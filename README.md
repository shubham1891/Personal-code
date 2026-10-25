# Loan Default Prediction - Capstone Project

Capstone project for the MIT Professional Education **Applied AI and Data Science Program** (Practical Data Science track, classification).

A bank's consumer credit department wants an empirically derived, interpretable model to predict which home equity loan applicants are likely to default, and recommendations on which applicant attributes matter most when approving a loan. The data is the Home Equity (HMEQ) dataset: 5,960 recent loans, 12 input attributes, and a binary target `BAD` (1 = defaulted or seriously delinquent).

## Deliverables

The program grades one of two tracks, chosen on the preference form. Both are provided.

| Stage | Full-code track | Low-code track |
|---|---|---|
| Milestone (20 pts) | `notebooks/Loan_Default_Prediction_Capstone.html` (executed full-code notebook; `.ipynb` alongside) | `reports/Loan_Default_Prediction_Milestone_Report.pdf` (business report; the completed template notebook `notebooks/Loan_Default_Prediction_Low_Code.html` supports it) |
| Final report (40 pts) | `reports/Loan_Default_Prediction_Final_Report.pdf` (Word source alongside) | same |
| Live presentation (40 pts) | `presentation/Loan_Default_Prediction_Presentation.pdf` (PowerPoint source alongside) | same |

## Repository layout

```
data/           hmeq.csv - the dataset as provided by the program
notebooks/      executed full-code notebook and completed low-code template notebook (.ipynb + HTML)
reports/        milestone report and final submission report (Word and PDF), report figures
presentation/   live presentation slides (PowerPoint and PDF)
scripts/        build_notebook.py / build_lowcode_notebook.py (generate the notebooks), run_notebook.py (executes a
                notebook and exports HTML), make_report_figures.py, build_milestone_report.js, build_report.js,
                build_presentation.js (generate the report figures, reports and slides), dump_text.py (review dumps)
```

## Reproducing

```bash
pip install -r requirements.txt
python3 scripts/build_notebook.py                      # writes the full-code notebook from the generator script
python3 scripts/run_notebook.py                        # executes every cell and writes the HTML export
python3 scripts/build_lowcode_notebook.py              # completes the low-code template (needs the template file path inside)
python3 scripts/run_notebook.py notebooks/Loan_Default_Prediction_Low_Code.ipynb
python3 scripts/make_report_figures.py                 # business-labelled charts for the reports (reads the executed notebook)
node scripts/build_milestone_report.js && node scripts/build_report.js && node scripts/build_presentation.js
```

Each notebook runs end to end in a few minutes on a laptop (the grid searches and the out-of-fold model selection are the slow steps). All random seeds are fixed, so the numbers in the reports and slides are reproducible.

## Approach in one paragraph

Exploratory analysis showed that one in five loans defaults, that a missing debt-to-income ratio is the single strongest risk signal (62% default rate versus 8.6% when present), that debt-to-income above 45% almost always defaults, and that delinquencies, derogatory reports and a short credit history raise risk sharply. A stratified 30% test set was held out before any statistic was fitted; missing values were flagged and imputed with training-row medians and modes; outliers were capped only for the linear model. Logistic Regression, a Decision Tree, a bagged ensemble of trees and a Random Forest were trained, tuned with cross-validated grid search on recall, and compared on recall (primary), precision, F1 and ROC-AUC. The final model and its decision threshold were then chosen on out-of-fold expected cost of credit errors using training data only, and the test set was scored once: the class-weighted Random Forest at a 0.25 threshold catches 93% of defaulters at 67% precision. A surrogate decision tree fitted to the forest's decisions (90% agreement) provides the plain-language reasons the Equal Credit Opportunity Act requires.
