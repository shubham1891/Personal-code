"""Completes the Low-Code learner notebook template for the Loan Default Prediction capstone.

The official template (Capstone_Project - Reference_Notebook_Loan_Default_Prediction_Low_Code.ipynb) is kept
cell for cell; every "Remove ___ and complete the code" blank is filled, every "Insights ____" cell is written,
the "as done above, analyze the other variables" notes get the extra cells they ask for, and the few template
cells that no longer run on current seaborn are repaired. Pre-processing, seeds and grids match the full-code
notebook, so both notebooks report the same numbers.

Run from the repository root:  python3 scripts/build_lowcode_notebook.py
Then:                          python3 scripts/run_notebook.py notebooks/Loan_Default_Prediction_Low_Code.ipynb
"""
import copy
from pathlib import Path

import nbformat as nbf

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = Path("/root/.claude/uploads/3d960908-7bd5-5726-97b7-6518804689b8/16ab844c-Capstone_Project_-_Reference_Notebook_Loan_Default_Prediction_Low_Code.ipynb")
OUT = ROOT / "notebooks" / "Loan_Default_Prediction_Low_Code.ipynb"

nb = nbf.read(TEMPLATE, as_version=4)
cells = nb.cells
assert len(cells) == 171, len(cells)

replace = {}   # original index -> new source (same cell type)
after = {}     # original index -> list of (type, source) cells to insert after it


def md(i, text):
    replace[i] = ("markdown", text.strip("\n"))


def code(i, text):
    replace[i] = ("code", text.strip("\n"))


def add_after(i, kind, text):
    after.setdefault(i, []).append((kind, text.strip("\n")))


# ----------------------------------------------------------------------------- problem definition
md(1, r"""
## **Problem Definition**

### **The Context:**

 - Why is this problem important to solve?

A large share of a retail bank's profit comes from the interest it earns on home loans and home equity lines of credit. The single biggest threat to that profit is the applicant who does not repay. Every loan that becomes a non-performing asset cancels the interest earned on many good loans. Today an underwriter studies each application by hand and decides whether to approve it. This process is slow, expensive, inconsistent between underwriters and open to human error and bias. Earlier attempts to automate it used hand-written heuristics.

In the bank's own recent book of 5,960 home equity loans, **1,189 (19.9%) ended in default or serious delinquency**. The current process approved all of them. Those loans averaged about \$16,900, so the bank put roughly \$20 million of principal at risk. The bank recovered about half through collateral, so it lost roughly \$10 million on this book alone.

A reliable, explainable scoring model cuts those losses. It protects revenue by not declining good applicants unnecessarily. It makes decisions faster and standardises them. It also gives the bank documented reasons for every decision, which the Equal Credit Opportunity Act (ECOA) requires.

### **The objective:**

 - What is the intended goal?

Build a classification model. The model predicts, at application time, whether an applicant is likely to default on a home equity loan. Recommend to the bank which applicant attributes matter most when it approves a loan. In priority order the goals are:

1. Catch as many future defaulters as possible (recall on the default class).
2. Keep the share of wrongly declined good applicants acceptable (precision).
3. Stay interpretable enough to justify every rejection.
4. Identify the attributes that should drive approval policy.

### **The key questions:**

- What are the key questions that need to be answered?

1. What share of past applicants defaulted, and how imbalanced is the problem?
2. Which applicant attributes (debt burden, credit history, loan size, job, loan purpose, property value) separate defaulters from repayers?
3. How should we treat missing information? Is the absence of information itself a risk signal?
4. Which technique (linear vs tree-based vs ensemble) gives the best trade-off between catching defaulters and wrongly rejecting good applicants?
5. What is the right measure of success for this business problem?
6. Which model should the bank adopt, with what settings, and what rules can it communicate to applicants and regulators?

### **The problem formulation**:

- What is it that we are trying to solve using data science?

This is a **supervised binary classification** problem. Each row is a past loan with 12 attributes known at application time and a target `BAD` (1 = defaulted or seriously delinquent, 0 = repaid). We follow these steps:

1. Explore and clean the data.
2. Train a linear model (Logistic Regression) and non-linear models (Decision Tree, Random Forest).
3. Tune them with cross-validated grid search.
4. Compare them on a business-driven metric (recall on defaulters, with precision as the guard-rail).
5. Propose a final solution with the business rules that follow from it.
""")

# ----------------------------------------------------------------------------- data overview
code(7, r"""
hm=pd.read_csv("../data/hmeq.csv")
""")
add_after(8, "markdown", r"""
**Reserve the test set before you fit any statistic.** We compute every statistic that prepares the data (outlier fences, imputation medians and modes, scaling) on the training rows only. We then apply it to all rows, so no information about the test applicants leaks into the models. The split is 70/30, stratified on `BAD`, with a fixed seed.
""")
add_after(8, "code", r"""
train_idx, test_idx = train_test_split(data.index, test_size=0.3, random_state=1, stratify=data['BAD'])
print(f"Training rows: {len(train_idx):,} | Test rows: {len(test_idx):,}")
""")
code(10, r"""
# Display first five rows
data.head()
""")
code(11, r"""
# Display last 5 rows
data.tail()
""")
code(13, r"""
# Check the shape of the data
print(f"The dataset has {data.shape[0]:,} rows and {data.shape[1]} columns")
""")
md(14, r"""
**Insights:** The dataset has 5,960 loans (rows) and 13 columns: the target `BAD` and 12 input attributes. Every row is one home equity loan that the bank approved under its current process.
""")
code(16, r"""
# Check info of the data
data.info()
""")
md(17, r"""
**Insights:**
- `BAD` and `LOAN` are integers with no gaps. `REASON` and `JOB` are text (categorical). The other nine inputs are floats.
- `DEROG`, `DELINQ`, `NINQ` and `CLNO` are stored as floats but are really whole-number counts.
- Every input except `LOAN` has fewer than 5,960 non-null values, so missing values are widespread and we must treat them before modelling.
""")
code(19, r"""
# Analyse missing values - Hint: use isnull() function
data.isnull().sum()
""")
code(20, r"""
# Check the percentage of missing values in the each column.
(data.isnull().sum() / len(data) * 100).round(2).sort_values(ascending=False)
""")
md(21, r"""
**Insights:**
- `DEBTINC` (debt-to-income ratio) is missing in 21.3% of applications, by far the most. It is the single most important affordability measure a lender has, so its absence is suspicious in itself.
- `DEROG` (11.9%), `DELINQ` (9.7%), `MORTDUE` (8.7%), `YOJ` (8.6%) and `NINQ` (8.6%) have moderate gaps. `JOB`, `REASON`, `CLAGE`, `CLNO` and `VALUE` are missing in under 5.2% of rows.
- No column is missing enough to remove it. 44% of rows have at least one blank, so removing rows is not an option either. We will impute values and keep a flag for every imputed cell.
""")
md(22, r"""
### **Think about it:**
- We found the total number of missing values and the percentage of missing values, which is better to consider?
- What can be the limit for % missing values in a column in order to avoid it and what are the challenges associated with filling them and avoiding them?

*The percentage is the better guide because it is independent of the dataset size. 1,267 missing values sounds large, but 21% tells us the column is still mostly populated. A common rule of thumb is to remove a column only when well over half of it is missing (say 60-70%). The gap must also carry no information. Below that share, imputation is preferable.*

*Filling values risks inventing patterns (every imputed row gets the same median). Removing rows or columns discards real applicants. Here, it would also discard the most predictive signal of all: whether the applicant supplied the information at all.*
""")
code(27, r"""
# Changing the data type of object type column to category
for i in cols:
    data[i] = data[i].astype('category')
""")
code(28, r"""
# Checking the info again and the datatype of different variable
data.info()
""")
code(30, r"""
# Analyze the summary statistics for numerical variables
data.describe().T
""")
md(31, r"""
**Insights:**
- `LOAN` ranges from \$1,100 to \$89,900 (median \$16,300, mean \$18,608). It is right-skewed with a tail of large loans. `MORTDUE` (median \$65,019) and `VALUE` (median \$89,236) are also right-skewed. `VALUE` has an extreme maximum of \$855,909.
- `YOJ` has a median of 7 years at the current job. A quarter of applicants have 3 years or less.
- `DEROG` and `DELINQ` are zero for at least 75% of applicants. Their means (0.25 and 0.45) come from a small group with many derogatory reports or delinquent lines.
- `CLAGE` has a median of 173 months (about 14.5 years). The maximum of 1,168 months (97 years) is not plausible.
- `NINQ` has a median of 1 recent inquiry and a maximum of 17. `CLNO` has a median of 20 credit lines and a maximum of 71.
- `DEBTINC` is tightly concentrated (25th-75th percentile 29% to 39%). The maximum of 203% is impossible and a data error.
""")
code(32, r"""
# Check summary for categorical data
data.describe(include=['category']).T
""")
md(33, r"""
**Insights:** `BAD` has 2 levels and the majority level (0, repaid) covers 4,771 of 5,960 loans. `REASON` has 2 levels with debt consolidation the most common (3,928 of 5,708 recorded). `JOB` has 6 levels and "Other" is the most common (2,388 of 5,681 recorded).
""")
code(35, r"""
# Checking the count of unique values in each categorical column
cols_cat= data.select_dtypes(['category'])

for i in cols_cat.columns:
    print('Unique values in',i, 'are :')
    print(data[i].value_counts())
    print('*'*40)
""")
md(36, r"""
**Insights:** 1,189 loans defaulted against 4,771 repaid, an imbalance of roughly 1:4. Debt consolidation (3,928) is more than twice as common as home improvement (1,780). Among occupations "Other" (2,388), ProfExe (1,276) and Office (948) dominate. Sales (109) and Self-employed (193) are small groups, so we should read their default rates with care.
""")
md(37, r"""
### **Think about it**
- The results above gave the absolute count of unique values in each categorical column. Are absolute values a good measure?
- If not, what else can be used? Try implementing that.

*Absolute counts depend on the sample size and make groups hard to compare. Shares (percentages) are easier to interpret. The cell below shows the same information as percentages.*
""")
add_after(37, "code", r"""
# Share of each category (percentage of non-missing values)
for i in cols_cat.columns:
    print('Percentage share of values in', i, ':')
    print((data[i].value_counts(normalize=True) * 100).round(2))
    print('*'*40)
""")

# ----------------------------------------------------------------------------- univariate
code(41, r"""
# While doing uni-variate analysis of numerical variables we want to study their central tendency and dispersion.
# Let us write a function that will help us create boxplot and histogram for any input numerical variable.
# This function takes the numerical column as the input and return the boxplots and histograms for the variable.
# Let us see if this help us write faster and cleaner code.
def histogram_boxplot(feature, figsize=(12,6), bins = None):
    ''' Boxplot and histogram combined
    feature: 1-d feature array
    figsize: size of fig (default (12,6))
    bins: number of bins (default None / auto)
    '''
    f2, (ax_box2, ax_hist2) = plt.subplots(nrows = 2, # Number of rows of the subplot grid= 2
                                           sharex = True, # x-axis will be shared among all subplots
                                           gridspec_kw = {"height_ratios": (.25, .75)},
                                           figsize = figsize
                                           ) # creating the 2 subplots
    sns.boxplot(x=feature, ax=ax_box2, showmeans=True, color='violet') # boxplot will be created and a star will indicate the mean value of the column
    sns.histplot(x=feature, kde=False, ax=ax_hist2, bins=bins if bins else 'auto') # For histogram
    ax_hist2.axvline(np.nanmean(feature), color='green', linestyle='--') # Add mean to the histogram
    ax_hist2.axvline(np.nanmedian(feature), color='black', linestyle='-') # Add median to the histogram
    ax_box2.set(xlabel='')
    f2.suptitle(feature.name)
    plt.show()
""")
md(44, r"""
**Insights:** Loan amounts range from \$1,100 to \$89,900. Half of all loans are below \$16,300 and 75% are below \$23,300. The distribution is right-skewed with a long tail. Loans above about \$41,000 show as outliers on the boxplot. They are genuine large loans rather than data errors, so we keep them for the tree models and cap them only for the linear model.
""")
add_after(45, "code", r"""
# Histogram and boxplot for the remaining numerical variables
for col in ['MORTDUE', 'VALUE', 'YOJ', 'CLAGE', 'CLNO', 'DEBTINC']:
    histogram_boxplot(data[col])
""")
md(46, r"""
**Insights:**
- `MORTDUE` and `VALUE` are right-skewed with most properties between \$50,000 and \$150,000 and a few very expensive ones (VALUE up to \$855,909). Because both describe the same asset they move together (correlation 0.88, see the heatmap below), which matters for the logistic regression.
- `YOJ` is right-skewed: the most common values are 0 to 5 years, the median is 7, and a long tail reaches 41 years.
- `CLAGE` is roughly bell-shaped around 170-180 months with a right tail. A few values above 600 months and a maximum of 1,168 months are not credible.
- `CLNO` is approximately normal around 20 lines.
- `DEBTINC` is concentrated between 25% and 42%. Very few applicants have a recorded ratio above 45%, and the maximum of 203% is impossible. Note that only the 79% of applicants with a recorded ratio appear here.
""")
code(48, r"""
# Function to create barplots that indicate percentage for each category.

def perc_on_bar(plot, feature):
    '''
    plot: the axes returned by sns.countplot
    feature: categorical feature
    the function won't work if a column is passed in hue parameter
    '''

    total = len(feature.dropna()) # length of the column (non-missing values)
    for p in plot.patches:
        percentage = '{:.1f}%'.format(100 * p.get_height()/total) # percentage of each class of the category
        x = p.get_x() + p.get_width() / 2 - 0.05 # width of the plot
        y = p.get_y() + p.get_height()           # height of the plot
        plot.annotate(percentage, (x, y), size = 12) # annotate the percentage

    plt.show() # show the plot
""")
code(50, r"""
#Build barplot for DELINQ

plt.figure(figsize=(15,5))
ax = sns.countplot(x=data["DELINQ"].dropna().astype(int), color='#4C72B0')
perc_on_bar(ax,data["DELINQ"])
""")
md(51, r"""
**Insights:** 78% of applicants with a recorded value have no delinquent credit line. 12% have one, 5% have two, and a small tail have three or more (up to 15). The minority with delinquencies is exactly the group a lender worries about. The bivariate analysis will show how sharply their default rate rises.
""")
add_after(52, "code", r"""
# Bar plots for the other categorical and count variables
for col in ['BAD', 'REASON', 'JOB', 'DEROG', 'NINQ']:
    plt.figure(figsize=(15,5))
    s = data[col].dropna()
    if str(s.dtype) != 'category':
        s = s.astype(int)
    ax = sns.countplot(x=s, color='#4C72B0')
    plt.title(col)
    perc_on_bar(ax, data[col])
""")
md(53, r"""
**Insights:**
- `BAD`: 80% of applicants repaid their loans and 20% defaulted. The imbalance is moderate. We handle it inside the models (class weights while we build them, the decision threshold when we choose the final one). Recall rather than accuracy is the measure of success.
- `REASON`: debt consolidation (69%) is far more common than home improvement (31%).
- `JOB`: "Other" (42%) is the most common occupation, then ProfExe (22%) and Office (17%). Sales (2%) and Self (3%) are small.
- `DEROG`: 86% have no major derogatory report. `NINQ`: 46% have no recent inquiry, 25% have one, and a tail have five or more.
""")

# ----------------------------------------------------------------------------- bivariate
code(57, r"""
sns.boxplot(x=data["BAD"],y=data['LOAN'],palette="PuBu")
plt.title('LOAN by BAD')
plt.show()
""")
md(58, r"""
**Insights:** Defaulters borrowed less on average (median \$14,900) than repayers (median \$16,900). The difference is real but modest, so loan size alone is not a strong separator. The default rate by loan band (added below) shows that loans under \$5,000 default 57% of the time, almost three times the average. A small requested amount is not a sign of low risk.
""")
add_after(59, "code", r"""
# Boxplots of every numerical variable by BAD, plus mean and median by class
num_cols = ['LOAN', 'MORTDUE', 'VALUE', 'YOJ', 'DEROG', 'DELINQ', 'CLAGE', 'NINQ', 'CLNO', 'DEBTINC']
fig, axes = plt.subplots(2, 5, figsize=(22, 9))
for ax, col in zip(axes.flatten(), num_cols):
    sns.boxplot(x=data["BAD"], y=data[col], ax=ax, palette="PuBu", showmeans=True)
    ax.set_title(f"{col} by BAD")
plt.tight_layout()
plt.show()

data.groupby("BAD", observed=True)[num_cols].agg(["mean", "median"]).T
""")
add_after(59, "code", r"""
# Default rate by band of the three most informative continuous variables
def default_rate_by_band(col, bins):
    banded = pd.cut(data[col], bins=bins, include_lowest=True)
    return data.groupby(banded, observed=True)["BAD"].agg(
        default_rate=lambda s: (s.astype(int).mean() * 100).round(1), applicants="count")

print("Default rate (%) by DEBTINC band")
print(default_rate_by_band("DEBTINC", [0, 20, 30, 35, 40, 45, 50, 210]))
print("\nDefault rate (%) by CLAGE band (months)")
print(default_rate_by_band("CLAGE", [0, 60, 120, 180, 240, 300, 1200]))
print("\nDefault rate (%) by LOAN band ($)")
print(default_rate_by_band("LOAN", [0, 5000, 10000, 15000, 20000, 30000, 90000]))
""")
add_after(59, "code", r"""
# Are the differences statistically significant? Mann-Whitney U tests for the amounts, chi-square tests for the categories
rows = []
for col in ['LOAN', 'MORTDUE', 'VALUE', 'DEBTINC', 'CLAGE']:
    a = data.loc[data['BAD'] == 1, col].dropna(); b = data.loc[data['BAD'] == 0, col].dropna()
    rows.append({'variable': col, 'median_defaulters': a.median(), 'median_repayers': b.median(), 'test': 'Mann-Whitney U', 'p_value': stats.mannwhitneyu(a, b).pvalue})
for col in ['REASON', 'JOB']:
    chi2, p, dof, _ = stats.chi2_contingency(pd.crosstab(data[col], data['BAD']))
    rows.append({'variable': col, 'median_defaulters': np.nan, 'median_repayers': np.nan, 'test': 'Chi-square', 'p_value': p})
pd.DataFrame(rows)
""")
add_after(59, "markdown", r"""
**Insights (numerical variables vs BAD):**
- `DEROG` and `DELINQ` separate the classes most: defaulters average 0.71 derogatory reports vs 0.13, and 1.23 delinquent lines vs 0.25, about five times higher.
- `CLAGE`: defaulters have a much shorter credit history (median 133 months vs 180). Under 5 years of history the default rate is 44%. Above 20 years it is about 10%.
- `DEBTINC` is a cliff, not a slope. Between 20% and 40% the default rate is only 4-7% (11% in the small group below 20%). Between 40% and 45% it is 11%. Above 45% it is 87%, and above 50% it is 100%. A 45% threshold is a natural policy rule.
- `NINQ`: defaulters made more recent inquiries (mean 1.78 vs 1.03).
- `VALUE` and `MORTDUE` are only slightly lower for defaulters (medians \$82,000 vs \$90,659 and \$60,279 vs \$66,839). `YOJ` and `CLNO` barely differ.
- The differences in `LOAN`, `MORTDUE` and `VALUE` are statistically significant (Mann-Whitney p < 0.001) but small in practice. `REASON` relates to default (chi-square p = 0.005) but weakly. `JOB` relates to default strongly (p < 0.001). Significance says the pattern is real. The band tables say where it is large enough to act on.
""")
code(61, r"""
sns.scatterplot(x=data["VALUE"], y=data['MORTDUE'], hue=data['BAD'], alpha=0.5, palette=["#4C72B0", "#C44E52"])
plt.title('MORTDUE vs VALUE')
plt.show()
""")
md(62, r"""
**Insights:** Mortgage balance and property value lie close to a straight line (the balance is typically 60-80% of the value). The two therefore carry much the same information. Defaulters are scattered throughout rather than clustered. This shows that these two amounts alone do not separate the classes.
""")
add_after(63, "code", r"""
# Other pairs of continuous variables
fig, axes = plt.subplots(1, 2, figsize=(16, 5.5))
sns.scatterplot(data=data, x="DEBTINC", y="CLAGE", hue="BAD", alpha=0.5, ax=axes[0], palette=["#4C72B0", "#C44E52"])
axes[0].axvline(45, color="black", linestyle="--", linewidth=1)
axes[0].set_title("CLAGE vs DEBTINC")
sns.scatterplot(data=data, x="LOAN", y="VALUE", hue="BAD", alpha=0.5, ax=axes[1], palette=["#4C72B0", "#C44E52"])
axes[1].set_title("VALUE vs LOAN")
plt.tight_layout()
plt.show()
""")
md(64, r"""
**Insights:** Almost every applicant to the right of the 45% debt-to-income line is a defaulter regardless of credit-history length. To the left, defaulters concentrate among short credit histories, so the two variables complement each other. Loan amount rises loosely with property value (correlation 0.34). Defaulters appear across the whole range and concentrate visibly among the smallest loans.
""")
code(67, r"""
### Function to plot stacked bar charts for categorical columns

def stacked_plot(x):
    sns.set(palette='nipy_spectral')
    tab1 = pd.crosstab(x,data['BAD'],margins=True)
    print(tab1)
    print('-'*120)
    tab = pd.crosstab(x,data['BAD'],normalize='index')
    tab.plot(kind='bar',stacked=True,figsize=(10,5))
    plt.legend(loc='lower left', frameon=False)
    plt.legend(loc="upper left", bbox_to_anchor=(1,1))
    plt.show()
    sns.set_theme()
""")
md(70, r"""
**Insights:** Home-improvement loans default slightly more often (22.2%) than debt-consolidation loans (19.0%). The relationship is weak, a 3-point difference around a 20% base rate, so loan purpose alone should not drive approval decisions.
""")
add_after(71, "code", r"""
# Stacked bar plots for JOB and the count variables (capped so the chart stays readable)
stacked_plot(data['JOB'])
stacked_plot(data['DEROG'].clip(upper=5))
stacked_plot(data['DELINQ'].clip(upper=6))
stacked_plot(data['NINQ'].clip(upper=8))
""")
add_after(71, "code", r"""
# Is missing information itself a signal? Default rate when a field is missing vs present
rows = []
for col in data.columns.drop("BAD"):
    if data[col].isnull().any():
        is_na = data[col].isnull()
        rows.append({"column": col, "missing_rows": int(is_na.sum()),
                     "default_rate_when_missing_%": round(data.loc[is_na, "BAD"].astype(int).mean() * 100, 1),
                     "default_rate_when_present_%": round(data.loc[~is_na, "BAD"].astype(int).mean() * 100, 1)})
pd.DataFrame(rows).sort_values("default_rate_when_missing_%", ascending=False)
""")
md(72, r"""
**Insights:**
- `JOB`: Sales (34.9%) and Self-employed (30.1%) default at 1.5 to 1.75 times the average. Office workers (13.2%) and ProfExe (16.6%) are the safest. Mgr and Other sit slightly above average. Sales and Self are small groups, so occupation should be a supporting signal only. The bank must monitor it for fair-lending proxy effects.
- `DEROG`: 17% default with no report, 39% with one, 51% with two, about 73-78% with three or more. `DELINQ`: 14% at zero, 34% at one, 45% at two, 100% at six or more. `NINQ` rises from 16% at zero to about 45-50% at five or more. These rising patterns are easy to explain to an applicant.
- **Missing information is itself a strong signal:** when `DEBTINC` is missing, 62% of applicants defaulted (vs 8.6% when present). When `VALUE` is missing, 94% defaulted. For `DEROG`, `DELINQ`, `YOJ`, `NINQ` and `JOB` the opposite holds (8-15% default when missing). This probably reflects how the data was recorded. We must therefore keep missing-value flags as features.
""")
code(75, r"""
# Separating numerical variables
numerical_col = data.select_dtypes(include=np.number).columns.tolist()

# Build correlation matrix for numerical columns
corr = data[numerical_col].corr()

# plot the heatmap
plt.figure(figsize=(16,12))
sns.heatmap(corr, annot=True, cmap='coolwarm',vmax=1,vmin=-1,
        fmt=".2f",
        xticklabels=corr.columns,
        yticklabels=corr.columns);
""")
code(76, r"""
# Build pairplot for the data with hue = 'BAD' (the six most informative numerical variables, to keep the chart readable)
sns.pairplot(data[['LOAN', 'DEBTINC', 'CLAGE', 'DELINQ', 'DEROG', 'NINQ', 'BAD']].dropna(),
             hue='BAD', palette=["#4C72B0", "#C44E52"], diag_kind='kde', corner=True, plot_kws={"alpha": 0.4, "s": 15})
plt.show()
""")
add_after(76, "markdown", r"""
**Insights (multivariate):**
- The only strong correlation between inputs is `MORTDUE` vs `VALUE` (0.88). This is multicollinearity for the logistic regression (their coefficients share the same information), but it is harmless for tree models. The moderate links are `CLNO` with `MORTDUE`/`VALUE` (0.27-0.32) and `LOAN` with `VALUE` (0.34).
- Correlations with the target are weak to moderate: `DELINQ` (0.35), `DEROG` (0.28), `DEBTINC` (0.20), `NINQ` (0.17), `CLAGE` (-0.17). The count variables are close to linear in the default rate. `DEBTINC`, `CLAGE` and `LOAN` act through thresholds that a correlation coefficient understates. This is an early hint that tree-based models should outperform a purely linear one on the raw inputs.
- In the pairplot, defaulters (red) have visibly shorter `CLAGE`, higher `DEBTINC` and heavier tails on `DELINQ`, `DEROG` and `NINQ`. No single pair separates the classes cleanly, so the separation comes from combinations.
""")
add_after(76, "markdown", r"""
#### Two categorical variables and the target: occupation and loan purpose

The bivariate analysis looked at occupation and loan purpose one at a time. Here we cross them, to check whether the risk of a loan purpose depends on the occupation. Applicants with a missing `JOB` or `REASON` are not in this chart.
""")
add_after(76, "code", r"""
#@title
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
add_after(76, "markdown", r"""
**Insights - occupation and loan purpose:**
- Occupation and loan purpose interact. Self-employed applicants who borrowed to consolidate debt defaulted 44% of the time (73 applicants). Self-employed applicants who borrowed for home improvement defaulted 18% of the time (115 applicants).
- Managers show the opposite pattern: 32% default on home-improvement loans (174 applicants) against 20% on debt consolidation (572 applicants). The "Other" group follows the managers (29% against 21%).
- Sales applicants default often for both purposes (35% and 33%), but only 12 of them borrowed for home improvement. Office workers default least for both purposes (15% and 11%).
- On its own, loan purpose looks weak (22% against 19%). Within some occupations it changes the risk by a factor of two. Tree models can learn this interaction directly. A linear model needs an explicit interaction term to learn it. Any rule that uses occupation needs the fair-lending review.
""")
add_after(76, "markdown", r"""
#### A numerical and a categorical variable with the target: debt burden and credit history by occupation

We check whether the two strongest numerical drivers work in every occupation, or only in some. The boxplots hide the extreme values to keep the boxes readable, and they use only applicants with a recorded value.
""")
add_after(76, "code", r"""
#@title
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
add_after(76, "markdown", r"""
**Insights - debt burden and credit history by occupation:**
- In every occupation, defaulters have a higher median debt-to-income ratio than repayers. The gap is about 1.5 points for office workers (37.6 against 36.1). It is about 6.5 points for sales and self-employed applicants (41.0 against 34.4, and 40.9 against 34.5).
- In every occupation, defaulters have a shorter credit history. The median gap is 29 months for professionals (160 against 189) and 57 months for managers (127 against 184).
- So debt burden and credit-history length work in every occupation. Occupation moves the baseline risk, but it does not replace these two drivers.
""")
add_after(76, "markdown", r"""
#### Interactions between the strongest drivers

The bivariate analysis found four strong drivers: the debt-to-income ratio, delinquent credit lines, credit-history length and derogatory reports. Here we cross them in pairs, and we keep "missing" as its own group because missingness is itself a signal. Each cell shows the default rate and the number of applicants. Cells with very few applicants (for example, a ratio above 45% with one delinquent line) are noisy, so we read them with caution.
""")
add_after(76, "code", r"""
#@title
# Default rate for pairs of drivers, with 'missing' kept as its own group
def band_with_missing(s, bins, labels):
    banded = pd.cut(s, bins=bins, labels=labels, include_lowest=True).astype(object)
    return banded.where(s.notna(), "missing")

dti_band = band_with_missing(data["DEBTINC"], [0, 30, 35, 40, 45, np.inf], ["under 30", "30-35", "35-40", "40-45", "over 45"])
delinq_group = band_with_missing(data["DELINQ"], [-0.5, 0.5, 1.5, np.inf], ["0", "1", "2+"])
history_band = band_with_missing(data["CLAGE"], [0, 120, 240, np.inf], ["under 10 yrs", "10-20 yrs", "20+ yrs"])
derog_group = band_with_missing(data["DEROG"], [-0.5, 0.5, np.inf], ["0", "1+"])

def rate_grid(rows, cols, row_order, col_order):
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
add_after(76, "markdown", r"""
**Insights - interactions between the strongest drivers:**
- **Debt burden and repayment history add up.** When the ratio is 45% or less, delinquency still decides much of the risk. In that group, 3% to 9% defaulted with no delinquent lines, and 25% to 30% defaulted with two or more.
- Above 45%, 91% to 100% defaulted, whatever the number of delinquent lines. The ratio alone is enough in that group.
- When the ratio is missing, delinquency adds risk on top of the missing signal. In that group, 50% defaulted with no delinquent lines (695 applicants) and 87% with two or more (253 applicants).
- **A long credit history lowers the risk but does not cancel a derogatory report.** With one or more reports, the default rate rises from 25% to 56% under 10 years of history. It rises from 15% to 48% at 10 to 20 years, and from 8% to 32% at 20 years or more.
- **The two missing-value signals compound.** With both fields recorded, 8% defaulted (4,662 applicants). With only the ratio missing, 60% defaulted (1,186 applicants). With only the property value missing, 81% defaulted (31 applicants). With both missing, 99% defaulted (81 applicants).
- These combined effects suggest that a tree-based model, which splits on one driver inside another, should beat a model that adds each driver alone. They also match the surrogate tree we fit later: a high or missing ratio flags an applicant, and repayment history decides among the others.
""")
md(77, r"""
### **Think about it**
- Are there missing values and outliers in the dataset? If yes, how can you treat them?
- Can you think of different ways in which this can be done and when to treat these outliers or not?
- Can we create new features based on Missing values?

*Yes to all three. We create a 0/1 flag per column, because the EDA showed that missingness of `DEBTINC` and `VALUE` is the strongest default signal in the data. We then impute missing values with the median (numerical) or mode (categorical).*

*We cap outliers at the IQR whiskers for the logistic regression, which is sensitive to extreme values. We leave them untouched for the tree models. Tree models split on rank order and would otherwise lose information such as "a debt-to-income ratio above 50% always defaults". `DEROG` and `DELINQ` are counts with an inter-quartile range of zero, so the IQR rule would erase them. We cap them at the 99th percentile instead.*
""")
code(79, r"""
def treat_outliers(df,col,fit_rows=None):
    '''
    treats outliers in a varaible
    col: str, name of the numerical varaible
    df: data frame
    col: name of the column
    fit_rows: rows used to compute the fences (the training rows); default all rows
    '''
    fit = df.loc[fit_rows, col] if fit_rows is not None else df[col]
    Q1=fit.quantile(0.25) # 25th quantile
    Q3=fit.quantile(0.75)  # 75th quantile
    IQR=Q3 - Q1   # IQR Range
    Lower_Whisker = Q1 - 1.5 * IQR  #define lower whisker
    Upper_Whisker = Q3 + 1.5 * IQR  # define upper Whisker
    df[col] = np.clip(df[col], Lower_Whisker, Upper_Whisker) # all the values samller than Lower_Whisker will be assigned value of Lower_whisker
                                                            # and all the values above upper_whishker will be assigned value of upper_Whisker
    return df

def treat_outliers_all(df, col_list, fit_rows=None):
    '''
    treat outlier in all numerical varaibles
    col_list: list of numerical varaibles
    df: data frame
    fit_rows: rows used to compute the fences (the training rows)
    '''
    for c in col_list:
        df = treat_outliers(df,c,fit_rows)

    return df
""")
code(80, r"""
df_raw = data.copy()

numerical_col = df_raw.select_dtypes(include=np.number).columns.tolist()# getting list of numerical columns

# DEROG and DELINQ have Q1 = Q3 = 0, so the IQR whiskers collapse to zero and the rule would erase them.
# They are capped at the 99th percentile instead; the other numerical columns use the IQR rule.
iqr_cols = [c for c in numerical_col if c not in ('DEROG', 'DELINQ')]
df = treat_outliers_all(df_raw, iqr_cols, fit_rows=train_idx)
for c in ['DEROG', 'DELINQ']:
    df[c] = df[c].clip(upper=df.loc[train_idx, c].quantile(0.99))

# Maximum of each column before and after the treatment
pd.DataFrame({'max_before': data[numerical_col].max(), 'max_after': df[numerical_col].max()})
""")
code(85, r"""
#  Treat Missing values in numerical columns with median and mode in categorical variables
# Select numeric columns.
num_data = df.select_dtypes('number')

# Select string and object columns.
cat_data = df.select_dtypes('category').columns.tolist()#df.select_dtypes('object')

# Fill numeric columns with the median of the training rows.
df[num_data.columns] = num_data.fillna(num_data.loc[train_idx].median())

# Fill object columns with the mode of the training rows.
for column in cat_data:
    mode = df.loc[train_idx, column].mode()[0]
    df[column] = df[column].fillna(mode)

print("Remaining missing values:", df.isnull().sum().sum())
""")
md(86, r"""
## **Important Insights from EDA**

What are the the most important observations and insights from the data based on the EDA performed?

1. **One in five loans goes bad (19.9%).** The classes are imbalanced, so accuracy is the wrong yardstick. We must handle the imbalance with class weights while we build the individual models, and with the decision threshold when we choose the final model.
2. **Missing information is the strongest single risk signal.** Applicants with no recorded debt-to-income ratio default 62% of the time (vs 8.6% when recorded). Applicants with no property valuation default 94% of the time. Unverifiable income or valuation is a red flag, not a neutral gap.
3. **Debt-to-income ratio has a hard threshold.** Between 20% and 40% the default rate is 4-7% (11% below 20%). Between 40% and 45% it is 11%. Above 45% it is 87-100%. A 45% threshold is a simple, defensible policy rule.
4. **Past credit behaviour predicts future behaviour.** Each additional derogatory report or delinquent credit line raises the default rate sharply (0 reports: 17%, 1: 39%, 2: 51%, 3 or more: about 75%). Recent inquiries show the same rising pattern.
5. **A long credit history protects.** Under 5 years of history, 44% default. Above 20 years, about 10% default.
6. **Small loans are not safe loans.** Loans under \$5,000 default 57% of the time.
7. **Occupation matters moderately** (Sales 35%, Self 30%, Office 13%). Loan purpose makes only a 3-point difference, although it is statistically significant.
8. **Property value and mortgage balance are highly correlated (0.88)** and individually weak predictors.
9. **Relationships with the target are non-linear** (cliffs and thresholds), so we expect tree-based models to beat logistic regression, which remains the most transparent benchmark.
10. **Risk factors combine rather than act alone.** A ratio above 45% flags an applicant by itself. At or below 45%, two or more delinquent lines raise the default rate from 3-9% to 25-30%. A derogatory report raises risk at every credit-history length. When both the ratio and the property value are missing, 99% defaulted. Loan purpose also changes the risk within some occupations (self-employed applicants: 44% on debt consolidation against 18% on home improvement). These interactions favour tree-based models.
11. **Pre-processing decisions:**
    - We removed no rows and found no duplicates.
    - We reserved the test set before we fitted any statistic.
    - We added a missing-value flag for every column with gaps.
    - We learned the median/mode imputation on the training rows.
    - We applied IQR capping only for the linear model (99th-percentile cap for the two count variables).
    - We one-hot encoded `REASON` and `JOB`.
    - We applied standard scaling to the continuous inputs for the linear model only.
""")

# ----------------------------------------------------------------------------- data preparation (linear model)
code(90, r"""
#@title
# Drop the dependent variable from the dataframe and create the X(independent variable) matrix
X = df.drop(['BAD'], axis=1)

# Create dummy variables for the categorical variables
X = pd.get_dummies(X, columns=['REASON', 'JOB'], drop_first=True, dtype=int)

# Create y(dependent varibale)
y = df['BAD'].astype(int)

print(X.shape, y.shape)
""")
code(92, r"""
#@title
# Split the data into training and test set, using the stratified 70/30 split held out at the start
X_train, X_test = X.loc[train_idx], X.loc[test_idx]
y_train, y_test = y.loc[train_idx], y.loc[test_idx]

print("Train shape:", X_train.shape, "Test shape:", X_test.shape)
print(f"Default rate - train: {y_train.mean():.3f}, test: {y_test.mean():.3f}")

# Standardise the continuous inputs for the linear model (fit on train only); the 0/1 flags and dummies stay as they are,
# so their coefficients read as the effect of the flag switching on. Tree models use the unscaled data.
from sklearn.preprocessing import StandardScaler
continuous = ['LOAN', 'MORTDUE', 'VALUE', 'YOJ', 'DEROG', 'DELINQ', 'CLAGE', 'NINQ', 'CLNO', 'DEBTINC']
scaler = StandardScaler().fit(X_train[continuous])
X_train_lr, X_test_lr = X_train.copy(), X_test.copy()
X_train_lr[continuous] = scaler.transform(X_train[continuous])
X_test_lr[continuous] = scaler.transform(X_test[continuous])
""")
md(93, r"""
### **Think about it**
- You can try different splits like 70:30 or 80:20 as per your choice. Does this change in split affect the performance?
- If the data is imbalanced, can you make the split more balanced and if yes, how?

*A 70:30 split leaves 1,788 applicants (357 defaulters) for an honest test. An 80:20 split would train on slightly more data but test on fewer defaulters, so the test scores become noisier. On two other 70/30 splits, the cheapest forest configuration (no class weights) and its 0.15 threshold did not change (see the robustness cell). We did not test an 80:20 split. We should not "balance" the split itself by removing applicants. Stratifying on `BAD` keeps the true 20% default rate in both sets. We then handle the imbalance inside the models, with class weights and later the decision threshold (or by resampling the training rows only).*
""")
md(94, r"""
## **Model Evaluation Criterion**

#### After understanding the problem statement, think about which evaluation metrics to consider and why.

The model can make two kinds of mistakes and they do not cost the same:

| Model says | Reality | Name | Business consequence |
|---|---|---|---|
| Will repay (approve) | Defaults | **False Negative** | The bank loses most of the principal plus collection costs: about \$9,000 on a typical \$16,900 defaulted loan after recovering collateral. |
| Will default (reject) | Repays | **False Positive** | The bank forgoes the interest margin on one good customer: about \$2,000. |

A missed defaulter costs roughly 4.5 times a wrongly rejected good applicant. That is why the **primary metric is Recall on the defaulter class (BAD = 1)**. Of all applicants who later defaulted, what share did the model flag? Recall alone can be gamed (rejecting everyone gives 100% recall). We therefore track **Precision** (how many flagged applicants really default) and **F1** as guard-rails, with **Accuracy** for completeness.

Grid search optimises recall with cross-validation on the training rows when we build the individual models. We then choose the final model and its threshold on the expected cost of the two errors. We estimate that cost on repeated out-of-fold predictions of the training rows, so precision enters the choice explicitly.
""")
code(95, r"""
#@title
#creating metric function
def metrics_score(actual, predicted):
    print(classification_report(actual, predicted, digits=3))
    cm = confusion_matrix(actual, predicted)
    plt.figure(figsize=(8,5))
    sns.heatmap(cm, annot=True,  fmt='d', cmap='Blues', xticklabels=['Repaid (0)', 'Default (1)'], yticklabels=['Repaid (0)', 'Default (1)'])
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.show()
""")
code(97, r"""
#@title
# Defining the Logistic regression model
lg = LogisticRegression(max_iter=2000, random_state=1)

# Fitting the model on the training data
lg.fit(X_train_lr, y_train)
""")
code(99, r"""
#@title
#Predict for train set
y_pred_train = lg.predict(X_train_lr)

#checking the performance on the train dataset
metrics_score(y_train, y_pred_train)
""")
code(101, r"""
#@title
#Predict for test set
y_pred_test = lg.predict(X_test_lr)

#checking the performance on the test dataset
metrics_score(y_test, y_pred_test)
""")
add_after(101, "code", r"""
#@title
# Logistic regression with balanced class weights, to counter the 1:4 imbalance
lg_bal = LogisticRegression(max_iter=2000, class_weight='balanced', random_state=1)
lg_bal.fit(X_train_lr, y_train)

print("Train performance - Logistic Regression (balanced)")
metrics_score(y_train, lg_bal.predict(X_train_lr))
print("Test performance - Logistic Regression (balanced)")
metrics_score(y_test, lg_bal.predict(X_test_lr))
""")
md(102, r"""
**Observations:**
- The plain logistic regression is accurate overall (88% on test) but catches only **57% of defaulters**: it favours the majority "repaid" class.
- Balancing the class weights raises test recall to **80%**, while precision falls to 61% and accuracy to 86%. The model catches about 23 more defaulters out of every 100, at the cost of rejecting more good applicants.
- Train and test scores are close, so the linear model does not over-fit. Its limit is that a straight line cannot capture the threshold effects that the EDA showed.
""")
code(104, r"""
#@title
# Printing the coefficients of logistic regression (balanced model). Continuous inputs are standardised, so their
# coefficients are per standard deviation; flags and dummies are 0/1, so theirs are the effect of switching the flag on.
coef = pd.DataFrame({'feature': X_train_lr.columns, 'coefficient': lg_bal.coef_[0]})
coef['odds_ratio'] = np.exp(coef['coefficient'])
coef['unit'] = ['per 1 standard deviation' if f in continuous else 'flag 0 -> 1' for f in coef['feature']]
coef = coef.sort_values('coefficient', ascending=False).reset_index(drop=True)

plt.figure(figsize=(9, 7))
sns.barplot(data=coef, x='coefficient', y='feature', palette=['#C44E52' if c > 0 else '#4C72B0' for c in coef['coefficient']])
plt.axvline(0, color='black', linewidth=1)
plt.title('Logistic Regression (balanced) - standardised coefficients (red raises default risk, blue lowers it)')
plt.show()
coef
""")
md(105, r"""
**Insights:**
- **Risk-increasing:** the missing-value flags dominate. An application with no property valuation has odds of default about 45 times higher, all else equal. An application with no debt-to-income ratio has odds about 13 times higher, all else equal. The flags are 0/1, so these odds ratios are the full effect of the flag. Among the continuous inputs, `DELINQ` (odds ratio about 2.4 per standard deviation) and `DEBTINC` (about 1.8) matter most, followed by `DEROG` and `NINQ`. The `JOB_Sales` indicator roughly triples the odds relative to a manager.
- **Risk-decreasing:** `CLAGE` lowers the risk (longer credit history, odds ratio about 0.6 per standard deviation). `YOJ`, `JOB_Office` and the `DEROG`/`JOB`/`YOJ`/`DELINQ` missing flags also lower the risk. In the EDA, the groups for which these fields were blank defaulted less often.
- `LOAN` has almost no linear effect once the model includes the other variables. Its relationship with default is non-linear (small loans are riskier, large ones are not).
- `MORTDUE` and `VALUE` have opposite signs of similar size, the classic symptom of their 0.88 correlation. Do not over-interpret these two coefficients individually.
- The signs agree with the EDA and with lending common sense, which gives confidence that the model learns real risk rather than noise.
""")
md(106, r"""
### **Think about it:**
- The above Logistic regression model was build on the threshold of 0.5, can we use different threshold?
- How to get an optimal threshold and which curve will help you achieve?
- How does, accuracy, precision and recall change on the threshold?

*Yes. The model outputs a probability and 0.5 is only a convention. The precision-recall curve (or the ROC curve) plotted against the threshold shows the trade-off. Lowering the threshold raises recall and lowers precision and accuracy, and raising it does the reverse. The optimal threshold is the one that minimises the business cost of the two errors. The cell below shows the trade-off for the balanced model.*
""")
add_after(106, "code", r"""
#@title
# Precision and recall of the balanced logistic regression at different thresholds (test set)
from sklearn.metrics import precision_recall_curve
proba_lr = lg_bal.predict_proba(X_test_lr)[:, 1]
prec, rec, thr = precision_recall_curve(y_test, proba_lr)
plt.figure(figsize=(8, 4.5))
plt.plot(thr, prec[:-1], label='Precision (default class)')
plt.plot(thr, rec[:-1], label='Recall (default class)')
plt.axvline(0.5, color='grey', linestyle='--', linewidth=1)
plt.xlabel('Probability threshold'); plt.ylabel('score'); plt.legend(); plt.show()

rows = []
for t in [0.3, 0.4, 0.5, 0.6]:
    p = (proba_lr >= t).astype(int)
    rows.append({'threshold': t, 'recall': recall_score(y_test, p), 'precision': precision_score(y_test, p),
                 'f1': f1_score(y_test, p), 'accuracy': accuracy_score(y_test, p)})
pd.DataFrame(rows).round(3)
""")

# ----------------------------------------------------------------------------- tree models
md(108, r"""
### **Think about it:**
- In Logistic regression we treated the outliers and built the model, should we do the same for tree based models or not? If not, why?

*No. A tree splits on the rank order of a variable ("is DEBTINC above 43.7?"), so an extreme value simply falls into the top bucket. The extreme value does not pull the split the way it pulls a regression line. Capping would also remove real information, such as "a debt-to-income ratio above 50% always defaults". We therefore build the tree models on the untreated data (`data`), with the same missing-value flags and imputation.*
""")
code(111, r"""
#@title
#  Treat Missing values in numerical columns with median and mode in categorical variables
# Select numeric columns.
num_data = data.select_dtypes('number')

# Select string and object columns.
cat_data = data.select_dtypes('category').columns.tolist()#df.select_dtypes('object')

# Fill numeric columns with the median of the training rows.
data[num_data.columns] = num_data.fillna(num_data.loc[train_idx].median())

# Fill object columns with the mode of the training rows.
for column in cat_data:
    mode = data.loc[train_idx, column].mode()[0]
    data[column] = data[column].fillna(mode)

print("Remaining missing values:", data.isnull().sum().sum())
""")
code(113, r"""
#@title
# Drop dependent variable from dataframe and create the X(independent variable) matrix
X = data.drop(['BAD'], axis=1)

# Create dummy variables for the categorical variables
X = pd.get_dummies(X, columns=['REASON', 'JOB'], drop_first=True, dtype=int)

# Create y(dependent varibale)
y = data['BAD'].astype(int)

print("Feature columns:", list(X.columns))
""")
code(115, r"""
#@title
# Split the data into training and test set (the same held-out applicants as for the linear model)
X_train, X_test = X.loc[train_idx], X.loc[test_idx]
y_train, y_test = y.loc[train_idx], y.loc[test_idx]
print("Train shape:", X_train.shape, "Test shape:", X_test.shape)
""")
code(116, r"""
#@title
#Defining Decision tree model with class weights class_weight={0: 0.2, 1: 0.8}
dt = DecisionTreeClassifier(class_weight={0: 0.2, 1: 0.8}, random_state=1)
""")
code(117, r"""
#@title
#fitting Decision tree model
dt.fit(X_train, y_train)
""")
code(119, r"""
#@title
# Checking performance on the training data
metrics_score(y_train, dt.predict(X_train))
""")
code(121, r"""
#@title
# Checking performance on the testing data
metrics_score(y_test, dt.predict(X_test))
print("Tree depth:", dt.get_depth(), "| number of leaves:", dt.get_n_leaves())
""")
md(122, r"""
**Insights:**
- The fully grown tree is a textbook case of **over-fitting**. It scores 100% recall, precision and accuracy on the training rows but only about **62% recall** and 72% precision on the test set. It memorised the training applicants (dozens of levels deep, hundreds of leaves) instead of learning general rules.
- The class weights do not help an un-pruned tree. They change which splits the tree chooses (this is a different tree). They cannot change the fact that a fully grown tree fits every training applicant perfectly. Its test predictions therefore remain those of an over-fitted tree. Class weights only help once we constrain (prune) the tree, which the grid search does next.
""")
md(123, r"""
### **Think about it:**
- Can we improve this model?
- How to get optimal parameters in order to get the best possible results?

*Yes: by pruning. Limiting the depth and the minimum number of applicants per leaf stops the tree from memorising. Combining that with class weights lets it favour the defaulter class. There is no formula for the best settings, so we find them by grid search with cross-validation on the training rows, scoring on recall.*
""")
code(126, r"""
#@title
# Choose the type of classifier.
dtree_estimator = DecisionTreeClassifier(random_state=1)

# Grid of parameters to choose from
parameters = {'max_depth': [3, 4, 5, 6, 8, 10, None],
              'min_samples_leaf': [1, 5, 10, 20, 50],
              'criterion': ['gini', 'entropy'],
              'class_weight': [None, 'balanced', {0: 0.2, 1: 0.8}]}

# Type of scoring used to compare parameter combinations
scorer = metrics.make_scorer(metrics.recall_score)

# Run the grid search
from sklearn.model_selection import StratifiedKFold
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=1)
grid_obj = GridSearchCV(dtree_estimator, parameters, scoring=scorer, cv=cv, n_jobs=-1)

# Fit the GridSearch on train dataset
grid_obj = grid_obj.fit(X_train, y_train)

# Set the clf to the best combination of parameters
dtree_estimator = grid_obj.best_estimator_

# Fit the best algorithm to the data.
dtree_estimator.fit(X_train, y_train)
print("Best parameters:", grid_obj.best_params_)
print(f"Best cross-validated recall: {grid_obj.best_score_:.3f}")
""")
code(128, r"""
#@title
# Checking performance on the training data based on the tuned model
metrics_score(y_train, dtree_estimator.predict(X_train))
""")
code(130, r"""
#@title
# Checking performance on the testing data based on the tuned model
metrics_score(y_test, dtree_estimator.predict(X_test))
print("Tree depth:", dtree_estimator.get_depth(), "| number of leaves:", dtree_estimator.get_n_leaves())
""")
md(131, r"""
**Insights:**
- Pruning with balanced class weights lifts **test recall to about 82%**, the highest of the single-model approaches. The pruned tree has a minimum of 20 applicants per leaf, which cuts it from several hundred leaves to about 100. The train-test gap narrows to about 10 points (92% vs 82%).
- The price is precision: only about 53% of the applicants the tree rejects would actually have defaulted, and accuracy falls to about 82%. The tree is deliberately cautious. Whether that is acceptable depends on how much good business the bank is willing to reject. The Random Forest below improves this balance.
""")
code(133, r"""
#@title
# Plot the decision  tree (first three levels; the full tree is deeper) and print the rules of the first four levels
from sklearn.tree import plot_tree, export_text
plt.figure(figsize=(26, 10))
plot_tree(dtree_estimator, feature_names=list(X_train.columns), class_names=['Repaid', 'Default'],
          filled=True, rounded=True, max_depth=3, fontsize=9, proportion=True)
plt.show()

print(export_text(dtree_estimator, feature_names=list(X_train.columns), max_depth=4, show_weights=False))
""")
add_after(133, "code", r"""
#@title
# The tree was fitted with balanced class weights, so a leaf labelled 'class: 1' means a raw default rate above roughly 20%,
# not a near-certain default. Observed default rates (training rows) of the groups defined by the first splits:
tr = data.loc[train_idx]
root_split = dtree_estimator.tree_.threshold[dtree_estimator.tree_.children_left[0]]
groups = {
    'Debt-to-income ratio missing': tr['DEBTINC_missing_values_flag'] == 1,
    f'Ratio recorded and above {root_split:.1f}%': (tr['DEBTINC_missing_values_flag'] == 0) & (tr['DEBTINC'] > root_split),
    f'Ratio recorded, at most {root_split:.1f}%, 1+ delinquent lines': (tr['DEBTINC_missing_values_flag'] == 0) & (tr['DEBTINC'] <= root_split) & (tr['DELINQ'] >= 1),
    f'Ratio recorded, at most {root_split:.1f}%, no delinquent lines': (tr['DEBTINC_missing_values_flag'] == 0) & (tr['DEBTINC'] <= root_split) & (tr['DELINQ'] == 0),
}
pd.DataFrame({'applicants': {k: int(v.sum()) for k, v in groups.items()},
              'default_rate_%': {k: round(tr.loc[v, 'BAD'].astype(int).mean() * 100, 1) for k, v in groups.items()}})
""")
md(134, r"""
#### Deduce the business rules apparent from the Decision Tree and write them down:

1. **Is the debt-to-income ratio missing?** If yes, the applicant is in a high-risk group (about 62% of these applicants defaulted). When income is unverified, the bank should reject the applicant or require income verification.
2. **If the ratio is recorded, is it above about 44%?** If yes, roughly three out of four such applicants defaulted (and above 45% the EDA showed 87-100%). Decline the application.
3. **Below that ratio, how many delinquent credit lines does the applicant have?** With none, only about 4-5% default, the safest group in the book. One or more delinquent lines push the applicant back into the risky branch.
4. **Among the remaining applicants, how long is the credit history (CLAGE) and are there derogatory reports (DEROG)?** Short histories (under about 15 years) with any derogatory report are risky. Long clean histories are safe.
5. **In the "ratio missing" branch the tree asks the same questions again** (delinquencies, derogatory reports, credit-history length, loan size). Almost every path that combines a missing ratio with a delinquency or derogatory report ends in "default".

These rules match the EDA findings, which is reassuring. The model formalises the patterns in the data rather than inventing new ones. The bank can quote each rule to an applicant as the reason for a decision.
""")
add_after(134, "markdown", r"""
### **Bagging (Bootstrap Aggregating): the step between one tree and a Random Forest**

A single tree has high variance: small changes in the training rows produce a different tree. Bagging trains many trees, each on a bootstrap sample of the training applicants, and combines their votes. This lowers variance without raising bias. A Random Forest is bagging plus a random subset of features at every split. Building a plain bagged ensemble first shows how much of the improvement comes from bagging alone.
""")
add_after(134, "code", r"""
#@title
# Bagging of 200 fully grown decision trees
bagging = BaggingClassifier(estimator=DecisionTreeClassifier(random_state=1), n_estimators=200, random_state=1, n_jobs=-1)
bagging.fit(X_train, y_train)

print("Train performance - Bagging")
metrics_score(y_train, bagging.predict(X_train))
print("Test performance - Bagging")
metrics_score(y_test, bagging.predict(X_test))
""")
add_after(134, "markdown", r"""
**Insights:** Averaging 200 trees lifts test precision from about 71-72% (single tree) to 83% at about 68% recall, and overall accuracy to 91%. The ensemble is right far more often when it flags a defaulter. Train recall is still 100%, so bagging limits the damage of over-fitting on unseen data rather than removing it. The bagged ensemble still misses about a third of defaulters. The Random Forest adds feature sub-sampling. Class weights or a lower decision threshold can then trade precision for recall.
""")
code(136, r"""
#@title
# Defining Random forest CLassifier
rf_estimator = RandomForestClassifier(n_estimators=200, random_state=1, n_jobs=-1)
rf_estimator.fit(X_train, y_train)
""")
code(138, r"""
#@title
#Checking performance on the training data
metrics_score(y_train, rf_estimator.predict(X_train))
""")
code(140, r"""
#@title
# Checking performance on the test data
metrics_score(y_test, rf_estimator.predict(X_test))
""")
md(141, r"""
**Observations:**
- Like the single tree, the forest fits the training rows perfectly. On the test set it is much stronger: about **69% recall with 84% precision** and 91% accuracy.
- The forest is conservative about flagging an applicant as a defaulter. When it does, it is right 84% of the time, but it still misses about a third of the defaulters. Class weights should shift that balance towards recall.
""")
code(143, r"""
#@title
# Defining Random Forest model with class weights class_weight={0: 0.2, 1: 0.8}
rf_estimator_weighted = RandomForestClassifier(n_estimators=200, class_weight={0: 0.2, 1: 0.8}, random_state=1, n_jobs=-1)

# Fitting Random Forest model
rf_estimator_weighted.fit(X_train, y_train)
""")
code(145, r"""
#@title
# Checking performance on the train data
metrics_score(y_train, rf_estimator_weighted.predict(X_train))
""")
code(147, r"""
#@title
# Checking performance on the test data
metrics_score(y_test, rf_estimator_weighted.predict(X_test))
""")
add_after(147, "markdown", r"""
**Observations:** Class weights lift **test recall to about 77%** while precision stays near 77% and accuracy near 91%. Unlike the single tree, the forest's recall responds to class weights at the 0.5 threshold. The weights shift the ensemble's averaged probabilities, which moves applicants across the fixed threshold. We test whether that shift is better than simply moving the threshold when we choose the final model. This is the best balance of recall and precision so far. It catches almost as many defaulters as the balanced logistic regression (77% vs 80%) with far higher precision (77% vs 61%).
""")
md(148, r"""
### **Think about it:**
- Can we try different weights?
- If yes, should we increase or decrease class weights for different classes?

*Yes. Raising the weight of the defaulter class pushes the forest towards flagging more applicants (higher recall, lower precision). Lowering it does the reverse. The grid search below tries 0.2/0.8 and `balanced` (which weights classes inversely to their frequency, about 0.62/2.5). The threshold analysis later shows that moving the decision threshold is an even finer dial for the same trade-off.*
""")
code(152, r"""
#@title
# Choose the type of classifier.
rf_estimator_tuned = RandomForestClassifier(random_state=1, n_jobs=-1)

# Grid of parameters to choose from
parameters = {'n_estimators': [150, 300],
              'max_depth': [6, 10, None],
              'min_samples_leaf': [1, 5, 10],
              'max_features': ['sqrt', 0.5],
              'class_weight': ['balanced', {0: 0.2, 1: 0.8}]}

# Type of scoring used to compare parameter combinations
scorer = metrics.make_scorer(metrics.recall_score)

# Run the grid search (3 folds keep the run time reasonable for the larger forest grid)
cv3 = StratifiedKFold(n_splits=3, shuffle=True, random_state=1)
grid_obj = GridSearchCV(rf_estimator_tuned, parameters, scoring=scorer, cv=cv3, n_jobs=-1)

#fit the GridSearch on train dataset
grid_obj = grid_obj.fit(X_train, y_train)

# Set the clf to the best combination of parameters
rf_estimator_tuned = grid_obj.best_estimator_

# Fit the best algorithm to the data.
rf_estimator_tuned.fit(X_train, y_train)
print("Best parameters:", grid_obj.best_params_)
print(f"Best cross-validated recall: {grid_obj.best_score_:.3f}")
""")
code(154, r"""
#@title
# Checking performance on the training data
metrics_score(y_train, rf_estimator_tuned.predict(X_train))
""")
code(156, r"""
#@title
# Checking performace on test dataset
metrics_score(y_test, rf_estimator_tuned.predict(X_test))
""")
md(157, r"""
**Insights:**
- Optimising purely for recall pushes the grid towards larger leaves (10 applicants minimum) and balanced weights. Test recall lands at about **79%**, close to the weighted forest. Precision drops to about 66% because the forest becomes more willing to flag borderline applicants.
- The train-test gap shrinks (train recall is no longer 100%), so the tuned forest generalises better even though its headline test numbers are similar.
- Recall-only tuning shows the limit of a single-metric search on an imbalanced problem. Beyond a point, extra recall costs a lot of precision. The comparison below weighs the two together.
""")
code(159, r"""
#@title
# importance of features in the tree building ( The importance of a feature is computed as the
#(normalized) total reduction of the criterion brought by that feature. It is also known as the Gini importance )
importances = rf_estimator_tuned.feature_importances_
indices = np.argsort(importances)
feature_names = list(X_train.columns)

plt.figure(figsize=(10, 8))
plt.title('Feature Importances - tuned Random Forest')
plt.barh(range(len(indices)), importances[indices], color='#4C72B0', align='center')
plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
plt.xlabel('Relative Importance')
plt.show()

pd.Series(importances, index=feature_names).sort_values(ascending=False).round(4).head(12)
""")
add_after(159, "markdown", r"""
**Insights (feature importance):** The two debt-to-income features dominate: the `DEBTINC` missing flag and `DEBTINC` together carry more than half (about 53%) of this recall-tuned forest's split power. (We show the final model's own importances, about a third for the pair, after we choose it.) This shows that affordability, and whether it could be checked, is the heart of the decision. Next come `DELINQ`, `CLAGE` and `DEROG` (repayment behaviour and depth of credit history), then `LOAN`, `VALUE`, `MORTDUE` and `CLNO`. The `JOB` and `REASON` dummies rank at the bottom: once financial behaviour is known, occupation and loan purpose add little. The selection step below tests whether occupation adds value at the cost-optimal threshold.
""")
md(160, r"""
### **Think about it:**
- We have only built 3 models so far, Logistic Regression, Decision Tree and Random Forest
- We can build other Machine Learning classification models like kNN, LDA, QDA or even Support Vector Machines (SVM).
- Can we also perform feature engineering and create model features and build a more robust and accurate model for this problem statement?

*Both are worthwhile next steps. We added a bagged ensemble above as the bridge between one tree and a forest. Gradient boosting would be the natural next model. kNN and SVM are less attractive here because they are harder to explain to an applicant, which the ECOA requires. On features, a loan-to-value ratio ((LOAN + MORTDUE) / VALUE) and a payment-to-income measure would give the trees directly what they now approximate through raw-amount splits. Time-series techniques from the course do not apply: each row is one application with no date or ordering.*
""")

# ----------------------------------------------------------------------------- comparison
code(165, r"""
#@title
# Make the list of all the models built (each with the input matrix it was trained on, because the
# logistic regression uses the standardised, outlier-capped data while the tree models use the untreated data)
models = [(lg, X_train_lr, X_test_lr), (lg_bal, X_train_lr, X_test_lr),
          (dt, X_train, X_test), (dtree_estimator, X_train, X_test), (bagging, X_train, X_test),
          (rf_estimator, X_train, X_test), (rf_estimator_weighted, X_train, X_test), (rf_estimator_tuned, X_train, X_test)]

# defining empty lists to add train and test results
acc_train = []
acc_test = []
recall_train = []
recall_test = []
precision_train = []
precision_test = []

# looping through all the models to get the accuracy,recall and precision scores
for model, Xtr, Xte in models:
     # accuracy score
    j = get_accuracy_score(model,False, X_train=Xtr, X_test=Xte)
    acc_train.append(j[0])
    acc_test.append(j[1])

    # recall score
    k = get_recall_score(model,False, X_train=Xtr, X_test=Xte)
    recall_train.append(k[0])
    recall_test.append(k[1])

    # precision score
    l = get_precision_score(model,False, X_train=Xtr, X_test=Xte)
    precision_train.append(l[0])
    precision_test.append(l[1])
""")
code(166, r"""
#@title
comparison_frame = pd.DataFrame({'Model':['Logistic Regression (plain)', 'Logistic Regression (balanced)', 'Decision Tree (class weights)',
                                          'Tuned Decision Tree', 'Bagging (200 trees)', 'Random Forest', 'Random Forest (class weights)', 'Tuned Random Forest'],
                                          'Train_Accuracy': acc_train,
                                          'Test_Accuracy': acc_test,
                                          'Train_Recall': recall_train,
                                          'Test_Recall': recall_test,
                                          'Train_Precision': precision_train,
                                          'Test_Precision': precision_test})
comparison_frame.round(3)
""")
add_after(166, "code", r"""
#@title
# Visual comparison on the test set
plot_df = comparison_frame.melt(id_vars='Model', value_vars=['Test_Recall', 'Test_Precision', 'Test_Accuracy'], var_name='metric', value_name='score')
plt.figure(figsize=(13, 5))
sns.barplot(data=plot_df, x='Model', y='score', hue='metric')
plt.xticks(rotation=25, ha='right'); plt.ylim(0, 1.05); plt.title('Test-set performance by model'); plt.legend(loc='lower right')
plt.show()
""")
add_after(166, "markdown", r"""
**Insights (comparison table):**
- Every un-pruned tree model (the single tree, bagging and the default and class-weighted forests) scores 100% on the training data. Only the test columns show differences between the models.
- On the test set at the 0.5 threshold, the tuned decision tree has the highest recall (82%) but the lowest precision (53%). The class-weighted Random Forest has the best balance (77% recall, 77% precision, 91% accuracy). The default, unweighted forest is the most precise (84%) and ranks applicants best (ROC-AUC 0.96 in the selection and test cells below). But it misses almost a third of defaulters at this threshold. The balanced logistic regression reaches 80% recall at 61% precision. We decide next which forest is best for the bank, on expected cost and training data only.
""")
add_after(166, "markdown", r"""
### **Choosing the final model and its decision threshold on training data only**

The comparison above uses the conventional 0.5 threshold. We never tested the class weights used so far (0.2/0.8 by convention, `balanced` from a recall-only grid search) against the business criterion. The bank's real question is which forest configuration, at its best threshold, gives the lowest expected cost of credit errors.

Class weights and the decision threshold are two dials for the same trade-off. So we choose them together, on that criterion, and **without touching the test set**. We score every candidate with **repeated 5-fold out-of-fold predictions on the training rows** (three different 5-fold splits, 15 validation folds). On those predictions we find the threshold that minimises the mean of the indicative expected cost. The indicative costs are about \$9,000 for a missed defaulter and about \$2,000 for a wrongly declined good applicant.

**Selection rule, fixed before the search:** the lowest mean expected cost on out-of-fold predictions wins. Among candidates within one fold-to-fold standard error of the lowest cost, we prefer the simplest (fewest non-default settings, fewer inputs).

1. Stage 1 searches the class weights and the minimum leaf size on all 27 inputs. The number of trees and the features tried per split stay at their defaults. The standard error is the standard deviation of the 15 pooled fold costs divided by the square root of 15. The robustness checks include a paired fold-by-fold check of the closest contest.
2. Stage 2 pits the winner against the recall-tuned grid winner, each on 27 and on 12 inputs. Stage 2 also tests the winner without any occupation information (21 inputs), the fallback a fair-lending review might require. We score the balanced logistic regression and the recall-tuned tree the same way at their own cost-minimising thresholds, for completeness on the chosen yardstick.

Only then do we refit the winner on all training rows and score it once on the test set.
""")
add_after(166, "code", r"""
#@title
from sklearn.model_selection import cross_val_predict
COST_FN, COST_FP = 9000, 2000
THRESHOLDS = np.round(np.arange(0.05, 0.71, 0.05), 2)
CV_REPEATS = [1, 2, 3]            # three different stratified 5-fold splits = 15 validation folds per candidate
COST_COL = 'Mean OOF expected cost per 1,000 ($)'

def cost_table(y_true, proba, thresholds=THRESHOLDS):
    rows = []
    for t in thresholds:
        pred = (proba > t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, pred).ravel(); n = len(y_true)
        rows.append({'threshold': float(t), 'recall': tp / (tp + fn), 'precision': tp / (tp + fp) if tp + fp else 0.0, 'accuracy': (tp + tn) / n,
                     'missed_defaulters_per_1000': 1000 * fn / n, 'good_customers_declined_per_1000': 1000 * fp / n,
                     'expected_cost_per_1000_$': 1000 * (fn * COST_FN + fp * COST_FP) / n})
    return pd.DataFrame(rows)

def oof_evaluate(model, cols, X=None):
    # repeated 5-fold out-of-fold evaluation on the training rows: mean threshold table, best row, mean AUC, fold-to-fold SD of the cost
    # (X defaults to the tree data X_train; the logistic regression passes its own capped and scaled frame)
    X = X_train if X is None else X
    probas, tables, fold_costs = [], [], {}
    for seed in CV_REPEATS:
        cv_rep = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        p = cross_val_predict(model, X[cols], y_train, cv=cv_rep, method='predict_proba')[:, 1]
        probas.append(p); tables.append(cost_table(y_train, p))
        for _, val in cv_rep.split(X[cols], y_train):
            fold_tbl = cost_table(y_train.iloc[val], p[val])
            for t, c in zip(fold_tbl['threshold'], fold_tbl['expected_cost_per_1000_$']):
                fold_costs.setdefault(t, []).append(c)
    tbl = pd.concat(tables).groupby('threshold', as_index=False).mean()
    best = tbl.loc[tbl['expected_cost_per_1000_$'].idxmin()]
    return {'probas': probas, 'table': tbl, 'best': best, 'auc': np.mean([metrics.roc_auc_score(y_train, p) for p in probas]),
            'fold_sd': np.std(fold_costs[best['threshold']], ddof=1)}

def summary_row(res):
    return {'Mean OOF ROC-AUC': res['auc'], 'Best threshold': res['best']['threshold'], 'OOF recall at best': res['best']['recall'],
            'OOF precision at best': res['best']['precision'], COST_COL: res['best']['expected_cost_per_1000_$'], 'Fold-to-fold SD of cost ($)': res['fold_sd']}

SELECTION_FORMAT = {'Mean OOF ROC-AUC': '{:.3f}', 'Best threshold': '{:.2f}', 'OOF recall at best': '{:.3f}', 'OOF precision at best': '{:.3f}',
                    COST_COL: '{:,.0f}', 'Fold-to-fold SD of cost ($)': '{:,.0f}'}

# Stage 1: class weights x minimum leaf size (200 trees, all 27 inputs)
weight_options = {'none': None, 'balanced': 'balanced', '0.3/0.7': {0: 0.3, 1: 0.7}, '0.2/0.8': {0: 0.2, 1: 0.8}, '0.1/0.9': {0: 0.1, 1: 0.9}}
stage1 = {}
for w_name, w in weight_options.items():
    for leaf in [1, 5, 10]:       # 1 = fully grown trees (default); 5 and 10 = the constrained settings in the recall-only grid (10 was its choice)
        stage1[(w_name, leaf)] = oof_evaluate(RandomForestClassifier(n_estimators=200, class_weight=w, min_samples_leaf=leaf, random_state=1, n_jobs=-1), list(X_train.columns))
config_search = pd.DataFrame({k: summary_row(v) for k, v in stage1.items()}).T
config_search.index.names = ['Class weights', 'Min. applicants per leaf']

# the pre-stated rule: lowest mean cost; among configurations within one standard error of it, the simplest
lowest = config_search[COST_COL].min()
one_se = config_search.loc[config_search[COST_COL].idxmin(), 'Fold-to-fold SD of cost ($)'] / np.sqrt(5 * len(CV_REPEATS))
within = config_search[config_search[COST_COL] <= lowest + one_se].copy()
within['non-default settings'] = [(w != 'none') + (leaf != 1) for w, leaf in within.index]
best_weights, best_leaf = within.sort_values(['non-default settings', COST_COL]).index[0]
best_leaf = int(best_leaf)
print(f'Lowest mean OOF cost ${lowest:,.0f}; one standard error ${one_se:,.0f}; within one SE: {list(within.index)}')
print(f'Stage 1 choice: class weights = {best_weights}, min. applicants per leaf = {best_leaf}')
config_search.style.format(SELECTION_FORMAT).highlight_min(subset=[COST_COL], color='#c6efce')
""")
add_after(166, "markdown", r"""
**Observations - configuration search:** fully grown trees beat constrained trees by a wide margin for every class-weight setting. A minimum leaf of 1 costs about \$317,000-345,000 per 1,000 applicants. A leaf of 5 costs roughly \$430,000-460,000 per 1,000 applicants, and the leaf of 10 that the recall-only grid search chose costs \$477,000-503,000. Constraining the leaves makes the probabilities cruder, which costs dearly once the threshold is free to move.

Among the fully grown forests the class weights barely matter. No weights (\$317,000), 0.3/0.7 (\$320,000) and 0.2/0.8 (\$321,000) are within one standard error (about \$10,500) of each other. They simply reach their minimum at different thresholds (0.15, 0.20, 0.25). The extreme 0.1/0.9 weighting is clearly worse, and `balanced` is somewhat worse (just outside one standard error).

By the pre-stated rule the unweighted forest is the stage 1 choice: it has the lowest mean cost and the simplest configuration. Its score also keeps a natural reading as an estimated default rate (we check this below with a calibration table).
""")
add_after(166, "code", r"""
#@title
# Stage 2: the chosen configuration against the recall-tuned grid winner, each on all 27 inputs and on the 12 most important features of the tuned forest
keep = pd.Series(rf_estimator_tuned.feature_importances_, index=X_train.columns).sort_values(ascending=False)
keep = keep[keep > 0.01].index.tolist()

def chosen_forest():
    return RandomForestClassifier(n_estimators=200, class_weight=weight_options[best_weights], min_samples_leaf=best_leaf, random_state=1, n_jobs=-1)

no_occupation = [c for c in X_train.columns if not c.startswith('JOB_')]   # fair-lending fallback: no occupation information at all (21 inputs)
candidates = {
    f'RF class weights {best_weights}, leaf {best_leaf}, 27 inputs': (chosen_forest(), list(X_train.columns)),
    f'RF class weights {best_weights}, leaf {best_leaf}, 21 inputs (no occupation)': (chosen_forest(), no_occupation),
    f'RF class weights {best_weights}, leaf {best_leaf}, 12 inputs': (chosen_forest(), keep),
    'RF recall-tuned grid winner, 27 inputs': (RandomForestClassifier(**grid_obj.best_params_, random_state=1, n_jobs=-1), list(X_train.columns)),
    'RF recall-tuned grid winner, 12 inputs': (RandomForestClassifier(**grid_obj.best_params_, random_state=1, n_jobs=-1), keep),
}
# the other techniques at their own cost-minimising thresholds, so the comparison on the chosen yardstick is complete
from sklearn.base import clone
other_techniques = {'Logistic Regression (balanced), own threshold': (clone(lg_bal), list(X_train_lr.columns), X_train_lr),
                    'Decision Tree (recall-tuned), own threshold': (clone(dtree_estimator), list(X_train.columns), X_train)}
oof = {}
for name, (model, cols) in candidates.items():
    oof[name] = stage1[(best_weights, best_leaf)] if name.endswith(f'leaf {best_leaf}, 27 inputs') else oof_evaluate(model, cols)
for name, (model, cols, frame) in other_techniques.items():
    oof[name] = oof_evaluate(model, cols, X=frame)
selection = pd.DataFrame({name: summary_row(res) for name, res in oof.items()}).T
selection.index.name = 'Candidate'
selection['Inputs'] = [len(cols) for _, cols in candidates.values()] + [len(c[1]) for c in other_techniques.values()]
lowest = selection[COST_COL].min()
one_se = selection.loc[selection[COST_COL].idxmin(), 'Fold-to-fold SD of cost ($)'] / np.sqrt(5 * len(CV_REPEATS))
within = selection[selection[COST_COL] <= lowest + one_se]
winner = within.sort_values(['Inputs', COST_COL]).index[0]       # simplest (fewest inputs) among those within one standard error
FINAL_THRESHOLD = float(selection.loc[winner, 'Best threshold'])
assert winner in candidates, "the cells that follow score the winner on the untreated tree data"
print(f'Within one standard error (${one_se:,.0f}) of the lowest cost: {list(within.index)}')
print('Selected model:', winner, '| selected threshold:', FINAL_THRESHOLD)
selection.style.format(SELECTION_FORMAT).highlight_min(subset=[COST_COL], color='#c6efce')
""")
add_after(166, "code", r"""
#@title
# Out-of-fold cost curve of the winner (mean over the three repeated 5-fold splits) and the sensitivity of the threshold to the cost ratio
# two panels that share the threshold axis, one y-axis each (no dual-axis chart)
tbl = oof[winner]['table']
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(9, 7), sharex=True)
ax1.plot(tbl['threshold'], tbl['recall'], marker='o', color='#3C8D5A', label='Recall (out-of-fold)')
ax1.plot(tbl['threshold'], tbl['precision'], marker='o', color='#4C72B0', label='Precision (out-of-fold)')
ax1.set_ylabel('score'); ax1.legend(loc='lower left')
ax1.set_title(f'{winner}: recall and precision by threshold (training rows, out-of-fold)')
ax2.plot(tbl['threshold'], tbl['expected_cost_per_1000_$'], marker='s', color='#1E2761')
ax2.set_ylabel('expected cost per 1,000 applicants ($)'); ax2.set_xlabel('probability threshold')
ax2.set_title('Indicative expected cost of credit errors by threshold')
for ax in (ax1, ax2):
    ax.axvline(FINAL_THRESHOLD, color='red', linestyle=':', linewidth=1)
plt.tight_layout(); plt.show()

rows = []
for ratio in [2, 3, 4.5, 6, 7, 8, 9]:
    costs = [sum(confusion_matrix(y_train, (p > t).astype(int)).ravel()[2] * ratio + confusion_matrix(y_train, (p > t).astype(int)).ravel()[1] for p in oof[winner]['probas']) for t in THRESHOLDS]
    rows.append({'cost of a missed defaulter / cost of a wrongly declined customer': f'{ratio}:1', 'cost-minimising threshold': THRESHOLDS[int(np.argmin(costs))],
                 'break-even threshold for a perfectly calibrated score': round(1 / (1 + ratio), 2)})
display(pd.DataFrame(rows))
tbl.round(3)
""")
add_after(166, "code", r"""
#@title
# Three robustness checks on the selection, all on training rows only
# (a) a finer threshold grid for the winner
fine = np.round(np.arange(0.08, 0.26, 0.01), 2)
fine_cost = np.mean([cost_table(y_train, p, thresholds=fine)['expected_cost_per_1000_$'].values for p in oof[winner]['probas']], axis=0)
print(f'(a) Finer grid, 0.01 steps: cost-minimising threshold {fine[int(np.argmin(fine_cost))]:.2f}; mean OOF cost per 1,000 ($) by threshold:')
print(pd.Series(fine_cost.round(0).astype(int), index=fine).to_frame('cost').T.to_string())

# (b) calibration of the out-of-fold scores: reliability table and Brier score, winner vs the class-weighted forest it replaced
score_bins = [0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.70, 1.0]
def reliability(proba, label):
    t = (pd.DataFrame({'score band': pd.cut(proba, score_bins, include_lowest=True), 'p': proba, 'y': y_train.values})
           .groupby('score band', observed=True).agg(applicants=('y', 'size'), mean_score=('p', 'mean'), observed_default_rate=('y', 'mean')))
    t.columns = pd.MultiIndex.from_product([[label], t.columns]); return t
p_final, p_weighted = oof[winner]['probas'][0], stage1[('0.2/0.8', 1)]['probas'][0]
print(f'(b) Brier score (lower is better; the base rate alone scores {metrics.brier_score_loss(y_train, np.full(len(y_train), y_train.mean())):.3f}): '
      f'final forest {metrics.brier_score_loss(y_train, p_final):.3f}, class weights 0.2/0.8 {metrics.brier_score_loss(y_train, p_weighted):.3f}')
display(pd.concat([reliability(p_final, 'Final forest (unweighted)'), reliability(p_weighted, 'Class weights 0.2/0.8')], axis=1).round(3))

# (d) the approve / refer / decline bands proposed later (0.10 and 0.25), on the out-of-fold scores of the training rows
oof_bands = pd.cut(p_final, [-0.01, 0.10, 0.25, 1.0], labels=['approve (score <= 0.10)', 'refer (0.10 - 0.25)', 'decline (score > 0.25)'])
band_oof = (pd.DataFrame({'band': oof_bands, 'defaulted': y_train.values}).groupby('band', observed=True)
              .agg(applicants=('defaulted', 'size'), defaulters=('defaulted', 'sum'), observed_default_rate=('defaulted', 'mean')))
band_oof['share_of_applicants'] = band_oof['applicants'] / len(y_train); band_oof['share_of_defaulters'] = band_oof['defaulters'] / y_train.sum()
print('(d) Approve / refer / decline bands on the out-of-fold scores (training rows):'); display(band_oof.round(3))

# (e) paired check of the 'within noise' statement: fold-by-fold cost difference, 0.2/0.8 forest at its best threshold minus the winner at its threshold
def fold_costs_at(res, t):
    out = []
    for seed, p in zip(CV_REPEATS, res['probas']):
        for _, val in StratifiedKFold(n_splits=5, shuffle=True, random_state=seed).split(X_train, y_train):
            out.append(cost_table(y_train.iloc[val], p[val], thresholds=np.array([t]))['expected_cost_per_1000_$'].iloc[0])
    return np.array(out)
weighted = stage1[('0.2/0.8', 1)]
diff = fold_costs_at(weighted, weighted['best']['threshold']) - fold_costs_at(oof[winner], FINAL_THRESHOLD)
print(f"(e) Paired fold-by-fold difference, 0.2/0.8 at {weighted['best']['threshold']:.2f} minus the winner at {FINAL_THRESHOLD:.2f}: mean ${diff.mean():,.0f} per 1,000, paired standard error ${diff.std(ddof=1) / np.sqrt(len(diff)):,.0f} ({len(diff)} folds)")

# (c) does the choice depend on this particular 70/30 split? Repeat stage 1 (fully grown trees) on two other stratified splits,
#     rebuilding the missing flags and the imputation from each split's own training rows
def training_rows_for_split(seed):
    frame = hm.copy()
    for c in ['REASON', 'JOB', 'BAD']:
        frame[c] = frame[c].astype('category')
    tr, _ = train_test_split(frame.index, test_size=0.3, random_state=seed, stratify=frame['BAD'])
    for col in [c for c in frame.columns if frame[c].isnull().any()]:
        frame[col + '_missing_values_flag'] = frame[col].isnull().astype(int)
    num = frame.select_dtypes('number').columns
    frame[num] = frame[num].fillna(frame.loc[tr, num].median())
    for c in ['REASON', 'JOB']:
        frame[c] = frame[c].fillna(frame.loc[tr, c].mode()[0])
    Xs = pd.get_dummies(frame.drop(['BAD'], axis=1), columns=['REASON', 'JOB'], drop_first=True, dtype=int)
    return Xs.loc[tr], frame.loc[tr, 'BAD'].astype(int)
rows = []
for seed in [2, 3]:
    Xs, ys = training_rows_for_split(seed)
    cv_s = StratifiedKFold(n_splits=5, shuffle=True, random_state=1)
    for w_name, w in weight_options.items():
        p = cross_val_predict(RandomForestClassifier(n_estimators=200, class_weight=w, random_state=1, n_jobs=-1), Xs, ys, cv=cv_s, method='predict_proba')[:, 1]
        t = cost_table(ys, p); best = t.loc[t['expected_cost_per_1000_$'].idxmin()]
        rows.append({'class weights': w_name, 'split seed': seed, 'best threshold': best['threshold'], 'OOF cost per 1,000 ($)': best['expected_cost_per_1000_$']})
split_check = pd.DataFrame(rows).pivot(index='class weights', columns='split seed', values=['best threshold', 'OOF cost per 1,000 ($)']).loc[list(weight_options)]
print('(c) Stage 1 repeated on two other 70/30 splits (fully grown trees, single 5-fold OOF). Cheapest configuration per split:',
      {seed: split_check[('OOF cost per 1,000 ($)', seed)].idxmin() for seed in [2, 3]})
split_check.style.format({c: ('{:.2f}' if c[0] == 'best threshold' else '{:,.0f}') for c in split_check.columns})
""")
add_after(166, "markdown", r"""
**Observations - model, threshold and robustness:** the unweighted forest on all 27 inputs has the lowest mean cost on out-of-fold predictions (about \$317,000 per 1,000 applicants). Removing all occupation information costs about 10% more (\$351,000, outside one standard error, so occupation carries real signal). The 12-input version costs about a fifth more, and the recall-tuned grid winner costs about half again as much. The balanced logistic regression and the recall-tuned tree, scored the same way at their own best thresholds, cost far more than any fully grown forest. So the technique choice holds on the chosen yardstick too.

The cost-minimising threshold is 0.15 (the model flags every applicant whose score exceeds 0.15, an estimated default risk of roughly one in five). It stays at 0.15 for cost ratios between 3:1 and 6:1. It falls to 0.10 only once a missed defaulter costs about eight times a wrongly declined applicant. A finer 0.01 grid gives the same threshold. The paired fold-by-fold comparison with the 0.2/0.8 forest (mean difference about \$4,000 per 1,000, paired standard error about \$5,000) shows the two are within noise. On two other 70/30 splits the unweighted forest is again the cheapest configuration, with the weighted forests within noise of it.

The calibration table shows why the optimum sits a little below the textbook break-even of 0.18 for a perfectly calibrated score. The forest's scores rank applicants well (Brier 0.062 against 0.160 for the base rate) but understate risk in the decision range. Applicants scored 0.15-0.20 defaulted about 23% of the time. By contrast, the class-weighted forest's scores are much further from the observed rates (7% for the same band). Read a score of 0.15 as "estimated default risk of roughly one in five", not exactly 15%.
""")
add_after(166, "code", r"""
#@title
# The final solution written out end to end, so that every step and every input to the scoring model is explicit
final_model, final_cols = candidates[winner]
flag_cols = [c for c in final_cols if c.endswith('_missing_values_flag')]
dummy_cols = [c for c in final_cols if c.startswith(('REASON_', 'JOB_')) and c not in flag_cols]
raw_cols = [c for c in final_cols if c not in flag_cols + dummy_cols]
assert len(final_cols) == len(raw_cols) + len(flag_cols) + len(dummy_cols) == 27 and final_cols == list(X_train.columns)
print(f'FINAL PIPELINE (every statistic below was learned on the {len(train_idx):,} training rows only)')
print(f'1. Raw inputs kept as numbers ({len(raw_cols)}):', raw_cols)
print(f'2. Missing-value flags, 1 if the field was blank ({len(flag_cols)}):', flag_cols)
print('3. Imputation of blanks - training-row medians:', {k: round(v, 2) for k, v in hm.loc[train_idx, num_cols].median().items()})
print('                          training-row modes  :', {c: hm.loc[train_idx, c].mode()[0] for c in ['REASON', 'JOB']})
print(f'4. One-hot encoding of REASON and JOB, first level dropped ({len(dummy_cols)}):', dummy_cols)
print('5. No outlier capping and no scaling: tree ensembles are unaffected by monotone transformations of an input')
print('6. Model:', type(final_model).__name__, {k: v for k, v in final_model.get_params().items() if k in ['n_estimators', 'class_weight', 'min_samples_leaf', 'max_features', 'max_depth', 'random_state']})
print(f'7. Model inputs, in order ({len(final_cols)}):', final_cols)
print(f'8. Decision rule: flag the applicant when the predicted default probability exceeds {FINAL_THRESHOLD:.2f} (break-even for a calibrated score at the stated costs: {COST_FP / (COST_FN + COST_FP):.2f})')
""")
add_after(166, "code", r"""
#@title
# Fit the winner on all training rows and score the test set once, at the selected threshold and at 0.5 for reference
final_model.fit(X_train[final_cols], y_train)
proba_test = final_model.predict_proba(X_test[final_cols])[:, 1]
final_pred = (proba_test > FINAL_THRESHOLD).astype(int)
print(f'Final model: {winner} at threshold {FINAL_THRESHOLD:.2f} - TEST SET')
metrics_score(y_test, final_pred)
print('Test ROC-AUC:', round(metrics.roc_auc_score(y_test, proba_test), 3))
cost_per_applicant = np.where((y_test == 1) & (final_pred == 0), COST_FN, np.where((y_test == 0) & (final_pred == 1), COST_FP, 0.0))
print(f"Today's process on these applicants (all approved, every defaulter missed): expected cost ${1000 * y_test.mean() * COST_FN:,.0f} per 1,000; the final model at {FINAL_THRESHOLD:.2f} cuts it by {1 - cost_per_applicant.mean() / (y_test.mean() * COST_FN):.1%}")
print(f"Test expected cost per 1,000 applicants: ${1000 * cost_per_applicant.mean():,.0f} (standard error about ${1000 * cost_per_applicant.std(ddof=1) / np.sqrt(len(y_test)):,.0f}); out-of-fold estimate ${oof[winner]['best']['expected_cost_per_1000_$']:,.0f}")
cost_table(y_test, proba_test, thresholds=np.array([FINAL_THRESHOLD, 0.5])).round(3)
""")
add_after(166, "code", r"""
#@title
# What the proposed three-band policy would mean in practice (test set): approve below a score of 0.10, refer 0.10 - 0.25 to an underwriter, decline above 0.25
bands = pd.cut(proba_test, [-0.01, 0.10, 0.25, 1.0], labels=['approve (score <= 0.10)', 'refer to underwriter (0.10 - 0.25)', 'decline (score > 0.25)'])
band_tbl = (pd.DataFrame({'band': bands, 'defaulted': y_test.values}).groupby('band', observed=True)
              .agg(applicants=('defaulted', 'size'), defaulters=('defaulted', 'sum'), observed_default_rate=('defaulted', 'mean')))
band_tbl['share_of_applicants'] = band_tbl['applicants'] / len(y_test)
band_tbl['share_of_defaulters'] = band_tbl['defaulters'] / y_test.sum()
band_tbl['per_1000_applicants'] = 1000 * band_tbl['share_of_applicants']
band_tbl.round(3)
""")
add_after(166, "code", r"""
#@title
# Where does the performance come from? The final model on the test applicants with a recorded debt-to-income ratio and on those without one
rows = []
for label, mask in [('ratio recorded', X_test['DEBTINC_missing_values_flag'] == 0), ('ratio missing', X_test['DEBTINC_missing_values_flag'] == 1)]:
    yt, pt, pp = y_test[mask], final_pred[mask.values], proba_test[mask.values]
    tn, fp, fn, tp = confusion_matrix(yt, pt).ravel()
    rows.append({'group': label, 'applicants': int(mask.sum()), 'share_of_applicants': mask.mean(), 'default_rate': yt.mean(), 'share_of_all_defaulters': yt.sum() / y_test.sum(),
                 'flagged': pt.mean(), 'recall': tp / (tp + fn), 'precision': tp / (tp + fp), 'ROC-AUC': metrics.roc_auc_score(yt, pp)})
pd.DataFrame(rows).set_index('group').round(3)
""")
add_after(166, "code", r"""
#@title
# What the final model relies on: impurity importance of the fitted forest and permutation importance (drop in test ROC-AUC when a column is shuffled);
# the test set is used here for interpretation only, no choice is made from it
from sklearn.inspection import permutation_importance
mdi = pd.Series(final_model.feature_importances_, index=final_cols).sort_values(ascending=False)
perm = permutation_importance(final_model, X_test[final_cols], y_test, scoring='roc_auc', n_repeats=5, random_state=1, n_jobs=-1)
perm_imp = pd.Series(perm.importances_mean, index=final_cols).sort_values(ascending=False)
pd.DataFrame({'impurity_importance': mdi.round(3), 'permutation_importance_auc_drop': perm_imp.round(4)}).sort_values('impurity_importance', ascending=False).head(12)
""")
add_after(166, "markdown", r"""
**Observations (final-model importances):** the debt-to-income ratio and its missing flag carry about a third of the final forest's split power (33%). Together with delinquent lines and credit-history length they carry about half (49%). Permutation importance ranks delinquent lines first, then the ratio, its missing flag and credit-history length. The 53% figure quoted earlier for the recall-tuned forest refers to that model, not to the final one.
""")
add_after(166, "code", r"""
#@title
# Explanation layer: a surrogate decision tree fitted to the forest's own decisions, and its agreement (fidelity) with the forest on the test applicants
# The surrogate is fitted to the forest's OUT-OF-FOLD decisions on the training rows: a fully grown forest reproduces its training labels
# almost perfectly, so its in-sample decisions would teach the surrogate the labels rather than the forest's behaviour on new applicants.
forest_decision_oof = (oof[winner]['probas'][0] > FINAL_THRESHOLD).astype(int)
forest_decision_insample = (final_model.predict_proba(X_train[final_cols])[:, 1] > FINAL_THRESHOLD).astype(int)
print(f'In-sample decisions agree with the training labels on {(forest_decision_insample == y_train.values).mean():.1%} of rows; '
      f'baseline: a rule that never flags anyone agrees with the forest test decisions {1 - final_pred.mean():.1%} of the time.')
for target_name, target in [('out-of-fold decisions', forest_decision_oof), ('in-sample decisions', forest_decision_insample)]:
    for depth in [3, 4, 5]:
        sur = DecisionTreeClassifier(max_depth=depth, min_samples_leaf=20, random_state=1).fit(X_train[final_cols], target)
        pred = sur.predict(X_test[final_cols])
        print(f'  surrogate target {target_name:22s} depth {depth}: fidelity {(pred == final_pred).mean():.1%}, kappa {metrics.cohen_kappa_score(final_pred, pred):.2f}')
surrogate = DecisionTreeClassifier(max_depth=4, min_samples_leaf=20, random_state=1).fit(X_train[final_cols], forest_decision_oof)
fidelity = (surrogate.predict(X_test[final_cols]) == final_pred).mean()
print(f'\nThe depth-4 surrogate tree (fitted to the out-of-fold decisions) reproduces {fidelity:.1%} of the forest decisions on unseen applicants.\n')
print(export_text(surrogate, feature_names=final_cols, max_depth=4, show_weights=False))
""")
md(167, r"""
**Insights (model selection and final model):**
- The configuration search shows that, once we choose the threshold on cost, class weights make no measurable difference. The unweighted forest, the 0.2/0.8 forest and the 0.3/0.7 forest are within one standard error of each other at their own best thresholds. Constrained trees (10 applicants per leaf, the recall-only grid choice) cost about half again as much. By the pre-stated rule we choose the **unweighted forest on all 27 inputs with a 0.15 threshold**. It has the lowest mean cost on out-of-fold predictions (about \$317,000 per 1,000 applicants). It is well ahead of the recall-tuned grid winner (\$490,000), the 12-input version (\$378,000) and the version without any occupation information (\$351,000, the fair-lending fallback).
- On the test set, scored once, it catches 93% of defaulters at 68% precision and 90% accuracy (ROC-AUC 0.96). Compared with the 0.5 threshold, missed defaulters fall from about 63 to 15 per 1,000 applicants. Wrongly flagged good applicants rise from about 26 to 87 per 1,000 applicants. The indicative expected cost halves (about \$0.30 million vs \$0.62 million per 1,000). The test cost (\$304,000 ± \$28,000 standard error per 1,000) is consistent with the out-of-fold estimate (\$317,000). One test evaluation is too noisy to adjudicate between the fully grown configurations, so that choice rests on the out-of-fold comparison.
- The 0.15 threshold sits just below the textbook break-even for a perfectly calibrated score (0.18). The reason is that the forest's scores understate risk in the decision range (applicants scored 0.15-0.20 defaulted about 23% of the time). The threshold held on a finer threshold grid and on two other train/test splits.
- In practice the bank would approve about 69% of applicants automatically (about 1% default). It would refer about 7% to an underwriter (about 24% default) and decline about 24% (74% default, 87% of all defaulters). Overall the model flags about 27% of applicants, an approval rate of about 73% on a population the bank approves in full today. All quoted performance figures are for the single 0.15 threshold. Under the bands the share of defaulters caught lies between about 87% (every referral approved) and 96% (every referral declined).
- Two thirds of all defaulters sit in the fifth of applicants with no recorded debt-to-income ratio, a group the model flags almost entirely (96%). On applicants with a recorded ratio it flags 9% and catches 83% of their defaulters at 80% precision. Those figures are the better guide to its behaviour once income verification is mandatory and the bank re-trains the model.
- We fit the depth-4 surrogate tree to the forest's out-of-fold decisions. It reproduces about 93% of the forest's decisions on unseen applicants (73% for a rule that never flags anyone). So its three rules are a faithful plain-language summary of the scoring engine:
  1. the debt-to-income ratio is missing,
  2. the ratio is above about 44%,
  3. the ratio is at or below 44%, and the applicant has both a delinquent line and a derogatory report.
""")
md(168, r"""
**1. Comparison of various techniques and their relative performance based on chosen Metric (Measure of success):**
- How do different techniques perform? Which one is performing relatively better? Is there scope to improve the performance further?

*Measure of success.* Recall on the defaulter class is the primary metric because a missed defaulter costs the bank about 4.5 times a wrongly declined good applicant. Precision and F1 are the guard-rails. We report accuracy for completeness.

*Linear vs non-linear.* The balanced logistic regression reaches 80% recall but only 61% precision. The data is made of thresholds (debt-to-income above 45%, any delinquency), which trees capture and a straight line cannot. The linear model remains the most transparent benchmark.

*Single tree vs bagging vs forest.* The tuned decision tree catches the most defaulters at the 0.5 threshold (82%). But it declines almost one good applicant for every defaulter it catches (53% precision). Bagging 200 trees shows the value of averaging. Against the single fully grown (class-weighted) tree, precision rises from 72% to 83% and recall from 62% to 68%.

The class-weighted Random Forest adds feature sub-sampling and class weights. It reaches 77% recall at 77% precision, the best balance at 0.5. The recall-tuned forest reaches 79% recall with lower precision (66%). Once we include the cost of lower precision, it has a clearly higher expected cost. The out-of-fold cost search above decides which forest is best for the bank, not this table.

*Pros and cons.* Logistic regression is fully transparent and trivial to run, but it under-fits threshold effects on the raw inputs. A decision tree gives a readable rule list, but it is unstable between re-trainings and has the lowest precision. Bagging and Random Forest have the best test-set performance and are the most stable. We explain them through feature importances, a surrogate tree and per-applicant risk drivers rather than a rule list. They need model-risk documentation and drift monitoring like any credit model.

*Scope to improve.* Yes:

1. Choosing the decision threshold on expected cost (done above, on training data only) lifts recall above 90% at a controlled precision cost. The 0.15 threshold on the unweighted forest gives 93% recall and 68% precision on the test set.
2. Engineered features such as loan-to-value and payment-to-income.
3. Gradient boosting and probability calibration.
4. Reject inference, because the data only covers loans the bank approved.
""")
md(169, r"""
**2. Refined insights:**
- What are the most meaningful insights relevant to the problem?

1. **Affordability, and whether the bank can check it, decides most outcomes.** The debt-to-income ratio and its missing flag are among the top features in every model (the top two by the forest's impurity importance). An applicant with no ratio that the bank can check defaulted 62% of the time. One with a ratio above 45% defaulted 87-100% of the time.
2. **Past repayment behaviour is the next most important predictor.** Delinquent lines, derogatory reports and recent inquiries all raise default risk as they increase (with noise in the small groups at the top). The tree's top splits and the forest's importances agree.
3. **Credit-history length protects:** about 10% default with 20+ years of history versus 44% with under 5 years.
4. **Loan size, property value and mortgage balance are secondary.** They matter in combination (small loans are riskier, missing valuations are almost always bad) but are weak on their own.
5. **Occupation and loan purpose matter little on their own.** They barely move performance at the conventional threshold, but they are not worthless (see insight 8). So their use is a fair-lending decision with a known price rather than a free simplification.
6. **Handling imbalance and missingness mattered more than the choice of algorithm.** At the 0.5 threshold class weights improved recall by about 23 points for the logistic regression and 9 for the forest. Averaging trees mainly bought precision. Once we chose the threshold on cost, however, we no longer needed the class weights. The unweighted forest at a 0.15 threshold was the cheapest configuration.
7. **The decision threshold is a business dial, and the bank should set it on training data.** With the forest's ranking ability the bank can move recall between about 70% and 94% by changing the threshold. The cost-minimising threshold of 0.15, chosen on repeated out-of-fold predictions, catches about 93% of defaulters with 68% precision on unseen applicants. It also holds when we use a finer grid or change the train/test split. It sits just below the textbook break-even (0.18) because the scores understate risk in the decision range.
8. **Occupation and loan purpose add little on their own but are not worthless.** Removing them and nine minor flags raised the expected cost on out-of-fold predictions by about a fifth. Removing occupation alone raised it by about 10%. So the fair-lending review should clear their use, with the 21-input model without occupation as the fallback.
""")
md(170, r"""
**3. Proposal for the final solution design:**
- What model do you propose to be adopted? Why is this the best solution to adopt?

**Proposal: a Random Forest scoring engine with a cost-based decision threshold, explained by a surrogate decision tree.**

- *Specification:*
  - Model: a Random Forest with 200 fully grown trees and no class weights. The configuration search showed that class weights make no measurable difference once we choose the threshold on cost.
  - Inputs: the 27 inputs listed in the final-pipeline cell (ten financial attributes, eleven missing-value flags, six occupation and loan-purpose indicators). We train the forest on the untreated data, with a missing flag per column and median/mode imputation learned on the training rows.
  - Decision threshold: 0.15, chosen by minimising expected cost on repeated out-of-fold predictions. It is stable for cost ratios between 3:1 and 6:1 and unchanged on two other train/test splits. It sits just below the theoretical break-even of 0.18, as expected for a score that understates risk. The bank should re-derive it with its own loss and margin figures.
  - Bands: approve / refer / decline bands (about 69% / 7% / 24% of applicants on the test set), so an underwriter still reviews the applicants near the threshold.
  - Fallback: the same forest without any occupation information (21 inputs), about 10% more expensive in credit errors, if the fair-lending review requires it. The 12-input lean model costs about a fifth more, and we do not recommend it.
- *Why it is the best solution:*
  - It had the lowest expected cost on repeated out-of-fold predictions of fifteen forest configurations and five final candidates, without any use of the test set.
  - On the held-out applicants it then caught 93% of defaulters at 68% precision and 90% accuracy (ROC-AUC 0.96). That is far better than the single tree (82% recall at 53% precision) and the logistic regression (80% at 61%). It is also well ahead of the recall-tuned forest once we include the cost of lower precision.
  - It is stable because it averages hundreds of trees and because its out-of-fold and test results agree.
  - Because it is unweighted, its score is close to a default rate. In the decision range it understates that rate (applicants scored 0.15-0.20 defaulted about 23% of the time). So the 0.15 threshold reads as "refer or decline above roughly one-in-five estimated risk".
- *Performance vs interpretability:* a depth-4 surrogate decision tree fitted to the forest's out-of-fold decisions reproduces about 93% of them on unseen applicants. Per-applicant risk drivers from the forest (for example SHAP values, built in months 0-2) give the reason for each decline. This includes the automatic declines above 0.25. The surrogate gives the plain-language summary of the rules:
  - the ratio is missing,
  - the ratio is above about 44%,
  - a delinquent line together with a derogatory report.
- *How it solves the problem:* per 1,000 applicants it flags about 185 of 200 defaulters before the money leaves the bank. It flags about 87 good applicants per 1,000 at the 0.15 threshold. Under the approve / refer / decline bands, the bank declines about 62 good applicants per 1,000 automatically and refers about 55. It cuts the indicative default-related cost per 1,000 applicants from roughly \$1.8 million to about \$0.3 million. It also gives the bank explicit policy rules that the bank can adopt immediately, with thresholds taken from the observed default rates in the EDA:
  - check income and valuation,
  - cap debt-to-income at 45%,
  - refer applicants with two or more delinquencies or derogatory reports to an underwriter.
- *Guard-rails:*
  - a shadow period on all applications (the training data covers only loans the old process approved),
  - mandatory income verification introduced alongside the shadow period,
  - a test before go-live on the historical applicants with a recorded ratio, with a refit if necessary (verification removes the model's strongest signal),
  - re-training on the outcomes of newly verified applicants after 12 months or more of repayment data,
  - a fair-lending review before go-live,
  - monthly monitoring of recall, precision and approval rate,
  - yearly re-training.
""")

# ----------------------------------------------------------------------------- assemble
new_cells = []
for i, c in enumerate(cells):
    c = copy.deepcopy(c)
    if i in replace:
        kind, src = replace[i]
        assert c.cell_type == kind, (i, c.cell_type, kind)
        c.source = src
    if c.cell_type == "code":
        c.outputs = []
        c.execution_count = None
    new_cells.append(c)
    for kind, src in after.get(i, []):
        new_cells.append(nbf.v4.new_markdown_cell(src) if kind == "markdown" else nbf.v4.new_code_cell(src))

unfilled = [i for i, c in enumerate(new_cells) if "___" in "".join(c.source)]
assert not unfilled, f"blanks left in cells {unfilled}"
nb.cells = new_cells
nb.metadata["kernelspec"] = {"display_name": "Python 3", "language": "python", "name": "python3"}
nbf.write(nb, OUT)
print(f"Wrote {OUT} with {len(new_cells)} cells ({len(replace)} replaced, {sum(len(v) for v in after.values())} added)")
