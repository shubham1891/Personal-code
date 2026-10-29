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

A large share of a retail bank's profit comes from the interest it earns on home loans and home equity lines of credit. The single biggest threat to that profit is the applicant who does not repay the loan. Every loan that becomes a non-performing asset (NPA) cancels the interest that the bank earned on many good loans. The bank therefore has to be judicious about whom it approves.

Today an underwriter studies each application by hand and decides whether to approve it. That process is slow, expensive, inconsistent from one underwriter to another, and vulnerable to human error and bias. Earlier attempts to automate the process used hand-written heuristics. The bank now has data on past loans and their outcomes. With that data, the bank can **learn** the approval decision from evidence instead of opinion. At the same time, the bank can make sure that the new model does not simply replicate the biases of the old manual process.

**Some facts that size the problem.** In the bank's own recent book of 5,960 home equity loans, **1,189 (19.9%) ended in default or serious delinquency**. The current process approved all of them. Those defaulted loans averaged about \$16,900 each, so roughly \$20 million of principal was at risk. We assume that the bank recovers about half through the collateral. On that assumption, the bank lost roughly \$10 million on this book alone. Every ten defaulters that the bank declines saves about \$90,000 at the \$9,000 per defaulter that we use throughout. Every good applicant that the bank wrongly declines costs only the interest margin on one loan, about \$2,000.

**Advantages of solving it.** A reliable, explainable scoring model has four advantages:

1. It cuts credit losses because it stops likely defaulters at the door.
2. It protects revenue because it does not decline good applicants unnecessarily.
3. It makes decisions faster and standardises them, so underwriters spend their time on the genuinely uncertain cases.
4. It gives the bank documented, consistent reasons for every decision. This is both a regulatory requirement and a fairness safeguard.

### **The objective:**

Build a classification model. At the time of application, the model predicts whether an applicant is likely to default on a home equity loan. Use that model to give the bank clear recommendations on which applicant attributes matter most when approving a loan.

The project has several goals, in priority order:

1. **Catch defaulters early** - maximise the share of future defaulters that the model flags at application time (recall on the defaulter class). We maximise recall because a missed defaulter is the costliest error.
2. **Protect good business** - keep the share of wrongly declined good applicants acceptable (precision). Then lower risk does not come at the price of lost revenue.
3. **Stay interpretable** - the Equal Credit Opportunity Act (ECOA) requires this. The bank must be able to give an applicant a specific, defensible reason for an adverse decision. A black box that cannot explain a rejection is not usable in production.
4. **Guide policy** - identify the applicant attributes that matter most. The bank can then tighten its approval rules and data collection even before it deploys a model.

### **The key questions:**

1. What share of past applicants defaulted, and how imbalanced is the problem?
2. Which applicant attributes (credit history, debt burden, loan size, job, loan purpose, property value) separate defaulters from repayers?
3. How should we treat missing information? Is the *absence* of information itself a risk signal?
4. Which modelling technique (linear vs. tree-based vs. ensemble) gives the best trade-off between catching defaulters and wrongly declining good applicants?
5. What is the right measure of success for this business problem, and how do the models compare on it?
6. Which model should the bank adopt, with what settings, and what rules can the bank communicate to applicants and regulators?

### **The problem formulation**:

This is a **supervised binary classification** problem. Each row is a past home equity loan. It has 12 attributes known at application time and a target `BAD` (1 = defaulted or seriously delinquent, 0 = repaid). We will:

- explore and clean the data (missing values, outliers, encoding).
- train a linear model (Logistic Regression) and non-linear models (Decision Tree, Bagging, Random Forest).
- tune the Logistic Regression, the Decision Tree and the Random Forest with cross-validated grid search.
- compare all models on a metric that we choose from the business cost of each type of error. The primary metric is **Recall on the defaulter class**. Precision and F1 are guard-rails so that the bank does not decline too many good applicants.
- choose the final configuration and its decision threshold on the expected cost of the two errors, with repeated out-of-fold predictions on the training rows. The model scores each application before the bank approves it, and the threshold converts that score into a flag.
- propose a final solution design with approve / refer / decline bands around the threshold and an explanation layer that gives a reason for each adverse decision.
""")

md(r"""
## **Data Description:**
The Home Equity dataset (HMEQ) contains baseline and loan performance information for 5,960 recent home equity loans. The target (BAD) is a binary variable that shows whether an applicant ultimately defaulted or was severely delinquent. This adverse outcome occurred in 1,189 cases (20 percent). The dataset records 12 input variables for each applicant.


* **BAD:** 1 = Applicant defaulted on loan, 0 = loan repaid

* **LOAN:** Amount of loan approved.

* **MORTDUE:** Amount due on the existing mortgage.

* **VALUE:** Current value of the property.

* **REASON:** Reason for the loan request. (HomeImp = home improvement, DebtCon= debt consolidation, which means a new loan that repays other liabilities and consumer debts)

* **JOB:** The type of job that loan applicant has such as manager, self, etc.

* **YOJ:** Years at present job.

* **DEROG:** Number of major derogatory reports (which indicates a serious delinquency or late payments).

* **DELINQ:** Number of delinquent credit lines. (A line of credit becomes delinquent when the applicant does not make the minimum required payments 30 to 60 days after the due date.)

* **CLAGE:** Age of the oldest credit line in months.

* **NINQ:** Number of recent credit inquiries.

* **CLNO:** Number of existing credit lines.

* **DEBTINC:** Debt-to-income ratio (all monthly debt payments divided by gross monthly income). Lenders use this number as one way to measure how well the applicant can manage the monthly payments on the money they plan to borrow.
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
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold, cross_val_predict, cross_validate
from sklearn.inspection import permutation_importance
from scipy import stats
from sklearn.preprocessing import StandardScaler

# Models
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, plot_tree, export_text
from sklearn.ensemble import RandomForestClassifier, BaggingClassifier
from sklearn.base import clone

# Metrics
from sklearn.metrics import (classification_report, confusion_matrix, recall_score,
                             precision_score, f1_score, accuracy_score, roc_auc_score,
                             roc_curve, precision_recall_curve, brier_score_loss, cohen_kappa_score)

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
# Print the number of rows and columns
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
- `DEROG`, `DELINQ`, `NINQ` and `CLNO` have the float type but are really **counts** (whole numbers). We can analyse them both as numbers and as ordered categories.
- Every input column except `LOAN` has fewer than 5,960 non-null values, so **missing values are widespread**. We must handle them before modelling.
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
# Plot the percentage of missing values in each column
plt.figure(figsize=(10, 4))
sns.barplot(x=missing.index, y=missing["missing_pct"], color="#4C72B0")
plt.title("Percentage of missing values per column")
plt.ylabel("% missing")
plt.xticks(rotation=45)
plt.show()
""")

md(r"""
**Observations:**

- `DEBTINC` (debt-to-income ratio) is missing in **21.3%** of the applications, by far the highest. This is the most important affordability measure a lender has, so its absence is suspicious in itself. We will test later whether missingness is linked to default.
- `DEROG` (11.9%), `DELINQ` (9.7%), `MORTDUE` (8.7%), `YOJ` (8.6%) and `NINQ` (8.6%) have moderate gaps.
- `JOB`, `REASON`, `CLAGE`, `CLNO` and `VALUE` are missing in fewer than 5.2% of rows.
- No column has enough missing values to justify removing it. Removing rows is also not an option. If we removed any row with at least one gap, we would discard more than 40% of the data. We will **impute** values and **keep a flag** for every imputed cell.
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

- **44% of applications have at least one blank field**, which shows that removing rows is not a viable option.
- Two applications have no information at all beyond the loan amount. We keep them: the missing-value flags that we create later will carry the information that the applicant supplied nothing.
- There are **no duplicate rows**, so we do not need to remove duplicates.
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
- `MORTDUE` (median \$65,019) and `VALUE` (median \$89,236) are also right-skewed. `VALUE` has a maximum of \$855,909, which is an extreme outlier relative to the 75th percentile (\$119,824).

**Employment and credit history**
- `YOJ` (years at present job): median 7 years, maximum 41 years. A quarter of applicants have 3 years or less at their present job.
- `DEROG` and `DELINQ` are zero for at least 75% of applicants (the 75th percentile is 0). A small group with many derogatory reports or delinquent lines drives their means (0.25 and 0.45). These are the applicants a lender worries about.
- `CLAGE` (age of oldest credit line): median 173 months (about 14.5 years). A maximum of 1,168 months (97 years) is not plausible and is an outlier.
- `NINQ` (recent credit inquiries): median 1, maximum 17.
- `CLNO` (number of credit lines): median 20, maximum 71.

**Debt burden**
- `DEBTINC`: median 34.8%, 75th percentile 39.0%. The maximum of 203% is physically implausible (debt payments twice the income). The 25th-75th range (29% to 39%) is tight, so the few applicants far above 40% are easy to notice.

**Categorical**
- `REASON`: 2 categories. Debt consolidation is 68.8% of stated reasons.
- `JOB`: 6 categories. "Other" is the largest (42%), then ProfExe (22.5%) and Office (16.7%). Sales (1.9%) and Self-employed (3.4%) are small groups.
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

The univariate analysis answers questions 1 to 4. The bivariate analysis answers questions 5 to 8. A summary of the answers is in the last cell of this notebook (Summary of answers to the leading questions).
""")

md(r"""
### **Univariate Analysis**
""")

code(r"""
# Helper: a box plot above a histogram for one numerical column
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
# Distribution and outliers of LOAN, with its range, median and mean
histogram_boxplot(data["LOAN"], title="LOAN - amount of loan approved")
print(f"LOAN ranges from ${data['LOAN'].min():,.0f} to ${data['LOAN'].max():,.0f}; "
      f"median ${data['LOAN'].median():,.0f}, mean ${data['LOAN'].mean():,.0f}")
""")

md(r"""
**Insights - LOAN (Q1):**
- Loan amounts range from **\$1,100 to \$89,900**. Half of all loans are below \$16,300 and 75% are below \$23,300.
- The distribution is right-skewed with a long tail. Loans above about \$41,000 appear as outliers on the boxplot. Those are genuine large loans, not data errors, so we will keep them for tree models and only cap them for the linear model.
""")

code(r"""
# Distribution and outliers of YOJ
histogram_boxplot(data["YOJ"], title="YOJ - years at present job")
""")

md(r"""
**Insights - YOJ (Q2):**
- Years at the present job is **right-skewed**. The most common values are 0 to 5 years, the median is 7 years and the mean is about 9 years.
- There is a long tail of long-tenured applicants (above about 28 years, up to 41) that the boxplot marks as outliers. These are plausible and we keep them.
- Job tenure is a mild stability signal. We will check in the bivariate section whether short tenure is linked to default.
""")

code(r"""
# Distribution and outliers of MORTDUE
histogram_boxplot(data["MORTDUE"], title="MORTDUE - amount due on existing mortgage")
""")

code(r"""
# Distribution and outliers of VALUE
histogram_boxplot(data["VALUE"], title="VALUE - current value of the property")
""")

md(r"""
**Insights - MORTDUE and VALUE:**
- Both are right-skewed with a bulk of properties between \$50,000 and \$150,000 and a small number of very expensive properties (VALUE up to \$855,909).
- Because the two variables describe the same asset, they should be strongly correlated. The correlation heatmap later shows this (r = 0.88). This matters for the logistic regression, where highly correlated inputs make coefficients unstable.
""")

code(r"""
# Distribution and outliers of CLAGE
histogram_boxplot(data["CLAGE"], title="CLAGE - age of oldest credit line (months)")
""")

code(r"""
# Distribution and outliers of DEBTINC
histogram_boxplot(data["DEBTINC"], title="DEBTINC - debt-to-income ratio (%)")
""")

md(r"""
**Insights - CLAGE and DEBTINC:**
- `CLAGE` is roughly bell-shaped around 170-180 months (about 15 years of credit history) with a right tail. A handful of values above 600 months (50+ years) and a maximum of 1,168 months are not credible. We will cap them for the linear model.
- `DEBTINC` is tightly concentrated between 25% and 42%. Very few applicants have a recorded ratio above 45%. The maximum of 203% is an impossible value. Note that this plot only shows the 79% of applicants with a recorded ratio.
""")

code(r"""
# Distribution and outliers of CLNO
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
# Helper: write the percentage of the total on each bar
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
- **Among applicants with a record, 86% have zero major derogatory reports** and 78% have zero delinquent credit lines. The minority with one or more is small but, as the bivariate analysis will show, carries a very high default rate.
- Recent credit inquiries are more dispersed. Of applicants with a record, 46% have none, 25% have one, 14% have two, and a tail have five or more. Many recent inquiries can signal an applicant who actively seeks credit under financial stress.
""")

md(r"""
#### Categorical variables (BAD, REASON, JOB)
""")

code(r"""
# Plot the class shares of BAD, REASON and JOB
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
- **Target:** applicants repaid 80% of loans and defaulted on 20%. The imbalance is moderate. We will handle it inside the models: class weights when we build the individual models, and the decision threshold when we choose the final one. The success metric is recall, not accuracy.
- **REASON has 2 unique categories.** Debt consolidation (69%) is far more common than home improvement (31%).
- **JOB has 6 unique categories and "Other" is the most common (42%)**, then professional/executive (22%) and office workers (17%). Sales (2%) and self-employed (3%) are small groups, so we should read their default rates with care.
""")

md(r"""
### **Bivariate Analysis**
""")

md(r"""
#### Numerical variables vs the target (BAD)
""")

code(r"""
# Compare each numerical variable for repaid (0) and defaulted (1) loans
num_cols = ["LOAN", "MORTDUE", "VALUE", "YOJ", "DEROG", "DELINQ", "CLAGE", "NINQ", "CLNO", "DEBTINC"]

fig, axes = plt.subplots(2, 5, figsize=(22, 9))
for ax, col in zip(axes.flatten(), num_cols):
    sns.boxplot(x=data["BAD"], y=data[col], hue=data["BAD"], legend=False, ax=ax, palette="PuBu", showmeans=True)
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

- **LOAN (Q6):** Defaulters borrowed *less* on average (mean \$16,922, median \$14,900) than repayers (mean \$19,028, median \$16,900). The difference is real but modest. Loan size by itself is not a strong separator. The default rate by loan band (next chart) shows the pattern more clearly.
- **VALUE (Q7):** Defaulters have slightly lower property values (median \$82,000 vs \$90,659). The correlation between `VALUE` and `BAD` is weak (r = -0.03), so property value alone does not predict default. Property value matters in combination with the mortgage balance and the loan size.
- **MORTDUE (Q8):** Defaulters have a somewhat lower outstanding mortgage (median \$60,279 vs \$66,839). This is again a modest difference.
- **DEROG and DELINQ** separate the two groups most strongly: defaulters average 0.71 derogatory reports vs 0.13, and 1.23 delinquent lines vs 0.25. These are **5x higher** among defaulters.
- **CLAGE:** Defaulters have a materially shorter credit history (median 133 months vs 180 months). A long, established credit record is protective.
- **NINQ:** Defaulters made more recent inquiries (mean 1.78 vs 1.03).
- **DEBTINC:** Defaulters carry a higher debt burden (median 38.1% vs 34.5%). The defaulter boxplot has a long upper tail where most of the extreme ratios sit.
- **YOJ and CLNO** show little difference between the two groups.
""")

code(r"""
# Are the differences statistically significant? Mann-Whitney U tests for the amounts (robust to skew),
# chi-square tests of independence for the categorical variables.
rows = []
for col in ["LOAN", "MORTDUE", "VALUE", "DEBTINC", "CLAGE"]:
    a = data.loc[data["BAD"] == 1, col].dropna(); b = data.loc[data["BAD"] == 0, col].dropna()
    rows.append({"variable": col, "median_defaulters": a.median(), "median_repayers": b.median(),
                 "test": "Mann-Whitney U", "p_value": stats.mannwhitneyu(a, b).pvalue})
for col in ["REASON", "JOB"]:
    chi2, p, dof, _ = stats.chi2_contingency(pd.crosstab(data[col], data["BAD"]))
    rows.append({"variable": col, "median_defaulters": np.nan, "median_repayers": np.nan, "test": "Chi-square", "p_value": p})
pd.DataFrame(rows).style.format({"median_defaulters": "{:,.1f}", "median_repayers": "{:,.1f}", "p_value": "{:.2e}"})
""")

md(r"""
**Insights - significance tests (Q5, Q6, Q8):**
- The differences in `LOAN`, `MORTDUE` and `VALUE` between defaulters and repayers are **statistically significant** (p < 0.001 in each case). With 5,960 loans, the tests can detect even modest gaps. However, the differences are **small in practical terms**: medians differ by \$2,000 to \$9,000 on amounts of \$15,000 to \$90,000. `DEBTINC` and `CLAGE` differ both significantly and materially.
- `REASON` is related to default (chi-square p = 0.005), but the effect is weak (22.2% vs 19.0%). `JOB` is strongly related (p < 0.001).
- Statistical significance tells us the pattern is real. The band charts below tell us where the pattern is large enough for the bank to act.
""")

code(r"""
# Helper: default rate and applicant count for each band of a numerical column
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

- **DEBTINC is a cliff, not a slope.** Applicants with a recorded ratio between 20% and 40% default only 4% to 7% of the time, well below the 20% average. The small group below 20% is at 11%. Between 40% and 45% the rate is 11%. **Above 45% it jumps to 87%, and above 50% it jumps to 100%**. A debt-to-income threshold around 45% is therefore a natural, explainable approval rule.
- **CLAGE protects.** Applicants whose oldest credit line is under 5 years old default 44% of the time. The rate falls steadily to 9% to 11% once the credit history is longer than 20 years.
- **Small loans are the riskiest.** Loans under \$5,000 default 57% of the time, against 14% to 20% for loans above \$15,000. Financially stretched applicants may request small loans, or the bank may already limit its exposure to weaker applicants. Either way, a small requested amount is not a sign of low risk.
""")

md(r"""
#### Categorical and count variables vs the target (BAD)
""")

code(r"""
# Helper: counts and stacked default-rate bars for a categorical column
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
# Default rate for each loan purpose
stacked_plot(data["REASON"], "BAD by REASON (loan purpose)")
""")

md(r"""
**Insights - REASON vs BAD (Q5):**
- Home-improvement loans default slightly more often (**22.2%**) than debt-consolidation loans (**19.0%**). There is a relationship, but it is weak: a 3-point difference around a 20% base rate. Loan purpose on its own should not drive approval decisions.
""")

code(r"""
# Default rate for each occupation
stacked_plot(data["JOB"], "BAD by JOB")
""")

md(r"""
**Insights - JOB vs BAD:**
- Default risk varies clearly by occupation. **Sales (34.9%)** and **Self-employed (30.1%)** applicants default at 1.5x to 1.75x the average, consistent with more variable income. **Office workers (13.2%)** and **professionals/executives (16.6%)** are the safest groups. Managers (23.3%) and "Other" (23.2%) sit slightly above average.
- The Sales and Self groups are small (109 and 193 applicants). The model should therefore use occupation as a supporting signal, not a primary one. Note also that the bank must use occupation carefully under fair-lending rules. Occupation is not a protected attribute, but the bank should monitor it for proxy effects.
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

- **DEROG:** Applicants with no derogatory report default 16.7% of the time. **One report raises this to 39%, and two reports raise it to 51%. Three or four reports raise it to about 75%, and five or more reports raise it to 73%.** The small groups at the top are noisy, but every one of them is far above average.
- **DELINQ:** The pattern is the same and even steeper. The default rate is 14% with no delinquent line, 34% with one, 45% with two, 55% with three, and **100% with six or more**.
- **NINQ:** Default risk rises with recent inquiries: 16% at zero, 23% at two, 39% at four, and about 46% at five or more (252 applicants). The small groups at five and above are noisy (34% to 52%).
- All three rates rise with the count. They are easy to explain to an applicant ("we declined your application because you have two delinquent credit lines"). They are exactly the kind of evidence that the ECOA requires.
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
# Plot the default rate when a field is missing and when it is present
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

- **When DEBTINC is missing, 62% of applicants defaulted. When it is present, only 8.6% did.** A missing debt-to-income ratio is the single strongest risk indicator in the whole dataset. In practice, applicants whose income the bank could not check, or who did not supply it, are far riskier than those with a checked ratio.
- **When VALUE is missing, 94% defaulted** (112 applicants). An application without a property valuation is almost always bad.
- Missing `CLAGE` (25%) and `CLNO` (24%) are mildly riskier than average.
- The opposite holds for `DEROG`, `DELINQ`, `YOJ`, `NINQ` and `JOB`: when these are missing the default rate is *lower* (8% to 15%). This probably reflects how the data was recorded (for example, "no record found" stored as blank for good applicants).
- **Implication for pre-processing:** we must not simply fill these gaps with the median and continue. We will **add a binary "was missing" flag for every column with gaps** so the models can learn from the absence of information. Then we will impute the values.
""")

md(r"""
#### Two numerical variables together
""")

code(r"""
# Plot two pairs of numerical variables, coloured by the outcome
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
- `VALUE` and `MORTDUE` lie close to a straight line: the mortgage balance is typically 60% to 80% of the property value. Defaulters are scattered throughout rather than clustered, which shows that these two amounts alone do not separate the classes.
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
- The moderate relationships are `CLNO` with `MORTDUE`/`VALUE` (0.27 to 0.32, wealthier applicants hold more credit lines) and `LOAN` with `VALUE` (0.34).
- Correlations with the target are weak to moderate: `DELINQ` (0.35) and `DEROG` (0.28) are the highest, followed by `DEBTINC` (0.20), `NINQ` (0.17) and `CLAGE` (-0.17). The count variables are close to linear in the default rate. However, the band charts showed that `DEBTINC`, `CLAGE` and `LOAN` act through thresholds and cliffs that a single correlation coefficient understates. This is an early hint that **tree-based models, which capture thresholds naturally, should outperform a purely linear model on the raw inputs**.
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
- No single pair of variables separates the classes cleanly. The separation comes from combinations, which again favours tree-based models.
""")

md(r"""
#### Two categorical variables and the target: occupation and loan purpose

The bivariate analysis looked at occupation and loan purpose one at a time. Here we cross them, to check whether the risk of a loan purpose depends on the occupation. Applicants with a missing `JOB` or `REASON` are not in this chart.
""")

code(r"""
# Default rate by occupation and loan purpose (two categorical variables and the target)
bad_int = data["BAD"].astype(int)
job_rate = bad_int.groupby([data["JOB"], data["REASON"]], observed=True).mean().unstack() * 100
job_n = bad_int.groupby([data["JOB"], data["REASON"]], observed=True).size().unstack()
cell_labels = job_rate.round(0).astype(int).astype(str) + "%\n(n=" + job_n.astype(str) + ")"

fig, ax = plt.subplots(figsize=(7, 5.5))
sns.heatmap(job_rate, annot=cell_labels, fmt="", cmap="Reds", vmin=0, vmax=50, linewidths=2, linecolor="white",
            cbar_kws={"label": "default rate (%)"}, ax=ax)
ax.set_xlabel("loan purpose (REASON)"); ax.set_ylabel("occupation (JOB)")
ax.set_title("Default rate by occupation and loan purpose")
plt.show()

pd.concat({"default_rate_%": job_rate.round(1), "applicants": job_n}, axis=1)
""")

md(r"""
**Insights - occupation and loan purpose:**
- Occupation and loan purpose interact. Self-employed applicants who borrowed to consolidate debt defaulted 44% of the time (73 applicants). Self-employed applicants who borrowed for home improvement defaulted 18% of the time (115 applicants).
- Managers show the opposite pattern: 32% default on home-improvement loans (174 applicants) against 20% on debt consolidation (572 applicants). The "Other" group follows the managers (29% against 21%).
- Sales applicants default often for both purposes (35% and 33%), but only 12 of them borrowed for home improvement. Office workers default least for both purposes (15% and 11%).
- On its own, loan purpose looks weak (22% against 19%). Within some occupations it changes the risk by a factor of two. Tree models can learn this interaction directly. A linear model needs an explicit interaction term to learn it. Any rule that uses occupation needs the fair-lending review.
""")

md(r"""
#### A numerical and a categorical variable with the target: debt burden and credit history by occupation

We check whether the two strongest numerical drivers work in every occupation, or only in some. The boxplots hide the extreme values to keep the boxes readable, and they use only applicants with a recorded value.
""")

code(r"""
# Debt-to-income and credit-history length by occupation, split by outcome
job_order = data["JOB"].value_counts().index
fig, axes = plt.subplots(1, 2, figsize=(16, 5.5))
for ax, col, label, title in [(axes[0], "DEBTINC", "debt-to-income ratio (%)", "Debt-to-income by occupation and outcome"),
                              (axes[1], "CLAGE", "age of oldest credit line (months)", "Credit-history length by occupation and outcome")]:
    sns.boxplot(data=data, x="JOB", y=col, hue="BAD", order=job_order, palette=["#4C72B0", "#C44E52"],
                showfliers=False, ax=ax)
    ax.set_xlabel("occupation (JOB)"); ax.set_ylabel(label); ax.set_title(title)
    ax.legend(title="BAD (1 = defaulted)", loc="upper left", bbox_to_anchor=(1.01, 1.0))
plt.tight_layout(); plt.show()

pd.concat({"DEBTINC_median": data.groupby(["JOB", "BAD"], observed=True)["DEBTINC"].median().unstack().round(1),
           "CLAGE_median_months": data.groupby(["JOB", "BAD"], observed=True)["CLAGE"].median().unstack().round(0)}, axis=1)
""")

md(r"""
**Insights - debt burden and credit history by occupation:**
- In every occupation, defaulters have a higher median debt-to-income ratio than repayers. The gap is about 1.5 points for office workers (37.6 against 36.1). It is about 6.5 points for sales and self-employed applicants (41.0 against 34.4, and 40.9 against 34.5).
- In every occupation, defaulters have a shorter credit history. The median gap is 29 months for professionals (160 against 189) and 57 months for managers (127 against 184).
- So debt burden and credit-history length work in every occupation. Occupation moves the baseline risk, but it does not replace these two drivers.
""")

md(r"""
#### Interactions between the strongest drivers

The bivariate analysis found four strong drivers: the debt-to-income ratio, delinquent credit lines, credit-history length and derogatory reports. Here we cross them in pairs, and we keep "missing" as its own group because missingness is itself a signal. Each cell shows the default rate and the number of applicants. Cells with very few applicants (for example, a ratio above 45% with one delinquent line) are noisy, so we read them with caution.
""")

code(r"""
# Default rate for pairs of drivers, with 'missing' kept as its own group
def band_with_missing(s, bins, labels):
    '''Cut a column into bands and keep blanks as a separate missing band.'''
    banded = pd.cut(s, bins=bins, labels=labels, include_lowest=True).astype(object)
    return banded.where(s.notna(), "missing")

dti_band = band_with_missing(data["DEBTINC"], [0, 30, 35, 40, 45, np.inf], ["under 30", "30-35", "35-40", "40-45", "over 45"])
delinq_group = band_with_missing(data["DELINQ"], [-0.5, 0.5, 1.5, np.inf], ["0", "1", "2+"])
history_band = band_with_missing(data["CLAGE"], [0, 120, 240, np.inf], ["under 10 yrs", "10-20 yrs", "20+ yrs"])
derog_group = band_with_missing(data["DEROG"], [-0.5, 0.5, np.inf], ["0", "1+"])

def rate_grid(rows, cols, row_order, col_order):
    '''Return the default rate and the applicant count for each pair of groups.'''
    grid_rate = bad_int.groupby([rows, cols]).mean().unstack().reindex(index=row_order, columns=col_order) * 100
    grid_n = bad_int.groupby([rows, cols]).size().unstack().reindex(index=row_order, columns=col_order).fillna(0).astype(int)
    return grid_rate, grid_n

grids = [
    (dti_band, delinq_group, ["under 30", "30-35", "35-40", "40-45", "over 45", "missing"], ["0", "1", "2+", "missing"],
     "debt-to-income ratio (%)", "delinquent credit lines", "Debt-to-income band and delinquent lines"),
    (history_band, derog_group, ["under 10 yrs", "10-20 yrs", "20+ yrs", "missing"], ["0", "1+", "missing"],
     "age of oldest credit line", "major derogatory reports", "Credit-history length and derogatory reports"),
]
fig, axes = plt.subplots(1, 2, figsize=(16, 6))
for ax, (rows, cols, row_order, col_order, ylabel, xlabel, title) in zip(axes, grids):
    grid_rate, grid_n = rate_grid(rows, cols, row_order, col_order)
    grid_labels = grid_rate.round(0).fillna(0).astype(int).astype(str) + "%\n(n=" + grid_n.astype(str) + ")"
    sns.heatmap(grid_rate, annot=grid_labels, fmt="", mask=(grid_n == 0), cmap="Reds", vmin=0, vmax=100, linewidths=2,
                linecolor="white", cbar_kws={"label": "default rate (%)"}, ax=ax)
    ax.set_ylabel(ylabel); ax.set_xlabel(xlabel); ax.set_title(title)
plt.tight_layout(); plt.show()

# The two strongest missing-value signals together
ratio_status = data["DEBTINC"].isna().map({False: "ratio recorded", True: "ratio missing"})
value_status = data["VALUE"].isna().map({False: "value recorded", True: "value missing"})
both_missing = bad_int.groupby([ratio_status, value_status]).agg(default_rate_pct="mean", applicants="size")
both_missing["default_rate_pct"] = (100 * both_missing["default_rate_pct"]).round(1)
both_missing
""")

md(r"""
**Insights - interactions between the strongest drivers:**
- **Debt burden and repayment history add up.** When the ratio is 45% or less, delinquency still decides much of the risk. In that group, 3% to 9% defaulted with no delinquent lines, and 25% to 30% defaulted with two or more.
- Above 45%, 91% to 100% defaulted, whatever the number of delinquent lines. The ratio alone is enough in that group.
- When the ratio is missing, delinquency adds risk on top of the missing signal. In that group, 50% defaulted with no delinquent lines (695 applicants) and 87% with two or more (253 applicants).
- **A long credit history lowers the risk but does not cancel a derogatory report.** With one or more reports, the default rate rises from 25% to 56% under 10 years of history. It rises from 15% to 48% at 10 to 20 years, and from 8% to 32% at 20 years or more.
- **The two missing-value signals compound.** With both fields recorded, 8% defaulted (4,662 applicants). With only the ratio missing, 60% defaulted (1,186 applicants). With only the property value missing, 81% defaulted (31 applicants). With both missing, 99% defaulted (81 applicants).
- These combined effects suggest that a tree-based model, which splits on one driver inside another, should beat a model that adds each driver alone. They also match the surrogate tree we fit later: a high or missing ratio flags an applicant, and repayment history decides among the others.
""")

# --------------------------------------------------------------------------------------
md(r"""
## Hold out the test set before fitting any pre-processing

We fit every statistic that prepares the data (outlier fences, imputation medians and modes, feature scaling) **on the training rows only**. Then we apply these statistics to the test rows. Fitting them on all 5,960 loans would leak a little information about the test applicants into the model. The split is 70% train / 30% test, stratified on `BAD` so both sets keep the 20% default rate. We fix the seed so every model sees the same applicants.
""")

code(r"""
# Split the rows 70/30 before any pre-processing. Stratify on BAD so that both sets keep the 20% default rate.
train_idx, test_idx = train_test_split(data.index, test_size=0.30, random_state=RANDOM_STATE, stratify=data["BAD"])
print(f"Training rows: {len(train_idx):,} | Test rows: {len(test_idx):,}")
print(f"Default rate - train: {data.loc[train_idx, 'BAD'].astype(int).mean():.3f}, test: {data.loc[test_idx, 'BAD'].astype(int).mean():.3f}")
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

- **Logistic Regression** is sensitive to extreme values because they pull the fitted line. For the linear model we **cap** each continuous column at the IQR whiskers (Q1 - 1.5 IQR and Q3 + 1.5 IQR). This keeps every row but limits the leverage of extremes. We cap the count variables `DEROG` and `DELINQ` at their 99th percentile instead, because their inter-quartile range is zero. We compute all fences on the training rows.
- **Decision Trees and Random Forests** split on rank order, so an outlier simply falls into the top bucket. Capping does not change their splits. For the tree models we **keep the original values**, because capping would only merge the largest values into one value.

We therefore keep two versions of the data: `df_lr` (outliers capped, for the linear model) and `data` (untreated, for the tree models).
""")

code(r"""
def treat_outliers(df, col, fit_rows):
    '''Cap a numerical column at the IQR whiskers computed on the training rows.'''
    Q1 = df.loc[fit_rows, col].quantile(0.25)
    Q3 = df.loc[fit_rows, col].quantile(0.75)
    IQR = Q3 - Q1
    lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
    df[col] = np.clip(df[col], lower, upper)
    return df

def treat_outliers_all(df, col_list, fit_rows):
    '''Cap each column in col_list at its IQR whiskers, learned on the training rows only.'''
    for c in col_list:
        df = treat_outliers(df, c, fit_rows)
    return df

df_lr = data.copy()

# IQR capping for the continuous variables
iqr_cols = [c for c in num_cols if c not in ("DEROG", "DELINQ")]
df_lr = treat_outliers_all(df_lr, iqr_cols, train_idx)

# DEROG and DELINQ are counts with Q1 = Q3 = 0, so the IQR whiskers collapse to zero and would erase
# the variables entirely. They are capped at the 99th percentile (of the training rows) instead.
for c in ["DEROG", "DELINQ"]:
    df_lr[c] = df_lr[c].clip(upper=df_lr.loc[train_idx, c].quantile(0.99))

# Compare the maximum of each column before and after capping
pd.DataFrame({"max_before": data[num_cols].max(), "max_after": df_lr[num_cols].max(),
              "rows_capped": [(data[c] > df_lr[c]).sum() + (data[c] < df_lr[c]).sum() for c in num_cols]})
""")

md(r"""
**Observations:**
- Capping removes the impossible values (DEBTINC 203% becomes about 54%, CLAGE 1,168 months becomes about 407 months) while keeping every row.
- `DEROG` and `DELINQ` have a 75th percentile of zero, so the IQR whiskers collapse to zero. If we applied the rule blindly, it would set every value to zero and remove two of the strongest risk signals. We therefore cap them at the 99th percentile instead (about 5 derogatory reports and 6 delinquent lines). This limits the leverage of the extreme counts while keeping the signal.
- The capped DEBTINC ceiling (about 54%) is still above the 45% danger threshold, so the linear model can still learn that rule.
""")

# --------------------------------------------------------------------------------------
md(r"""
## Treating Missing Values
""")

md(r"""
**Approach.**

1. **Create a binary flag** `<column>_missing` for every column with gaps. The bivariate analysis showed that missingness, especially of `DEBTINC` and `VALUE`, is strongly predictive, so we must preserve this information.
2. **Impute numerical columns with the median** and **categorical columns with the mode**. The median is not sensitive to the skew and outliers seen above. Compute both on the training rows only. Then apply them to all rows.
3. Apply exactly the same steps to both versions of the data. Use `df_lr` for the linear model and `data` for the tree models.
""")

code(r"""
# Helper: add a 0/1 flag for each column that has missing values
def add_missing_flags(df):
    '''Add a 0/1 flag column for each column that has missing values.'''
    for col in [c for c in df.columns if df[c].isnull().any()]:
        df[f"{col}_missing"] = df[col].isnull().astype(int)
    return df

def impute(df, fit_rows):
    '''Median for numerical columns, mode for categorical columns, both learned from the training rows.'''
    num = df.select_dtypes("number").columns
    cat = df.select_dtypes("category").columns.drop("BAD")
    df[num] = df[num].fillna(df.loc[fit_rows, num].median())
    for c in cat:
        df[c] = df[c].fillna(df.loc[fit_rows, c].mode()[0])
    return df

for frame in (df_lr, data):
    add_missing_flags(frame)
    impute(frame, train_idx)

print("Remaining missing values (tree data):", data.isnull().sum().sum())
print("Remaining missing values (linear data):", df_lr.isnull().sum().sum())
print("\nFlag columns added:", [c for c in data.columns if c.endswith("_missing")])
""")

code(r"""
# Show the first rows after imputation, with the new missing-value flags
data.head()
""")

# --------------------------------------------------------------------------------------
md(r"""
## **Important Insights from EDA**

What are the the most important observations and insights from the data based on the EDA performed?
""")

md(r"""
1. **One in five loans goes bad (19.9%).** The classes are imbalanced, so accuracy is the wrong yardstick. We must handle the imbalance with class weights while we build the individual models, and with the decision threshold when we choose the final model.

2. **Missing information is the strongest single risk signal.** Applicants with no recorded debt-to-income ratio default 62% of the time (vs 8.6% when it is recorded). Applicants with no property valuation default 94% of the time. The bank's approval process should treat an unverifiable income or valuation as a red flag, not as a neutral gap.

3. **Debt-to-income ratio has a hard threshold.** Between 20% and 40% the default rate is only 4% to 7% (and 11% below 20%). Between 40% and 45% it is 11%. Above 45% it is 87% to 100%. A 45% threshold is a simple, defensible policy rule.

4. **Past credit behaviour predicts future behaviour.** Each additional major derogatory report or delinquent credit line raises the default rate sharply. The rate is 17% with 0 reports, 39% with 1, 51% with 2, and about 75% with 3 or more. Recent credit inquiries show the same rising pattern.

5. **A long credit history protects.** Applicants whose oldest credit line is under 5 years old default 44% of the time. Above 20 years the rate falls to about 10%.

6. **Small loans are not safe loans.** Loans under \$5,000 default 57% of the time, almost three times the average.

7. **Occupation matters moderately.** Sales (35%) and self-employed (30%) applicants default most. Office workers (13%) and professionals (17%) default least. Loan purpose (home improvement vs debt consolidation) makes only a 3-point difference, although the difference is statistically significant.

8. **Property value and mortgage balance are highly correlated (0.88)** and individually weak predictors. We will keep them, but we should read the linear model's coefficients for them with caution.

9. **Several relationships with the target are threshold-shaped** (debt-to-income, credit-history length, loan size) rather than straight lines. We therefore expect tree-based models to outperform logistic regression on the raw inputs. Logistic regression will remain useful as the most transparent benchmark.

10. **Risk factors combine rather than act alone.** A ratio above 45% flags an applicant by itself. At or below 45%, two or more delinquent lines raise the default rate from 3-9% to 25-30%. A derogatory report raises risk at every credit-history length. When both the ratio and the property value are missing, 99% defaulted. Loan purpose also changes the risk within some occupations (self-employed applicants: 44% on debt consolidation against 18% on home improvement). These interactions favour tree-based models.

11. **Pre-processing decisions:**
    - We did not remove any rows, and we found no duplicates.
    - We separated the test set before we fitted any statistic.
    - We added a missing-value flag for every column with gaps.
    - We learned the median/mode imputation on the training rows.
    - We applied IQR capping only for the linear model (99th-percentile cap for DEROG and DELINQ).
    - We one-hot encoded `REASON` and `JOB`.
    - We scaled the continuous inputs only for the linear model.
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

**A note on technique choice.** The Practical Data Science toolkit covers decision trees, bagging and random forests, and time-series forecasting. We use the first three below. We move from a single tree to a bagged ensemble to a random forest, so that we can see what each idea contributes.

Time-series methods do not apply to this problem. Each row is one loan application with no date or ordering, so there is no sequence to model. We recommend a time-aware validation (train on earlier applications, test on later ones) as further analysis once application dates are available. We include logistic regression as the linear benchmark that we need to compare linear and non-linear techniques fairly.

**How we use the test set.** We choose the hyper-parameters, the final model and its decision threshold with cross-validation on the training rows. We score the test set once per model to report performance, and we never use it to choose any of them.
""")

md(r"""
### Model evaluation criterion - what is the measure of success?

The model makes two kinds of mistakes, and they do not cost the same:

| Model says | Reality | Name | Business consequence |
|---|---|---|---|
| Will repay (approve) | Defaults | **False Negative** | The bank loses a large part of the principal plus collection costs. The defaulted loans in this data averaged about \$16,900. With about half recovered through the collateral, this is roughly \$9,000 per missed defaulter. |
| Will default (reject) | Repays | **False Positive** | The bank loses the interest margin on one good customer and may lose the relationship. This is roughly \$2,000. |

A missed defaulter costs several times more than a wrongly rejected good applicant. The primary metric is therefore **Recall on the defaulter class (BAD = 1)**. *Of all the applicants who later defaulted, what share did the model flag in advance?*

Recall alone can be gamed (rejecting everyone gives 100% recall), so we track two guard-rails:

- **Precision** on the defaulter class: of the applicants we reject, how many would really have defaulted? Low precision means the bank rejects good business.
- **F1-score**: the harmonic mean of the two. We use it as the tie-breaker when recall is similar.

We also report **Accuracy** for completeness and **ROC-AUC** as a threshold-free measure of how well the model ranks risky applicants. ROC-AUC matters because the bank can later move the decision threshold.

We tune the individual models with **cross-validated grid search optimising Recall** (the course convention, and a deliberate push towards catching defaulters). Recall alone rewards flagging everyone. We therefore **choose the final model and its threshold on the expected cost of the two errors**. We estimate this cost with out-of-fold predictions on the training rows, so that precision carries an explicit price.
""")

code(r"""
# Helper: print the classification report and plot the confusion matrix
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

- Separate the target from the inputs. One-hot encode `REASON` and `JOB`. Remove the first level of each to avoid redundant columns. Convert the target to integer.
- Use the **70% / 30% stratified split** fixed above (`train_idx`, `test_idx`) for both data versions. In this way, **the same applicants are in the test set** for the linear and the tree models.
- Standardise the **continuous inputs only** for the linear model (fit on the training rows). Leave the 0/1 flags and dummy columns as they are. Then we can read each of their coefficients as the effect of the flag switching from 0 to 1.
""")

code(r"""
def prepare_xy(df):
    '''Return the one-hot encoded inputs X and the integer target y.'''
    X = pd.get_dummies(df.drop(columns=["BAD"]), columns=["REASON", "JOB"], drop_first=True, dtype=int)
    y = df["BAD"].astype(int)
    return X, y

# Linear-model version (outliers capped)
X_lr, y_lr = prepare_xy(df_lr)
X_train_lr, X_test_lr = X_lr.loc[train_idx], X_lr.loc[test_idx]
y_train_lr, y_test_lr = y_lr.loc[train_idx], y_lr.loc[test_idx]

# Tree-model version (outliers untouched)
X, y = prepare_xy(data)
X_train, X_test = X.loc[train_idx], X.loc[test_idx]
y_train, y_test = y.loc[train_idx], y.loc[test_idx]

print("Feature columns:", list(X.columns))
print(f"\nTrain shape: {X_train.shape}, Test shape: {X_test.shape}")
assert (y_train_lr == y_train).all(), "both data versions must share the same split"
""")

code(r"""
# Scale the continuous inputs for the linear model (fit on train only); flags and dummies stay 0/1
scaler = StandardScaler().fit(X_train_lr[num_cols])
X_train_lr_s, X_test_lr_s = X_train_lr.copy(), X_test_lr.copy()
X_train_lr_s[num_cols] = scaler.transform(X_train_lr[num_cols])
X_test_lr_s[num_cols] = scaler.transform(X_test_lr[num_cols])
assert list(X_train_lr_s.columns) == list(X_train.columns), "both data versions carry the same 27 named inputs"
print(f"Linear-model inputs ({X_train_lr_s.shape[1]}), the same columns as the tree models:")
print(f"  capped (IQR whiskers, DEROG and DELINQ at the 99th percentile) and standardised ({len(num_cols)}):", num_cols)
print(f"  left as 0/1 ({X_train_lr_s.shape[1] - len(num_cols)}):", [c for c in X_train_lr_s.columns if c not in num_cols])

cv5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
cv3 = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)
""")

md(r"""
#### Model inputs at each stage

The table follows the named inputs from the raw fields to the model. The outputs above print every list.

| Stage | Tree models (Decision Tree, Bagging, Random Forest) | Logistic regression |
|---|---|---|
| 1. Raw fields (12) | `LOAN`, `MORTDUE`, `VALUE`, `REASON`, `JOB`, `YOJ`, `DEROG`, `DELINQ`, `CLAGE`, `NINQ`, `CLNO`, `DEBTINC` | Same |
| 2. Outlier treatment | None | The 10 numeric fields capped on training-row fences: IQR whiskers, `DEROG` and `DELINQ` at the 99th percentile |
| 3. Missing-value flags (11) | `<field>_missing` for every field except `LOAN` | Same |
| 4. Imputation | Training-row median (numeric fields) or mode (`REASON`, `JOB`) | Same |
| 5. One-hot encoding (6) | `REASON_HomeImp`, `JOB_Office`, `JOB_Other`, `JOB_ProfExe`, `JOB_Sales`, `JOB_Self` | Same |
| 6. Scaling | None | The 10 numeric fields standardised; the 17 flags and indicators stay 0/1 |
| 7. Model inputs (27) | 10 numeric fields + 11 flags + 6 indicators | The same 27 columns |
| 8. Input-set reduction | Tested in the selection section: 21 inputs (no occupation) and 12 inputs. The final pipeline cell names both sets and the rule that decides | Not applied |
""")

# --------------------------------------------------------------------------------------
md(r"""
### Logistic Regression
""")

md(r"""
Logistic regression is the **linear benchmark**: it models the log-odds of default as a weighted sum of the inputs. Its coefficients are directly interpretable, which is exactly what the ECOA requires. We fit three versions:

1. A plain model (equal class weights) to see the effect of the imbalance.
2. A model with `class_weight="balanced"`, which up-weights the minority defaulter class so the model stops favouring the majority.
3. The balanced model with its regularisation strength `C` tuned by cross-validated grid search on recall. This gives the linear model the same tuning treatment as the tree models.
""")

code(r"""
# 1. Plain logistic regression
lr_plain = LogisticRegression(max_iter=3000, random_state=RANDOM_STATE)
lr_plain.fit(X_train_lr_s, y_train_lr)

print("Train performance - Logistic Regression (plain)")
metrics_score(y_train_lr, lr_plain.predict(X_train_lr_s), title="LR plain - train")
print("Test performance - Logistic Regression (plain)")
metrics_score(y_test_lr, lr_plain.predict(X_test_lr_s), title="LR plain - test")
results.append(model_scores(lr_plain, X_train_lr_s, y_train_lr, X_test_lr_s, y_test_lr, "Logistic Regression (plain)"))
""")

code(r"""
# 2. Logistic regression with balanced class weights, 3. with the regularisation strength tuned by grid search
lr_search = GridSearchCV(LogisticRegression(max_iter=3000, class_weight="balanced", random_state=RANDOM_STATE),
                         {"C": [0.01, 0.1, 1, 10]}, scoring="recall", cv=cv5, n_jobs=-1)
lr_search.fit(X_train_lr_s, y_train_lr)
print("Best C:", lr_search.best_params_, f"| best CV recall: {lr_search.best_score_:.3f}")
print(pd.DataFrame(lr_search.cv_results_)[["param_C", "mean_test_score"]].rename(columns={"mean_test_score": "CV recall"}).round(3).to_string(index=False))
lr_bal = lr_search.best_estimator_

print("\nTrain performance - Logistic Regression (balanced, tuned C)")
metrics_score(y_train_lr, lr_bal.predict(X_train_lr_s), title="LR balanced - train")
print("Test performance - Logistic Regression (balanced, tuned C)")
metrics_score(y_test_lr, lr_bal.predict(X_test_lr_s), title="LR balanced - test")
results.append(model_scores(lr_bal, X_train_lr_s, y_train_lr, X_test_lr_s, y_test_lr, "Logistic Regression (balanced)"))
""")

md(r"""
**Observations - Logistic Regression:**
- The plain model is accurate overall (about 88% on test) but catches only about **57% of defaulters** on the test set. It favours the "repaid" prediction because that is the majority class.
- Balancing the class weights raises test recall to about **80%** while precision falls to about 61% and accuracy to about 86%. In business terms the balanced model catches roughly 23 more defaulters out of every 100, at the cost of rejecting more good applicants.
- Regularisation strength makes little difference: cross-validated recall is within two points across `C` from 0.01 to 10. So the functional form, not the regularisation, limits the linear model.
- Train and test scores are close, so the linear model **does not over-fit**. Its limitation is that a straight line on the raw inputs cannot capture the threshold effects seen in the EDA. Binned or interaction features would help, and we list them as further work.
- ROC-AUC of about 0.91 shows the model ranks applicants well even though a fixed 0.5 threshold is not ideal.
""")

code(r"""
# Coefficients and odds ratios of the balanced logistic regression.
# Continuous inputs are standardised, so their coefficients are per one standard deviation;
# flags and dummies are 0/1, so their coefficients are the effect of the flag switching on.
coef = pd.DataFrame({"feature": X_train_lr_s.columns, "coefficient": lr_bal.coef_[0]})
coef["odds_ratio"] = np.exp(coef["coefficient"])
coef["unit"] = ["per 1 standard deviation" if f in num_cols else "flag 0 -> 1" for f in coef["feature"]]
coef = coef.sort_values("coefficient", ascending=False).reset_index(drop=True)

plt.figure(figsize=(9, 7))
colors = ["#C44E52" if c > 0 else "#4C72B0" for c in coef["coefficient"]]
sns.barplot(data=coef, x="coefficient", y="feature", hue="feature", legend=False, palette=colors)
plt.axvline(0, color="black", linewidth=1)
plt.title("Logistic Regression (balanced) - coefficients\nred = raises default risk, blue = lowers it")
plt.show()
coef
""")

md(r"""
**Insights - what the linear model says drives default:**

- **Risk-increasing (positive coefficients):** the missing-value flags dominate (these flags are 0/1, so the odds ratios are the full effect of the flag). An application with **no property valuation has odds of default about 45 times higher**, all else equal. An application with **no debt-to-income ratio has odds about 13 times higher**, all else equal. The model also gives `CLNO_missing` a large odds ratio (11.2). Do not read this flag on its own. Every applicant with a missing `CLNO` also has missing `DEROG`, `DELINQ`, `CLAGE` and `NINQ`. The five flag coefficients partly cancel, and together they give an odds ratio of about 3. The EDA shows only 23.9% default when `CLNO` is missing, against 19.8% when it is present. Among the continuous inputs, `DELINQ` (odds ratio about 2.4 per standard deviation) and `DEBTINC` (about 1.8) matter most, followed by `DEROG` and `NINQ`. The `JOB_Sales` indicator roughly triples the odds relative to a manager.
- **Risk-decreasing (negative coefficients):** `CLAGE` (longer credit history, odds ratio about 0.6 per standard deviation), `YOJ` (job tenure) and `JOB_Office` lower the odds. The `DEROG`, `JOB`, `YOJ` and `DELINQ` missing flags also lower the odds: in the EDA, the groups with these fields blank defaulted less often.
- `LOAN` has almost no linear effect once the model includes the other variables. Its relationship with default is non-linear (small loans are riskier, large loans are not), and a straight line cannot represent this.
- `MORTDUE` and `VALUE` have opposite signs, the classic symptom of their 0.88 correlation. We should not over-interpret these two coefficients individually.
- The signs agree with the EDA and with lending common sense, which gives confidence that the model learns real risk rather than noise.
""")

md(r"""
#### Can a different threshold improve the linear model?

The default threshold is 0.5. For an imbalanced problem the best operating point is usually lower. The precision-recall trade-off below shows what the bank gains and loses by moving the threshold.
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

# Metrics at a few candidate thresholds (illustration only; the threshold of the final model is chosen on training data below)
rows = []
for t in [0.3, 0.4, 0.5, 0.6]:
    p = (proba_lr > t).astype(int)
    rows.append({"threshold": t, "recall": recall_score(y_test_lr, p),
                 "precision": precision_score(y_test_lr, p), "f1": f1_score(y_test_lr, p),
                 "accuracy": accuracy_score(y_test_lr, p)})
pd.DataFrame(rows)
""")

md(r"""
**Observations:**
- Lowering the threshold to 0.4 lifts recall to about 84% but precision drops to about 53%. Raising it to 0.6 does the reverse (about 73% recall, 68% precision). F1 is highest around 0.5-0.6, so the balanced model at 0.5 is already close to its best balance.
- The threshold is a **business lever**, not a technical constant: the bank's risk appetite decides where to sit on this curve. For the final model we choose it formally, on the training rows, in the model-selection section.
""")

# --------------------------------------------------------------------------------------
md(r"""
### Decision Tree
""")

md(r"""
A decision tree learns a sequence of yes/no questions ("Is DEBTINC above 43.7%?") that split the applicants into increasingly pure groups. It captures the threshold effects seen in the EDA directly and produces rules that the bank can read to an applicant or a regulator.

We train the tree models on the **untreated data** (`X_train`, `X_test`). Outliers do not distort tree splits, and capping would only merge the largest values into one value.

We proceed in three steps:

1. Start with a fully grown tree to establish a baseline.
2. Add class weights.
3. Prune with grid search.
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
- The fully grown tree is a textbook case of **over-fitting**. It scores 100% recall, precision and accuracy on the training rows, but only about **69% recall** and 71% precision on the test set. It memorised the training applicants (dozens of levels deep, hundreds of leaves) instead of learning general rules.
- Even so, its test recall is already higher than the plain logistic regression, which shows that non-linear splits help on this data.
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
- Adding class weights to an un-pruned tree does **not** help: test recall is about 62%, no better than the baseline. The weights change the weighted impurity and therefore the chosen splits (this is a different tree). But they cannot change the fact that a fully grown tree fits every training applicant perfectly. So the test predictions remain those of an over-fitted tree.
- Class weights only help once we constrain (prune) the tree, which is what the grid search does next.
""")

md(r"""
### **Decision Tree - Hyperparameter Tuning**

* Hyperparameter tuning is difficult. **No direct method tells us how a change in a hyperparameter value will reduce the loss of the model**. So we usually experiment. We use grid search to tune the hyperparameters.
* **Grid search is a tuning technique that attempts to compute the optimum values of hyperparameters.**
* **It is an exhaustive search**: it tries every combination of the parameter values that we specify.
* **Cross-validated grid search** chooses the parameters of the estimator from a parameter grid.

**Criterion {"gini", "entropy"}**

The function to measure the quality of a split. Supported criteria are "gini" for the Gini impurity and "entropy" for the information gain.

**max_depth**

The maximum depth of the tree. If None, the tree grows until all leaves are pure or until all leaves contain less than min_samples_split samples.

**min_samples_leaf**

The minimum number of samples that a leaf node must contain. The tree considers a split point at any depth only if the split leaves at least min_samples_leaf training samples in each branch. This may smooth the model, especially in regression.

This link describes more hyperparameters that you can tune.

https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html

We search over depth, minimum leaf size, split criterion and class weights. We use **5-fold stratified cross-validation on the training rows with Recall as the scoring metric**. Because class weights are in the grid, recall-scoring will favour the heavier minority weighting. We report the precision cost of that choice alongside.
""")

code(r"""
# Test every combination of tree settings. Score each one by 5-fold cross-validated recall.
dt_grid = {
    "max_depth": [3, 4, 5, 6, 8, 10, None],
    "min_samples_leaf": [1, 5, 10, 20, 50],
    "criterion": ["gini", "entropy"],
    "class_weight": [None, "balanced", {0: 0.2, 1: 0.8}],
}

dt_search = GridSearchCV(DecisionTreeClassifier(random_state=RANDOM_STATE), dt_grid,
                         scoring="recall", cv=cv5, n_jobs=-1)
dt_search.fit(X_train, y_train)

print("Best parameters :", dt_search.best_params_)
print(f"Best CV recall  : {dt_search.best_score_:.3f}")
dt_tuned = dt_search.best_estimator_
""")

code(r"""
# Score the tuned tree on the training and test rows
print("Train performance - Decision Tree (tuned)")
metrics_score(y_train, dt_tuned.predict(X_train), title="DT tuned - train")
print("Test performance - Decision Tree (tuned)")
metrics_score(y_test, dt_tuned.predict(X_test), title="DT tuned - test")
results.append(model_scores(dt_tuned, X_train, y_train, X_test, y_test, "Decision Tree (tuned)"))
print("Tree depth:", dt_tuned.get_depth(), "| number of leaves:", dt_tuned.get_n_leaves())
""")

md(r"""
**Observations - tuned Decision Tree:**
- Pruning (a minimum of 20 applicants per leaf) cuts the tree from several hundred leaves to about 100. Combined with balanced class weights, it lifts **test recall to about 82%**, the highest of the single-model approaches. The train-test gap narrows from about 30 points to about 10 (92% vs 82%), so over-fitting is much smaller though not gone.
- The price is precision: only about 53% of the applicants the tree rejects would actually have defaulted, and overall accuracy falls to about 82%. The tree is deliberately cautious - it flags anyone who looks even moderately risky.
- This is the recall-precision trade-off in action. Whether 53% precision is acceptable depends on how much good business the bank is willing to decline. The ensembles below improve this balance.
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
# Text version of the decision rules (first three levels). Note: the tree was fitted with balanced class weights,
# so a leaf labelled 'class: 1' means the weighted majority is 'default', i.e. a raw default rate above roughly 20%,
# not a near-certain default. The observed default rates of the main rules are computed next.
print(export_text(dt_tuned, feature_names=list(X_train.columns), max_depth=3, show_weights=False))
""")

code(r"""
# Observed default rate (training rows) of the groups defined by the tree's first splits
tr = data.loc[train_idx]
root_split = dt_tuned.tree_.threshold[dt_tuned.tree_.children_left[0]]   # DEBTINC threshold under 'DEBTINC_missing <= 0.5'
groups = {
    "Debt-to-income ratio missing": tr["DEBTINC_missing"] == 1,
    f"Ratio recorded and above {root_split:.1f}%": (tr["DEBTINC_missing"] == 0) & (tr["DEBTINC"] > root_split),
    f"Ratio recorded, at most {root_split:.1f}%, 1+ delinquent lines": (tr["DEBTINC_missing"] == 0) & (tr["DEBTINC"] <= root_split) & (tr["DELINQ"] >= 1),
    f"Ratio recorded, at most {root_split:.1f}%, no delinquent lines": (tr["DEBTINC_missing"] == 0) & (tr["DEBTINC"] <= root_split) & (tr["DELINQ"] == 0),
}
pd.DataFrame({"applicants": {k: int(v.sum()) for k, v in groups.items()},
              "default_rate_%": {k: round(tr.loc[v, "BAD"].astype(int).mean() * 100, 1) for k, v in groups.items()}})
""")

md(r"""
**Business rules deduced from the tree:**

The top of the tree, with the observed default rates of each group, gives the bank plain-language rules. The bank can defend these rules in front of an applicant or a regulator:

1. **Is the debt-to-income ratio missing?** If yes, the applicant is in a high-risk group: about 62% of these applicants defaulted. If income is unverified, the bank should either reject the applicant or require an income-verification step.
2. **If the ratio is recorded, is it above about 44%?** If yes, roughly three out of four defaulted (and above 45% the EDA showed 87% to 100%): decline.
3. **Below that ratio, how many delinquent credit lines does the applicant have?** With none, only about 4-5% default (the safest group in the book). With one or more, the rate is about four times higher and the tree asks further questions.
4. **Among the remaining applicants, how long is the credit history (CLAGE) and are there derogatory reports (DEROG)?** Short histories (under about 15 years) with any derogatory report are risky. Long clean histories are safe.
5. **In the "ratio missing" branch the tree asks the same questions again** (delinquencies, derogatory reports, credit-history length, loan size). Almost every path that combines a missing ratio with any delinquency or derogatory report ends in "default".

These rules match the EDA findings exactly, which is reassuring: the model formalises the patterns in the data rather than inventing new ones.
""")

# --------------------------------------------------------------------------------------
md(r"""
### Bagging (Bootstrap Aggregating): from one tree to many

A single decision tree has **high variance**: small changes in the training rows produce a different tree. This is why the fully grown tree scored 100% on the training rows and far less on the test set. **Bagging** trains many trees, each on a *bootstrap sample* (a random sample of the training applicants drawn with replacement), and combines their votes. Averaging many over-fitted trees cancels their individual errors, which lowers variance without raising bias.

A Random Forest is bagging plus one more idea (a random subset of features at every split). So we build a plain bagged ensemble first, to show how much of the improvement comes from bagging alone.
""")

code(r"""
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
- Averaging 200 trees lifts **test precision from 71% (single tree) to about 83% and ROC-AUC from 0.81 to about 0.95**. Recall stays the same (about 68%). That is the variance reduction bagging promises. The ensemble is right far more often when it flags a defaulter, and it ranks applicants by risk almost as well as the forest will.
- Train recall is still 100%: bagging limits the *damage* of over-fitting on unseen data. It does not stop each tree from memorising its sample.
- Weighting the base trees towards the defaulter class does **not** raise recall (it falls to about 60%). As with the single tree, the weights change which splits each fully grown tree makes. They do not change the fact that each tree fits its bootstrap sample perfectly. The forest sections and the final selection below test whether class weights help an ensemble. They also test whether an ensemble needs the weights at all once we tune the decision threshold.
- A bagged ensemble still misses about a third of defaulters. The random forest adds feature sub-sampling, which de-correlates the trees and should improve ranking. At the 0.5 threshold, class weights are then one way to trade some precision for recall.
""")

# --------------------------------------------------------------------------------------
md(r"""
### **Building a Random Forest Classifier**

**Random Forest is a bagging algorithm where the base models are Decision Trees.** The algorithm takes samples from the training data, and on each sample a decision tree makes a prediction.

**The forest combines the results from all the decision trees and makes the final prediction by voting or averaging.**

Each tree sees a different bootstrap sample and a random subset of features at each split. Because of this, the individual over-fitted trees balance each other in the average. This usually improves test performance greatly over a single tree, and the forest keeps the ability to model thresholds. The cost is interpretability: we cannot read a forest of hundreds of trees as a rule list. So we will use **feature importances** and, for the final model, a **surrogate decision tree** to explain it.
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
- Like the single tree, the forest fits the training rows perfectly, but on the test set it does much better. It scores about **69% recall with 84% precision**, 91% accuracy and a ROC-AUC of about 0.96 (the best ranking ability of all the models).
- The forest is conservative about flagging an applicant as a defaulter: when it does, it is right 84% of the time. But it still misses about a third of the defaulters. Class weights should shift that balance towards recall.
""")

md(r"""
### **Build a Random Forest model with Class Weights**
""")

code(r"""
# Fit a forest of 200 trees. The 0.2/0.8 weights make each defaulter count four times as much as a repayer.
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
- Class weights lift **test recall to about 77%** while precision stays near 77% and accuracy near 91%. Unlike the single tree, the forest's recall responds to class weights at the 0.5 threshold. The weights shift the ensemble's averaged probabilities, which moves applicants across the fixed threshold. The final selection tests whether that shift is better than simply moving the threshold.
- This is the best balance of recall and precision so far. The forest catches almost as many defaulters as the balanced logistic regression (77% vs 80%) with far higher precision (77% vs 61%). So it declines far fewer good applicants.
- Train scores are still near-perfect, so there is residual over-fitting of the training labels. We judge below whether that hurts on unseen applicants, with out-of-fold cross-validation rather than training scores.
""")

md(r"""
### **Random Forest Classifier Hyperparameter Tuning**

We search over the number of trees, maximum depth, minimum leaf size, the number of features considered per split and the class weights. Again we use **stratified 3-fold cross-validation on the training rows and Recall as the scoring metric**. (3 folds instead of 5 keep the run time reasonable for the larger forest grid.)
""")

code(r"""
# Test every combination of forest settings. Use 3 folds to keep the run time short.
rf_grid = {
    "n_estimators": [150, 300],
    "max_depth": [6, 10, None],
    "min_samples_leaf": [1, 5, 10],
    "max_features": ["sqrt", 0.5],
    "class_weight": ["balanced", {0: 0.2, 1: 0.8}],
}

rf_search = GridSearchCV(RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1), rf_grid,
                         scoring="recall", cv=cv3, n_jobs=-1)
rf_search.fit(X_train, y_train)

print("Best parameters :", rf_search.best_params_)
print(f"Best CV recall  : {rf_search.best_score_:.3f}")
rf_tuned = rf_search.best_estimator_
""")

code(r"""
# Score the recall-tuned forest on the training and test rows
print("Train performance - Random Forest (tuned for recall)")
metrics_score(y_train, rf_tuned.predict(X_train), title="RF tuned - train")
print("Test performance - Random Forest (tuned for recall)")
metrics_score(y_test, rf_tuned.predict(X_test), title="RF tuned - test")
results.append(model_scores(rf_tuned, X_train, y_train, X_test, y_test, "Random Forest (tuned, recall)"))
""")

md(r"""
**Observations - recall-tuned Random Forest:**
- Optimising purely for recall pushes the grid towards larger leaves (10 applicants minimum) and balanced weights. Test recall lands at about **79%**, close to the weighted forest. But precision drops to about 66% because the forest becomes more willing to flag borderline applicants.
- The train-test gap shrinks (train recall is no longer 100%), so the tuned forest memorises less, even though its headline test numbers are no better.
- Recall-only tuning illustrates the limitation of a single-metric search on an imbalanced problem: beyond a point, extra recall costs a lot of precision. This is why we choose the final model on expected cost, not on recall alone.
""")

code(r"""
# Feature importance of the recall-tuned random forest, used to test a leaner feature set
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
- The two debt-to-income features dominate: **`DEBTINC_missing` and `DEBTINC` together provide about half of this forest's split power.** This agrees with the EDA finding that affordability, and whether the bank could check it, is the heart of the decision.
- Next come **`DELINQ`, `CLAGE` and `DEROG`** (past repayment behaviour and depth of credit history), then `LOAN`, `VALUE`, `MORTDUE` and `CLNO`.
- `NINQ`, `YOJ` and `VALUE_missing` contribute modestly. The `JOB` and `REASON` dummies rank at the bottom: once the model knows the financial behaviour, occupation and loan purpose add little on their own. (Mean-decrease-in-impurity importance favours continuous variables with many split points, so we complement it below with permutation importance for the final model.)
""")

md(r"""
#### Improving the forest by removing weak variables

A best-practice check: does the model keep its performance with fewer inputs? A leaner model is cheaper to maintain, easier to explain and less prone to learning spurious patterns. We refit the recall-tuned forest on only the features with importance above 1%. This 12-feature set is then a candidate when we choose the final model. The selection section applies one rule: keep the smallest input set whose out-of-fold cost is within one standard error of the lowest.
""")

code(r"""
# Keep only the inputs with an importance above 1%, then refit the tuned forest on them
keep = importances[importances > 0.01].index.tolist()
dropped = [c for c in X_train.columns if c not in keep]
print(f"Keeping {len(keep)} of {X_train.shape[1]} features: {keep}")
print(f"Dropped: {dropped}")

rf_lean = RandomForestClassifier(**{k: v for k, v in rf_search.best_params_.items()},
                                 random_state=RANDOM_STATE, n_jobs=-1)
rf_lean.fit(X_train[keep], y_train)

print("Test performance - Random Forest (tuned, reduced features)")
metrics_score(y_test, rf_lean.predict(X_test[keep]), title="RF tuned, reduced features - test")
results.append(model_scores(rf_lean, X_train[keep], y_train, X_test[keep], y_test, "Random Forest (tuned, reduced features)"))
""")

md(r"""
**Observations:**
- At the default 0.5 threshold, removing the 15 low-importance columns changes test recall and precision by about a point. (The removed columns are all occupation and loan-purpose dummies and nine of the eleven missing-value flags.) For this model the signal lives mainly in 12 variables: the ten financial attributes plus the `DEBTINC` and `VALUE` missing flags.
- The next section tests properly whether the leaner set is also good enough at the business-optimal threshold. There it competes against the full feature set on expected cost.
""")

md(r"""
#### Did tuning improve the validation scores?

The grid searches above give no cross-validated score for the untuned baselines. Here we score each untuned baseline on the same folds, so that we can compare before and after tuning on the training rows. The test set plays no part.
""")

code(r"""
# Validation scores before and after tuning, on the same folds that each grid search used (training rows only).
# This shows that tuning improves the cross-validated scores, not only the test scores.
before_after = [
    ("Logistic Regression", "before: plain", lr_plain, X_train_lr_s, y_train_lr, cv5),
    ("Logistic Regression", "after: balanced, C tuned", lr_bal, X_train_lr_s, y_train_lr, cv5),
    ("Decision Tree", "before: fully grown", dt_base, X_train, y_train, cv5),
    ("Decision Tree", "after: grid search", dt_tuned, X_train, y_train, cv5),
    ("Random Forest", "before: default", rf_base, X_train, y_train, cv3),
    ("Random Forest", "class weights 0.2/0.8", rf_cw, X_train, y_train, cv3),
    ("Random Forest", "after: grid search", rf_tuned, X_train, y_train, cv3),
]
tuning_rows = []
for technique, stage, model, X_cv, y_cv, folds in before_after:
    cv_scores = cross_validate(clone(model), X_cv, y_cv, cv=folds, scoring=["recall", "precision", "roc_auc"], n_jobs=-1)
    tuning_rows.append({"Technique": technique, "Stage": stage, "CV recall": cv_scores["test_recall"].mean(),
                        "CV precision": cv_scores["test_precision"].mean(), "CV ROC-AUC": cv_scores["test_roc_auc"].mean()})
pd.DataFrame(tuning_rows).set_index(["Technique", "Stage"]).round(3)
""")

md(r"""
**Observations - validation scores before and after tuning:**
- Tuning raises the cross-validated recall of each tuned technique. Logistic regression rises from 0.626 to 0.814, almost all from the balanced class weights. The grid above shows that `C` moves it by less than two points. The decision tree rises from 0.644 to 0.826. The random forest rises from 0.703 to 0.811 (0.790 with class weights alone).
- The test set shows the same direction (0.566 to 0.796, 0.686 to 0.821 and 0.686 to 0.790). So the gains do not come from one lucky split.
- Recall-only tuning costs precision in every case (0.789 to 0.598, 0.663 to 0.533 and 0.829 to 0.640). It also lowers the forest's cross-validated ROC-AUC from 0.954 to 0.921. This is why we choose the final configuration and its threshold on expected cost in the selection section below.
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
# Put the scores of all models in one table. Darker cells show higher test scores.
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
                        ("Bagging (200 trees)", bag, X_test),
                        ("Random Forest (class weights)", rf_cw, X_test),
                        ("Random Forest (tuned, recall)", rf_tuned, X_test)]:
    pr = model.predict_proba(Xt)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, pr)
    plt.plot(fpr, tpr, label=f"{name} (AUC = {roc_auc_score(y_test, pr):.3f})")
plt.plot([0, 1], [0, 1], "k--", linewidth=1)
plt.xlabel("False positive rate (good customers wrongly rejected)")
plt.ylabel("True positive rate (defaulters caught) = Recall")
plt.title("ROC curves - test set"); plt.legend(); plt.show()
""")

md(r"""
**Comparison - how the techniques perform (at the default 0.5 threshold):**

*Linear vs non-linear.* The balanced logistic regression reaches about 80% recall but only about 61% precision and a ROC-AUC of about 0.91. Every random forest beats it on precision and AUC at a similar recall. This shows that trees capture the threshold-shaped relationships in this data better. The linear model remains the most transparent benchmark.

*Single tree vs bagging vs forest.* The tuned decision tree achieves the **highest raw recall (about 82%)** but the **lowest precision (about 53%)**. It would reject almost one good applicant for every defaulter it catches. Bagging 200 trees shows the value of averaging. At the same 68% recall as the single fully grown tree, precision rises to about 83% and ROC-AUC from 0.81 to about 0.95.

The random forests add feature sub-sampling. Without class weights the forest is the most precise model at 0.5 (69% recall at 84% precision) and ranks applicants best of all (ROC-AUC 0.963). With class weights or recall tuning it reaches 77-79% recall at 66-77% precision, a far better balance than the single tree at this threshold.

*Among the forests.* The class-weighted forest (0.2/0.8) has the best F1 (about 0.77) and precision at the same recall. The recall-tuned forest has the same recall with lower precision but a smaller train-test gap. The reduced-feature forest performs essentially the same as the tuned one with 12 instead of 27 inputs. This table cannot show which of these is best for the bank. This is because the business cares about the cost of the two errors at the best operating threshold, not at 0.5. We choose among them next, on the training rows.

*Is there scope to improve further?* Yes, in three directions:
1. **Threshold tuning** on the chosen forest (next section) moves recall above 90% at a controlled precision cost, because the forest's AUC is high.
2. **Feature engineering** such as a loan-to-value ratio ((LOAN + MORTDUE) / VALUE), binned debt-to-income or interaction terms. The trees approximate these features but could use them directly. These features would also help the linear model.
3. **Gradient boosting and probability calibration.** Gradient boosting builds trees one after another, and each new tree corrects the errors of the earlier trees. It keeps what makes trees fit this data (thresholds, combined risk factors and blank fields). On tabular data like this it often ranks applicants better than a random forest. Calibration matters because the forest's scores understate risk in the decision range (see the calibration check below). Both were outside the scope of this milestone, and we list them as next steps.
""")

md(r"""
#### Implementation feasibility, risks and benefits of each technique

Performance is only one side of the decision. The table below weighs each technique on how practical it is to put in front of the bank's credit officers and regulators.

| Technique | Interpretability (ECOA adverse-action reasons) | Build and run cost | Stability and maintenance | Main risks | Verdict |
|---|---|---|---|---|---|
| Logistic Regression (balanced) | Excellent: one coefficient per attribute, and the bank can quote odds ratios directly | Trivial. Trains in under a second. Needs scaling and outlier capping in the pipeline | Very stable across re-trainings | Under-fits threshold effects on the raw inputs, so at the same recall it declines many more good applicants than the forest. Needs careful handling of correlated inputs (MORTDUE/VALUE) | Keep as the transparent benchmark and challenger model |
| Decision Tree (tuned) | Excellent: a short rule list a credit officer can read | Trivial | Unstable: small changes in the training rows can re-shape the tree. The bank must check it again at every re-train | Lowest precision (53%): too much good business declined | Use as a rule summary, not as the scorer |
| Bagged trees (200) | Same as the forest: importances and per-applicant risk drivers, no rule list | Low | Stable, like the forest | Class weights do not move its recall, so it catches only about two thirds of defaulters. Below the forest on every metric | The Random Forest supersedes it |
| Random Forest (unweighted, class-weighted or tuned) | Good with the right tooling: global importances, a surrogate tree that reproduces most of its decisions, and per-applicant risk drivers (built before the shadow run). Not a rule list on its own | Low: trains in seconds, scores in milliseconds. 200-300 trees are trivial to host | Stable: averaging removes single-tree instability. Needs drift monitoring and yearly re-training like any credit model | Some stakeholders perceive it as a black box. Needs model-risk documentation and a fairness review before the bank starts to use it | **Adopt as the scoring engine**, with the surrogate tree for explanations |

**A caveat that applies to every technique.** The data contains only loans the bank *approved* under its current process (the problem statement: "recent applicants who have been given credit"). The models therefore never saw the applicants the old process declined. The "approve all" baseline used below describes the outcome of today's process on the applicants it accepts, not the full applicant population. For this reason we list reject inference and a shadow period on all applications as risks and next steps.
""")

md(r"""
### Choosing the final model and its decision threshold, on training rows only

Above, we compared the models at the conventional 0.5 threshold. We never tested the class weights used so far (0.2/0.8 by convention, `balanced` from a recall-only grid search) against the business criterion. The bank's real question is: **which forest configuration, at its best threshold, produces the lowest expected cost of credit errors?** Class weights and the decision threshold are two dials for the same trade-off (how readily the model flags an applicant). So we must choose them together and on that criterion.

To answer it **without touching the test set**, we score every candidate with **repeated 5-fold out-of-fold predictions on the training rows**. We use three different stratified 5-fold splits. So each training applicant receives three probabilities from models that never saw them, and we judge every candidate on 15 validation folds. For each candidate we find, on those out-of-fold predictions, the threshold that minimises the mean of the indicative expected cost.

**Selection rule, fixed before the search:** the candidate with the lowest mean expected cost on out-of-fold predictions wins. If several candidates lie within one fold-to-fold standard error of the lowest cost, we prefer the simplest of them (fewest non-default settings, fewer inputs). The standard error is the standard deviation of the 15 pooled fold costs divided by the square root of 15. This convention treats the three repeats as independent. We show a paired fold-by-fold check of the closest contest with the robustness checks. Only then do we refit the winner on all training rows and score it once on the test set.

Indicative cost assumptions: a missed defaulter costs about \$9,000 (roughly half of the \$16,900 average defaulted loan after recovery of the collateral). A wrongly declined good applicant costs about \$2,000 in lost interest margin and acquisition spend. We show afterwards how sensitive the chosen threshold is to these assumptions.

The search runs in two stages:

**(1)** The forest's class weights and minimum leaf size, on all 27 inputs. These are the two dials the course material and the earlier grid search used. The number of trees and the features tried per split stay at their defaults, 200 and the square root of the input count.

**(2)** The winning configuration against the recall-tuned grid winner, each on all 27 inputs and on the 12-feature set. Stage 2 also includes the winning configuration without any occupation information (21 inputs), which is the fallback a fair-lending review might require.

For completeness on the chosen yardstick, we score three more techniques the same way at their own cost-minimising thresholds. These are the bagged trees, the balanced logistic regression and the recall-tuned decision tree.
""")

code(r"""
COST_FN, COST_FP = 9000, 2000   # indicative dollar cost of a missed defaulter / a wrongly declined good customer
THRESHOLDS = np.round(np.arange(0.05, 0.71, 0.05), 2)
CV_REPEATS = [1, 2, 3]          # three different stratified 5-fold splits of the training rows = 15 validation folds per candidate
COST_COL = "Mean OOF expected cost per 1,000 ($)"

def cost_table(y_true, proba, thresholds=THRESHOLDS):
    '''Recall, precision and indicative expected cost per 1,000 applicants at each threshold.'''
    rows = []
    for t in thresholds:
        pred = (proba > t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, pred).ravel()
        n = len(y_true)
        rows.append({"threshold": float(t), "recall": tp / (tp + fn), "precision": tp / (tp + fp) if tp + fp else 0.0,
                     "accuracy": (tp + tn) / n,
                     "missed_defaulters_per_1000": 1000 * fn / n, "good_customers_declined_per_1000": 1000 * fp / n,
                     "expected_cost_per_1000_$": 1000 * (fn * COST_FN + fp * COST_FP) / n})
    return pd.DataFrame(rows)

def oof_evaluate(model, cols, X=None):
    '''Repeated 5-fold out-of-fold evaluation of one candidate on the training rows (X defaults to the tree data X_train;
    the linear model passes its own capped and scaled frame). Returns the per-repeat OOF probabilities, the threshold
    table averaged over the repeats, its best row, the mean OOF ROC-AUC and the fold-to-fold SD of the cost at the best threshold.'''
    X = X_train if X is None else X
    probas, tables, fold_costs = [], [], {}
    for seed in CV_REPEATS:
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        p = cross_val_predict(model, X[cols], y_train, cv=cv, method="predict_proba")[:, 1]
        probas.append(p)
        tables.append(cost_table(y_train, p))
        for _, val in cv.split(X[cols], y_train):
            fold_tbl = cost_table(y_train.iloc[val], p[val])
            for t, c in zip(fold_tbl["threshold"], fold_tbl["expected_cost_per_1000_$"]):
                fold_costs.setdefault(t, []).append(c)
    tbl = pd.concat(tables).groupby("threshold", as_index=False).mean()
    best = tbl.loc[tbl["expected_cost_per_1000_$"].idxmin()]
    return {"probas": probas, "table": tbl, "best": best,
            "auc": np.mean([roc_auc_score(y_train, p) for p in probas]),
            "fold_sd": np.std(fold_costs[best["threshold"]], ddof=1)}

def summary_row(res):
    '''Return one row of the selection table from an out-of-fold result.'''
    return {"Mean OOF ROC-AUC": res["auc"], "Best threshold": res["best"]["threshold"],
            "OOF recall at best": res["best"]["recall"], "OOF precision at best": res["best"]["precision"],
            COST_COL: res["best"]["expected_cost_per_1000_$"], "Fold-to-fold SD of cost ($)": res["fold_sd"]}

SELECTION_FORMAT = {"Mean OOF ROC-AUC": "{:.3f}", "Best threshold": "{:.2f}", "OOF recall at best": "{:.3f}",
                    "OOF precision at best": "{:.3f}", COST_COL: "{:,.0f}", "Fold-to-fold SD of cost ($)": "{:,.0f}"}

# Stage 1: class weights x minimum leaf size (200 trees, all 27 inputs)
weight_options = {"none": None, "balanced": "balanced", "0.3/0.7": {0: 0.3, 1: 0.7}, "0.2/0.8": {0: 0.2, 1: 0.8}, "0.1/0.9": {0: 0.1, 1: 0.9}}
leaf_options = [1, 5, 10]        # 1 = fully grown trees (the default); 5 and 10 = the constrained settings in the recall-only grid (10 was its choice)
stage1 = {}
for w_name, w in weight_options.items():
    for leaf in leaf_options:
        model = RandomForestClassifier(n_estimators=200, class_weight=w, min_samples_leaf=leaf, random_state=RANDOM_STATE, n_jobs=-1)
        stage1[(w_name, leaf)] = oof_evaluate(model, list(X_train.columns))
config_search = pd.DataFrame({k: summary_row(v) for k, v in stage1.items()}).T
config_search.index.names = ["Class weights", "Min. applicants per leaf"]
config_search.style.format(SELECTION_FORMAT).highlight_min(subset=[COST_COL], color="#c6efce")
""")

code(r"""
# Apply the pre-stated rule: lowest mean cost, and among the configurations within one standard error of it, the simplest
lowest = config_search[COST_COL].min()
one_se = config_search.loc[config_search[COST_COL].idxmin(), "Fold-to-fold SD of cost ($)"] / np.sqrt(5 * len(CV_REPEATS))
within = config_search[config_search[COST_COL] <= lowest + one_se].copy()
within["non-default settings"] = [(w != "none") + (leaf != 1) for w, leaf in within.index]
print(f"Lowest mean OOF cost: ${lowest:,.0f} per 1,000 applicants; one standard error (15 folds): ${one_se:,.0f}")
print("Configurations within one standard error of the lowest cost:")
display(within[[COST_COL, "Best threshold", "non-default settings"]].style.format({COST_COL: "{:,.0f}", "Best threshold": "{:.2f}"}))
best_weights, best_leaf = within.sort_values(["non-default settings", COST_COL]).index[0]
best_leaf = int(best_leaf)
print(f"\nStage 1 choice: class weights = {best_weights}, min. applicants per leaf = {best_leaf}")
""")

md(r"""
**Observations - configuration search:**
- **Fully grown trees beat constrained trees by a wide margin for every class-weight setting.** With a minimum leaf of 1 the expected cost is about \$317,000-345,000 per 1,000 applicants, against roughly \$430,000-460,000 with a leaf of 5. With the leaf of 10 that the recall-only grid search chose, it is roughly \$477,000-503,000. Constraining the leaves buys recall at the 0.5 threshold by making the probabilities cruder. Once the threshold is free to move, the finer probabilities of fully grown trees are worth far more. (We searched tree size through the leaf size only, and we kept the number of trees and the features tried per split at their defaults.)
- **Among the fully grown forests the class weights barely matter.** No weights (\$317,000), 0.3/0.7 (\$320,000) and 0.2/0.8 (\$321,000) lie within one fold-to-fold standard error (about \$10,500) of each other. Each simply reaches its minimum at a different threshold (0.15, 0.20 and 0.25). Class weights and the decision threshold are two ways to shift the same trade-off, and the threshold alone does the job. The extreme 0.1/0.9 weighting is clearly worse. The `balanced` weighting is somewhat worse (about \$13,000 above the lowest cost, just outside one standard error).
- By the pre-stated rule we choose the **unweighted forest with fully grown trees** for the next stage. It has the lowest mean cost, and it is the simplest of the configurations within one standard error. Its score also keeps a natural reading as an estimated default rate (we check this below with a calibration table). That reading makes the threshold interpretable as the bank's risk appetite.
""")

code(r"""
# Stage 2: the chosen configuration against the recall-tuned grid winner, on all 27 inputs and on the 12-feature set,
# plus the chosen configuration without any occupation information (the fair-lending fallback)
def chosen_forest():
    '''Return an unfitted forest with the configuration that stage 1 chose.'''
    return RandomForestClassifier(n_estimators=200, class_weight=weight_options[best_weights], min_samples_leaf=best_leaf,
                                  random_state=RANDOM_STATE, n_jobs=-1)

no_occupation = [c for c in X_train.columns if not c.startswith("JOB_")]   # fair-lending fallback: no occupation information at all (21 inputs)
candidates = {
    f"RF class weights {best_weights}, leaf {best_leaf}, 27 inputs": (chosen_forest(), list(X_train.columns)),
    f"RF class weights {best_weights}, leaf {best_leaf}, 21 inputs (no occupation)": (chosen_forest(), no_occupation),
    f"RF class weights {best_weights}, leaf {best_leaf}, 12 inputs": (chosen_forest(), keep),
    "RF recall-tuned grid winner, 27 inputs": (RandomForestClassifier(**rf_search.best_params_, random_state=RANDOM_STATE, n_jobs=-1), list(X_train.columns)),
    "RF recall-tuned grid winner, 12 inputs": (RandomForestClassifier(**rf_search.best_params_, random_state=RANDOM_STATE, n_jobs=-1), keep),
}
# The other techniques at their own cost-minimising thresholds, so that the comparison on the chosen yardstick is complete
# (the logistic regression is evaluated on its own capped and scaled data version)
other_techniques = {
    "Bagging (200 trees), own threshold": (clone(bag), list(X_train.columns), X_train),
    "Logistic Regression (balanced, C tuned), own threshold": (clone(lr_bal), list(X_train_lr_s.columns), X_train_lr_s),
    "Decision Tree (recall-tuned), own threshold": (clone(dt_tuned), list(X_train.columns), X_train),
}
oof = {}
for name, (model, cols) in candidates.items():
    oof[name] = stage1[(best_weights, best_leaf)] if name.endswith(f"leaf {best_leaf}, 27 inputs") else oof_evaluate(model, cols)
for name, (model, cols, frame) in other_techniques.items():
    oof[name] = oof_evaluate(model, cols, X=frame)
selection = pd.DataFrame({name: summary_row(res) for name, res in oof.items()}).T
selection.index.name = "Candidate"
selection["Inputs"] = [len(cols) for _, cols in candidates.values()] + [len(c[1]) for c in other_techniques.values()]

lowest = selection[COST_COL].min()
one_se = selection.loc[selection[COST_COL].idxmin(), "Fold-to-fold SD of cost ($)"] / np.sqrt(5 * len(CV_REPEATS))
within = selection[selection[COST_COL] <= lowest + one_se]
winner = within.sort_values(["Inputs", COST_COL]).index[0]      # simplest (fewest inputs) among those within one standard error
FINAL_THRESHOLD = float(selection.loc[winner, "Best threshold"])
assert winner in candidates, "the cells that follow score the winner on the untreated tree data; a linear winner would need its own data version"
final_model, final_cols = candidates[winner]
print(f"Candidates within one standard error (${one_se:,.0f}) of the lowest cost: {list(within.index)}")
print(f"Selected model : {winner}")
print(f"Selected threshold (from out-of-fold cost): {FINAL_THRESHOLD:.2f}")
selection.style.format(SELECTION_FORMAT).highlight_min(subset=[COST_COL], color="#c6efce")
""")

code(r"""
# Out-of-fold cost curve of the winner (mean over the three repeated 5-fold splits)
# Two panels that share the threshold axis, one y-axis each (no dual-axis chart)
tbl = oof[winner]["table"]
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(9, 7), sharex=True)
ax1.plot(tbl["threshold"], tbl["recall"], marker="o", color="#3C8D5A", label="Recall (out-of-fold)")
ax1.plot(tbl["threshold"], tbl["precision"], marker="o", color="#4C72B0", label="Precision (out-of-fold)")
ax1.set_ylabel("score"); ax1.legend(loc="lower left")
ax1.set_title(f"{winner}: recall and precision by threshold (training rows, out-of-fold)")
ax2.plot(tbl["threshold"], tbl["expected_cost_per_1000_$"], marker="s", color="#1E2761")
ax2.set_ylabel("expected cost per 1,000 applicants ($)"); ax2.set_xlabel("probability threshold")
ax2.set_title("Indicative expected cost of credit errors by threshold")
for ax in (ax1, ax2):
    ax.axvline(FINAL_THRESHOLD, color="red", linestyle=":", linewidth=1)
plt.tight_layout(); plt.show()

tbl.style.format({"recall": "{:.3f}", "precision": "{:.3f}", "accuracy": "{:.3f}", "missed_defaulters_per_1000": "{:.1f}",
                  "good_customers_declined_per_1000": "{:.1f}", "expected_cost_per_1000_$": "{:,.0f}"}).highlight_min(subset=["expected_cost_per_1000_$"], color="#c6efce")
""")

code(r"""
# How sensitive is the chosen threshold to the cost assumptions? Re-run the threshold choice for other cost ratios.
rows = []
for ratio in [2, 3, 4.5, 6, 7, 8, 9]:
    costs = []
    for t in THRESHOLDS:
        c = 0
        for proba_oof in oof[winner]["probas"]:
            tn, fp, fn, tp = confusion_matrix(y_train, (proba_oof > t).astype(int)).ravel()
            c += fn * ratio + fp
        costs.append(c)
    rows.append({"cost of a missed defaulter / cost of a wrongly declined customer": f"{ratio}:1",
                 "cost-minimising threshold": THRESHOLDS[int(np.argmin(costs))],
                 "break-even threshold for a perfectly calibrated score": round(1 / (1 + ratio), 2)})
pd.DataFrame(rows)
""")

code(r"""
# Five robustness checks on the selection, all on training rows only.

# (a) A finer threshold grid for the winner: does the 0.05 step hide a better cut-off?
fine = np.round(np.arange(0.08, 0.26, 0.01), 2)
fine_cost = np.mean([cost_table(y_train, p, thresholds=fine)["expected_cost_per_1000_$"].values for p in oof[winner]["probas"]], axis=0)
print(f"(a) Finer grid, 0.01 steps: cost-minimising threshold {fine[int(np.argmin(fine_cost))]:.2f}; mean OOF cost per 1,000 ($) by threshold:")
print(pd.Series(fine_cost.round(0).astype(int), index=fine).to_frame("cost").T.to_string())

# (b) Calibration: do the out-of-fold scores behave like default rates? Reliability table and Brier score for the winner
#     and for the class-weighted forest it replaced.
score_bins = [0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.70, 1.0]
def reliability(proba, label):
    '''Return the reliability table: mean score and observed default rate per score band.'''
    t = (pd.DataFrame({"score band": pd.cut(proba, score_bins, include_lowest=True), "p": proba, "y": y_train.values})
           .groupby("score band", observed=True).agg(applicants=("y", "size"), mean_score=("p", "mean"), observed_default_rate=("y", "mean")))
    t.columns = pd.MultiIndex.from_product([[label], t.columns])
    return t
p_final, p_weighted = oof[winner]["probas"][0], stage1[("0.2/0.8", 1)]["probas"][0]
print(f"(b) Brier score (mean squared error of the score as a probability, lower is better; the base rate alone scores "
      f"{brier_score_loss(y_train, np.full(len(y_train), y_train.mean())):.3f}): "
      f"final forest {brier_score_loss(y_train, p_final):.3f}, class weights 0.2/0.8 {brier_score_loss(y_train, p_weighted):.3f}")
display(pd.concat([reliability(p_final, "Final forest (unweighted)"), reliability(p_weighted, "Class weights 0.2/0.8")], axis=1).round(3))

# (c) The approve / refer / decline bands proposed later (0.10 and 0.25), on the out-of-fold scores of the training rows
oof_bands = pd.cut(p_final, [-0.01, 0.10, 0.25, 1.0], labels=["approve (score <= 0.10)", "refer (0.10 - 0.25)", "decline (score > 0.25)"])
band_oof = (pd.DataFrame({"band": oof_bands, "defaulted": y_train.values}).groupby("band", observed=True)
              .agg(applicants=("defaulted", "size"), defaulters=("defaulted", "sum"), observed_default_rate=("defaulted", "mean")))
band_oof["share_of_applicants"] = band_oof["applicants"] / len(y_train)
band_oof["share_of_defaulters"] = band_oof["defaulters"] / y_train.sum()
print("(c) Approve / refer / decline bands on the out-of-fold scores (training rows):")
display(band_oof.style.format({"observed_default_rate": "{:.1%}", "share_of_applicants": "{:.1%}", "share_of_defaulters": "{:.1%}"}))

# (d) Paired check of the 'within noise' statement: fold-by-fold cost difference between the 0.2/0.8 forest at its own best
#     threshold and the winner at its threshold, over the same 15 validation folds
def fold_costs_at(res, t):
    '''Return the expected cost per 1,000 applicants in each validation fold at threshold t.'''
    out = []
    for seed, p in zip(CV_REPEATS, res["probas"]):
        for _, val in StratifiedKFold(n_splits=5, shuffle=True, random_state=seed).split(X_train, y_train):
            out.append(cost_table(y_train.iloc[val], p[val], thresholds=np.array([t]))["expected_cost_per_1000_$"].iloc[0])
    return np.array(out)
weighted = stage1[("0.2/0.8", 1)]
diff = fold_costs_at(weighted, weighted["best"]["threshold"]) - fold_costs_at(oof[winner], FINAL_THRESHOLD)
print(f"(d) Paired fold-by-fold difference, class weights 0.2/0.8 at {weighted['best']['threshold']:.2f} minus the winner at {FINAL_THRESHOLD:.2f}: "
      f"mean ${diff.mean():,.0f} per 1,000 applicants, paired standard error ${diff.std(ddof=1) / np.sqrt(len(diff)):,.0f} ({len(diff)} folds)")

# (e) Does the choice depend on this particular 70/30 split? Repeat stage 1 (fully grown trees) on two other stratified splits,
#     rebuilding the missing flags and the imputation from each split's own training rows.
def training_rows_for_split(seed):
    '''Rebuild the tree inputs of the training rows for another stratified 70/30 split.'''
    frame = hm.copy()
    for c in ["REASON", "JOB", "BAD"]:
        frame[c] = frame[c].astype("category")
    tr, _ = train_test_split(frame.index, test_size=0.30, random_state=seed, stratify=frame["BAD"])
    add_missing_flags(frame)
    impute(frame, tr)
    Xs, ys = prepare_xy(frame)
    return Xs.loc[tr], ys.loc[tr]

rows = []
for seed in [2, 3]:
    Xs, ys = training_rows_for_split(seed)
    cv_s = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    for w_name, w in weight_options.items():
        p = cross_val_predict(RandomForestClassifier(n_estimators=200, class_weight=w, random_state=RANDOM_STATE, n_jobs=-1),
                              Xs, ys, cv=cv_s, method="predict_proba")[:, 1]
        t = cost_table(ys, p)
        best = t.loc[t["expected_cost_per_1000_$"].idxmin()]
        rows.append({"class weights": w_name, "split seed": seed, "best threshold": best["threshold"],
                     "OOF cost per 1,000 ($)": best["expected_cost_per_1000_$"]})
split_check = (pd.DataFrame(rows).pivot(index="class weights", columns="split seed", values=["best threshold", "OOF cost per 1,000 ($)"])
                 .loc[list(weight_options)])
print("(e) Stage 1 repeated on two other 70/30 splits (fully grown trees, single 5-fold OOF). Cheapest configuration per split:",
      {seed: split_check[("OOF cost per 1,000 ($)", seed)].idxmin() for seed in [2, 3]})
split_check.style.format({c: ("{:.2f}" if c[0] == "best threshold" else "{:,.0f}") for c in split_check.columns})
""")

md(r"""
**Observations - model and threshold selection:**
- On repeated out-of-fold predictions the **unweighted forest on all 27 inputs has the lowest expected cost**, about \$317,000 per 1,000 applicants. Removing all occupation information (the five occupation indicators and the occupation-missing flag) costs about 10% more (\$351,000), outside one standard error. Occupation carries real signal, so removing it is a policy choice with a measurable price, not a free one. The 12-input version costs about a fifth more (\$378,000): occupation, loan purpose and the minor missing flags barely registered at the 0.5 threshold. Together, however, they give a measurable gain at the cost-optimal operating point. As a result, neither simpler model is within one standard error, and we choose neither.
- The recall-tuned grid winner is far worse (\$490,000) once precision enters the cost. This shows that recall-only tuning over-shoots. We scored the bagged trees, the balanced logistic regression and the recall-tuned decision tree the same way, at their own best thresholds. All three cost more than any fully grown forest (\$390,000, \$550,000 and \$607,000, see the table). The technique choice therefore holds on the chosen yardstick as well as on ranking quality.
- The cost-minimising threshold is **0.15**: flag every applicant whose score exceeds 0.15 (an estimated default risk of roughly one in five, see the calibration check). It stays at 0.15 for any cost ratio between 3:1 and 6:1. At 2:1 it would move to 0.20. It falls to 0.10 once a missed defaulter costs about eight times a wrongly declined applicant. The choice is stable across these assumptions. For a perfectly calibrated score the textbook break-even at the stated costs would be \$2,000 / (\$9,000 + \$2,000) = 0.18. The forest's optimum sits a little below it because its scores understate risk in the decision range, as the calibration check shows.
- **Threshold tuning lowers the out-of-fold expected cost.** On the same out-of-fold predictions at the default 0.5 threshold, the unweighted forest has recall 0.714 and precision 0.825. Its expected cost is \$574,545 per 1,000 applicants. At 0.15 it has recall 0.937, precision 0.647 and an expected cost of \$317,354. That is 45% lower, and we measured it on the training rows only.
- **Robustness of the choice.** A finer 0.01 grid gives the same threshold (0.15, with 0.16 within \$500 of it). The paired fold-by-fold comparison with the 0.2/0.8 forest shows that the two are within noise. The mean difference is about \$4,000 per 1,000 applicants, with a paired standard error of about \$5,000. On two other 70/30 splits the unweighted forest is again the cheapest configuration, and the weighted forests are again within noise of it. The choice is therefore not an artefact of this split.
- **Calibration.** The final forest's out-of-fold scores rank applicants well (Brier score 0.062 against 0.160 for the base rate) and rise broadly with the observed default rate. There is one small dip between the 0.2-0.3 and 0.3-0.4 bands. In the decision range the scores understate the default rate: applicants scored 0.15-0.20 defaulted about 23% of the time, and those scored 0.20-0.30 about 40%. The class-weighted forest's scores are much further from the observed rates (applicants it scored 0.15-0.20 defaulted only 7% of the time). That is the concrete reason an unweighted score is easier to explain and govern. Therefore, read a score of 0.15 as "estimated default risk of roughly one in five", not exactly 15%. We list probability calibration under further analysis.
- **What the test set can and cannot show.** We fixed the imputation statistics and the 12-feature set on all training rows before the repeated cross-validation, which can only favour the candidates that lost. We also chose the configuration and the threshold on the same out-of-fold predictions. The single test evaluation below is therefore a consistency check of the chosen model's performance. It is not evidence for the choice between configurations. Its cost comes with a standard error of about \$28,000 per 1,000 applicants, wider than the differences between the fully grown configurations. The paired fold-by-fold check in the robustness cell is the right evidence for those differences.
""")

code(r"""
# The final solution written out end to end, so that every step and every input to the scoring model is explicit
flag_cols = [c for c in final_cols if c.endswith("_missing")]
dummy_cols = [c for c in final_cols if c.startswith(("REASON_", "JOB_")) and c not in flag_cols]
raw_cols = [c for c in final_cols if c not in flag_cols + dummy_cols]
assert len(final_cols) == len(raw_cols) + len(flag_cols) + len(dummy_cols) == 27
assert final_cols == list(X_train.columns), "the final model uses every prepared column, in this order"

print(f"FINAL PIPELINE  (every statistic below was learned on the {len(train_idx):,} training rows only)")
print(f"1. Raw inputs kept as numbers ({len(raw_cols)}):", raw_cols)
print(f"2. Missing-value flags, 1 if the field was blank ({len(flag_cols)}):", flag_cols)
print("3. Imputation of blanks - training-row medians:", {k: round(v, 2) for k, v in hm.loc[train_idx, num_cols].median().items()})
print("                          training-row modes  :", {c: hm.loc[train_idx, c].mode()[0] for c in ["REASON", "JOB"]})
print(f"4. One-hot encoding of REASON and JOB, first level dropped ({len(dummy_cols)}):", dummy_cols)
print("5. No outlier capping and no scaling: tree ensembles are unaffected by monotone transformations of an input")
print("6. Model:", type(final_model).__name__, {k: v for k, v in final_model.get_params().items()
      if k in ["n_estimators", "class_weight", "min_samples_leaf", "max_features", "max_depth", "random_state"]})
print(f"7. Model inputs, in order ({len(final_cols)}):", final_cols)
print(f"8. Decision rule: flag the applicant when the predicted default probability exceeds {FINAL_THRESHOLD:.2f}")
print(f"9. Input-set reduction. Rule: keep the smallest input set whose mean out-of-fold cost is within one standard error "
      f"(${one_se:,.0f}) of the lowest. Input sets tested with the selected configuration:")
reduced_ok = []
for name, (_, cols) in candidates.items():
    if not name.startswith(f"RF class weights {best_weights}, leaf {best_leaf},"):
        continue
    cost = selection.loc[name, COST_COL]
    removed = [c for c in final_cols if c not in cols]
    status = "selected" if name == winner else ("within one standard error" if cost <= lowest + one_se else "outside one standard error")
    if removed and cost <= lowest + one_se:
        reduced_ok.append(name)
    print(f"   {len(cols)} inputs: ${cost:,.0f} per 1,000 applicants ({status})" + (f"; removes {removed}" if removed else ""))
    if removed and len(cols) < len(removed):
        print(f"      keeps {cols}")
print("   No reduced set is within one standard error, so the final model keeps all 27 inputs." if not reduced_ok
      else f"   Reduced sets within one standard error: {reduced_ok}")
""")

code(r"""
# Fit the selected model on all training rows and score the test set ONCE, at the selected threshold and at 0.5 for reference
final_model.fit(X_train[final_cols], y_train)
proba_test = final_model.predict_proba(X_test[final_cols])[:, 1]
final_pred = (proba_test > FINAL_THRESHOLD).astype(int)

print(f"Final model: {winner} at threshold {FINAL_THRESHOLD:.2f} - TEST SET")
metrics_score(y_test, final_pred, title=f"Final model - test (threshold {FINAL_THRESHOLD:.2f})")
print(f"Test ROC-AUC: {roc_auc_score(y_test, proba_test):.3f}")

cost_per_applicant = np.where((y_test == 1) & (final_pred == 0), COST_FN, np.where((y_test == 0) & (final_pred == 1), COST_FP, 0.0))
print(f"Test expected cost per 1,000 applicants: ${1000 * cost_per_applicant.mean():,.0f} "
      f"(standard error about ${1000 * cost_per_applicant.std(ddof=1) / np.sqrt(len(y_test)):,.0f}); "
      f"out-of-fold estimate ${oof[winner]['best']['expected_cost_per_1000_$']:,.0f}")

test_tbl = cost_table(y_test, proba_test, thresholds=np.array([FINAL_THRESHOLD, 0.5]))
test_tbl.style.format({"recall": "{:.3f}", "precision": "{:.3f}", "accuracy": "{:.3f}", "missed_defaulters_per_1000": "{:.1f}",
                       "good_customers_declined_per_1000": "{:.1f}", "expected_cost_per_1000_$": "{:,.0f}"})
""")

code(r"""
# What the proposed three-band policy would mean in practice (test set): approve below a score of 0.10,
# refer 0.10 - 0.25 to an underwriter, decline above 0.25
bands = pd.cut(proba_test, [-0.01, 0.10, 0.25, 1.0],
               labels=["approve (score <= 0.10)", "refer to underwriter (0.10 - 0.25)", "decline (score > 0.25)"])
band_tbl = (pd.DataFrame({"band": bands, "defaulted": y_test.values}).groupby("band", observed=True)
              .agg(applicants=("defaulted", "size"), defaulters=("defaulted", "sum"), observed_default_rate=("defaulted", "mean")))
band_tbl["share_of_applicants"] = band_tbl["applicants"] / len(y_test)
band_tbl["share_of_defaulters"] = band_tbl["defaulters"] / y_test.sum()
band_tbl["per_1000_applicants"] = 1000 * band_tbl["share_of_applicants"]
band_tbl.style.format({"observed_default_rate": "{:.1%}", "share_of_applicants": "{:.1%}", "share_of_defaulters": "{:.1%}", "per_1000_applicants": "{:.0f}"})
""")

code(r"""
# Where does the performance come from? The final model on the test applicants with a recorded debt-to-income ratio and on
# those without one (the group that mandatory income verification, the first process change recommended, will shrink)
rows = []
for label, mask in [("ratio recorded", X_test["DEBTINC_missing"] == 0), ("ratio missing", X_test["DEBTINC_missing"] == 1)]:
    yt, pt, pp = y_test[mask], final_pred[mask.values], proba_test[mask.values]
    tn, fp, fn, tp = confusion_matrix(yt, pt).ravel()
    rows.append({"group": label, "applicants": int(mask.sum()), "share_of_applicants": mask.mean(), "default_rate": yt.mean(),
                 "share_of_all_defaulters": yt.sum() / y_test.sum(), "flagged": pt.mean(), "recall": tp / (tp + fn),
                 "precision": tp / (tp + fp), "ROC-AUC": roc_auc_score(yt, pp)})
pd.DataFrame(rows).set_index("group").style.format({"share_of_applicants": "{:.1%}", "default_rate": "{:.1%}", "share_of_all_defaulters": "{:.1%}",
                                                     "flagged": "{:.1%}", "recall": "{:.3f}", "precision": "{:.3f}", "ROC-AUC": "{:.3f}"})
""")

md(r"""
**Observations - final model on unseen applicants:**
- At the chosen 0.15 threshold the forest catches about **93% of defaulters** on the test set with about **68% precision** and 90% accuracy. Per 1,000 applicants that is roughly 185 of 200 defaulters flagged in advance, about 15 missed and about 87 good applicants flagged.
- At the conventional 0.5 threshold the same forest would catch only about 69% of defaulters (with 84% precision). It would miss about 63 defaulters per 1,000 instead of 15, and it would decline about 26 good applicants instead of 87. Under the stated costs the lower threshold halves the expected cost of credit errors (about \$0.30 million vs \$0.62 million per 1,000 applicants).
- The test numbers are consistent with the out-of-fold estimates (recall 93% vs 94%, precision 68% vs 65%, cost \$304,000 ± \$28,000 vs \$317,000 per 1,000). The chosen model performs on unseen applicants as the training-based estimate said it would. As we noted above, one test evaluation cannot adjudicate between the fully grown configurations, which differed by far less than that standard error. That choice rests on the out-of-fold comparison.
- **Where the performance comes from.** Two thirds of all defaulters sit in the fifth of applicants with no recorded debt-to-income ratio. The model flags virtually all of that group (96%), catching 98% of its defaulters at 64% precision. On the four fifths with a recorded ratio it is a genuinely selective scorer. It flags 9% of them and catches 83% of their defaulters at 80% precision (ROC-AUC 0.97).
- Mandatory income verification, the first process change we recommend, will shrink the missing-ratio group. Before go-live, the bank must test the model on the historical applicants with a recorded ratio, and refit it if necessary. The model's behaviour on those applicants is the better guide to what to expect. Re-training on newly verified outcomes needs 12 months or more of repayment data.
- **The three-band policy in numbers.** Under the bands the bank would approve about 69% of applicants (about 690 per 1,000) automatically, with an observed default rate of about 1%. It would refer about 7% (about 73 per 1,000) to an underwriter. About one in four of this group defaulted. It would decline about 24% (about 235 per 1,000). In this group 74% defaulted, and the group holds 87% of all defaulters.
- The shares match the out-of-fold rows (66% / 9% / 25%), so we did not tune the bands to the test set. The edges 0.10 and 0.25 are round numbers around the threshold. We set them beforehand, roughly where the out-of-fold cost is 10-20% above its minimum. The bank is to tune them to underwriting capacity in the shadow period.
- Overall the model flags about 27% of applicants. That is an approval rate of about 73% on a population the bank approves in full today. The 0.5 threshold would flag 16%. The referral band is small enough to work by hand, and it is where the model is least certain.
- All performance and cost figures in this notebook are for the single 0.15 threshold. The bands are the operating procedure around it. Whatever an underwriter approves inside the referral band trades some of the modelled benefit for a human check. Under the bands the share of defaulters caught lies between about 87% and 96%. The low end holds if the underwriter approves every referral. The high end holds if the underwriter declines every referral.
""")

code(r"""
# What the final model relies on: impurity-based importance of the fitted forest, and permutation importance
# (drop in test ROC-AUC when a column is shuffled), which does not favour variables with many split points.
# The test set is used here for interpretation only; no choice is made from it.
mdi = pd.Series(final_model.feature_importances_, index=final_cols).sort_values(ascending=False)
perm = permutation_importance(final_model, X_test[final_cols], y_test, scoring="roc_auc", n_repeats=5,
                              random_state=RANDOM_STATE, n_jobs=-1)
perm_imp = pd.Series(perm.importances_mean, index=final_cols).sort_values(ascending=False)

fig, axes = plt.subplots(1, 2, figsize=(16, 6))
sns.barplot(x=mdi.values[:12], y=mdi.index[:12], color="#4C72B0", ax=axes[0])
axes[0].set_title("Final model - impurity-based importance (top 12)"); axes[0].set_xlabel("share of split power")
sns.barplot(x=perm_imp.values[:12], y=perm_imp.index[:12], color="#C44E52", ax=axes[1])
axes[1].set_title("Final model - permutation importance on test (drop in ROC-AUC, top 12)"); axes[1].set_xlabel("mean drop in ROC-AUC")
plt.tight_layout(); plt.show()

pd.DataFrame({"impurity_importance": mdi.round(3), "permutation_importance_auc_drop": perm_imp.round(4)}).sort_values("impurity_importance", ascending=False).head(12)
""")

md(r"""
**Insights - what the final model relies on:**
- Both views agree on the core drivers. These are the **debt-to-income ratio and its missing flag, the number of delinquent credit lines and the age of the credit history**. Together they carry about half of the forest's split power (0.49). They also produce the four largest drops in ranking quality when the permutation test shuffles them.
- Impurity importance spreads the remaining weight over the property value, loan and mortgage amounts, the number of credit lines and job tenure. These are continuous variables with many split points. Permutation importance ranks `DELINQ` first, i.e. repayment behaviour, and gives the amounts less weight. Occupation, loan purpose and the minor missing flags each matter little on their own. But, as the selection table showed, together they give a measurable gain at the cost-optimal threshold.
""")

md(r"""
#### An explanation layer that follows the forest: a surrogate decision tree

The ECOA requires a specific reason for each adverse decision. A forest of 200 trees cannot be read directly, so we fit a **surrogate decision tree to the forest's own decisions**. The target is the forest's flag / do-not-flag outcome at the 0.15 threshold, not the original labels.

A fully grown forest reproduces its training labels almost perfectly. As a result, its in-sample decisions would teach the surrogate the labels rather than the forest's behaviour on new applicants. We therefore fit the surrogate to the forest's **out-of-fold decisions** on the training rows (the repeated-CV scores above). We compare its agreement with the forest's actual decisions on the test applicants, its *fidelity*, with the trivial baseline of never flagging anyone. We summarise the agreement with Cohen's kappa.
""")

code(r"""
# The surrogate is fitted to the forest's OUT-OF-FOLD decisions on the training rows: a fully grown forest reproduces its
# training labels almost perfectly, so its in-sample decisions would teach the surrogate the labels, not the forest's behaviour
# on applicants it has not seen.
forest_decision_oof = (oof[winner]["probas"][0] > FINAL_THRESHOLD).astype(int)
forest_decision_insample = (final_model.predict_proba(X_train[final_cols])[:, 1] > FINAL_THRESHOLD).astype(int)
forest_decision_test = final_pred
print(f"In-sample decisions agree with the training labels on {(forest_decision_insample == y_train.values).mean():.1%} of rows "
      f"(flag rate {forest_decision_insample.mean():.1%}); out-of-fold flag rate {forest_decision_oof.mean():.1%}; test flag rate {forest_decision_test.mean():.1%}.")
print(f"Baseline: a rule that never flags anyone agrees with the forest's test decisions {1 - forest_decision_test.mean():.1%} of the time.\n")

fidelity, kappa = {}, {}
for target_name, target in [("out-of-fold decisions", forest_decision_oof), ("in-sample decisions", forest_decision_insample)]:
    for depth in [3, 4, 5]:
        sur = DecisionTreeClassifier(max_depth=depth, min_samples_leaf=20, random_state=RANDOM_STATE).fit(X_train[final_cols], target)
        pred = sur.predict(X_test[final_cols])
        fidelity[(target_name, depth)] = (pred == forest_decision_test).mean()
        kappa[(target_name, depth)] = cohen_kappa_score(forest_decision_test, pred)
print("Agreement with the forest's test decisions (fidelity) and Cohen's kappa, by surrogate target and depth:")
for k in fidelity:
    print(f"  {k[0]:22s} depth {k[1]}: {fidelity[k]:.1%} (kappa {kappa[k]:.2f})")

surrogate = DecisionTreeClassifier(max_depth=4, min_samples_leaf=20, random_state=RANDOM_STATE).fit(X_train[final_cols], forest_decision_oof)
print(f"\nSurrogate tree (depth 4, fitted to the out-of-fold decisions) reproduces {fidelity[('out-of-fold decisions', 4)]:.1%} "
      f"of the forest's decisions on unseen applicants.\n")
print(export_text(surrogate, feature_names=final_cols, max_depth=4, show_weights=False))
""")

md(r"""
**Insights - the surrogate tree:**
- Fitted to the forest's out-of-fold decisions, a four-level tree reproduces about **93% of the forest's decisions** on unseen applicants (kappa 0.82). Depths 3 to 5 agree within half a point. A rule that never flags anyone reaches 73%. Fitted to the forest's in-sample decisions instead, the tree would reach only about 90%, because those decisions are almost identical to the training labels. The out-of-fold target is what makes the surrogate describe the scoring engine rather than the training data.
- The rules are short, and they are the same drivers the EDA and the stand-alone tree found: *Is the debt-to-income ratio missing? Then flag, whatever the credit history. If it is recorded, is it above about 44%? Then flag. At or below 44%, flag only when there is at least one delinquent credit line together with at least one major derogatory report. Otherwise clear.* (Credit-history length and job tenure appear as splits inside the "ratio missing" branch, but the tree flags every applicant on that branch.) The bank can therefore tell a flagged applicant which of these conditions applied to them.
- The surrogate does not reproduce roughly 7% of decisions. Also, each adverse-action notice must give the reasons for that applicant. So the bank must build per-applicant risk drivers from the forest itself (for example SHAP values) in the first two months, before the shadow run. These drivers give the reason for each decline, including the automatic declines above 0.25. The surrogate rules give the plain-language summary of how the model decides.
""")

md(r"""
#### Do the EDA drivers remain significant after modelling?

The table compares each EDA driver with its weight in the three model types. EDA figures compare defaulters with repayers. Odds ratios come from the balanced logistic regression. 'Top splits' means the first three levels of the tuned tree and the surrogate tree. Importances come from the final forest.

| Variable | EDA evidence | Logistic regression odds ratio | Top splits | Final forest: impurity share / permutation drop | Remains significant? |
|---|---|---|---|---|---|
| DEBTINC_missing | 62.0% default when missing, 8.6% when present | 13.1 | First split of both trees | 18.6% / 0.031 | Yes |
| DEBTINC | Median 38.1% vs 34.5% (p < 0.001). 87% to 100% default above 45% | 1.82 per SD | Next split, at about 44%, in both trees | 14.0% / 0.033 | Yes |
| DELINQ | 14% default with 0 lines, 45% with 2 | 2.42 per SD | Splits right after the ratio in both trees | 8.0% / 0.038 (largest drop) | Yes |
| CLAGE | Median 133 vs 180 months (p < 0.001) | 0.62 per SD (protective) | Splits in both trees | 8.6% / 0.029 | Yes |
| DEROG | 17% default with 0 reports, 51% with 2 | 1.49 per SD | Splits after DELINQ in both trees | 4.4% / 0.010 | Yes, but weaker in the forest |
| VALUE_missing | 93.8% default when missing (112 applicants) | 44.6 (largest) | No | 2.6% / 0.011 | Strong in the linear model, weak in the forest. Only 1.9% of applicants have it |
| NINQ | 16% default with 0 inquiries, about 46% with 5 or more | 1.19 per SD | No | 3.4% / 0.012 | Weakly |
| LOAN | Median \$14,900 vs \$16,900 (p < 0.001). 57% default under \$5,000 | 0.995 (no linear effect) | No | 6.7% / 0.014 | Moderately, in the forest only (a non-linear effect) |
| VALUE, MORTDUE | Significant (p < 0.001) but small gaps. Correlation 0.88 | 1.11 and 0.88 per SD (opposite signs) | No | 6.9% and 6.4% / 0.012 and 0.011 | Weakly. They carry the same information |
| JOB | Chi-square p < 0.001. Sales 35%, Office 13% | Sales 3.30, Office 0.56 | No | Each indicator outside the top 12 by impurity | Yes, as a group. Without it the out-of-fold cost rises by about 10% (\$351,000 vs \$317,000) |
| REASON | Chi-square p = 0.005. 22.2% vs 19.0% | 1.16 | No | Outside the top 12 by impurity | No, not on its own |

**Answer.** Yes, the main EDA drivers remain significant after modelling. The debt-to-income ratio, its missing flag, delinquent lines and credit-history length are strong in every model. In the final forest they carry 49% of the split power and give the four largest permutation drops. Some EDA findings weaken after modelling. Loan purpose is significant in the EDA (p = 0.005), but it adds little to any model. The loan, property and mortgage amounts differ significantly, but the linear model gives them little weight, and permutation ranks them below the four core drivers. A missing valuation has the largest linear odds ratio (44.6). It ranks only 12th in the forest, because only 112 applicants have it. Occupation remains significant only as a group.
""")

code(r"""
# Indicative business impact per 1,000 applicants (test set): current process vs each technique at 0.5, and the final model
def impact_per_1000(y_true, y_pred):
    '''Return caught, missed and wrongly declined applicants and the expected cost, per 1,000 applicants.'''
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    n = len(y_true)
    return {"defaulters_caught_per_1000": round(1000 * tp / n, 1),
            "defaulters_missed_per_1000": round(1000 * fn / n, 1),
            "good_customers_declined_per_1000": round(1000 * fp / n, 1),
            "expected_cost_per_1000_$": round(1000 * (fn * COST_FN + fp * COST_FP) / n)}

baseline_cost = round(1000 * y_test.mean() * COST_FN)   # today's outcome on these (approved) applicants: every defaulter is missed
impact = pd.DataFrame({
    "Current process (all of these applicants were approved)": {"defaulters_caught_per_1000": 0.0,
                                      "defaulters_missed_per_1000": round(1000 * y_test.mean(), 1),
                                      "good_customers_declined_per_1000": 0.0,
                                      "expected_cost_per_1000_$": baseline_cost},
    "Logistic Regression (balanced), threshold 0.5": impact_per_1000(y_test_lr, lr_bal.predict(X_test_lr_s)),
    "Decision Tree (tuned), threshold 0.5": impact_per_1000(y_test, dt_tuned.predict(X_test)),
    "Random Forest (class weights), threshold 0.5": impact_per_1000(y_test, rf_cw.predict(X_test)),
    "Final model (unweighted forest), threshold 0.5": impact_per_1000(y_test, (proba_test > 0.5).astype(int)),
    f"Final model, threshold {FINAL_THRESHOLD:.2f}": impact_per_1000(y_test, final_pred),
}).T
impact["cost_reduction_vs_current_%"] = ((1 - impact["expected_cost_per_1000_$"] / baseline_cost) * 100).round(1)
impact
""")

md(r"""
**Observations - indicative benefit:**
- Against today's outcome on these applicants (all approved, 20% defaulted), every model removes most of the default-related cost. At the 0.5 threshold the class-weighted forest cuts the indicative expected cost per 1,000 applicants by roughly 72%. The logistic regression cuts it by about 68%, and the tuned tree and the unweighted forest by about 66% each. The tree and the linear model decline many more good applicants (about 145 and 102 per 1,000, against 46 for the class-weighted forest). The unweighted forest at 0.5 is precise but misses too many defaulters (63 per 1,000). Moving its threshold is what makes it the cheapest option.
- At its chosen threshold the final model cuts the cost by about 83%. Per 1,000 applicants it catches about 185 of 200 defaulters and flags about 87 good applicants at the 0.15 threshold. Under the approve / refer / decline bands, the bank declines about 62 good applicants per 1,000 automatically and refers about 55.
- These figures use round-number assumptions. They also use the test applicants, all of whom the old process approved. The bank's finance team should replace the assumptions with actual loss-given-default and margin figures. The shadow period will show how the model behaves on the applicants the old process declined.
""")

md(r"""
**2. Refined insights:**
- What are the most meaningful insights relevant to the problem?
""")

md(r"""
1. **Affordability, and whether the bank can check it, decides most outcomes.** The missing flag of the debt-to-income ratio (`DEBTINC_missing`) is the first split of the tuned tree and of the surrogate tree. This flag and the ratio itself have the two largest impurity importances in the recall-tuned forest (0.287 and 0.244). They also lead in the final forest (0.186 and 0.140). In the linear model the flag has the second-largest odds ratio (13.1), after a missing valuation (44.6). An applicant with no verifiable ratio defaulted 62% of the time. One with a ratio above 45% defaulted 87% to 100% of the time. On the historical loans, these two checks alone flag a large share of the defaults.

2. **Past repayment behaviour is the next most important predictor.** Delinquent credit lines, major derogatory reports and recent credit inquiries all raise default risk as they increase. The linear model agrees: all three raise the odds of default (2.42, 1.49 and 1.19 per standard deviation). The tuned tree and the surrogate tree split on delinquent lines and derogatory reports near the top. In the final forest, delinquent lines give the largest permutation drop (0.038). But derogatory reports (0.010) and inquiries (0.012) give smaller drops than the loan amount (0.014).

3. **Credit history length protects.** Applicants with 20+ years of credit history default about 10% of the time versus 44% for those with under 5 years.

4. **Loan size, property value and mortgage balance are secondary.** Their differences between defaulters and repayers are statistically significant but small. They matter in combination (small loans are riskier, missing valuations are almost always bad) rather than on their own. The 0.88 correlation between `VALUE` and `MORTDUE` means they largely carry the same information.

5. **Occupation and loan purpose matter little on their own but are not worthless.** They barely move performance at the 0.5 threshold. Yet removing them (and nine minor missing flags) raised the out-of-fold expected cost of the final model by about a fifth. Removing occupation alone raised it by about 10%. The fair-lending review should clear their use. The 21-input model without occupation is the fallback.

6. **The main drivers remain significant after modelling.** The linear coefficients, the tree's rules, the forest's importances and the surrogate tree all give large weight to the same four drivers. The table "Do the EDA drivers remain significant after modelling?" shows the evidence. Loan purpose does not remain significant on its own. Occupation remains significant only as a group. This agreement gives confidence that the signal is real and stable.

7. **The threshold mattered as much as the choice of algorithm.** At the 0.5 threshold, class weights improved recall by about 23 points for the logistic regression and 9 for the forest. Averaging trees (bagging) mainly bought precision and ranking quality. When we move the threshold of the final forest from 0.5 to 0.15, the out-of-fold cost falls from about \$575,000 to \$317,000 per 1,000 applicants. At each model's own best threshold, the forest still costs far less than the logistic regression (\$317,000 vs \$550,000). Once we chose the threshold on cost, the class weights were no longer necessary.

8. **The decision threshold is a business dial, and the bank should set it on training data.** With the forest's strong ranking ability (ROC-AUC 0.96) the bank can move recall between about 70% and 94% by changing the threshold. We chose the cost-minimising threshold of 0.15 on repeated out-of-fold predictions. It catches about 93% of defaulters with 68% precision on unseen applicants. It is stable to changes in the cost assumptions, to a finer threshold grid and to the choice of train/test split. It sits just below the textbook break-even (0.18) because the forest's scores understate risk in the decision range.
""")

md(r"""
**3. Proposal for the final solution design:**
- What model do you propose to be adopted? Why is this the best solution to adopt?
""")

md(r"""
### Proposed solution: a Random Forest scoring engine with a cost-based decision threshold, explained by a surrogate decision tree

**Is the model ready for production? Yes, with conditions.**
- *Evidence.* On the 1,788 unseen test applicants the model catches 92.7% of defaulters at 68.1% precision (ROC-AUC 0.963). This agrees with the out-of-fold estimate (recall 94%, precision 65%, cost \$317,000 against \$304,000 per 1,000 applicants on the test set). Under the indicative costs it cuts the cost of credit errors by about 83%.
- *Limits.* The data holds only loans that the old process approved. Two thirds of the defaulters have no recorded debt-to-income ratio, and mandatory income verification will shrink that group. The cost figures are indicative.
- *Verdict.* The performance is good enough for production. But the model must not affect real decisions until the bank meets five conditions. It runs the model in shadow mode on all applications for one to two months. It builds the per-applicant risk drivers. It passes the fairness review. It re-derives the 0.15 threshold from its own loss and margin figures. It tests the model on past applicants with a recorded ratio (83% recall, 80% precision on the test set). The other guard-rails apply after go-live.

**Model specification**
- `RandomForestClassifier` with 200 fully grown trees and **no class weights**. The configuration search showed that class weights add nothing once we choose the threshold on cost. The 0.3/0.7 and 0.2/0.8 weightings lie within one standard error of the unweighted forest. The balanced and 0.1/0.9 weightings cost about \$13,000 and \$27,000 more per 1,000 applicants. We train the forest on the untreated data with the 27 model inputs listed in the final-pipeline cell. These are the ten financial attributes, the eleven missing-value flags and the six occupation and loan-purpose indicators. Pre-processing: a missing flag per column, plus median/mode imputation learned on the training rows. There is no outlier capping and no scaling.
- **Decision threshold 0.15** instead of the default 0.5. We chose it by minimising the indicative expected cost on repeated out-of-fold predictions of the training rows. The bank re-derives it with its own loss-given-default and margin figures before go-live. The choice was stable for cost ratios between 3:1 and 6:1 and on two other train/test splits. It sits just below the textbook break-even of 0.18 because the forest's scores understate risk in the decision range.
- **Explanation layer:** a surrogate decision tree of depth 4, fitted to the forest's out-of-fold decisions. It reproduces about 93% of them on unseen applicants (73% for never flagging). Per-applicant risk drivers from the forest (for example SHAP values) complete the layer. The bank builds them in the first two months of the project, before the shadow run. They give the reason for each decline, including the automatic declines above 0.25. The surrogate rules give the plain-language summary.
- **Fallback:** the same forest without any occupation information (21 inputs) if the fair-lending review requires it, at about 10% more expected credit-error cost. The 12-input lean model (no occupation, loan purpose or minor flags) costs about a fifth more, and we do not recommend it.

**Why this is the best solution to adopt**
1. **Lowest expected cost of credit errors, chosen without looking at the test set.** It had the lowest expected cost of the fifteen forest configurations and of the eight final candidates in the selection table. That cost was about \$317,000 per 1,000 applicants on repeated out-of-fold predictions. On the test set it then delivered about 93% recall at 68% precision and 90% accuracy, with a ROC-AUC of about 0.96. At their own best thresholds, the other techniques cost about 1.2 to 1.9 times as much. These are the bagged trees (\$390,000), the balanced logistic regression (\$550,000) and the tuned decision tree (\$607,000). The recall-tuned forest buys its recall with too much precision.
2. **Stable.** Averaging hundreds of trees removes the instability of a single tree. The out-of-fold and test results agree. The threshold is insensitive to the cost assumptions over a wide range.
3. **Interpretable enough for ECOA.** The surrogate tree gives a short, faithful rule list. Its conditions are: debt-to-income ratio missing, ratio above about 44%, and (at or below 44%) a delinquent line together with a derogatory report. Per-applicant risk drivers, which the bank builds before the shadow run, give the reason for each decline. Because the forest is unweighted, its score is close to a default rate. In the decision range it understates that rate (applicants scored 0.15-0.20 defaulted about 23% of the time). The 0.15 threshold therefore reads as "refer or decline when the estimated risk is above roughly one in five". That is a plain statement of the bank's risk appetite.
4. **Operationally simple.** The inputs are all fields that the underwriting process already captures. The bank needs no new data to deploy the model. The first process change the analysis recommends (mandatory income and valuation verification) improves the data for every future model.

**How the solution solves the problem**

The design meets the four goals stated in the problem definition.
1. *Catch defaulters early.* Per 1,000 applicants it flags about 185 of 200 defaulters before the money leaves the bank.
2. *Protect good business.* At the 0.15 threshold the model approves about 73% of applicants. It flags about 87 creditworthy applicants per 1,000 (11% of them). Under the approve / refer / decline bands, the bank approves about 69% of applicants automatically. Underwriters review the 7% in the 0.10 to 0.25 band. Under the bands, the bank declines about 62 creditworthy applicants per 1,000 automatically and refers about 55.
3. *Stay interpretable.* The surrogate tree gives the rules. Per-applicant risk drivers give the reason for each decline.
4. *Guide policy.* The same drivers support rules that the bank can use now. Examples are mandatory income and valuation verification and a 45% debt-to-income limit.

Under the indicative costs, the cost of credit errors falls from about \$1.8 million to about \$0.3 million per 1,000 applicants (about 83% less).

**Why not the alternatives**
- *Logistic regression (balanced):* fully transparent, but at a similar recall it mis-classifies many more good applicants (precision 61% vs 77% at the 0.5 threshold). The reason is that it cannot represent the threshold effects on the raw inputs.
- *Tuned decision tree:* highest recall at 0.5 (82%), but a precision of 53% means too much lost business. It serves better as a rule summary than as the scorer.
- *Bagged trees:* a clear improvement over a single tree (precision 83%, ROC-AUC 0.95). But it misses a third of defaulters, and class weights do not move its recall. The forest dominates it on every metric that matters.
- *Class-weighted random forests (0.2/0.8 or 0.3/0.7):* the 0.2/0.8 forest has the best balance at the 0.5 threshold. Both lie within one standard error of the final model once we tune their own thresholds (0.25 and 0.20). The balanced weighting is somewhat worse, and the 0.1/0.9 weighting is clearly worse. We preferred the unweighted forest under the pre-stated rule as the simplest configuration with the lowest mean cost.
- *Recall-tuned random forest:* the cross-validated grid winner on recall, but its constrained trees (at least 10 applicants per leaf) give cruder probabilities. Once precision enters the cost, its expected cost is about half again as high as the final forest's.
- *The forest at the default 0.5 threshold:* best precision (84%), but it misses almost a third of defaulters, which is the costlier error. Moving the threshold to 0.15 is what makes it the final model.

**Guard-rails for adoption**
- Run the model in shadow mode on all applications for one to two months before it goes live. Include the applications the old process would decline, which the training data does not cover. Introduce mandatory income and valuation verification alongside the shadow period. Verification removes the missing-ratio signal that the current model relies on most. So, before go-live, test the model on the historical applicants with a recorded ratio, and refit it if necessary. On those applicants it already catches 83% of defaulters at 80% precision. Re-training on the outcomes of newly verified applicants, and reject inference for declined applicants, need 12 months or more of repayment data.
- Monitor the approval rate and the score distribution monthly, and recall and precision as repayment outcomes arrive. Re-train at least yearly or when the default rate drifts. Re-derive the threshold whenever the cost assumptions change.
- Run a fairness review on the final model (approval rates and error rates across protected groups) before go-live. Keep the 21-input fallback (no occupation information) ready if you have to remove occupation.
- Have a human underwriter review applicants in the uncertain band around the threshold during the first months. That band is a predicted probability between roughly 0.10 and 0.25. On the test set that band holds about 7% of applicants with a default rate of about 24%. About 69% are clear approvals (about 1% default) and about 24% clear declines (74% default).
""")

md(r"""
---
### Summary of answers to the leading questions

| # | Question | Answer |
|---|---|---|
| 1 | Range of LOAN | \$1,100 to \$89,900. Median \$16,300. Right-skewed |
| 2 | Distribution of YOJ | Right-skewed. The most common values are 0-5 years (41%). Median 7, tail to 41 |
| 3 | Unique categories in REASON | 2 (DebtCon 69%, HomeImp 31%) |
| 4 | Most common JOB | "Other" (42%), then ProfExe (22%) and Office (17%) |
| 5 | REASON vs default | Weak but statistically significant relationship: HomeImp 22.2% vs DebtCon 19.0% (chi-square p = 0.005) |
| 6 | LOAN for defaulters vs repayers | Defaulters borrow less (median \$14,900 vs \$16,900, Mann-Whitney p < 0.001). Loans under \$5,000 default 57% of the time |
| 7 | VALUE vs default | Very weak correlation (-0.03). But a *missing* valuation defaults 94% of the time |
| 8 | MORTDUE for defaulters vs repayers | Lower for defaulters (median \$60,279 vs \$66,839, Mann-Whitney p < 0.001) but a small difference in practice |
""")

nb["cells"] = cells
nb["metadata"] = {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python"},
}
out = "notebooks/Loan_Default_Prediction_Capstone.ipynb"
nbf.write(nb, out)
print(f"Wrote {out} with {len(cells)} cells")
