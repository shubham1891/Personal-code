# Loan Default Prediction - Capstone Project

This is the capstone project for the MIT Professional Education **Applied AI and Data Science Program** (Practical Data Science track, classification).

The consumer credit department of a bank wants an empirically derived, interpretable model. The department wants this model to predict which applicants for a home equity loan are likely to default. The department also wants recommendations on which applicant attributes matter most when the bank approves a loan. The data is the Home Equity (HMEQ) dataset: 5,960 recent loans, 12 input attributes, and a binary target `BAD` (1 = defaulted or seriously delinquent).

## Deliverables

The program grades one of two tracks. The participant chooses this track on the preference form. This repository provides both tracks.

| Stage | Full-code track | Low-code track |
|---|---|---|
| Milestone (20 pts) | `notebooks/Loan_Default_Prediction_Capstone.html` (executed full-code notebook, with the `.ipynb` file next to it) | `reports/Loan_Default_Prediction_Milestone_Report.pdf` (business report, supported by the completed template notebook `notebooks/Loan_Default_Prediction_Low_Code.html`) |
| Final report (40 pts) | `reports/Loan_Default_Prediction_Final_Report.pdf` (Word source alongside) | same |
| Live presentation (40 pts) | `presentation/Loan_Default_Prediction_Presentation.pdf` (PowerPoint source alongside) | same |

Upload exactly one file for each stage. If you upload a notebook and a report together, the graders mark only the report. They do not mark a submission that has more than one file.

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

Each notebook runs end to end in a few minutes on a laptop. The slow steps are the grid searches and the step that chooses the final model on out-of-fold predictions. We fixed all random seeds, so the numbers in the reports and slides are reproducible.

## Approach in brief

Exploratory analysis showed the following. One in five loans defaults. A missing debt-to-income ratio is the single strongest risk signal (62% default rate versus 8.6% when the ratio is present). Loans with debt-to-income above 45% almost always default. Delinquencies, derogatory reports and a short credit history raise risk sharply.

We separated a stratified 30% test set before we fitted any statistic. We flagged missing values and imputed them with training-row medians and modes. We capped outliers only for the linear model.

We trained Logistic Regression, a Decision Tree, a bagged ensemble of trees and a Random Forest. We tuned the Logistic Regression, the Decision Tree and the Random Forest with cross-validated grid search on recall. We compared the models on recall (primary), precision, F1 and ROC-AUC.

We then chose the final model's configuration (class weights, tree size, input set) and its decision threshold together, with training data only. The criterion was the expected cost of credit errors on repeated out-of-fold predictions. We fixed the rule for this choice in advance. We scored the test set once. On the test set, the unweighted Random Forest on all 27 inputs at a 0.15 threshold catches 93% of defaulters at 68% precision.

We wrote the final pipeline step by step in the notebook so that every input to the scoring model is explicit. We fitted a surrogate decision tree to the forest's out-of-fold decisions. It agrees with the forest on 93% of unseen applicants and gives the plain-language summary of how the model decides. The bank builds per-applicant risk drivers from the forest (for example SHAP values) in the first two months, before the shadow run. These drivers give the reason for each decline that the Equal Credit Opportunity Act requires.
