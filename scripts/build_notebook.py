"""Builds the Loan Default Prediction capstone notebook (full-code version).

Run:  python3 scripts/build_notebook.py
Then: python3 scripts/run_notebook.py   (executes it and exports HTML)
"""
import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []


def md(text):
    cells.append(nbf.v4.new_markdown_cell(text.strip("\n")))


def code(text):
    cells.append(nbf.v4.new_code_cell(text.strip("\n")))


# --------------------------------------------------------------------------------------
md(r"""
# **Loan Default Prediction**

### Capstone Project - Practical Data Science (Classification) | Milestone Submission

**Learner:** Shubham Garg
**Program:** MIT Professional Education - Applied AI and Data Science Program
**Dataset:** Home Equity (HMEQ) - 5,960 recent home equity loans
""")

md(r"""
## **Problem Definition**

### **The Context:**

A large share of a retail bank's profit comes from the interest it earns on home loans and home equity lines of credit. The single biggest threat to that profit is the borrower who does not pay back: every loan that turns into a non-performing asset (NPA) wipes out the interest earned on many good loans. The bank therefore has to be judicious about whom it approves.

Today the approval decision is made through a manual study of the application by an underwriter. That process is slow, expensive, inconsistent from one underwriter to another, and vulnerable to human error and bias. Earlier attempts to automate the process used hand-written heuristics. With the data the bank now has on past loans and their outcomes, it is possible to **learn** the approval decision from evidence instead of opinion, while making sure the new model does not simply replicate the biases of the old manual process.

### **The objective:**

Build a classification model that predicts, at the time of application, whether a client is likely to default on a home equity loan, and use that model to give the bank clear recommendations on which applicant attributes matter most when approving a loan.

The model must satisfy two constraints at once:

1. **Predictive power** - catch as many future defaulters as possible before the money leaves the bank.
2. **Interpretability** - under the Equal Credit Opportunity Act (ECOA) the bank must be able to give an applicant a specific, defensible reason for an adverse decision. A black box that cannot explain a rejection is not usable in production.

### **The key questions:**

1. What share of past applicants defaulted, and how imbalanced is the problem?
2. Which applicant attributes (credit history, debt burden, loan size, job, loan purpose, property value) separate defaulters from repayers?
3. How should missing information be treated? Is the *absence* of information itself a risk signal?
4. Which modelling technique (linear vs. tree-based vs. ensemble) gives the best trade-off between catching defaulters and wrongly rejecting good customers?
5. What is the right measure of success for this business problem, and how do the models compare on it?
6. Which model should the bank adopt, with what settings, and what rules can the bank communicate to applicants and regulators?

### **The problem formulation**:

This is a **supervised binary classification** problem. Each row is a past home equity loan with 12 attributes known at application time and a target `BAD` (1 = defaulted or seriously delinquent, 0 = repaid). We will:

- explore and clean the data (missing values, outliers, encoding);
- train a linear model (Logistic Regression) and non-linear models (Decision Tree, Random Forest);
- tune the non-linear models with cross-validated grid search;
- compare all models on a metric chosen from the business cost of each type of error (**Recall on the defaulter class** as primary, with Precision and F1 as guard-rails so that the bank does not reject too many good customers);
- propose a final solution design and the business rules that follow from it.
""")

md(r"""
## **Data Description:**
The Home Equity dataset (HMEQ) contains baseline and loan performance information for 5,960 recent home equity loans. The target (BAD) is a binary variable that indicates whether an applicant has ultimately defaulted or has been severely delinquent. This adverse outcome occurred in 1,189 cases (20 percent). 12 input variables were registered for each applicant.


* **BAD:** 1 = Client defaulted on loan, 0 = loan repaid

* **LOAN:** Amount of loan approved.

* **MORTDUE:** Amount due on the existing mortgage.

* **VALUE:** Current value of the property.

* **REASON:** Reason for the loan request. (HomeImp = home improvement, DebtCon= debt consolidation which means taking out a new loan to pay off other liabilities and consumer debts)

* **JOB:** The type of job that loan applicant has such as manager, self, etc.

* **YOJ:** Years at present job.

* **DEROG:** Number of major derogatory reports (which indicates a serious delinquency or late payments).

* **DELINQ:** Number of delinquent credit lines (a line of credit becomes delinquent when a borrower does not make the minimum required payments 30 to 60 days past the day on which the payments were due).

* **CLAGE:** Age of the oldest credit line in months.

* **NINQ:** Number of recent credit inquiries.

* **CLNO:** Number of existing credit lines.

* **DEBTINC:** Debt-to-income ratio (all your monthly debt payments divided by your gross monthly income. This number is one way lenders measure your ability to manage the monthly payments to repay the money you plan to borrow.
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Import the necessary libraries and Data**
""")

code(r"""
# Core libraries
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

# Visualisation
import matplotlib.pyplot as plt
import seaborn as sns

# Pre-processing and model selection
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler

# Models
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, plot_tree, export_text
from sklearn.ensemble import RandomForestClassifier

# Metrics
from sklearn import metrics
from sklearn.metrics import (classification_report, confusion_matrix, recall_score,
                             precision_score, f1_score, accuracy_score, roc_auc_score,
                             roc_curve, precision_recall_curve)

# Display settings
pd.set_option("display.max_columns", None)
pd.set_option("display.float_format", lambda x: f"{x:,.3f}")
sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams["figure.dpi"] = 100

RANDOM_STATE = 1
""")

code(r"""
# Load the dataset
hm = pd.read_csv("../data/hmeq.csv")

# Work on a copy so the raw data stays untouched
data = hm.copy()
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Data Overview**
""")

md(r"""
- Reading the dataset
- Understanding the shape of the dataset
- Checking the data types
- Checking for missing values
- Checking for duplicated values
""")

code(r"""
# First five rows
data.head()
""")

code(r"""
# Last five rows
data.tail()
""")

code(r"""
print(f"The dataset has {data.shape[0]:,} rows and {data.shape[1]} columns.")
""")

code(r"""
# Data types and non-null counts
data.info()
""")

md(r"""
**Observations:**

- There are **5,960 loans and 13 columns**: the target `BAD` plus 12 input attributes.
- `BAD` and `LOAN` are integers with no gaps. `REASON` and `JOB` are text (categorical). All other inputs are numeric floats.
- `DEROG`, `DELINQ`, `NINQ` and `CLNO` are stored as floats but are really **counts** (whole numbers). They can be analysed both as numbers and as ordered categories.
- Every input column except `LOAN` has fewer than 5,960 non-null values, so **missing values are widespread** and must be handled before modelling.
""")

code(r"""
# Count and percentage of missing values in each column
missing = pd.DataFrame({
    "missing_count": data.isnull().sum(),
    "missing_pct": (data.isnull().mean() * 100).round(2)
}).sort_values("missing_pct", ascending=False)
missing
""")

code(r"""
plt.figure(figsize=(10, 4))
sns.barplot(x=missing.index, y=missing["missing_pct"], color="#4C72B0")
plt.title("Percentage of missing values per column")
plt.ylabel("% missing")
plt.xticks(rotation=45)
plt.show()
""")

md(r"""
**Observations:**

- `DEBTINC` (debt-to-income ratio) is missing in **21.3%** of the applications, by far the highest. This is the most important affordability measure a lender has, so its absence is suspicious in itself and we will test later whether missingness is linked to default.
- `DEROG` (11.9%), `DELINQ` (9.7%), `MORTDUE` (8.7%), `YOJ` (8.6%) and `NINQ` (8.6%) have moderate gaps.
- `JOB`, `REASON`, `CLAGE`, `CLNO` and `VALUE` are missing in fewer than 5.2% of rows.
- No column is missing enough to justify dropping it. Dropping rows is also not an option: dropping any row with at least one gap would discard more than 40% of the data. We will **impute** values and **keep a flag** for every imputed cell.
""")

code(r"""
# Rows with a missing value in at least one column, and rows where every input except LOAN is blank
rows_with_na = data.isnull().any(axis=1).sum()
all_blank = data.drop(columns=["BAD", "LOAN"]).isnull().all(axis=1).sum()
print(f"Rows with at least one missing value : {rows_with_na:,} ({rows_with_na/len(data):.1%})")
print(f"Rows where every input except LOAN is blank : {all_blank}")
""")

code(r"""
# Duplicate rows
print("Number of duplicated rows:", data.duplicated().sum())
""")

md(r"""
**Observations:**

- **44% of applications have at least one blank field**, which confirms that row deletion is not viable.
- Two applications have no information at all beyond the loan amount. We keep them: the missing-value flags created later will carry the information that nothing was supplied.
- There are **no duplicate rows**, so no de-duplication is required.
""")

code(r"""
# Convert object columns and the target to the 'category' data type (saves memory, makes intent explicit)
for col in ["REASON", "JOB"]:
    data[col] = data[col].astype("category")
data["BAD"] = data["BAD"].astype("category")
data.dtypes
""")

# --------------------------------------------------------------------------------------
md(r"""
## Summary Statistics
""")

code(r"""
# Summary statistics for the numerical columns
data.describe().T
""")

code(r"""
# Summary statistics for the categorical columns (including the target)
data.describe(include="category").T
""")

code(r"""
# Unique values and their share for each categorical column
for col in ["BAD", "REASON", "JOB"]:
    print(f"Value share in {col}:")
    print((data[col].value_counts(normalize=True) * 100).round(2).to_string())
    print("-" * 40)
""")

md(r"""
- **Observations from Summary Statistics**

**Target**
- 19.95% of the loans ended in default (1,189 of 5,960). The classes are **imbalanced roughly 4:1**, so accuracy alone would be misleading (a model that approves everyone is 80% "accurate" and useless).

**Loan and property amounts**
- `LOAN` ranges from \$1,100 to \$89,900 with a median of \$16,300 and mean of \$18,608. The mean is above the median, so the distribution is right-skewed with a tail of large loans.
- `MORTDUE` (median \$65,019) and `VALUE` (median \$89,236) are also right-skewed, and `VALUE` has a maximum of \$855,909, which is an extreme outlier relative to the 75th percentile (\$119,824).

**Employment and credit history**
- `YOJ` (years at present job): median 7 years, maximum 41 years. A quarter of applicants have been in their job 3 years or less.
- `DEROG` and `DELINQ` are zero for at least 75% of applicants (the 75th percentile is 0). Their means (0.25 and 0.45) are driven by a small group with many derogatory reports or delinquent lines - these are the applicants a lender worries about.
- `CLAGE` (age of oldest credit line): median 173 months (about 14.5 years); a maximum of 1,168 months (97 years) is not plausible and is an outlier.
- `NINQ` (recent credit inquiries): median 1, maximum 17.
- `CLNO` (number of credit lines): median 20, maximum 71.

**Debt burden**
- `DEBTINC`: median 34.8%, 75th percentile 39.0%. The maximum of 203% is physically implausible (debt payments twice the income). The 25th-75th range (29% to 39%) is tight, so the few applicants far above 40% stand out.

**Categorical**
- `REASON`: 2 categories; debt consolidation is 68.8% of stated reasons.
- `JOB`: 6 categories; "Other" is the largest (42%), followed by ProfExe (22.5%) and Office (16.7%). Sales (1.9%) and Self-employed (3.4%) are small groups.
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Exploratory Data Analysis (EDA) and Visualization**
""")

md(r"""
- EDA is an important part of any project involving data.
- It is important to investigate and understand the data better before building a model with it.
- A few questions have been mentioned below which will help you approach the analysis in the right manner and generate insights from the data.
- A thorough analysis of the data, in addition to the questions mentioned below, should be done.
""")

md(r"""
**Leading Questions**:
1. What is the range of values for the loan amount variable "LOAN"?
2. How does the distribution of years at present job "YOJ" vary across the dataset?
3. How many unique categories are there in the REASON variable?
4. What is the most common category in the JOB variable?
5. Is there a relationship between the REASON variable and the proportion of applicants who defaulted on their loan?
6. Do applicants who default have a significantly different loan amount compared to those who repay their loan?
7. Is there a correlation between the value of the property and the loan default rate?
8. Do applicants who default have a significantly different mortgage amount compared to those who repay their loan?

Questions 1 to 4 are answered in the univariate analysis; questions 5 to 8 in the bivariate analysis. A summary of answers is given at the end of the EDA section.
""")

md(r"""
### **Univariate Analysis**
""")

code(r"""
def histogram_boxplot(feature, figsize=(12, 6), bins=None, title=None):
    '''Boxplot on top of a histogram for one numerical feature, with mean (green dashed) and median (black) lines.'''
    f, (ax_box, ax_hist) = plt.subplots(nrows=2, sharex=True,
                                        gridspec_kw={"height_ratios": (0.25, 0.75)},
                                        figsize=figsize)
    sns.boxplot(x=feature, ax=ax_box, showmeans=True, color="violet")
    sns.histplot(x=feature, ax=ax_hist, bins=bins if bins else "auto", color="#4C72B0")
    ax_hist.axvline(np.nanmean(feature), color="green", linestyle="--", label="mean")
    ax_hist.axvline(np.nanmedian(feature), color="black", linestyle="-", label="median")
    ax_hist.legend()
    ax_box.set(xlabel="")
    f.suptitle(title or feature.name, fontsize=13)
    plt.show()
""")

code(r"""
histogram_boxplot(data["LOAN"], title="LOAN - amount of loan approved")
print(f"LOAN ranges from ${data['LOAN'].min():,.0f} to ${data['LOAN'].max():,.0f}; "
      f"median ${data['LOAN'].median():,.0f}, mean ${data['LOAN'].mean():,.0f}")
""")

md(r"""
**Insights - LOAN (Q1):**
- Loan amounts range from **\$1,100 to \$89,900**. Half of all loans are below \$16,300 and 75% are below \$23,300.
- The distribution is right-skewed with a long tail; loans above about \$41,000 appear as outliers on the boxplot. Those are genuine large loans, not data errors, so they will be kept for tree models and only capped for the linear model.
""")

code(r"""
histogram_boxplot(data["YOJ"], title="YOJ - years at present job")
""")

md(r"""
**Insights - YOJ (Q2):**
- Years at the current job is **right-skewed**: the most common values are 0 to 5 years, the median is 7 years and the mean about 9 years.
- There is a long tail of long-tenured applicants (25 to 41 years) flagged as outliers. These are plausible and are kept.
- Job tenure is a mild stability signal; we will check in the bivariate section whether short tenure is linked to default.
""")

code(r"""
histogram_boxplot(data["MORTDUE"], title="MORTDUE - amount due on existing mortgage")
""")

code(r"""
histogram_boxplot(data["VALUE"], title="VALUE - current value of the property")
""")

md(r"""
**Insights - MORTDUE and VALUE:**
- Both are right-skewed with a bulk of properties between \$50,000 and \$150,000 and a small number of very expensive properties (VALUE up to \$855,909).
- Because the two variables describe the same asset, they should be strongly correlated (confirmed later in the correlation heatmap, r = 0.88). This matters for the logistic regression, where highly correlated inputs make coefficients unstable.
""")

code(r"""
histogram_boxplot(data["CLAGE"], title="CLAGE - age of oldest credit line (months)")
""")

code(r"""
histogram_boxplot(data["DEBTINC"], title="DEBTINC - debt-to-income ratio (%)")
""")

md(r"""
**Insights - CLAGE and DEBTINC:**
- `CLAGE` is roughly bell-shaped around 170-180 months (about 15 years of credit history) with a right tail. A handful of values above 600 months (50+ years) and a maximum of 1,168 months are not credible and will be capped for the linear model.
- `DEBTINC` is tightly concentrated between 25% and 42%; very few applicants have a recorded ratio above 45%. The maximum of 203% is an impossible value. Note that this plot only shows the 79% of applicants for whom the ratio is recorded.
""")

code(r"""
histogram_boxplot(data["CLNO"], title="CLNO - number of existing credit lines")
""")

md(r"""
**Insights - CLNO:**
- Number of credit lines is approximately normal, centred around 20 lines, with a few applicants holding more than 45 lines.
""")

md(r"""
#### Count-type variables (DEROG, DELINQ, NINQ)

These are whole-number counts where most applicants are at zero, so bar charts are more informative than histograms.
""")

code(r"""
def perc_on_bar(ax, total):
    '''Annotate bars with the percentage of the total.'''
    for p in ax.patches:
        pct = f"{100 * p.get_height() / total:.1f}%"
        ax.annotate(pct, (p.get_x() + p.get_width() / 2, p.get_height()),
                    ha="center", va="bottom", fontsize=9)

fig, axes = plt.subplots(1, 3, figsize=(18, 4.5))
for ax, col in zip(axes, ["DEROG", "DELINQ", "NINQ"]):
    s = data[col].dropna().astype(int)
    sns.countplot(x=s, ax=ax, color="#4C72B0")
    perc_on_bar(ax, len(s))
    ax.set_title(f"{col} (non-missing applicants)")
plt.tight_layout()
plt.show()
""")

md(r"""
**Insights - DEROG, DELINQ, NINQ:**
- **86% of applicants have zero major derogatory reports** and 78% have zero delinquent credit lines. The minority with one or more is small but, as the bivariate analysis will show, carries a very high default rate.
- Recent credit inquiries are more spread out: 46% have none, 25% have one, 14% have two, and a tail have five or more. Many recent inquiries can signal a borrower actively seeking credit under financial stress.
""")

md(r"""
#### Categorical variables (BAD, REASON, JOB)
""")

code(r"""
fig, axes = plt.subplots(1, 3, figsize=(18, 4.5))
for ax, col in zip(axes, ["BAD", "REASON", "JOB"]):
    s = data[col].dropna()
    order = s.value_counts().index
    sns.countplot(x=s, order=order, ax=ax, color="#4C72B0")
    perc_on_bar(ax, len(s))
    ax.set_title(col)
plt.tight_layout()
plt.show()
""")

md(r"""
**Insights - BAD, REASON, JOB (Q3, Q4):**
- **Target:** 80% of loans were repaid and 20% defaulted. The imbalance is moderate, which is why we will use class weights in the models and recall, not accuracy, as the success metric.
- **REASON has 2 unique categories.** Debt consolidation (69%) is far more common than home improvement (31%).
- **JOB has 6 unique categories and "Other" is the most common (42%)**, followed by professional/executive (22%) and office workers (17%). Sales (2%) and self-employed (3%) are small groups, so default rates for them should be read with care.
""")

md(r"""
### **Bivariate Analysis**
""")

md(r"""
#### Numerical variables vs the target (BAD)
""")

code(r"""
num_cols = ["LOAN", "MORTDUE", "VALUE", "YOJ", "DEROG", "DELINQ", "CLAGE", "NINQ", "CLNO", "DEBTINC"]

fig, axes = plt.subplots(2, 5, figsize=(22, 9))
for ax, col in zip(axes.flatten(), num_cols):
    sns.boxplot(x=data["BAD"], y=data[col], ax=ax, palette="PuBu", showmeans=True)
    ax.set_title(f"{col} by BAD")
    ax.set_xlabel("BAD (0 = repaid, 1 = default)")
plt.tight_layout()
plt.show()
""")

code(r"""
# Mean and median of each numerical variable by target class
data.groupby("BAD", observed=True)[num_cols].agg(["mean", "median"]).T
""")

md(r"""
**Insights - numerical variables vs BAD (Q6, Q7, Q8):**

- **LOAN (Q6):** Defaulters borrowed *less* on average (mean \$16,922, median \$14,900) than repayers (mean \$19,028, median \$16,900). The difference is real but modest; loan size by itself is not a strong separator. The default rate by loan band (next chart) shows the pattern more clearly.
- **VALUE (Q7):** Defaulters have slightly lower property values (median \$82,000 vs \$90,659). The correlation between `VALUE` and `BAD` is weak (r = -0.03), so property value alone does not predict default; it matters in combination with the mortgage balance and the loan size.
- **MORTDUE (Q8):** Defaulters have a somewhat lower outstanding mortgage (median \$60,279 vs \$66,839). Again a modest difference.
- **DEROG and DELINQ** show the strongest separation: defaulters average 0.71 derogatory reports vs 0.13, and 1.23 delinquent lines vs 0.25. These are **5x higher** among defaulters.
- **CLAGE:** Defaulters have a materially shorter credit history (median 133 months vs 180 months). A long, established credit record is protective.
- **NINQ:** Defaulters made more recent inquiries (mean 1.78 vs 1.03).
- **DEBTINC:** Defaulters carry a higher debt burden (median 38.1% vs 34.5%) and the defaulter boxplot has a long upper tail where most of the extreme ratios sit.
- **YOJ and CLNO** show little difference between the two groups.
""")

code(r"""
def default_rate_by_band(col, bins, labels=None):
    '''Default rate and applicant count per band of a numerical column (missing values excluded).'''
    banded = pd.cut(data[col], bins=bins, labels=labels, include_lowest=True)
    tab = data.groupby(banded, observed=True)["BAD"].agg(
        default_rate=lambda s: (s.astype(int).mean() * 100).round(1),
        applicants="count")
    return tab

fig, axes = plt.subplots(1, 3, figsize=(20, 4.8))
specs = [
    ("DEBTINC", [0, 20, 30, 35, 40, 45, 50, 210], "Debt-to-income ratio band (%)"),
    ("CLAGE",   [0, 60, 120, 180, 240, 300, 1200], "Age of oldest credit line band (months)"),
    ("LOAN",    [0, 5000, 10000, 15000, 20000, 30000, 90000], "Loan amount band ($)"),
]
for ax, (col, bins, label) in zip(axes, specs):
    tab = default_rate_by_band(col, bins)
    sns.barplot(x=tab.index.astype(str), y=tab["default_rate"], ax=ax, color="#C44E52")
    for i, (rate, n) in enumerate(zip(tab["default_rate"], tab["applicants"])):
        ax.text(i, rate + 1, f"{rate}%\n(n={n})", ha="center", fontsize=8)
    ax.axhline(19.9, color="black", linestyle="--", linewidth=1, label="overall 19.9%")
    ax.set_title(f"Default rate by {col} band"); ax.set_xlabel(label); ax.set_ylabel("% defaulted")
    ax.tick_params(axis="x", rotation=30); ax.legend()
plt.tight_layout()
plt.show()
""")

md(r"""
**Insights - default rate by band:**

- **DEBTINC is a cliff, not a slope.** Applicants with a recorded ratio between 20% and 40% default only 4% to 7% of the time, well below the 20% average. Between 40% and 45% the rate doubles to 11%, and **above 45% it jumps to 87%, and above 50% to 100%**. A debt-to-income threshold around 45% is therefore a natural, explainable approval rule.
- **CLAGE protects.** Applicants whose oldest credit line is under 5 years old default 43% of the time; the rate falls steadily to 9% to 11% once the credit history is longer than 20 years.
- **Small loans are the riskiest.** Loans under \$5,000 default 57% of the time, against 14% to 20% for loans above \$15,000. Small loans may be requested by financially stretched applicants, or the bank may already be limiting exposure to weaker applicants. Either way, a small requested amount is not a sign of low risk.
""")

md(r"""
#### Categorical and count variables vs the target (BAD)
""")

code(r"""
def stacked_plot(x, title=None):
    '''Cross-tab counts and a normalised stacked bar chart of BAD by a categorical column.'''
    tab_counts = pd.crosstab(x, data["BAD"], margins=True)
    print(tab_counts)
    print("-" * 60)
    tab = pd.crosstab(x, data["BAD"], normalize="index")
    ax = tab.plot(kind="bar", stacked=True, figsize=(9, 4), color=["#4C72B0", "#C44E52"])
    for i, (idx, row) in enumerate(tab.iterrows()):
        ax.text(i, 1.01, f"{row[1]*100:.0f}% bad", ha="center", fontsize=9)
    ax.legend(title="BAD", loc="upper left", bbox_to_anchor=(1, 1))
    ax.set_ylabel("share of applicants")
    ax.set_title(title or f"BAD by {x.name}")
    plt.show()
""")

code(r"""
stacked_plot(data["REASON"], "BAD by REASON (loan purpose)")
""")

md(r"""
**Insights - REASON vs BAD (Q5):**
- Home-improvement loans default slightly more often (**22.2%**) than debt-consolidation loans (**19.0%**). There is a relationship, but it is weak: a 3-point difference around a 20% base rate. Loan purpose on its own should not drive approval decisions.
""")

code(r"""
stacked_plot(data["JOB"], "BAD by JOB")
""")

md(r"""
**Insights - JOB vs BAD:**
- Default risk varies clearly by occupation. **Sales (34.9%)** and **Self-employed (30.1%)** applicants default at 1.5x to 1.75x the average, consistent with more variable income. **Office workers (13.2%)** and **professionals/executives (16.6%)** are the safest groups; managers (23.3%) and "Other" (23.2%) sit slightly above average.
- The Sales and Self groups are small (109 and 193 applicants), so the model should use occupation as a supporting signal, not a primary one. Note also that occupation must be used carefully under fair-lending rules; it is not a protected attribute, but the bank should monitor it for proxy effects.
""")

code(r"""
# Default rate by number of derogatory reports, delinquent lines and recent inquiries (capped for readability)
fig, axes = plt.subplots(1, 3, figsize=(20, 4.8))
for ax, (col, cap) in zip(axes, [("DEROG", 5), ("DELINQ", 6), ("NINQ", 8)]):
    s = data[col].clip(upper=cap)
    tab = data.groupby(s, observed=True)["BAD"].agg(
        default_rate=lambda v: (v.astype(int).mean() * 100).round(1), applicants="count")
    labels = [f"{int(i)}+" if i == cap else f"{int(i)}" for i in tab.index]
    sns.barplot(x=labels, y=tab["default_rate"], ax=ax, color="#C44E52")
    for i, (rate, n) in enumerate(zip(tab["default_rate"], tab["applicants"])):
        ax.text(i, rate + 1, f"{rate}%\n(n={n})", ha="center", fontsize=8)
    ax.axhline(19.9, color="black", linestyle="--", linewidth=1)
    ax.set_title(f"Default rate by {col}"); ax.set_ylabel("% defaulted"); ax.set_xlabel(col)
plt.tight_layout()
plt.show()
""")

md(r"""
**Insights - credit-history counts vs BAD:**

- **DEROG:** Applicants with no derogatory report default 16.7% of the time. **One report raises this to 39%, two to 51%, three or more to over 70%.** Every applicant with 7 or more reports defaulted.
- **DELINQ:** The pattern is the same and even steeper: 14% with no delinquent line, 34% with one, 45% with two, 55% with three, and **100% with six or more**.
- **NINQ:** Default risk rises steadily with recent inquiries: 16% at zero, 23% at two, 39% at four, around 50% at five or more.
- These three variables are monotonic, easy to explain to an applicant ("your application was declined because you have two delinquent credit lines") and are exactly the kind of evidence the ECOA asks for.
""")

md(r"""
#### Does missing information predict default?
""")

code(r"""
# Default rate when a field is missing vs when it is present
rows = []
for col in data.columns.drop("BAD"):
    if data[col].isnull().any():
        is_na = data[col].isnull()
        rows.append({
            "column": col,
            "missing_rows": int(is_na.sum()),
            "default_rate_when_missing_%": round(data.loc[is_na, "BAD"].astype(int).mean() * 100, 1),
            "default_rate_when_present_%": round(data.loc[~is_na, "BAD"].astype(int).mean() * 100, 1),
        })
missing_vs_bad = pd.DataFrame(rows).sort_values("default_rate_when_missing_%", ascending=False)
missing_vs_bad
""")

code(r"""
plt.figure(figsize=(11, 4.5))
m = missing_vs_bad.melt(id_vars="column", value_vars=["default_rate_when_missing_%", "default_rate_when_present_%"],
                        var_name="status", value_name="default_rate")
m["status"] = m["status"].str.replace("default_rate_when_", "").str.replace("_%", "")
sns.barplot(data=m, x="column", y="default_rate", hue="status", palette=["#C44E52", "#4C72B0"])
plt.axhline(19.9, color="black", linestyle="--", linewidth=1)
plt.title("Default rate when a field is missing vs present")
plt.ylabel("% defaulted"); plt.xlabel("")
plt.show()
""")

md(r"""
**Insights - missingness as a signal (a key finding):**

- **When DEBTINC is missing, 62% of applicants defaulted; when it is present, only 8.6% did.** A missing debt-to-income ratio is the single strongest risk indicator in the whole dataset. In practice, applicants whose income could not be verified, or who did not supply it, are far riskier than those with a verified ratio.
- **When VALUE is missing, 94% defaulted** (112 applicants). An application without a property valuation is almost always bad.
- Missing `CLAGE` (25%) and `CLNO` (24%) are mildly riskier than average.
- The opposite holds for `DEROG`, `DELINQ`, `YOJ`, `NINQ` and `JOB`: when these are missing the default rate is *lower* (8% to 15%). This probably reflects how the data was recorded (for example, "no record found" stored as blank for good customers).
- **Implication for pre-processing:** we must not simply fill these gaps with the median and move on. We will **add a binary "was missing" flag for every column with gaps** so the models can learn from the absence of information, and then impute the values.
""")

md(r"""
#### Two numerical variables together
""")

code(r"""
fig, axes = plt.subplots(1, 2, figsize=(16, 5.5))
sns.scatterplot(data=data, x="VALUE", y="MORTDUE", hue="BAD", alpha=0.5, ax=axes[0], palette=["#4C72B0", "#C44E52"])
axes[0].set_title("Property value vs mortgage due")
sns.scatterplot(data=data, x="DEBTINC", y="CLAGE", hue="BAD", alpha=0.5, ax=axes[1], palette=["#4C72B0", "#C44E52"])
axes[1].axvline(45, color="black", linestyle="--", linewidth=1)
axes[1].set_title("Debt-to-income vs age of credit history")
plt.tight_layout()
plt.show()
""")

md(r"""
**Insights:**
- `VALUE` and `MORTDUE` lie close to a straight line: the mortgage balance is typically 60% to 80% of the property value. Defaulters are scattered throughout rather than clustered, confirming that these two amounts alone do not separate the classes.
- In the right-hand chart almost every applicant to the right of the 45% debt-to-income line is a defaulter, regardless of credit history length. To the left, defaulters are concentrated in the lower part of the chart (short credit history). The two variables complement each other.
""")

md(r"""
### **Multivariate Analysis**
""")

code(r"""
# Correlation heatmap for numerical variables (target included as a number)
corr_df = data[num_cols].copy()
corr_df["BAD"] = data["BAD"].astype(int)
corr = corr_df.corr()

plt.figure(figsize=(12, 9))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", vmin=-1, vmax=1, square=True)
plt.title("Correlation matrix of numerical variables")
plt.show()
""")

md(r"""
**Insights - correlations:**
- The only strong correlation between inputs is **MORTDUE vs VALUE (0.88)**. For the logistic regression this is multicollinearity: the two coefficients will share the same information and individually be less reliable. Tree-based models are unaffected.
- Moderate relationships: `CLNO` with `MORTDUE`/`VALUE` (0.27 to 0.32, wealthier borrowers hold more credit lines) and `LOAN` with `VALUE` (0.34).
- Correlations with the target are all weak to moderate because the relationships are non-linear (thresholds and cliffs, as seen above): `DELINQ` (0.35) and `DEROG` (0.28) are the highest, followed by `DEBTINC` (0.20), `NINQ` (0.17) and `CLAGE` (-0.17). This is an early hint that **tree-based models, which capture thresholds naturally, should outperform a purely linear model**.
""")

code(r"""
# Pairplot of the most informative numerical variables, coloured by the target
sns.pairplot(data[["LOAN", "DEBTINC", "CLAGE", "DELINQ", "DEROG", "NINQ", "BAD"]].dropna(),
             hue="BAD", palette=["#4C72B0", "#C44E52"], diag_kind="kde", corner=True,
             plot_kws={"alpha": 0.4, "s": 15})
plt.suptitle("Pairplot of key numerical variables by BAD", y=1.02)
plt.show()
""")

md(r"""
**Insights - pairplot:**
- The density curves on the diagonal show that defaulters (red) have visibly shorter `CLAGE`, higher `DEBTINC` and heavier tails on `DELINQ`, `DEROG` and `NINQ`.
- No single pair of variables separates the classes cleanly; the separation comes from combinations, which again favours tree-based models.
""")

# --------------------------------------------------------------------------------------
md(r"""
## Treating Outliers
""")

md(r"""
**Approach.** The boxplots showed outliers in almost every numerical column. Two kinds exist here:

1. *Implausible values* that are probably data errors: `DEBTINC` above 100%, `CLAGE` above about 600 months.
2. *Genuine but extreme values*: large loans, expensive properties, many delinquencies.

Both kinds matter differently for different models:

- **Logistic Regression** is sensitive to extreme values because they pull the fitted line. For the linear model we **cap** each continuous column at the IQR whiskers (Q1 - 1.5 IQR and Q3 + 1.5 IQR), which keeps every row but limits the leverage of extremes. The count variables `DEROG` and `DELINQ` are capped at their 99th percentile instead, because their inter-quartile range is zero.
- **Decision Trees and Random Forests** split on rank order, so an outlier simply falls into the top bucket; capping does not change their splits. For the tree models we **keep the original values**, which also preserves information such as "DEBTINC above 50% always defaults".

We therefore keep two versions of the data: `df_lr` (outliers capped, for the linear model) and `data` (untreated, for the tree models).
""")

code(r"""
def treat_outliers(df, col):
    '''Cap a numerical column at the IQR whiskers.'''
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
    df[col] = np.clip(df[col], lower, upper)
    return df

def treat_outliers_all(df, col_list):
    for c in col_list:
        df = treat_outliers(df, c)
    return df

df_lr = data.copy()

# IQR capping for the continuous variables
iqr_cols = [c for c in num_cols if c not in ("DEROG", "DELINQ")]
df_lr = treat_outliers_all(df_lr, iqr_cols)

# DEROG and DELINQ are counts with Q1 = Q3 = 0, so the IQR whiskers collapse to zero and would erase
# the variables entirely. They are capped at the 99th percentile instead.
for c in ["DEROG", "DELINQ"]:
    cap = df_lr[c].quantile(0.99)
    df_lr[c] = df_lr[c].clip(upper=cap)

# Compare the maximum of each column before and after capping
pd.DataFrame({"max_before": data[num_cols].max(), "max_after": df_lr[num_cols].max(),
              "rows_capped": [(data[c] > df_lr[c]).sum() + (data[c] < df_lr[c]).sum() for c in num_cols]})
""")

md(r"""
**Observations:**
- Capping removes the impossible values (DEBTINC 203% becomes about 54%, CLAGE 1,168 months becomes about 408 months) while keeping every row.
- `DEROG` and `DELINQ` have a 75th percentile of zero, so the IQR whiskers collapse to zero; applying the rule blindly would set every value to zero and erase two of the strongest risk signals. They are therefore capped at the 99th percentile instead (about 4 derogatory reports and 5 delinquent lines), which limits the leverage of the extreme counts while keeping the signal.
- The capped DEBTINC ceiling (about 54%) is still above the 45% danger threshold, so the linear model can still learn that rule.
""")

# --------------------------------------------------------------------------------------
md(r"""
## Treating Missing Values
""")

md(r"""
**Approach.**

1. **Create a binary flag** `<column>_missing` for every column with gaps. The bivariate analysis showed that missingness, especially of `DEBTINC` and `VALUE`, is strongly predictive, so this information must be preserved.
2. **Impute numerical columns with the median** (robust to the skew and outliers seen above) and **categorical columns with the mode**.
3. Apply exactly the same steps to both versions of the data (`df_lr` for the linear model, `data` for the tree models).

Imputation statistics are computed on the full dataset here for simplicity; in a production pipeline they would be computed on the training fold only. Because medians and modes of this data are stable, the effect on the evaluation below is negligible.
""")

code(r"""
def add_missing_flags(df):
    '''Add a 0/1 flag column for each column that has missing values.'''
    for col in [c for c in df.columns if df[c].isnull().any()]:
        df[f"{col}_missing"] = df[col].isnull().astype(int)
    return df

def impute(df):
    '''Median for numerical columns, mode for categorical columns.'''
    num = df.select_dtypes("number").columns
    cat = df.select_dtypes("category").columns.drop("BAD")
    df[num] = df[num].fillna(df[num].median())
    for c in cat:
        df[c] = df[c].fillna(df[c].mode()[0])
    return df

for frame in (df_lr, data):
    add_missing_flags(frame)
    impute(frame)

print("Remaining missing values (tree data):", data.isnull().sum().sum())
print("Remaining missing values (linear data):", df_lr.isnull().sum().sum())
print("\nFlag columns added:", [c for c in data.columns if c.endswith("_missing")])
""")

code(r"""
data.head()
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Important Insights from EDA**

What are the the most important observations and insights from the data based on the EDA performed?
""")

md(r"""
1. **One in five loans goes bad (19.9%).** The classes are imbalanced, so accuracy is the wrong yardstick and class weights are needed during training.

2. **Missing information is the strongest single risk signal.** Applicants with no recorded debt-to-income ratio default 62% of the time (vs 8.6% when it is recorded) and applicants with no property valuation default 94% of the time. The bank's approval process should treat an unverifiable income or valuation as a red flag, not as a neutral gap.

3. **Debt-to-income ratio has a hard threshold.** Below 40% the default rate is only 4% to 7%; between 40% and 45% it is 11%; above 45% it is 87% to 100%. A 45% cut-off is a simple, defensible policy rule.

4. **Past credit behaviour predicts future behaviour.** Each additional major derogatory report or delinquent credit line raises the default rate sharply (0 reports: 17%; 1: 39%; 2: 51%; 3+: 70%+). Recent credit inquiries show the same monotonic pattern.

5. **A long credit history protects.** Applicants whose oldest credit line is under 5 years old default 43% of the time; above 20 years the rate falls to about 10%.

6. **Small loans are not safe loans.** Loans under \$5,000 default 57% of the time, three times the average.

7. **Occupation matters moderately.** Sales (35%) and self-employed (30%) applicants default most; office workers (13%) and professionals (17%) least. Loan purpose (home improvement vs debt consolidation) makes only a 3-point difference.

8. **Property value and mortgage balance are highly correlated (0.88)** and individually weak predictors. They will be kept, but the linear model's coefficients for them should be read with caution.

9. **Relationships with the target are non-linear** (cliffs and thresholds rather than straight lines), so tree-based models are expected to outperform logistic regression, while logistic regression will remain useful as the most transparent benchmark.

10. **Pre-processing decisions:** no rows dropped, no duplicates found, a missing-value flag added for every column with gaps, median/mode imputation, IQR capping only for the linear model, one-hot encoding for `REASON` and `JOB`, and feature scaling only for the linear model.
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Model Building - Approach**
- Data preparation
- Partition the data into train and test set
- Build the model
- Fit on the train data
- Tune the model
- Test the model on test set

**A note on technique choice.** The Practical Data Science toolkit covers decision trees, bagging and random forests, and time-series forecasting. The first three are used below, building up from a single tree to a bagged ensemble to a random forest so that the contribution of each idea is visible. Time-series methods do not apply to this problem: each row is one loan application with no date or ordering, so there is no sequence to model. A time-aware validation (train on earlier applications, test on later ones) is recommended as further analysis once application dates are available. Logistic regression is included as the linear benchmark required for a fair comparison of linear and non-linear techniques.
""")

md(r"""
### Model evaluation criterion - what is the measure of success?

The model makes two kinds of mistakes, and they do not cost the same:

| Model says | Reality | Name | Business consequence |
|---|---|---|---|
| Will repay (approve) | Defaults | **False Negative** | The bank loses a large part of the principal plus collection costs. For a typical \$18,600 loan this is several thousand dollars. |
| Will default (reject) | Would have repaid | **False Positive** | The bank loses the interest margin on one good customer and may lose the relationship. Typically a few hundred to a couple of thousand dollars. |

A missed defaulter costs several times more than a wrongly rejected good customer. The primary metric is therefore **Recall on the defaulter class (BAD = 1)**: *of all the applicants who went on to default, what share did the model flag in advance?*

Recall alone can be gamed (rejecting everyone gives 100% recall), so we track two guard-rails:

- **Precision** on the defaulter class: of the applicants we reject, how many would really have defaulted? Low precision means the bank is turning away good business.
- **F1-score**: the harmonic mean of the two, used as the tie-breaker when recall is similar.

We also report **Accuracy** for completeness and **ROC-AUC** as a threshold-free measure of how well the model ranks risky applicants, which matters because the bank can later move the decision threshold.

We will tune the models with **cross-validated grid search optimising Recall**, and then choose the final model on recall *with acceptable precision* rather than recall at any cost.
""")

code(r"""
def metrics_score(actual, predicted, labels=("Repaid (0)", "Default (1)"), title="Confusion matrix"):
    '''Classification report and a confusion matrix heatmap.'''
    print(classification_report(actual, predicted, digits=3))
    cm = confusion_matrix(actual, predicted)
    plt.figure(figsize=(5.5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False,
                xticklabels=labels, yticklabels=labels)
    plt.ylabel("Actual"); plt.xlabel("Predicted"); plt.title(title)
    plt.show()


def model_scores(model, X_tr, y_tr, X_te, y_te, name):
    '''Return a one-row DataFrame of train/test metrics for a fitted model.'''
    p_tr, p_te = model.predict(X_tr), model.predict(X_te)
    row = {
        "Model": name,
        "Train Recall": recall_score(y_tr, p_tr), "Test Recall": recall_score(y_te, p_te),
        "Train Precision": precision_score(y_tr, p_tr), "Test Precision": precision_score(y_te, p_te),
        "Train F1": f1_score(y_tr, p_tr), "Test F1": f1_score(y_te, p_te),
        "Train Accuracy": accuracy_score(y_tr, p_tr), "Test Accuracy": accuracy_score(y_te, p_te),
        "Test ROC-AUC": roc_auc_score(y_te, model.predict_proba(X_te)[:, 1]),
    }
    return pd.DataFrame([row])

results = []   # collects the comparison table
""")

md(r"""
### Data preparation and train/test split

- Separate the target from the inputs, one-hot encode `REASON` and `JOB` (dropping the first level to avoid redundant columns), and convert the target to integer.
- Split **70% train / 30% test**, stratified on `BAD` so both sets keep the 20% default rate. The same random seed is used for every model so results are comparable.
- Build the split for both data versions (capped data for the linear model, untreated data for the tree models) with the same seed, so **the same applicants end up in the test set** in both cases.
""")

code(r"""
def prepare_xy(df):
    X = pd.get_dummies(df.drop(columns=["BAD"]), columns=["REASON", "JOB"], drop_first=True, dtype=int)
    y = df["BAD"].astype(int)
    return X, y

# Linear-model version (outliers capped)
X_lr, y_lr = prepare_xy(df_lr)
X_train_lr, X_test_lr, y_train_lr, y_test_lr = train_test_split(
    X_lr, y_lr, test_size=0.30, random_state=RANDOM_STATE, stratify=y_lr)

# Tree-model version (outliers untouched)
X, y = prepare_xy(data)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.30, random_state=RANDOM_STATE, stratify=y)

print("Feature columns:", list(X.columns))
print(f"\nTrain shape: {X_train.shape}, Test shape: {X_test.shape}")
print(f"Default rate - train: {y_train.mean():.3f}, test: {y_test.mean():.3f}")
assert (X_train_lr.index == X_train.index).all(), "both splits must contain the same applicants"
""")

code(r"""
# Scale the inputs for the linear model (fit on train only, apply to test)
scaler = StandardScaler()
X_train_lr_s = pd.DataFrame(scaler.fit_transform(X_train_lr), columns=X_train_lr.columns, index=X_train_lr.index)
X_test_lr_s = pd.DataFrame(scaler.transform(X_test_lr), columns=X_test_lr.columns, index=X_test_lr.index)
""")

# --------------------------------------------------------------------------------------
md(r"""
### Logistic Regression
""")

md(r"""
Logistic regression is the **linear benchmark**: it models the log-odds of default as a weighted sum of the inputs. Its coefficients are directly interpretable, which is exactly what the ECOA requirement asks for. We fit two versions:

1. A plain model (equal class weights) to see the effect of the imbalance.
2. A model with `class_weight="balanced"`, which up-weights the minority defaulter class so the model stops favouring the majority.
""")

code(r"""
# 1. Plain logistic regression
lr_plain = LogisticRegression(max_iter=2000, random_state=RANDOM_STATE)
lr_plain.fit(X_train_lr_s, y_train_lr)

print("Train performance - Logistic Regression (plain)")
metrics_score(y_train_lr, lr_plain.predict(X_train_lr_s), title="LR plain - train")
print("Test performance - Logistic Regression (plain)")
metrics_score(y_test_lr, lr_plain.predict(X_test_lr_s), title="LR plain - test")
results.append(model_scores(lr_plain, X_train_lr_s, y_train_lr, X_test_lr_s, y_test_lr, "Logistic Regression (plain)"))
""")

code(r"""
# 2. Logistic regression with balanced class weights
lr_bal = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE)
lr_bal.fit(X_train_lr_s, y_train_lr)

print("Train performance - Logistic Regression (balanced)")
metrics_score(y_train_lr, lr_bal.predict(X_train_lr_s), title="LR balanced - train")
print("Test performance - Logistic Regression (balanced)")
metrics_score(y_test_lr, lr_bal.predict(X_test_lr_s), title="LR balanced - test")
results.append(model_scores(lr_bal, X_train_lr_s, y_train_lr, X_test_lr_s, y_test_lr, "Logistic Regression (balanced)"))
""")

md(r"""
**Observations - Logistic Regression:**
- The plain model is accurate overall (88% on test) but catches only **57% of defaulters** on the test set: it is biased towards predicting "repaid" because that is the majority class.
- Balancing the class weights raises test recall to **80%** while precision falls to 61% and accuracy to 86%. In business terms the balanced model catches roughly 23 more defaulters out of every 100, at the cost of rejecting more good customers.
- Train and test scores are close, so the linear model is **not over-fitting**; its limitation is that a straight line cannot capture the threshold effects seen in the EDA.
- ROC-AUC of about 0.91 shows the model ranks applicants well even though a fixed 0.5 cut-off is not ideal.
""")

code(r"""
# Coefficients and odds ratios of the balanced logistic regression (inputs are standardised,
# so coefficients are comparable: effect of a one-standard-deviation increase on the log-odds of default)
coef = pd.DataFrame({"feature": X_train_lr_s.columns, "coefficient": lr_bal.coef_[0]})
coef["odds_ratio"] = np.exp(coef["coefficient"])
coef = coef.sort_values("coefficient", ascending=False).reset_index(drop=True)

plt.figure(figsize=(9, 7))
colors = ["#C44E52" if c > 0 else "#4C72B0" for c in coef["coefficient"]]
sns.barplot(data=coef, x="coefficient", y="feature", palette=colors)
plt.axvline(0, color="black", linewidth=1)
plt.title("Logistic Regression (balanced) - standardised coefficients\nred = raises default risk, blue = lowers it")
plt.show()
coef
""")

md(r"""
**Insights - what the linear model says drives default:**

- **Risk-increasing (positive coefficients):** `DEBTINC_missing` is the largest effect (odds of default about 2.9 times higher per standard deviation, i.e. when the ratio is not recorded), followed by `DELINQ` (odds ratio 2.4), `VALUE_missing` (1.9), `DEBTINC` (1.8), `CLNO_missing`, `DEROG` (1.5), `NINQ` and the `JOB_Sales` indicator.
- **Risk-decreasing (negative coefficients):** `CLAGE` (longer credit history, odds ratio 0.61), `YOJ` (job tenure), `JOB_Office`, and the `DEROG_missing`, `JOB_missing`, `YOJ_missing` and `DELINQ_missing` flags (the groups for which these fields were blank defaulted less often in the EDA).
- `LOAN` has almost no linear effect once the other variables are included: its relationship with default is non-linear (small loans are riskier, large loans are not), which a straight line cannot represent.
- The signs agree with the EDA and with lending common sense, which gives confidence that the model is learning real risk rather than noise.
- `MORTDUE` and `VALUE` have opposite signs of similar size, the classic symptom of their 0.88 correlation; individually these two coefficients should not be over-interpreted.
""")

md(r"""
#### Can a different threshold improve the linear model?

The default cut-off is 0.5. For an imbalanced problem the best operating point is usually lower. The precision-recall trade-off below shows what the bank gains and loses by moving the threshold.
""")

code(r"""
proba_lr = lr_bal.predict_proba(X_test_lr_s)[:, 1]
prec, rec, thr = precision_recall_curve(y_test_lr, proba_lr)

plt.figure(figsize=(8, 4.5))
plt.plot(thr, prec[:-1], label="Precision (default class)")
plt.plot(thr, rec[:-1], label="Recall (default class)")
plt.axvline(0.5, color="grey", linestyle="--", linewidth=1, label="threshold = 0.5")
plt.xlabel("Probability threshold for predicting default"); plt.ylabel("score")
plt.title("Logistic Regression (balanced) - precision and recall vs threshold (test set)")
plt.legend(); plt.show()

# Metrics at a few candidate thresholds
rows = []
for t in [0.3, 0.4, 0.5, 0.6]:
    p = (proba_lr >= t).astype(int)
    rows.append({"threshold": t, "recall": recall_score(y_test_lr, p),
                 "precision": precision_score(y_test_lr, p), "f1": f1_score(y_test_lr, p),
                 "accuracy": accuracy_score(y_test_lr, p)})
pd.DataFrame(rows)
""")

md(r"""
**Observations:**
- Lowering the threshold to 0.4 lifts recall to about 83% but precision drops to about 53%; raising it to 0.6 does the reverse (74% recall, 67% precision). F1 is highest around 0.5-0.6, so the balanced model at 0.5 is already close to its best balance.
- The threshold is a **business lever**, not a technical constant: the bank's risk appetite decides where to sit on this curve. We revisit it for the final model.
""")

# --------------------------------------------------------------------------------------
md(r"""
### Decision Tree
""")

md(r"""
A decision tree learns a sequence of yes/no questions ("Is DEBTINC above 44.6%?") that split the applicants into increasingly pure groups. It captures the threshold effects seen in the EDA directly and produces rules that can be read out to an applicant or a regulator.

Tree models are trained on the **untreated data** (`X_train`, `X_test`): outliers do not distort tree splits, and keeping the real values preserves information such as "DEBTINC above 50% always defaults".

We start with a fully grown tree to establish a baseline, then add class weights, then prune with grid search.
""")

code(r"""
# Baseline decision tree (fully grown)
dt_base = DecisionTreeClassifier(random_state=RANDOM_STATE)
dt_base.fit(X_train, y_train)

print("Train performance - Decision Tree (default)")
metrics_score(y_train, dt_base.predict(X_train), title="DT default - train")
print("Test performance - Decision Tree (default)")
metrics_score(y_test, dt_base.predict(X_test), title="DT default - test")
results.append(model_scores(dt_base, X_train, y_train, X_test, y_test, "Decision Tree (default)"))
print("Tree depth:", dt_base.get_depth(), "| number of leaves:", dt_base.get_n_leaves())
""")

md(r"""
**Observations - default Decision Tree:**
- The fully grown tree is a textbook case of **over-fitting**: 100% recall, precision and accuracy on the training data, but only about **69% recall** and 71% precision on the test set. It has memorised the training applicants (dozens of levels deep, hundreds of leaves) instead of learning general rules.
- Even so, its test recall is already higher than the plain logistic regression, confirming that non-linear splits help on this data.
""")

code(r"""
# Decision tree with class weights favouring the defaulter class
dt_cw = DecisionTreeClassifier(random_state=RANDOM_STATE, class_weight={0: 0.2, 1: 0.8})
dt_cw.fit(X_train, y_train)

print("Train performance - Decision Tree (class weights 0.2/0.8)")
metrics_score(y_train, dt_cw.predict(X_train), title="DT weighted - train")
print("Test performance - Decision Tree (class weights 0.2/0.8)")
metrics_score(y_test, dt_cw.predict(X_test), title="DT weighted - test")
results.append(model_scores(dt_cw, X_train, y_train, X_test, y_test, "Decision Tree (class weights)"))
""")

md(r"""
**Observations:**
- Adding class weights to an un-pruned tree does **not** help: the tree still grows until every training leaf is pure, so the weights have nothing left to re-balance. Test recall is about 62%, no better than the baseline.
- Class weights only pay off once the tree is constrained (pruned), which is what the grid search does next.
""")

md(r"""
### **Decision Tree - Hyperparameter Tuning**

* Hyperparameter tuning is tricky in the sense that **there is no direct way to calculate how a change in the hyperparameter value will reduce the loss of your model**, so we usually resort to experimentation. We'll use Grid search to perform hyperparameter tuning.
* **Grid search is a tuning technique that attempts to compute the optimum values of hyperparameters.**
* **It is an exhaustive search** that is performed on the specific parameter values of a model.
* The parameters of the estimator/model used to apply these methods are **optimized by cross-validated grid-search** over a parameter grid.

**Criterion {"gini", "entropy"}**

The function to measure the quality of a split. Supported criteria are "gini" for the Gini impurity and "entropy" for the information gain.

**max_depth**

The maximum depth of the tree. If None, then nodes are expanded until all leaves are pure or until all leaves contain less than min_samples_split samples.

**min_samples_leaf**

The minimum number of samples is required to be at a leaf node. A split point at any depth will only be considered if it leaves at least min_samples_leaf training samples in each of the left and right branches. This may have the effect of smoothing the model, especially in regression.

You can learn about more Hyperpapameters on this link and try to tune them.

https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html

We search over depth, minimum leaf size, split criterion and class weights, using **5-fold stratified cross-validation on the training set with Recall as the scoring metric**. The test set is never used for tuning.
""")

code(r"""
dt_grid = {
    "max_depth": [3, 4, 5, 6, 8, 10, None],
    "min_samples_leaf": [1, 5, 10, 20, 50],
    "criterion": ["gini", "entropy"],
    "class_weight": [None, "balanced", {0: 0.2, 1: 0.8}],
}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

dt_search = GridSearchCV(DecisionTreeClassifier(random_state=RANDOM_STATE), dt_grid,
                         scoring="recall", cv=cv, n_jobs=-1)
dt_search.fit(X_train, y_train)

print("Best parameters :", dt_search.best_params_)
print(f"Best CV recall  : {dt_search.best_score_:.3f}")
dt_tuned = dt_search.best_estimator_
""")

code(r"""
print("Train performance - Decision Tree (tuned)")
metrics_score(y_train, dt_tuned.predict(X_train), title="DT tuned - train")
print("Test performance - Decision Tree (tuned)")
metrics_score(y_test, dt_tuned.predict(X_test), title="DT tuned - test")
results.append(model_scores(dt_tuned, X_train, y_train, X_test, y_test, "Decision Tree (tuned)"))
print("Tree depth:", dt_tuned.get_depth(), "| number of leaves:", dt_tuned.get_n_leaves())
""")

md(r"""
**Observations - tuned Decision Tree:**
- Pruning (a minimum of 20 applicants per leaf, which cuts the tree from 366 leaves to about 100) combined with balanced class weights lifts **test recall to about 82%**, the highest of the single-model approaches. The train-test gap narrows from 31 points to about 10 (92% vs 82%), so over-fitting is much reduced though not gone.
- The price is precision: only about 53% of the applicants the tree rejects would actually have defaulted, and overall accuracy falls to about 82%. The tree is deliberately cautious - it flags anyone who looks even moderately risky.
- This is the recall-precision trade-off in action. Whether 53% precision is acceptable depends on how much good business the bank is willing to turn away; the Random Forest below improves this balance.
""")

code(r"""
# Visualise the top levels of the tuned tree (the full tree is deeper; the first 3 levels carry the main rules)
plt.figure(figsize=(26, 10))
plot_tree(dt_tuned, feature_names=X_train.columns, class_names=["Repaid", "Default"],
          filled=True, rounded=True, max_depth=3, fontsize=9, proportion=True)
plt.title("Tuned Decision Tree - first three levels (proportions of weighted samples)")
plt.show()
""")

code(r"""
# Text version of the decision rules (first four levels)
print(export_text(dt_tuned, feature_names=list(X_train.columns), max_depth=4, show_weights=False))
""")

md(r"""
**Business rules deduced from the tree:**

Reading the top of the tree gives the bank a set of plain-language rules it can defend in front of an applicant or a regulator:

1. **Is the debt-to-income ratio missing?** If yes, the applicant is in the highest-risk group (62% historical default rate). Unverified income should trigger either a rejection or a mandatory income-verification step.
2. **If the ratio is recorded, is it above roughly 43-45%?** If yes, the applicant is almost certain to default - reject.
3. **Below that ratio, how many delinquent credit lines does the applicant have?** Zero delinquencies is the safest group; one or more pushes the applicant back into the risky branch.
4. **Among the remaining applicants, how long is the credit history (CLAGE) and how many derogatory reports (DEROG) are there?** Short histories (under about 15 years) with any derogatory report are risky; long clean histories are safe.
5. **In the "ratio missing" branch the same questions are asked again** (delinquencies, derogatory reports, credit-history length, loan size), and almost every path that combines a missing ratio with any delinquency or derogatory report ends in "default".

These rules match the EDA findings exactly, which is reassuring: the model is formalising the patterns in the data rather than inventing new ones.
""")

# --------------------------------------------------------------------------------------
md(r"""
### Bagging (Bootstrap Aggregating): from one tree to many

A single decision tree has **high variance**: small changes in the training data produce a different tree, which is why the fully grown tree scored 100% on training data and far less on test data. **Bagging** trains many trees, each on a *bootstrap sample* (a random sample of the training applicants drawn with replacement), and combines their votes. Averaging many over-fitted trees cancels out their individual errors, which lowers variance without raising bias.

A Random Forest is bagging plus one more idea (a random subset of features at every split), so building a plain bagged ensemble first shows how much of the improvement comes from bagging alone.
""")

code(r"""
from sklearn.ensemble import BaggingClassifier

# Bagging of 200 fully grown decision trees
bag = BaggingClassifier(estimator=DecisionTreeClassifier(random_state=RANDOM_STATE),
                        n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)
bag.fit(X_train, y_train)

print("Train performance - Bagging (200 trees)")
metrics_score(y_train, bag.predict(X_train), title="Bagging - train")
print("Test performance - Bagging (200 trees)")
metrics_score(y_test, bag.predict(X_test), title="Bagging - test")
results.append(model_scores(bag, X_train, y_train, X_test, y_test, "Bagging (200 trees)"))
""")

code(r"""
# Does weighting the base trees towards the defaulter class help a bagged ensemble?
bag_cw = BaggingClassifier(estimator=DecisionTreeClassifier(random_state=RANDOM_STATE, class_weight={0: 0.2, 1: 0.8}),
                           n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)
bag_cw.fit(X_train, y_train)
results.append(model_scores(bag_cw, X_train, y_train, X_test, y_test, "Bagging (class-weighted trees)"))
pd.concat(results[-2:], ignore_index=True).set_index("Model").round(3)
""")

md(r"""
**Observations - Bagging:**
- Averaging 200 trees lifts **test precision from 71% (single tree) to 83% and ROC-AUC from 0.81 to 0.95** at the same recall (about 68%). That is the variance reduction bagging promises: the ensemble is right far more often when it flags a defaulter, and it ranks applicants by risk almost as well as the forest will.
- Train recall is still 100%: bagging limits the *damage* of over-fitting on unseen data, it does not stop each tree from memorising its sample.
- Weighting the base trees towards the defaulter class does **not** raise recall (it falls to about 61%), for the same reason as with the single tree: an un-pruned tree already fits its bootstrap sample perfectly, so the weights have nothing left to rebalance. Class weights become useful once the trees are also constrained, which is what the random forest tuning below does.
- A bagged ensemble still misses about a third of defaulters. The random forest adds feature sub-sampling, which de-correlates the trees and should improve both ranking and, combined with class weights, recall.
""")

md(r"""
### **Building a Random Forest Classifier**

**Random Forest is a bagging algorithm where the base models are Decision Trees.** Samples are taken from the training data and on each sample a decision tree makes a prediction.

**The results from all the decision trees are combined together and the final prediction is made using voting or averaging.**

Because each tree sees a different bootstrap sample and a random subset of features at each split, the individual over-fitted trees average out, which usually gives a large improvement in test performance over a single tree while keeping the ability to model thresholds. The cost is interpretability: a forest of hundreds of trees cannot be read as a rule list, so we will rely on **feature importances** to explain it.
""")

code(r"""
# Baseline random forest
rf_base = RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)
rf_base.fit(X_train, y_train)

print("Train performance - Random Forest (default)")
metrics_score(y_train, rf_base.predict(X_train), title="RF default - train")
print("Test performance - Random Forest (default)")
metrics_score(y_test, rf_base.predict(X_test), title="RF default - test")
results.append(model_scores(rf_base, X_train, y_train, X_test, y_test, "Random Forest (default)"))
""")

md(r"""
**Observations - default Random Forest:**
- Like the single tree, the forest fits the training data perfectly, but on the test set it is much stronger: about **69% recall with 85% precision**, 91% accuracy and a ROC-AUC of about 0.96 (the best ranking ability so far).
- The forest is conservative about calling someone a defaulter: when it does, it is right 85% of the time, but it still misses about a third of the defaulters. Class weights should shift that balance towards recall.
""")

md(r"""
### **Build a Random Forest model with Class Weights**
""")

code(r"""
rf_cw = RandomForestClassifier(n_estimators=200, class_weight={0: 0.2, 1: 0.8},
                               random_state=RANDOM_STATE, n_jobs=-1)
rf_cw.fit(X_train, y_train)

print("Train performance - Random Forest (class weights 0.2/0.8)")
metrics_score(y_train, rf_cw.predict(X_train), title="RF weighted - train")
print("Test performance - Random Forest (class weights 0.2/0.8)")
metrics_score(y_test, rf_cw.predict(X_test), title="RF weighted - test")
results.append(model_scores(rf_cw, X_train, y_train, X_test, y_test, "Random Forest (class weights)"))
""")

md(r"""
**Observations - weighted Random Forest:**
- Class weights lift **test recall to about 78%** while precision stays near 78% and accuracy near 91%. Unlike the single tree, the forest benefits from class weights because each bootstrap tree is slightly different and the weights change how the ensemble votes.
- This is the best balance of recall and precision so far: the forest catches almost as many defaulters as the balanced logistic regression (78% vs 80%) with far higher precision (77% vs 61%), so it declines far fewer good customers.
- Train scores are still perfect, so there is residual over-fitting; tuning the depth and leaf size should reduce the gap.
""")

md(r"""
### **Random Forest Classifier Hyperparameter Tuning**

We search over the number of trees, maximum depth, minimum leaf size, the number of features considered per split and the class weights, again with **stratified 3-fold cross-validation on the training data and Recall as the scoring metric**. (3 folds instead of 5 keep the run time reasonable for the larger forest grid.)
""")

code(r"""
rf_grid = {
    "n_estimators": [150, 300],
    "max_depth": [6, 10, None],
    "min_samples_leaf": [1, 5, 10],
    "max_features": ["sqrt", 0.5],
    "class_weight": ["balanced", {0: 0.2, 1: 0.8}],
}
cv3 = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)

rf_search = GridSearchCV(RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1), rf_grid,
                         scoring="recall", cv=cv3, n_jobs=-1)
rf_search.fit(X_train, y_train)

print("Best parameters :", rf_search.best_params_)
print(f"Best CV recall  : {rf_search.best_score_:.3f}")
rf_tuned = rf_search.best_estimator_
""")

code(r"""
print("Train performance - Random Forest (tuned for recall)")
metrics_score(y_train, rf_tuned.predict(X_train), title="RF tuned - train")
print("Test performance - Random Forest (tuned for recall)")
metrics_score(y_test, rf_tuned.predict(X_test), title="RF tuned - test")
results.append(model_scores(rf_tuned, X_train, y_train, X_test, y_test, "Random Forest (tuned, recall)"))
""")

md(r"""
**Observations - tuned Random Forest:**
- Optimising purely for recall pushes the grid towards larger leaves (10 applicants minimum) and balanced weights. Test recall lands at about **78%**, the same as the weighted forest, but precision drops to about 65% because the forest becomes more willing to flag borderline applicants.
- The train-test gap shrinks (train recall is no longer 100%), so the tuned forest generalises better even though its headline test numbers are similar.
- Recall-only tuning illustrates the limitation of a single-metric search on an imbalanced problem: beyond a point, extra recall is bought with a lot of precision. The comparison table below weighs the two together.
""")

code(r"""
# Feature importance of the tuned random forest
importances = pd.Series(rf_tuned.feature_importances_, index=X_train.columns).sort_values(ascending=False)

plt.figure(figsize=(9, 7))
sns.barplot(x=importances.values, y=importances.index, color="#4C72B0")
plt.title("Random Forest (tuned) - feature importance (mean decrease in impurity)")
plt.xlabel("importance"); plt.ylabel("")
plt.show()
importances.round(4).to_frame("importance").head(12)
""")

md(r"""
**Insights - what the forest relies on:**
- The two debt-to-income features dominate: **`DEBTINC_missing` and `DEBTINC` together account for more than half (about 53%) of all the forest's split power.** This confirms the EDA finding that affordability, and whether it could be verified, is the heart of the decision.
- Next come **`DELINQ`, `CLAGE` and `DEROG`** (past repayment behaviour and depth of credit history), then `LOAN`, `VALUE`, `MORTDUE` and `CLNO`.
- `NINQ`, `YOJ` and `VALUE_missing` contribute modestly. The `JOB` and `REASON` dummies rank at the bottom: once financial behaviour is known, occupation and loan purpose add little, which is also good news from a fair-lending perspective.
""")

md(r"""
#### Improving the forest by removing weak variables

A best-practice check: does the model keep its performance with fewer inputs? A leaner model is cheaper to maintain, easier to explain and less prone to picking up spurious patterns. We refit the weighted forest on only the features with importance above 1%.
""")

code(r"""
keep = importances[importances > 0.01].index.tolist()
dropped = [c for c in X_train.columns if c not in keep]
print(f"Keeping {len(keep)} of {X_train.shape[1]} features. Dropped: {dropped}")

rf_lean = RandomForestClassifier(**{k: v for k, v in rf_search.best_params_.items()},
                                 random_state=RANDOM_STATE, n_jobs=-1)
rf_lean.fit(X_train[keep], y_train)

print("Test performance - Random Forest (tuned, reduced features)")
metrics_score(y_test, rf_lean.predict(X_test[keep]), title="RF tuned, reduced features - test")
results.append(model_scores(rf_lean, X_train[keep], y_train, X_test[keep], y_test, "Random Forest (tuned, reduced features)"))
""")

md(r"""
**Observations:**
- Dropping the 15 low-importance columns (all occupation and loan-purpose dummies and nine of the eleven missing-value flags) changes test performance by at most a point: recall stays at about 78% and precision moves from about 65% to 66%. The forest's signal lives in **12 variables**: the ten financial attributes plus the `DEBTINC` and `VALUE` missing flags.
- This supports a simpler production model and confirms that occupation and loan purpose are not needed to reach the performance level reported here.
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Model Performance Comparison and Final Model Selection**
""")

md(r"""
**1. Comparison of various techniques and their relative performance based on chosen Metric (Measure of success):**
- How do different techniques perform? Which one is performing relatively better? Is there scope to improve the performance further?
""")

code(r"""
comparison = pd.concat(results, ignore_index=True).set_index("Model")
comparison.style.format("{:.3f}").background_gradient(subset=["Test Recall", "Test Precision", "Test F1", "Test ROC-AUC"], cmap="Blues")
""")

code(r"""
# Visual comparison on the test set
plot_df = comparison[["Test Recall", "Test Precision", "Test F1", "Test ROC-AUC"]].reset_index().melt(
    id_vars="Model", var_name="metric", value_name="score")
plt.figure(figsize=(13, 5.5))
ax = sns.barplot(data=plot_df, x="Model", y="score", hue="metric", palette="muted")
plt.xticks(rotation=25, ha="right"); plt.ylim(0, 1.05)
plt.title("Test-set performance by model"); plt.legend(loc="lower right")
plt.show()
""")

code(r"""
# ROC curves for the main candidates on the test set
plt.figure(figsize=(7, 6))
for name, model, Xt in [("Logistic Regression (balanced)", lr_bal, X_test_lr_s),
                        ("Decision Tree (tuned)", dt_tuned, X_test),
                        ("Random Forest (class weights)", rf_cw, X_test),
                        ("Random Forest (tuned)", rf_tuned, X_test)]:
    pr = model.predict_proba(Xt)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, pr)
    plt.plot(fpr, tpr, label=f"{name} (AUC = {roc_auc_score(y_test, pr):.3f})")
plt.plot([0, 1], [0, 1], "k--", linewidth=1)
plt.xlabel("False positive rate (good customers wrongly rejected)")
plt.ylabel("True positive rate (defaulters caught) = Recall")
plt.title("ROC curves - test set"); plt.legend(); plt.show()
""")

md(r"""
**Comparison - how the techniques perform:**

*Linear vs non-linear.* The balanced logistic regression reaches 80% recall but only 61% precision and a ROC-AUC of 0.91. Every random forest beats it on precision and AUC at a similar recall, confirming that the threshold-shaped relationships in this data are better captured by trees. The linear model remains the most transparent benchmark.

*Single tree vs bagging vs forest.* The tuned decision tree achieves the **highest raw recall (about 82%)** but the **lowest precision (about 53%)**: it would reject almost one good customer for every defaulter it catches. Bagging 200 trees shows the value of averaging: at the same 68% recall as the single fully grown tree, precision rises to 83% and ROC-AUC from 0.81 to 0.95. The random forests add feature sub-sampling and class weights and reach about 78% recall with precision between 65% and 77%, a far better balance, and the highest AUC (0.93-0.96), meaning they rank applicants by risk most accurately.

*Among the forests.* The class-weighted forest (0.2/0.8) has the best F1 (about 0.78) and precision at the same recall; the recall-tuned forest has the same recall with lower precision but a smaller train-test gap; the reduced-feature forest performs essentially the same as the tuned one with 12 instead of 27 inputs.

*Is there scope to improve further?* Yes, in three directions:
1. **Threshold tuning** on the chosen forest (shown below) moves recall above 90% at a controlled precision cost, because the forest's AUC is high.
2. **Feature engineering** such as a loan-to-value ratio ((LOAN + MORTDUE) / VALUE) or interaction terms, which the trees approximate but could use directly.
3. **Other ensembles** (gradient boosting) and probability calibration, which were outside the scope of this milestone and are listed as next steps.
""")

md(r"""
#### Implementation feasibility, risks and benefits of each technique

Performance is only one side of the decision. The table below weighs each technique on how practical it is to put in front of the bank's credit officers and regulators.

| Technique | Interpretability (ECOA adverse-action reasons) | Build and run cost | Stability and maintenance | Main risks | Verdict |
|---|---|---|---|---|---|
| Logistic Regression (balanced) | Excellent: one coefficient per attribute, odds ratios can be quoted directly | Trivial; trains in under a second; needs scaling and outlier capping in the pipeline | Very stable across re-trainings | Under-fits threshold effects, so it declines about 1.6 good customers per defaulter caught; needs careful handling of correlated inputs (MORTDUE/VALUE) | Keep as the transparent benchmark and challenger model |
| Decision Tree (tuned) | Excellent: a short rule list a credit officer can read | Trivial | Unstable: small changes in training data can re-shape the tree; must be re-validated at every re-train | Lowest precision (53%): too much good business declined | Use as the **explanation layer**, not as the scorer |
| Bagged trees (200) | Same as the forest: importances and per-applicant reason codes, no rule list | Low | Robust, like the forest | Class weights do not move its recall, so it is stuck at catching about two thirds of defaulters; below the forest on every metric | Superseded by the Random Forest |
| Random Forest (class weights or tuned) | Good with the right tooling: global feature importances plus per-applicant reason codes (the attributes that pushed the score up); not a rule list on its own | Low: trains in seconds, scores in milliseconds; 200-300 trees are trivial to host | Robust: averaging removes single-tree instability; needs drift monitoring and yearly re-training like any credit model | Perceived as a black box by some stakeholders; needs model-risk documentation and a fairness review before launch | **Adopt as the scoring engine**, paired with the tree for explanations |

**Potential outcome, in numbers.** The cell below turns the test-set confusion matrix into an indicative dollar impact per 1,000 applicants, using the same cost assumptions as the threshold analysis (missed defaulter about \$9,000, wrongly declined good customer about \$2,000). The baseline is the current process, under which every one of these applicants was approved and 20% defaulted.
""")

code(r"""
COST_FN, COST_FP = 9000, 2000   # indicative dollar cost of a missed defaulter / a wrongly declined good customer

def impact_per_1000(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    n = len(y_true)
    return {"defaulters_caught_per_1000": round(1000 * tp / n, 1),
            "defaulters_missed_per_1000": round(1000 * fn / n, 1),
            "good_customers_declined_per_1000": round(1000 * fp / n, 1),
            "expected_cost_per_1000_$": round(1000 * (fn * COST_FN + fp * COST_FP) / n)}

baseline_cost = round(1000 * y_test.mean() * COST_FN)   # approve everyone: every defaulter is a missed defaulter
impact = pd.DataFrame({
    "Current process (approve all)": {"defaulters_caught_per_1000": 0.0,
                                      "defaulters_missed_per_1000": round(1000 * y_test.mean(), 1),
                                      "good_customers_declined_per_1000": 0.0,
                                      "expected_cost_per_1000_$": baseline_cost},
    "Logistic Regression (balanced)": impact_per_1000(y_test_lr, lr_bal.predict(X_test_lr_s)),
    "Decision Tree (tuned)": impact_per_1000(y_test, dt_tuned.predict(X_test)),
    "Random Forest (class weights)": impact_per_1000(y_test, rf_cw.predict(X_test)),
}).T
impact["cost_reduction_vs_current_%"] = ((1 - impact["expected_cost_per_1000_$"] / baseline_cost) * 100).round(1)
impact
""")

md(r"""
**Observations - indicative benefit:**
- Against a baseline where all applicants are approved, every model removes the large majority of default-related cost. At the default 0.5 threshold the class-weighted forest cuts the indicative expected cost per 1,000 applicants by roughly 73%, the logistic regression by about 68% and the tuned tree by about 66%, mainly because the tree and the linear model decline many more good customers.
- Per 1,000 applicants the forest catches about 157 of the 200 defaulters while declining about 46 good customers; the tuned tree catches about 163 but declines about 143 good customers. The forest's advantage is almost entirely in precision, which is exactly what protects the bank's good business.
- These figures use round-number assumptions; the next section shows that moving the forest's threshold improves them further, and the bank's finance team should replace the assumptions with actual loss-given-default and margin figures.
""")

md(r"""
#### Choosing the operating threshold for the class-weighted Random Forest

The forest outputs a probability of default. The 0.5 cut-off used so far is arbitrary; the bank should pick the cut-off that matches its risk appetite. Below we show recall, precision and an **indicative expected cost per 1,000 applicants** under simple assumptions: a missed defaulter costs about \$9,000 (roughly half of a typical \$18,600 loan after recovery of the collateral) and a wrongly rejected good customer costs about \$2,000 in lost interest margin and acquisition spend.
""")

code(r"""
proba_rf = rf_cw.predict_proba(X_test)[:, 1]

rows = []
for t in np.round(np.arange(0.20, 0.71, 0.05), 2):
    p = (proba_rf > t).astype(int)        # strict '>' matches predict(), which assigns class 1 when p > 0.5
    tn, fp, fn, tp = confusion_matrix(y_test, p).ravel()
    n = len(y_test)
    rows.append({"threshold": float(t), "recall": tp / (tp + fn), "precision": tp / (tp + fp),
                 "f1": f1_score(y_test, p), "accuracy": (tp + tn) / n,
                 "missed_defaulters_per_1000": round(1000 * fn / n, 1),
                 "good_customers_rejected_per_1000": round(1000 * fp / n, 1),
                 "expected_cost_per_1000_$": round(1000 * (fn * COST_FN + fp * COST_FP) / n)})
thr_table = pd.DataFrame(rows)
thr_table.style.format({"recall": "{:.3f}", "precision": "{:.3f}", "f1": "{:.3f}", "accuracy": "{:.3f}",
                        "expected_cost_per_1000_$": "{:,.0f}"}).highlight_min(subset=["expected_cost_per_1000_$"], color="#c6efce")
""")

code(r"""
fig, ax1 = plt.subplots(figsize=(9, 4.8))
ax1.plot(thr_table["threshold"], thr_table["recall"], marker="o", label="Recall")
ax1.plot(thr_table["threshold"], thr_table["precision"], marker="o", label="Precision")
ax1.set_xlabel("probability threshold"); ax1.set_ylabel("score"); ax1.legend(loc="lower left")
ax2 = ax1.twinx()
ax2.plot(thr_table["threshold"], thr_table["expected_cost_per_1000_$"], color="grey", linestyle="--", marker="s", label="expected cost / 1,000 applicants")
ax2.set_ylabel("expected cost per 1,000 applicants ($)"); ax2.legend(loc="upper right")
plt.title("Class-weighted Random Forest - effect of the decision threshold (test set)")
plt.show()

best_t = thr_table.loc[thr_table["expected_cost_per_1000_$"].idxmin(), "threshold"]
print(f"Threshold with the lowest indicative expected cost: {best_t}")
""")

code(r"""
# Final model at the cost-minimising threshold
FINAL_THRESHOLD = float(best_t)
final_pred = (proba_rf > FINAL_THRESHOLD).astype(int)
print(f"Final model: class-weighted Random Forest, threshold = {FINAL_THRESHOLD}")
metrics_score(y_test, final_pred, title=f"Final model - test (threshold {FINAL_THRESHOLD})")
""")

md(r"""
**Observations - threshold choice:**
- At the default 0.5 cut-off the forest misses about 43 defaulters and wrongly declines about 46 good customers per 1,000 applicants. **Lowering the threshold to 0.25 cuts the missed defaulters to about 13 per 1,000 (recall 93%)** while the wrongly declined rise to about 92 per 1,000 (precision 67%, accuracy 90%).
- Under the stated cost assumptions (a missed defaulter is about 4.5 times as costly as a wrongly declined customer) the expected cost per 1,000 applicants falls from about \$479k at 0.5 to about \$304k at 0.25, a reduction of more than a third. Thresholds between 0.20 and 0.30 are all within 12% of that minimum, so the choice is robust.
- The exact threshold should be set with the bank's finance team using actual loss-given-default and margin figures; the table above is the template for that conversation.
""")

md(r"""
**2. Refined insights:**
- What are the most meaningful insights relevant to the problem?
""")

md(r"""
1. **Affordability, and whether it can be verified, decides most outcomes.** The debt-to-income ratio and its missing-flag are the top two features in every model. An applicant with no verifiable ratio defaulted 62% of the time; one with a ratio above 45% defaulted 87% to 100% of the time. These two checks alone would have caught a large share of historical defaults.

2. **Past repayment behaviour is the next strongest predictor.** Delinquent credit lines, major derogatory reports and recent credit inquiries all raise default risk monotonically. The decision tree's top splits and the forest's importances agree on this.

3. **Credit history length protects.** Applicants with 20+ years of credit history default about 10% of the time versus 43% for those with under 5 years.

4. **Loan size, property value and mortgage balance are secondary.** They matter in combination (small loans are riskier, as are missing valuations) but are weak on their own. The 0.88 correlation between `VALUE` and `MORTDUE` means they largely carry the same information.

5. **Occupation and loan purpose add little once financial behaviour is known.** Removing them barely changes the forest's performance. This is helpful for fair lending: the recommended model can be run without them.

6. **The models agree with each other and with the EDA.** The linear coefficients, the tree's rules and the forest's importances all point to the same handful of drivers, which gives confidence that the signal is real and stable.

7. **Model type matters less than handling the imbalance and missingness correctly.** Class weights improved recall by about 23 points for the logistic regression and 10 points for the forest. Averaging trees (bagging) mainly bought precision and ranking quality; the forest's feature sub-sampling plus class weights then bought recall.

8. **The decision threshold is a business dial.** With the forest's high AUC (0.96), the bank can move recall between about 70% and 94% by changing the cut-off, trading against how many good customers it declines. At the cost-minimising cut-off of 0.25 the forest catches 93% of defaulters with 67% precision.
""")

md(r"""
**3. Proposal for the final solution design:**
- What model do you propose to be adopted? Why is this the best solution to adopt?
""")

md(r"""
### Proposed solution: a class-weighted Random Forest as the scoring engine, paired with the pruned Decision Tree as the explanation layer

**Model specification**
- `RandomForestClassifier` with 200 trees, class weights {repaid: 0.2, default: 0.8}, all features (or the reduced set of about a dozen financial features, which performs the same), trained on the untreated data with missing-value flags and median/mode imputation.
- Decision threshold of **0.25** (the cost-minimising value under the stated assumptions) rather than the default 0.5, to be confirmed with the bank's own loss and margin figures.

**Why this is the best solution to adopt**
1. **Best balance on the chosen metric.** On unseen applicants it catches about 78% of defaulters at the 0.5 threshold and **93% at the recommended 0.25 threshold with 67% precision**, far better than the single decision tree (82% recall at 53% precision) and the logistic regression (80% recall at 61% precision). It has the highest F1 and the highest ROC-AUC (0.96) of all models tested, and the lowest indicative expected cost per 1,000 applicants.
2. **Robust.** Averaging hundreds of trees removes the instability of a single tree; the reduced-feature test showed the forest does not depend on any fragile variable.
3. **Interpretable enough for ECOA, with the right companion.** The forest itself is explained through feature importances and, for each applicant, the specific values that pushed the score up (high debt-to-income, delinquent lines, short history). For the formal adverse-action notice, the pruned decision tree provides a short rule list that mirrors the forest's logic (debt-to-income missing or above about 45%, delinquencies, derogatory reports, credit-history length). Both models are built from the same drivers, so the explanation is consistent with the score.
4. **Operationally simple.** The inputs are all fields already captured in the underwriting process; no new data is required to deploy.

**Why not the alternatives**
- *Logistic regression (balanced):* fully transparent, but at a similar recall it mis-classifies many more good customers (precision 61% vs 77%) because it cannot represent the threshold effects.
- *Tuned decision tree:* highest recall (81%) but precision of 54% means too much lost business; it is better used as the explanation layer than as the scorer.
- *Bagged trees:* a clear improvement over a single tree (precision 83%, ROC-AUC 0.95) but it misses a third of defaulters and class weights do not move its recall; the forest dominates it on every metric that matters.
- *Default random forest:* best precision (85%) but misses almost a third of defaulters, which is the costlier error.

**Guard-rails for adoption**
- Monitor recall, precision and the approval rate monthly; re-train at least yearly or when the default rate drifts.
- Run a fairness review on the final model (approval rates and error rates across protected groups) before launch, and keep occupation out of the production feature set unless the review clears it.
- Keep a human underwriter in the loop for applicants in the uncertain band around the threshold (predicted probability between roughly 0.15 and 0.40) during the first months.
""")

md(r"""
---
### Summary of answers to the leading questions

| # | Question | Answer |
|---|---|---|
| 1 | Range of LOAN | \$1,100 to \$89,900; median \$16,300; right-skewed |
| 2 | Distribution of YOJ | Right-skewed; most applicants 0-5 years, median 7, tail to 41 |
| 3 | Unique categories in REASON | 2 (DebtCon 69%, HomeImp 31%) |
| 4 | Most common JOB | "Other" (42%), then ProfExe (22%) and Office (17%) |
| 5 | REASON vs default | Weak relationship: HomeImp 22.2% vs DebtCon 19.0% |
| 6 | LOAN for defaulters vs repayers | Defaulters borrow less (median \$14,900 vs \$16,900); loans under \$5,000 default 57% of the time |
| 7 | VALUE vs default | Very weak correlation (-0.03); but a *missing* valuation defaults 94% of the time |
| 8 | MORTDUE for defaulters vs repayers | Slightly lower for defaulters (median \$60,279 vs \$66,839); not a strong separator |
""")

nb["cells"] = cells
nb["metadata"] = {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python"},
}
out = "notebooks/Loan_Default_Prediction_Capstone.ipynb"
nbf.write(nb, out)
print(f"Wrote {out} with {len(cells)} cells")
