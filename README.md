# Loan Default Prediction - Capstone Project

Capstone project for the MIT Professional Education **Applied AI and Data Science Program** (Practical Data Science track, classification).

A bank's consumer credit department wants an empirically derived, interpretable model to predict which home equity loan applicants are likely to default, and recommendations on which applicant attributes matter most when approving a loan. The data is the Home Equity (HMEQ) dataset: 5,960 recent loans, 12 input attributes, and a binary target `BAD` (1 = defaulted or seriously delinquent).

## Deliverables

| Stage | File | Format for submission |
|---|---|---|
| Milestone (20 pts) | `notebooks/Loan_Default_Prediction_Capstone.ipynb` | `notebooks/Loan_Default_Prediction_Capstone.html` (executed notebook, full-code version) |
| Final report (40 pts) | `reports/Loan_Default_Prediction_Final_Report.docx` | `reports/Loan_Default_Prediction_Final_Report.pdf` |
| Live presentation (40 pts) | `presentation/Loan_Default_Prediction_Presentation.pptx` | `presentation/Loan_Default_Prediction_Presentation.pdf` |

## Repository layout

```
data/           hmeq.csv - the dataset as provided by the program
notebooks/      executed capstone notebook (.ipynb) and its HTML export
reports/        final submission report (Word and PDF)
presentation/   live presentation slides (PowerPoint and PDF)
scripts/        build_notebook.py (generates the notebook), run_notebook.py (executes it and exports HTML),
                build_report.js and build_presentation.js (generate the report and slides)
```

## Reproducing

```bash
pip install -r requirements.txt
python3 scripts/build_notebook.py     # writes the notebook from the generator script
python3 scripts/run_notebook.py       # executes every cell and writes the HTML export
```

The notebook runs end to end in roughly five minutes on a laptop (the Random Forest grid search is the slow step). All random seeds are fixed, so the numbers in the report and slides are reproducible.

## Approach in one paragraph

Exploratory analysis showed that one in five loans defaults, that a missing debt-to-income ratio is the single strongest risk signal (62% default rate versus 8.6% when present), that debt-to-income above 45% almost always defaults, and that delinquencies, derogatory reports and a short credit history raise risk sharply. Missing values were flagged and imputed, outliers were capped only for the linear model, and the data was split 70/30 with stratification. Logistic Regression, a Decision Tree and a Random Forest were trained, tuned with cross-validated grid search on recall, and compared on recall (primary), precision, F1 and ROC-AUC. The proposed solution is a class-weighted Random Forest as the scoring engine with a pruned Decision Tree as the explanation layer for adverse-action notices, with the decision threshold set from the bank's cost of a missed default versus a wrongly declined customer.
