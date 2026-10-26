"""Draws the business-facing charts used in the Final Report (reports/figures/report_*.png).

The charts are drawn for the report (plain-language labels, no variable names) rather than lifted from the
notebook. Model numbers are parsed from the executed notebook so the report can never drift from it; the
descriptive statistics are recomputed from data/hmeq.csv with the same definitions as the notebook.

Run from the repository root after scripts/run_notebook.py:  python3 scripts/make_report_figures.py
"""
import html
import json
import re
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
NB = ROOT / "notebooks" / "Loan_Default_Prediction_Capstone.ipynb"
OUT = ROOT / "reports" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

NAVY, RED, BLUE, GREEN, GREY, LIGHT = "#1E2761", "#C44E52", "#4C72B0", "#3C8D5A", "#8C8C8C", "#9DB4DE"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.color": "#E6E6E6", "grid.linewidth": 0.6, "axes.axisbelow": True, "figure.dpi": 200})

def r0(v):
    """Round half up to a whole number (matches the rounding in the report tables)."""
    return int(np.floor(v + 0.5 + 1e-9))


NAMES = {  # variable -> plain language
    "LOAN": "Loan amount", "MORTDUE": "Mortgage balance", "VALUE": "Property value", "YOJ": "Years at current job",
    "DEROG": "Major derogatory reports", "DELINQ": "Delinquent credit lines", "CLAGE": "Age of oldest credit line",
    "NINQ": "Recent credit inquiries", "CLNO": "Number of credit lines", "DEBTINC": "Debt-to-income ratio",
    "REASON": "Loan purpose", "JOB": "Occupation",
}
for k in list(NAMES):
    NAMES[f"{k}_missing"] = NAMES[k] + " missing"


# ---------------------------------------------------------------- notebook outputs
nb = json.loads(NB.read_text())


def cell_outputs(key):
    for c in nb["cells"]:
        if c["cell_type"] == "code" and key in "".join(c["source"]):
            return c.get("outputs", [])
    raise SystemExit(f"cell not found: {key}")


def styler_table(key):
    for o in cell_outputs(key):
        d = o.get("data", {})
        if "text/html" in d:
            h = "".join(d["text/html"])
            h = re.sub(r"<style.*?</style>", "", h, flags=re.S)
            rows = []
            for r in re.findall(r"<tr>(.*?)</tr>", h, flags=re.S):
                rows.append([html.unescape(re.sub("<.*?>", "", x)).strip() for x in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, flags=re.S)])
            return rows
    raise SystemExit(f"no table in cell: {key}")


# model comparison table
rows = styler_table("comparison = pd.concat")
header = rows[0]
comp = pd.DataFrame([r[1:] for r in rows[2:]], index=[r[0] for r in rows[2:]], columns=header[1:]).replace(",", "", regex=True).astype(float)

# final model on the test set (recall / precision at the selected threshold, ROC-AUC), added to the comparison as "Proposed"
final_outputs = cell_outputs("final_model.fit(X_train[final_cols], y_train)")
final_auc = None
for o in final_outputs:
    if o.get("output_type") == "stream":
        m = re.search(r"Test ROC-AUC:\s*([0-9.]+)", "".join(o["text"]))
        if m: final_auc = float(m.group(1))
rows = styler_table("final_model.fit(X_train[final_cols], y_train)")
final_tbl = pd.DataFrame([r[1:] for r in rows[1:]], columns=rows[0][1:]).replace(",", "", regex=True).astype(float)
final_row = final_tbl.iloc[0]
assert final_auc is not None and final_row["threshold"] < 0.5
comp.loc["Proposed (own threshold)"] = {"Test Recall": final_row["recall"], "Test Precision": final_row["precision"], "Test ROC-AUC": final_auc}
PROPOSED_LABEL = f"Proposed: forest\n(threshold {final_row['threshold']:.2f})"

# out-of-fold threshold table of the selected model (training rows)
rows = styler_table('tbl = oof[winner]["table"]')
thr = pd.DataFrame([r[1:] for r in rows[1:]], columns=rows[0][1:]).replace(",", "", regex=True).astype(float)

# impurity-based importances of the final model (top 12, printed as a frame with two columns)
imp_txt = ""
for o in cell_outputs('"impurity_importance": mdi.round(3)'):
    d = o.get("data", {})
    if "text/plain" in d and "impurity_importance" in "".join(d["text/plain"]):
        imp_txt = "".join(d["text/plain"])
imp = {}
for line in imp_txt.splitlines()[1:]:
    parts = line.split()
    if len(parts) == 3:
        imp[parts[0]] = float(parts[1])

# ---------------------------------------------------------------- descriptive statistics from the data
df = pd.read_csv(ROOT / "data" / "hmeq.csv")
base_rate = df["BAD"].mean() * 100


def rate_by_band(col, bins, labels):
    b = pd.cut(df[col], bins=bins, labels=labels, include_lowest=True)
    g = df.groupby(b, observed=True)["BAD"]
    return g.mean() * 100, g.count()


def bar_with_labels(ax, labels, values, color, counts=None, fmt="{:.0f}%", ymax=None, n_prefix="n="):
    fmt_n = lambda n: f"{n/1000:.1f}k" if n >= 1000 else f"{n}"
    ticks = [f"{l}\n{n_prefix}{fmt_n(n)}" for l, n in zip(labels, counts)] if counts is not None else list(labels)
    bars = ax.bar(ticks, values, color=color, width=0.65)
    ax.tick_params(axis="x", labelsize=6.5)
    for b, v in zip(bars, values):
        ax.text(b.get_x() + b.get_width() / 2, v + 1.5, f"{r0(v)}%", ha="center", va="bottom", fontsize=7.5,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 0.4}, zorder=4)
    ax.axhline(base_rate, color="#555555", linestyle="--", linewidth=0.8, zorder=1)
    ax.set_ylim(0, ymax or max(values) * 1.25)
    ax.set_ylabel("Default rate (%)")


# Figure: missing vs present
present, missing, names, n_missing = [], [], [], []
for col in ["VALUE", "DEBTINC", "CLAGE", "CLNO", "MORTDUE", "REASON", "NINQ", "YOJ", "DELINQ", "DEROG", "JOB"]:
    is_na = df[col].isna()
    missing.append(df.loc[is_na, "BAD"].mean() * 100)
    present.append(df.loc[~is_na, "BAD"].mean() * 100)
    names.append(NAMES[col])
    n_missing.append(int(is_na.sum()))
fig, ax = plt.subplots(figsize=(8.5, 3.6))
x = np.arange(len(names))
b1 = ax.bar(x - 0.2, missing, 0.4, color=RED, label="Field missing on the application")
b2 = ax.bar(x + 0.2, present, 0.4, color=BLUE, label="Field present")
for bars_, vals_ in [(b1, missing), (b2, present)]:
    for b, v in zip(bars_, vals_):
        ax.text(b.get_x() + b.get_width() / 2, v + 1.5, f"{r0(v)}%", ha="center", fontsize=6.5,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 0.3}, zorder=4)
ax.axhline(base_rate, color="#555555", linestyle="--", linewidth=0.8, zorder=1, label=f"All applicants ({base_rate:.1f}%)")
ax.set_xticks(x); ax.set_xticklabels(names, rotation=30, ha="right")
ax.set_ylabel("Default rate (%)"); ax.set_ylim(0, 105); ax.legend(frameon=False, fontsize=8)
ax.set_title("Default rate when a field is missing versus present", fontsize=11, color=NAVY, loc="left")
fig.tight_layout(); fig.savefig(OUT / "report_missing_vs_present.png"); plt.close(fig)

# Figure: bands (debt-to-income, credit age, loan amount)
fig, axes = plt.subplots(1, 3, figsize=(10.5, 3.4))
specs = [
    ("DEBTINC", [0, 20, 30, 35, 40, 45, 50, 210], ["0-20", "20-30", "30-35", "35-40", "40-45", "45-50", "50+"], "Debt-to-income ratio (%)", RED),
    ("CLAGE", [0, 60, 120, 180, 240, 300, 1200], ["<5", "5-10", "10-15", "15-20", "20-25", "25+"], "Age of oldest credit line (years)", BLUE),
    ("LOAN", [0, 5000, 10000, 15000, 20000, 30000, 90000], ["<5k", "5-10k", "10-15k", "15-20k", "20-30k", "30k+"], "Loan amount ($)", RED),
]
for ax, (col, bins, labels, xlabel, color) in zip(axes, specs):
    r, n = rate_by_band(col, bins, labels)
    bar_with_labels(ax, labels, r.values, color, counts=n.values, ymax=118)
    ax.set_xlabel(xlabel)
axes[0].set_title("By debt burden", fontsize=10, color=NAVY, loc="left")
axes[1].set_title("By length of credit history", fontsize=10, color=NAVY, loc="left")
axes[2].set_title("By loan size", fontsize=10, color=NAVY, loc="left")
for ax in axes[1:]:
    ax.set_ylabel("")
fig.text(0.5, -0.02, f"Dashed line: overall default rate ({base_rate:.1f}%). n = applicants in the band (missing values excluded).", ha="center", fontsize=8, color=GREY)
fig.tight_layout(); fig.savefig(OUT / "report_default_rate_bands.png", bbox_inches="tight"); plt.close(fig)

# Figure: credit-history counts
fig, axes = plt.subplots(1, 3, figsize=(11, 3.4), gridspec_kw={"width_ratios": [6, 7, 9]})
for ax, (col, cap, xlabel) in zip(axes, [("DEROG", 5, "Major derogatory reports"), ("DELINQ", 6, "Delinquent credit lines"), ("NINQ", 8, "Recent credit inquiries")]):
    s = df[col].clip(upper=cap)
    g = df.groupby(s, observed=True)["BAD"]
    r, n = g.mean() * 100, g.count()
    labels = [f"{int(i)}+" if i == cap else f"{int(i)}" for i in r.index]
    bar_with_labels(ax, labels, r.values, BLUE if col != "DEROG" else RED, counts=n.values, ymax=118, n_prefix="")
    ax.set_xlabel(xlabel); ax.set_title(f"By {xlabel.lower()}", fontsize=10, color=NAVY, loc="left")
for ax in axes[1:]:
    ax.set_ylabel("")
fig.text(0.5, -0.02, f"Dashed line: overall default rate ({base_rate:.1f}%). Second line under each bar: applicants with that count (missing values excluded).", ha="center", fontsize=8, color=GREY)
fig.tight_layout(); fig.savefig(OUT / "report_credit_history.png", bbox_inches="tight"); plt.close(fig)

# Figure: interactions (multivariate) - default rate for pairs of variables, single-hue sequential scale
def _band(series, bins, labels):
    b = pd.cut(series, bins=bins, labels=labels, include_lowest=True).astype(object)
    return b.where(series.notna(), "Not recorded")

def _grid(rows, cols, row_order, col_order):
    g = df.groupby([rows, cols])["BAD"]
    rate = (g.mean() * 100).unstack().reindex(index=row_order, columns=col_order)
    n = g.size().unstack().reindex(index=row_order, columns=col_order).fillna(0).astype(int)
    return rate, n

def _heat(ax, rate, n, vmax, xlabel, ylabel, title):
    im = ax.imshow(rate.values, cmap="Reds", vmin=0, vmax=vmax, aspect="auto")
    for i in range(rate.shape[0]):
        for j in range(rate.shape[1]):
            if n.iat[i, j] == 0:
                continue
            v = rate.iat[i, j]
            ax.text(j, i - 0.12, f"{int(np.floor(v + 0.5))}%", ha="center", va="center", fontsize=9,
                    color="white" if v > 0.55 * vmax else "#222222", fontweight="bold")
            ax.text(j, i + 0.22, f"n={n.iat[i, j]:,}", ha="center", va="center", fontsize=6.5,
                    color="white" if v > 0.55 * vmax else "#333333")
    ax.set_xticks(range(rate.shape[1])); ax.set_xticklabels(rate.columns, fontsize=8)
    ax.set_yticks(range(rate.shape[0])); ax.set_yticklabels(rate.index, fontsize=8)
    ax.set_xlabel(xlabel); ax.set_ylabel(ylabel); ax.grid(False)
    ax.set_title(title, fontsize=10, color=NAVY, loc="left")
    for edge in ["top", "right", "bottom", "left"]:
        ax.spines[edge].set_visible(False)
    ax.set_xticks(np.arange(-0.5, rate.shape[1], 1), minor=True); ax.set_yticks(np.arange(-0.5, rate.shape[0], 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=2); ax.tick_params(which="minor", length=0)
    cb = plt.colorbar(im, ax=ax, fraction=0.046, pad=0.03); cb.set_label("Default rate (%)", fontsize=8); cb.ax.tick_params(labelsize=7)

dti_rows = ["Under 30%", "30-35%", "35-40%", "40-45%", "Over 45%", "Not recorded"]
delinq_cols = ["None", "1", "2 or more", "Not recorded"]
rate_a, n_a = _grid(_band(df["DEBTINC"], [0, 30, 35, 40, 45, np.inf], dti_rows[:-1]),
                    _band(df["DELINQ"], [-0.5, 0.5, 1.5, np.inf], delinq_cols[:-1]), dti_rows, delinq_cols)
job_names = {"Mgr": "Manager", "Office": "Office", "Other": "Other", "ProfExe": "Professional", "Sales": "Sales", "Self": "Self-employed"}
reason_names = {"DebtCon": "Debt consolidation", "HomeImp": "Home improvement"}
known = df["JOB"].notna() & df["REASON"].notna()
rate_b, n_b = _grid(df.loc[known, "JOB"].map(job_names), df.loc[known, "REASON"].map(reason_names),
                    list(job_names.values()), list(reason_names.values()))
fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.3), gridspec_kw={"width_ratios": [1.35, 1]})
_heat(axes[0], rate_a, n_a, 100, "Delinquent credit lines", "Debt-to-income ratio", "Debt burden and repayment history combine")
_heat(axes[1], rate_b, n_b, 100, "Loan purpose", "Occupation", "Loan purpose matters within some occupations")
fig.text(0.5, -0.02, "Each cell: default rate and number of applicants. Both panels use the same 0-100% colour scale. Small cells (n under about 30) are noisy.", ha="center", fontsize=8, color=GREY)
fig.tight_layout(w_pad=3); fig.savefig(OUT / "report_interactions.png", bbox_inches="tight"); plt.close(fig)

# Figure: model comparison (test set)
show = [
    ("Logistic Regression (balanced)", "Logistic Regression\n(balanced)"),
    ("Decision Tree (tuned)", "Decision Tree\n(tuned)"),
    ("Bagging (200 trees)", "Bagged trees\n(200)"),
    ("Random Forest (default)", "Random Forest\n(default)"),
    ("Random Forest (class weights)", "Random Forest\n(class weights)"),
    ("Random Forest (tuned, recall)", "Random Forest\n(tuned)"),
    ("Proposed (own threshold)", PROPOSED_LABEL),
]
metrics = [("Test Recall", "Defaulters caught (recall)", NAVY), ("Test Precision", "Precision", LIGHT), ("Test ROC-AUC", "Risk-ranking quality (ROC-AUC)", GREEN)]
fig, ax = plt.subplots(figsize=(8.5, 3.6))
x = np.arange(len(show)); w = 0.26
for i, (col, label, color) in enumerate(metrics):
    vals = [comp.loc[k, col] * 100 for k, _ in show]
    bars = ax.bar(x + (i - 1) * w, vals, w, color=color, label=label)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 1, f"{r0(v)}", ha="center", fontsize=7.5)
ax.set_xticks(x); ax.set_xticklabels([lab for _, lab in show], fontsize=8)
ax.set_ylim(0, 112); ax.set_ylabel("Score on unseen applicants (%)")
ax.legend(frameon=False, fontsize=8, ncol=3, loc="upper left")
ax.set_title("Techniques on the 1,788 held-out applicants (0.5 threshold; proposed model at 0.15)", fontsize=11, color=NAVY, loc="left")
fig.tight_layout(); fig.savefig(OUT / "report_model_comparison.png"); plt.close(fig)

# Figure: threshold trade-off - two stacked panels that share the threshold axis (one y-axis each, no dual-axis chart)
x = thr["threshold"]
best = thr.loc[thr["expected_cost_per_1000_$"].idxmin(), "threshold"]
best_cost = thr["expected_cost_per_1000_$"].min() / 1000
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8.5, 5.6), sharex=True, gridspec_kw={"height_ratios": [1.1, 1]})
ax1.plot(x, thr["recall"] * 100, marker="o", markersize=4, linewidth=2, color=GREEN, label="Defaulters caught (recall)")
ax1.plot(x, thr["precision"] * 100, marker="o", markersize=4, linewidth=2, color=BLUE, label="Precision")
ax1.text(x.iloc[-1] + 0.012, thr["recall"].iloc[-1] * 100, "Recall", fontsize=8, color="#333333", va="center")
ax1.text(x.iloc[-1] + 0.012, thr["precision"].iloc[-1] * 100, "Precision", fontsize=8, color="#333333", va="center")
ax1.set_ylabel("Share (%)"); ax1.set_ylim(40, 100)
ax1.legend(frameon=False, fontsize=8, loc="lower right", bbox_to_anchor=(1.0, 1.0), ncol=2, borderaxespad=0.2)
ax1.set_title("Recall and precision", fontsize=10, color=NAVY, loc="left")
ax2.plot(x, thr["expected_cost_per_1000_$"] / 1000, marker="s", markersize=4, linewidth=2, color=NAVY)
ax2.set_ylabel("$ thousand per\n1,000 applicants")
ax2.set_title("Indicative expected cost of credit errors", fontsize=10, color=NAVY, loc="left")
ax2.set_ylim(150, None)
ax2.annotate(f"Lowest cost: ${best_cost:,.0f}k at {best:.2f}", xy=(best, best_cost), xytext=(best + 0.04, best_cost - 110),
             fontsize=8, color="#333333", va="center", arrowprops={"arrowstyle": "-", "color": GREY, "linewidth": 0.8})
ax2.set_xlabel("Decision threshold (probability above which an applicant is flagged)")
ax2.set_xlim(x.min() - 0.02, x.max() + 0.09)
for ax in (ax1, ax2):
    ax.axvline(best, color=RED, linewidth=1, linestyle=":")
    ax.axvline(0.5, color=GREY, linewidth=1, linestyle=":")
ax1.text(best + 0.006, 97, f"Recommended threshold {best:.2f}", color="#333333", fontsize=8, va="top")
ax1.text(0.506, 97, "Default threshold 0.50", color="#333333", fontsize=8, va="top")
fig.suptitle("Moving the decision threshold of the selected Random Forest (out-of-fold, training rows)", fontsize=11, color=NAVY, x=0.01, ha="left")
fig.tight_layout(); fig.savefig(OUT / "report_threshold.png"); plt.close(fig)

# Figure: feature importance (top 12, plain names)
items = sorted(imp.items(), key=lambda kv: kv[1])
fig, ax = plt.subplots(figsize=(7.5, 3.8))
ax.barh([NAMES.get(k, k) for k, _ in items], [v * 100 for _, v in items], color=[RED if "missing" in k or k == "DEBTINC" else NAVY for k, _ in items])
for i, (k, v) in enumerate(items):
    ax.text(v * 100 + 0.4, i, f"{v*100:.1f}%", va="center", fontsize=8)
ax.set_xlabel("Share of the model's decision power (%)"); ax.set_xlim(0, 24)
ax.set_title("What the final Random Forest relies on most", fontsize=11, color=NAVY, loc="left")
fig.tight_layout(); fig.savefig(OUT / "report_feature_importance.png"); plt.close(fig)

print("wrote", sorted(p.name for p in OUT.glob("report_*.png")))
print("check: base rate %.2f%%, best threshold %.2f, top importance %s, n_imp %d" % (base_rate, best, items[-1], len(items)))
