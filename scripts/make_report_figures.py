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


def bar_with_labels(ax, labels, values, color, counts=None, fmt="{:.0f}%", ymax=None):
    fmt_n = lambda n: f"{n/1000:.1f}k" if n >= 1000 else f"{n}"
    ticks = [f"{l}\nn={fmt_n(n)}" for l, n in zip(labels, counts)] if counts is not None else list(labels)
    bars = ax.bar(ticks, values, color=color, width=0.65)
    ax.tick_params(axis="x", labelsize=6.5)
    for b, v in zip(bars, values):
        ax.text(b.get_x() + b.get_width() / 2, v + 1.5, fmt.format(v), ha="center", va="bottom", fontsize=8)
    ax.axhline(base_rate, color="black", linestyle="--", linewidth=0.9)
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
for b, v in zip(b1, missing):
    ax.text(b.get_x() + b.get_width() / 2, v + 1.5, f"{v:.0f}%", ha="center", fontsize=8)
for b, v in zip(b2, present):
    ax.text(b.get_x() + b.get_width() / 2, v + 1.5, f"{v:.0f}%", ha="center", fontsize=8)
ax.axhline(base_rate, color="black", linestyle="--", linewidth=0.9, label=f"All applicants ({base_rate:.1f}%)")
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
fig, axes = plt.subplots(1, 3, figsize=(10.5, 3.4))
for ax, (col, cap, xlabel) in zip(axes, [("DEROG", 5, "Major derogatory reports"), ("DELINQ", 6, "Delinquent credit lines"), ("NINQ", 8, "Recent credit inquiries")]):
    s = df[col].clip(upper=cap)
    g = df.groupby(s, observed=True)["BAD"]
    r, n = g.mean() * 100, g.count()
    labels = [f"{int(i)}+" if i == cap else f"{int(i)}" for i in r.index]
    bar_with_labels(ax, labels, r.values, BLUE if col != "DEROG" else RED, counts=n.values, ymax=118)
    ax.set_xlabel(xlabel); ax.set_title(f"By {xlabel.lower()}", fontsize=10, color=NAVY, loc="left")
for ax in axes[1:]:
    ax.set_ylabel("")
fig.text(0.5, -0.02, f"Dashed line: overall default rate ({base_rate:.1f}%). n = applicants with that count (missing values excluded).", ha="center", fontsize=8, color=GREY)
fig.tight_layout(); fig.savefig(OUT / "report_credit_history.png", bbox_inches="tight"); plt.close(fig)

# Figure: model comparison (test set)
show = [
    ("Logistic Regression (balanced)", "Logistic Regression\n(balanced)"),
    ("Decision Tree (tuned)", "Decision Tree\n(tuned)"),
    ("Bagging (200 trees)", "Bagged trees\n(200)"),
    ("Random Forest (default)", "Random Forest\n(default)"),
    ("Random Forest (class weights)", "Random Forest\n(class weights)"),
    ("Random Forest (tuned, recall)", "Random Forest\n(tuned)"),
]
metrics = [("Test Recall", "Defaulters caught (recall)", NAVY), ("Test Precision", "Precision", LIGHT), ("Test ROC-AUC", "Risk-ranking quality (ROC-AUC)", GREEN)]
fig, ax = plt.subplots(figsize=(8.5, 3.6))
x = np.arange(len(show)); w = 0.26
for i, (col, label, color) in enumerate(metrics):
    vals = [comp.loc[k, col] * 100 for k, _ in show]
    bars = ax.bar(x + (i - 1) * w, vals, w, color=color, label=label)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 1, f"{v:.0f}", ha="center", fontsize=7.5)
ax.set_xticks(x); ax.set_xticklabels([lab for _, lab in show], fontsize=8.5)
ax.set_ylim(0, 112); ax.set_ylabel("Score on unseen applicants (%)")
ax.legend(frameon=False, fontsize=8, ncol=3, loc="upper left")
ax.set_title("How the techniques compare on the 1,788 held-out applicants", fontsize=11, color=NAVY, loc="left")
fig.tight_layout(); fig.savefig(OUT / "report_model_comparison.png"); plt.close(fig)

# Figure: threshold trade-off
fig, ax1 = plt.subplots(figsize=(8.5, 3.6))
ax1.plot(thr["threshold"], thr["recall"] * 100, marker="o", color=GREEN, label="Defaulters caught (recall)")
ax1.plot(thr["threshold"], thr["precision"] * 100, marker="o", color=NAVY, label="Precision")
ax1.set_xlabel("Decision threshold (probability above which an applicant is flagged)")
ax1.set_ylabel("%"); ax1.set_ylim(50, 100)
ax2 = ax1.twinx(); ax2.grid(False)
ax2.plot(thr["threshold"], thr["expected_cost_per_1000_$"] / 1000, marker="s", linestyle="--", color=GREY, label="Indicative expected cost per 1,000 applicants")
ax2.set_ylabel("Expected cost per 1,000 applicants ($ thousand)")
best = thr.loc[thr["expected_cost_per_1000_$"].idxmin(), "threshold"]
ax1.axvline(best, color=RED, linewidth=1, linestyle=":")
ax1.text(best + 0.005, 80, f"Recommended threshold {best:.2f}", color=RED, fontsize=8)
ax1.axvline(0.5, color=GREY, linewidth=1, linestyle=":")
ax1.text(0.505, 52, "Default threshold 0.50", color=GREY, fontsize=8)
h1, l1 = ax1.get_legend_handles_labels(); h2, l2 = ax2.get_legend_handles_labels()
ax1.legend(h1 + h2, l1 + l2, frameon=False, fontsize=8, loc="upper center", ncol=3, bbox_to_anchor=(0.5, 1.02))
ax1.set_title("Moving the decision threshold of the selected Random Forest (out-of-fold, training rows)", fontsize=11, color=NAVY, loc="left", pad=22)
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
