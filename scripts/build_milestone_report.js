// Builds reports/Loan_Default_Prediction_Milestone_Report.docx (Milestone submission, Low-code track business report).
// Structure follows the program's Report Template: Problem Definition, Data Exploration, Building Models,
// Comparison of Techniques, Proposal for the Final Solution Design.
// Run from the repository root:  node scripts/build_milestone_report.js
// Requires the figures produced by scripts/make_report_figures.py.

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, LevelFormat, PageBreak, Footer, PageNumber,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const FIG = (name) => fs.readFileSync(path.join(ROOT, "reports", "figures", name));
const OUT = path.join(ROOT, "reports", "Loan_Default_Prediction_Milestone_Report.docx");

const NAVY = "1E2761";
const GREY = "595959";
const FONT = "Calibri";

const p = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 140, line: 276 }, alignment: opts.align || AlignmentType.JUSTIFIED,
    children: Array.isArray(text) ? text : [new TextRun({ text, font: FONT, size: 22, ...opts.run })], ...opts.para });
const bold = (t) => new TextRun({ text: t, bold: true, font: FONT, size: 22 });
const txt = (t) => new TextRun({ text: t, font: FONT, size: 22 });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 320, after: 160 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: NAVY })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: NAVY })] });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 90, line: 264 }, children: Array.isArray(runs) ? runs : [txt(runs)] });
const numbered = (runs, ref) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 100, line: 264 }, children: Array.isArray(runs) ? runs : [txt(runs)] });
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: t, italics: true, font: FONT, size: 19, color: GREY })] });
const figure = (name, w, h) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
  children: [new ImageRun({ type: "png", data: FIG(name), transformation: { width: Math.round(w * 96), height: Math.round(h * 96) } })] });
const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(header, rows, widths, keepTogether = false) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (text, isHeader, w, alignRight, keep = false) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 0 }, keepNext: keep,
      children: [new TextRun({ text: String(text), bold: isHeader, font: FONT, size: 19, color: isHeader ? "FFFFFF" : "000000" })] })],
  });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [
    new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => cell(h, true, widths[i], false, keepTogether)) }),
    ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, false, widths[i], i > 0 && /^[\d$.,%\-]+$/.test(String(c)), keepTogether && ri < rows.length - 1)) })),
  ] });
}

const children = [];

// ---------------------------------------------------------------- title
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 200 }, children: [new TextRun({ text: "Capstone Project: Loan Default Prediction", font: FONT, bold: true, size: 44, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Milestone Report", font: FONT, size: 30, color: GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Problem Definition, Data Exploration, Building Models, Comparison of Techniques, Final Solution Design", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Practical Data Science track (Classification)  |  MIT Professional Education - Applied AI and Data Science Program", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: "Shubham Garg  |  November 2026", font: FONT, size: 22, color: GREY })] }),
);

// ---------------------------------------------------------------- 1. problem definition
children.push(h1("1. Problem Definition"));
children.push(h2("Context: why this problem is important to solve"));
children.push(p("A large share of a retail bank's profit comes from the interest it earns on home loans and home equity lines of credit. The single biggest threat to that profit is the borrower who does not repay the loan. Every loan that becomes a non-performing asset removes the interest earned on many good loans. Today an underwriter studies each application manually and decides whether to approve it. That process is slow, expensive, inconsistent between underwriters and open to human error and bias. Earlier attempts to automate it relied on hand-written heuristics."));
children.push(p([txt("The numbers size the problem. In the bank's own recent book of "), bold("5,960 home equity loans, 1,189 (19.9%) ended in default or serious delinquency"), txt(". The current process approved all of them. Those loans averaged about $16,900, so the bank put roughly $20 million of principal at risk. The bank recovered about half through the collateral, so it lost roughly $10 million on this book alone. Every ten defaulters avoided saves about $90,000 (at the $9,000 per defaulter used throughout). Every good applicant wrongly declined costs only the interest margin on one loan, about $2,000.")]));
children.push(p([bold("Advantages of solving it. "), txt("A reliable, explainable scoring model has four advantages. (1) It cuts credit losses by stopping likely defaulters at the door. (2) It protects revenue by not declining good applicants unnecessarily. (3) It makes decisions faster and standardises them, so underwriters spend their time on the genuinely uncertain cases. (4) It gives the bank documented, consistent reasons for every decision, a regulatory requirement under the Equal Credit Opportunity Act (ECOA) and a fairness safeguard.")]));

children.push(h2("Objectives: the intended goals"));
children.push(p("Build a classification model that predicts at application time whether an applicant will likely default on a home equity loan. Recommend to the bank which applicant attributes matter most when it approves a loan. In priority order:"));
children.push(
  numbered([bold("Catch defaulters early: "), txt("maximise the share of future defaulters that the model flags at application time (recall on the default class). A missed defaulter is the costliest error.")], "goals"),
  numbered([bold("Protect good business: "), txt("keep the share of wrongly declined good applicants acceptable (precision), so that lower risk does not cost the bank revenue.")], "goals"),
  numbered([bold("Stay interpretable: "), txt("the bank must be able to give an applicant a specific, defensible reason for an adverse decision. A black box that cannot explain an adverse decision is not usable in production.")], "goals"),
  numbered([bold("Guide policy: "), txt("identify the attributes that matter most. The bank can then tighten its approval rules and data collection, even before it deploys a model.")], "goals"),
);

children.push(h2("The key questions"));
children.push(
  numbered("What share of past applicants defaulted, and how imbalanced is the problem?", "kq"),
  numbered("Which applicant attributes (debt burden, credit history, loan size, job, loan purpose, property value) separate defaulters from repayers?", "kq"),
  numbered("How should we treat missing information? Is the absence of information itself a risk signal?", "kq"),
  numbered("Which technique (linear vs tree-based vs ensemble) gives the best trade-off between catching defaulters and wrongly declining good applicants?", "kq"),
  numbered("What is the right measure of success for this business problem, and how do the models compare on it?", "kq"),
  numbered("Which model should the bank adopt, with what settings, and what rules can it communicate to applicants and regulators?", "kq"),
);

children.push(h2("The problem formulation"));
children.push(p("As a data-science problem this is supervised binary classification. Each row of the data is a past loan with 12 attributes known at application time. Each row also has a target BAD (1 = defaulted or seriously delinquent, 0 = repaid). Data science fits into the approval process as a scoring step. The model converts an application into a probability of default. The bank converts that probability into a flag or clear decision with a threshold set from the cost of the two possible errors. Cases in a referral band around the threshold go to an underwriter. An explanation layer converts the decision into reasons. The work therefore covers these steps. We explore and clean the data, then train a linear model (Logistic Regression) and non-linear models (Decision Tree, bagged trees, Random Forest). We tune them with cross-validation and choose the final model and its threshold on the expected-cost criterion. We propose a solution design that balances performance with interpretability."));

// ---------------------------------------------------------------- 2. data exploration
children.push(h1("2. Data Exploration"));
children.push(h2("Data description"));
children.push(p("The Home Equity (HMEQ) dataset contains baseline and loan-performance information for 5,960 recent home equity loans that the bank approved. The target BAD indicates whether the applicant ultimately defaulted or became seriously delinquent (1,189 cases, 19.9%). The dataset records twelve inputs for each applicant:"));
children.push(table(
  ["Variable", "Meaning", "Type"],
  [
    ["LOAN", "Amount of loan approved", "numeric, complete"],
    ["MORTDUE", "Amount due on the existing mortgage", "numeric, 8.7% missing"],
    ["VALUE", "Current value of the property", "numeric, 1.9% missing"],
    ["REASON", "Reason for the loan: HomeImp (home improvement) or DebtCon (debt consolidation)", "categorical, 4.2% missing"],
    ["JOB", "Occupation: Mgr, Office, Other, ProfExe, Sales, Self", "categorical, 4.7% missing"],
    ["YOJ", "Years at present job", "numeric, 8.6% missing"],
    ["DEROG", "Number of major derogatory reports", "count, 11.9% missing"],
    ["DELINQ", "Number of delinquent credit lines", "count, 9.7% missing"],
    ["CLAGE", "Age of the oldest credit line in months", "numeric, 5.2% missing"],
    ["NINQ", "Number of recent credit inquiries", "count, 8.6% missing"],
    ["CLNO", "Number of existing credit lines", "count, 3.7% missing"],
    ["DEBTINC", "Debt-to-income ratio (%)", "numeric, 21.3% missing"],
  ],
  [1500, 5560, 2300],
));
children.push(caption("Table 1. The twelve applicant attributes and their missing-value rates."));
children.push(p("There are no duplicate rows. 44% of applications have at least one blank field, so we cannot simply remove those rows. Loan amounts range from $1,100 to $89,900 (median $16,300) and are right-skewed, as are property values and mortgage balances. The debt-to-income ratio is tightly concentrated between 29% and 39% for the middle half of applicants but contains impossible values (a maximum of 203%). The age of the oldest credit line has an implausible maximum of 97 years. Three quarters of applicants have no derogatory report and no delinquent credit line."));

children.push(h2("Observations and insights"));
children.push(p([bold("Missing information is the strongest single risk signal. "), txt("Applicants with no recorded debt-to-income ratio defaulted 62% of the time, against 8.6% for applicants with a recorded ratio. Applicants with no property valuation defaulted 94% of the time (Figure 1). For the problem this means that the bank should treat an unverifiable income or collateral as a red flag, not a neutral gap. It also means that the models must be able to see whether a field was blank.")]));
children.push(figure("report_missing_vs_present.png", 6.4, 2.71));
children.push(caption("Figure 1. Default rate when an attribute is missing versus present."));
children.push(p([bold("Debt burden has a hard threshold. Credit history protects. Small loans are not safe loans. "), txt("Between a 20% and a 40% debt-to-income ratio only 4% to 7% of applicants default. Between 40% and 45% the rate is 11%, and above 45% it is 87% to 100%. Applicants with under five years of credit history default 44% of the time against about 10% with over twenty years. Loans under $5,000 default 57% of the time, almost three times the average (Figure 2). These are threshold-shaped relationships that a straight line cannot represent well. This already suggests that tree-based models will do better than a purely linear one.")]));
children.push(figure("report_default_rate_bands.png", 6.6, 2.14));
children.push(caption("Figure 2. Default rate by debt-to-income band, length of credit history and loan amount."));
children.push(p([bold("Past repayment behaviour predicts future behaviour. "), txt("The default rate rises from 17% with no major derogatory report to 39% with one, 51% with two and about 75% with three or more. It rises from 14% with no delinquent credit line to 34% with one, 45% with two and 100% with six or more. It rises from 16% with no recent credit inquiry to about 45-50% with five or more (Figure 3). Each of these is a plain-language reason that the bank can give an applicant.")]));
children.push(figure("report_credit_history.png", 6.6, 2.14));
children.push(caption("Figure 3. Default rate by number of derogatory reports, delinquent credit lines and recent credit inquiries."));
children.push(p([bold("Occupation matters moderately. Loan purpose barely matters. "), txt("Sales (35%) and self-employed (30%) applicants default most. Office workers (13%) and professionals (17%) default least. Home-improvement loans default slightly more often than debt-consolidation loans (22% vs 19%). Both relationships are statistically significant (chi-square tests, p = 0.005 for loan purpose, p < 0.001 for occupation). However, loan purpose is too weak to drive decisions, and the bank must handle occupation with care under fair-lending rules.")]));
children.push(p([bold("Amounts differ significantly but modestly. "), txt("Defaulters borrowed less (median $14,900 vs $16,900) and had slightly lower property values ($82,000 vs $90,659) and mortgage balances ($60,279 vs $66,839). Mann-Whitney tests give p < 0.001 for each, but the gaps are small relative to the amounts. Property value and mortgage balance are correlated at 0.88, so they carry much the same information.")]));

children.push(h2("Data treatments and pre-processing"));
children.push(
  bullet([bold("Test set reserved first. "), txt("We reserved a stratified 30% of applicants (1,788, including 357 defaulters) as the test set before we fitted any statistic. This ensures that outlier fences, imputation values and scaling never see the test rows.")]),
  bullet([bold("Missing values. "), txt("We created a 0/1 'was missing' flag for each of the eleven columns with gaps. We then filled numerical gaps with the training-row median and categorical gaps with the training-row mode. We removed no rows.")]),
  bullet([bold("Outliers. "), txt("For the linear model only, we capped continuous variables at the inter-quartile whiskers computed on the training rows. This removes the impossible debt-to-income and credit-age values. For the same model, we also capped the two count variables at their 99th percentile, because their inter-quartile range is zero. Tree models use the untouched values, since they split on rank order and would otherwise lose information such as 'above 50% always defaults'.")]),
  bullet([bold("Encoding and scaling. "), txt("We one-hot encoded loan purpose and occupation (first level removed). We standardised the continuous inputs for the logistic regression only. We left the flags as 0/1 so their coefficients read as the effect of the flag.")]),
  bullet([bold("Imbalance. "), txt("We handled the 1:4 class imbalance inside the models rather than by resampling, so we kept every real applicant. We used class weights while we built the individual models, and the decision threshold when we chose the final model.")]),
);

// ---------------------------------------------------------------- 3. building models
children.push(h1("3. Building Models"));
children.push(h2("Measure of success"));
children.push(p("The two errors a scoring model can make do not cost the same. Approving an applicant who then defaults (a missed defaulter) costs most of the principal plus collection costs. Defaulted loans averaged $16,900 and the bank recovered about half through collateral, so a missed defaulter costs roughly $9,000. Declining an applicant who would have repaid costs the interest margin on one customer, roughly $2,000. The primary metric is therefore recall on the default class (the share of future defaulters the model flags). Recall alone rewards a model that flags everyone, so we track precision (the share of flagged applicants who really default) and F1 as guard-rails. We report accuracy for completeness. ROC-AUC measures how well the model ranks applicants by risk, which matters when we move the threshold. We tuned each individual model by cross-validated grid search that optimises recall. We then chose the final model's configuration and its threshold on the expected cost of the two errors. We estimated that cost with repeated out-of-fold predictions on the training rows, so that precision has an explicit price in the choice."));

children.push(h2("Models built and what each one taught us"));
children.push(table(
  ["Model (test set, 0.5 threshold)", "Defaulters caught", "Precision", "Accuracy", "ROC-AUC", "Meaningful insight"],
  [
    ["Logistic Regression, plain", "57%", "77%", "88%", "0.91", "It is accurate overall but biased to the majority class. It misses 43% of defaulters because 80% of applicants repay."],
    ["Logistic Regression, balanced class weights (C tuned)", "80%", "61%", "86%", "0.91", "Class weights buy 23 points of recall for 16 points of precision. Coefficients agree with the EDA. No property valuation (odds of default about 45 times higher), no debt-to-income ratio (13 times), delinquencies, debt burden and short credit history drive risk. The straight line cannot represent the thresholds, which caps its precision."],
    ["Decision Tree, fully grown", "69%", "71%", "88%", "0.81", "It memorises the training data (100% on train, depth 28, 366 leaves). Even so its test recall beats the plain linear model, showing that splits capture the thresholds."],
    ["Decision Tree, pruned and balanced (grid search)", "82%", "53%", "82%", "0.88", "Pruning to at least 20 applicants per leaf plus balanced weights gives the highest recall of any single model. But it declines almost one good applicant per defaulter caught. Its first splits read as business rules: ratio missing (62% default), ratio above 44% (77%), delinquent lines, credit-history length."],
    ["Bagged trees (200)", "68%", "83%", "91%", "0.95", "Averaging bootstrapped trees lifts precision from 71% to 83% and ranking quality from 0.81 to 0.95 at the same recall as one tree. This is variance reduction in action. Class-weighting the base trees does not raise recall, because each fully grown tree still fits its sample perfectly."],
    ["Random Forest, default (200 trees)", "69%", "84%", "91%", "0.96", "Feature sub-sampling adds a little more ranking quality (the best ROC-AUC). But at the 0.5 threshold the forest is conservative and still misses almost a third of defaulters there. With its threshold moved to 0.15 this is the proposed model."],
    ["Random Forest, class weights 0.2/0.8", "77%", "77%", "91%", "0.96", "Class weights shift the forest towards recall with almost no loss of precision. This is the best balance at the conventional threshold."],
    ["Random Forest, grid-searched on recall", "79%", "66%", "88%", "0.93", "Recall-only tuning chooses larger leaves and balanced weights. It generalises with a smaller train-test gap, but it buys little extra recall with a lot of precision. This is why the final selection uses expected cost rather than recall alone."],
    ["Random Forest, tuned, 12 inputs", "78%", "66%", "88%", "0.93", "Removing occupation, loan purpose and nine minor flags changes performance by about a point at the 0.5 threshold. The selection step tests whether this holds at the cost-optimal threshold."],
  ],
  [2300, 1000, 900, 900, 800, 3460],
));
children.push(caption("Table 2. Models built, their held-out performance and the insight each one contributed."));
children.push(p([bold("What the models say drives default. "), txt("All techniques agree on the following points. The main drivers are the debt-to-income ratio and whether it was recorded, the number of delinquent credit lines and derogatory reports, and the credit-history length. Loan, property and mortgage amounts matter in combination. Occupation and loan purpose add little on their own. A linear model, a single tree and the ensembles agree, and this is the best evidence that the signal is real.")]));

// ---------------------------------------------------------------- 4. comparison
children.push(h1("4. Comparison of Techniques and their Performance"));
children.push(figure("report_model_comparison.png", 6.4, 2.71));
children.push(caption("Figure 4. Share of defaulters caught, precision and risk-ranking quality of each technique on the held-out applicants."));
children.push(p([bold("Why recall with a precision guard-rail is the right metric. "), txt("A missed defaulter costs about 4.5 times a wrongly declined good applicant, so the bank should prefer models that catch defaulters. This preference holds only while the number of declined good applicants stays proportionate. Accuracy would reward approving everyone (80% accurate and useless). Recall alone would reward declining everyone. The business sets the order: recall first, precision second, and expected cost to settle the trade-off.")]));
children.push(p([bold("Which technique performs better. "), txt("Linear vs non-linear: the balanced logistic regression reaches 80% recall but only 61% precision and a ROC-AUC of 0.91. Every forest beats it on precision and ranking at a similar recall, because the data is made of thresholds. Single tree vs ensembles: the pruned tree catches the most defaulters at the 0.5 threshold (82%) but with the lowest precision (53%). Bagging shows that averaging alone lifts precision to 83%. The class-weighted forest reaches 77% recall at 77% precision with a ROC-AUC of 0.96, the best balance.")]));
children.push(table(
  ["Technique", "Pros", "Cons"],
  [
    ["Logistic Regression", "It is fully transparent: one coefficient per attribute, and the bank can quote odds ratios. It is trivial to run and very stable.", "It under-fits threshold effects on the raw inputs. At the same recall it declines many more good applicants, and it is sensitive to outliers and correlated inputs."],
    ["Decision Tree", "It is a readable rule list that captures thresholds, and it is cheap.", "It is unstable between re-trainings and has the lowest precision when tuned for recall. It over-fits unless pruned."],
    ["Bagged trees", "It reduces variance by a large amount and is stable. Its precision and ranking quality are high.", "It has no rule list, and class weights do not move its recall. The forest supersedes it."],
    ["Random Forest", "It has the best balance of recall and precision, the best ranking quality, and is stable. Importances, a surrogate tree and per-applicant reason codes explain it.", "It is not a rule list on its own, and it is perceived as a black box. It needs model-risk documentation and drift monitoring."],
  ],
  [1800, 3780, 3780],
));
children.push(caption("Table 3. Pros and cons of the techniques for this problem."));
children.push(p([bold("Is there scope to improve further? "), txt("Yes, and we already apply the first improvement below. Choosing the operating threshold on expected cost rather than at 0.5 moves the forest's recall above 90% at a controlled precision cost. We expect further gains from engineered features such as a loan-to-value ratio and a payment-to-income measure, which would also help the linear model. We also expect gains from gradient boosting, probability calibration and reject inference. Reject inference matters because the data only covers loans the bank approved, so the models never saw the applicants the old process declined.")]));

// ---------------------------------------------------------------- 5. proposal
children.push(h1("5. Proposal for the Final Solution Design"));
children.push(h2("Choosing the model and its threshold on training data only"));
children.push(p("Class weights and the decision threshold are two dials for the same trade-off (how readily the model flags an applicant). We therefore chose them together and on the business criterion, and we fixed a rule before the search. The candidate with the lowest mean expected cost on out-of-fold predictions wins. Among candidates within one fold-to-fold standard error of it, we prefer the simplest. We scored every candidate with out-of-fold predictions from repeated 5-fold cross-validation on the training rows (three different splits, 15 validation folds). We judged each candidate at its own cost-minimising threshold. The test set played no part in the choice. Stage 1 searched the forest's class weights and minimum leaf size on all 27 inputs (Table 4)."));
children.push(table(
  ["Class weights", "Min. applicants per leaf", "Best threshold", "Recall at best", "Precision at best", "Mean expected cost per 1,000", "Fold-to-fold SD"],
  [
    ["none", "1", "0.15", "93.7%", "64.7%", "$317,000", "$41,000"],
    ["0.3 / 0.7", "1", "0.20", "94.0%", "64.0%", "$320,000", "$34,000"],
    ["0.2 / 0.8", "1", "0.25", "93.2%", "65.1%", "$321,000", "$39,000"],
    ["balanced", "1", "0.25", "92.7%", "65.0%", "$330,000", "$36,000"],
    ["0.1 / 0.9", "1", "0.30", "93.5%", "62.0%", "$345,000", "$38,000"],
    ["0.3 / 0.7", "5", "0.30", "88.5%", "60.9%", "$433,000", "$45,000"],
    ["balanced", "5", "0.35", "89.7%", "58.6%", "$438,000", "$46,000"],
    ["0.2 / 0.8", "5", "0.35", "89.5%", "58.7%", "$439,000", "$42,000"],
    ["none", "5", "0.20", "87.8%", "61.0%", "$443,000", "$44,000"],
    ["0.1 / 0.9", "5", "0.50", "87.6%", "59.8%", "$458,000", "$53,000"],
    ["0.3 / 0.7", "10", "0.30", "87.7%", "57.7%", "$477,000", "$55,000"],
    ["none", "10", "0.20", "86.5%", "58.6%", "$485,000", "$48,000"],
    ["0.2 / 0.8", "10", "0.40", "86.5%", "58.6%", "$486,000", "$52,000"],
    ["balanced", "10", "0.35", "89.9%", "53.9%", "$488,000", "$52,000"],
    ["0.1 / 0.9", "10", "0.50", "89.0%", "53.7%", "$503,000", "$54,000"],
  ],
  [1300, 1300, 1150, 1150, 1250, 1700, 1510], true,
));
children.push(caption("Table 4. Stage 1 of the selection: forest configurations (200 trees, all 27 inputs) on repeated out-of-fold predictions of the training rows, sorted by mean expected cost. Costs assume $9,000 per missed defaulter and $2,000 per wrongly declined applicant. The standard error of a mean cost is the fold-to-fold SD divided by the square root of the 15 folds. For the lowest-cost row this is about $10,500. We treat configurations within one standard error of it as tied."));
children.push(p("Fully grown trees beat constrained trees by a wide margin for every weighting. A minimum leaf of 5 or 10 applicants (10 was the recall-only grid search's choice) makes the probabilities cruder. This costs dearly once the threshold is free to move. Among the fully grown forests the class weights barely matter. The unweighted, 0.3/0.7 and 0.2/0.8 forests lie within one standard error (about $10,500) of each other. They simply reach their minimum at different thresholds (0.15, 0.20 and 0.25). By the pre-stated rule we kept the unweighted forest, the simplest configuration with the lowest mean cost. Its score also keeps a natural reading as an estimated default rate, which we checked with a calibration table in the notebook. It understates risk in the decision range, as we discuss below. Stage 2 pitted it against the recall-tuned grid winner, each on all 27 inputs and on the 12-input subset. The same stage also tested it without any occupation information, the fallback a fair-lending review might require. We scored the balanced logistic regression and the recall-tuned tree the same way at their own cost-minimising thresholds. This compares every technique on the chosen yardstick (Table 5)."));
children.push(table(
  ["Candidate", "Out-of-fold ROC-AUC", "Best threshold", "Recall at best", "Precision at best", "Expected cost per 1,000 applicants"],
  [
    ["Random Forest, unweighted, fully grown, 27 inputs", "0.96", "0.15", "93.7%", "64.7%", "$317,000"],
    ["Random Forest, unweighted, fully grown, 21 inputs (no occupation)", "0.96", "0.15", "92.3%", "63.3%", "$351,000"],
    ["Random Forest, unweighted, fully grown, 12 inputs", "0.95", "0.15", "91.3%", "62.1%", "$378,000"],
    ["Random Forest, recall-tuned grid winner, 27 inputs", "0.93", "0.35", "89.7%", "54.0%", "$490,000"],
    ["Random Forest, recall-tuned grid winner, 12 inputs", "0.92", "0.35", "88.3%", "53.7%", "$513,000"],
    ["Logistic Regression, balanced (C tuned), own threshold", "0.91", "0.50", "81.5%", "59.9%", "$550,000"],
    ["Decision Tree, recall-tuned, own threshold", "0.88", "0.55", "80.0%", "56.3%", "$607,000"],
  ],
  [3160, 1200, 1100, 1200, 1300, 1400], true,
));
children.push(caption("Table 5. Stage 2 of the selection: final candidates on repeated out-of-fold predictions of the training rows (mean of three 5-fold splits). Same cost assumptions as Table 4."));
children.push(p("The unweighted forest on all 27 inputs has the lowest expected cost. The recall-tuned grid winner costs about half again as much once precision has a price. This shows that recall-only tuning over-shoots. The balanced logistic regression and the tuned tree cost about $550,000 and $607,000 per 1,000 even at their own best thresholds. So the forest wins on the chosen yardstick as well as on ranking quality. Removing all occupation information costs about 10% more, and the 12-input version costs about a fifth more. Both are well outside one standard error. So occupation, loan purpose and the minor flags do add value at the cost-optimal operating point, and we choose neither simpler model. Removing occupation is therefore a policy choice with a measurable price. The cost-minimising threshold is 0.15 (flag every applicant whose score exceeds 0.15, an estimated default risk of roughly one in five). It stays at 0.15 for any cost ratio between 3:1 and 6:1 (see the notebook's cost-ratio table). Figure 5 shows the curves at the 4.5:1 costs. It also stays there on a finer 0.01 grid, and when we repeat the whole configuration search on two other 70/30 splits. It sits just below the textbook break-even of 0.18 for a perfectly calibrated score, because the forest's scores understate risk in the decision range. The scores still rank applicants well (Brier score 0.062 against 0.160 for the base rate). Applicants scored 0.15 to 0.20 defaulted about 23% of the time, so a score of 0.15 reads as roughly one-in-five estimated risk. We write the final pipeline step by step in the notebook, with the exact 27 input columns, the training-row imputation values and the model settings. This makes every input to the scoring model explicit."));
children.push(figure("report_threshold.png", 6.4, 2.71));
children.push(caption("Figure 5. Recall, precision and indicative expected cost as the forest's threshold moves, on out-of-fold predictions of the training rows."));

children.push(h2("Performance of the proposed model on unseen applicants"));
children.push(table(
  ["Proposed model on the 1,788 held-out applicants", "Model flags as likely default", "Model clears as likely to repay", "Total"],
  [
    ["Actually defaulted", "331 (caught)", "26 (missed)", "357"],
    ["Actually repaid", "155 (wrongly flagged)", "1,276 (correctly cleared)", "1,431"],
    ["Total", "486", "1,302", "1,788"],
  ],
  [3460, 2000, 2300, 1600], true,
));
children.push(caption("Table 6. Decisions of the proposed model at the 0.15 threshold: 92.7% of defaulters caught, 68.1% precision, 89.9% accuracy, ROC-AUC 0.96. At the conventional 0.5 threshold the same model gives 68.6% recall and 84.2% precision."));
children.push(p("Per 1,000 applicants the model flags about 185 of 200 defaulters before the money leaves the bank. It misses about 15 and declines or refers about 87 applicants who would have repaid. Under the indicative costs this cuts default-related cost from roughly $1.8 million per 1,000 applicants (today: all approved, 20% default) to about $0.3 million. That is a reduction of about 83%. Out-of-fold and test results are consistent (recall 93% vs 94%, precision 68% vs 65%, cost $304,000 ± $28,000 vs $317,000 per 1,000). The choice between the closely matched configurations rests on the out-of-fold comparison. A single test evaluation is too noisy to adjudicate that choice. Overall the model flags about 27% of applicants, an approval rate of about 73% on a population the bank approves in full today. At the 0.5 threshold it flags 16%. The model wrongly flags about 11% of creditworthy applicants at 0.15 against 3% at 0.5, which is the price of the recall. The approve / refer / decline bands at 0.10 and 0.25 would approve about 69% of applications automatically (about 1% of them defaulted). They would send about 7% to an underwriter (about one in four defaulted). They would decline about 24% (74% defaulted, 87% of all defaulters). Two thirds of all defaulters sit in the fifth of applicants with no recorded debt-to-income ratio, a group the model flags almost entirely (96%). On applicants with a recorded ratio it flags 9% and catches 83% of their defaulters at 80% precision. This is the better guide to its behaviour once income verification is mandatory and we re-train the model."));

children.push(h2("Performance versus interpretability"));
children.push(p("The forest performs best, but nobody can read it as a rule list. The ECOA requires a specific reason for each adverse decision. The proposal resolves the trade-off with a surrogate decision tree. This is a four-level tree that we fit to the forest's out-of-fold flag/clear decisions on the training rows. We use out-of-fold decisions because a fully grown forest reproduces its training labels almost perfectly. In-sample decisions would therefore teach the tree the labels rather than the forest's behaviour on new applicants. The surrogate reproduces 93% of the forest's decisions on unseen applicants, against 73% for a rule that never flags anyone. Its rules are the same drivers the analysis found throughout. If the debt-to-income ratio is missing, the tree flags the applicant. If the ratio is recorded and above about 44%, the tree flags the applicant. At or below 44%, the tree flags the applicant if there is a delinquent credit line together with a major derogatory report. Otherwise the tree clears the applicant. For each applicant the production system should also report the top risk drivers from the forest itself. Then the roughly 7% of decisions the surrogate does not reproduce still carry a specific reason. Automatic declines above the 0.25 band edge take their primary reason from those drivers, with the surrogate rule as the plain-language summary. Figure 6 shows what the forest relies on. The debt-to-income ratio, its missing flag, delinquent lines and credit-history length together carry about half of its decision power. Permutation importance ranks the same four at the top."));
children.push(figure("report_feature_importance.png", 5.9, 2.99));
children.push(caption("Figure 6. The twelve inputs the final Random Forest relies on most."));

children.push(h2("The proposed solution design"));
children.push(table(
  ["Element", "Proposal"],
  [
    ["Scoring engine", "Random Forest, 200 fully grown trees, no class weights. The configuration search showed that class weights make no measurable difference once we choose the threshold on cost. The 27 inputs are of three kinds. The 10 financial attributes (LOAN, MORTDUE, VALUE, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). A 0/1 missing-value flag for each of the 11 fields with gaps (MORTDUE, VALUE, REASON, JOB, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). Six 0/1 indicators from one-hot encoding (REASON = HomeImp, and JOB = Office, Other, ProfExe, Sales, Self). Median/mode imputation learned on training rows, plus a missing flag per field. No outlier capping, no scaling."],
    ["Decision rule", "Flag when predicted probability > 0.15. This threshold is cost-minimising on repeated out-of-fold predictions and stable for cost ratios 3:1 to 6:1. It is just below the textbook break-even of 0.18, as expected for a score that understates risk, and unchanged on two other train/test splits. We will re-derive it with the bank's own loss and margin figures. Approve / refer / decline bands at 0.10 and 0.25 keep an underwriter in the loop around the threshold. On the test set the bands hold about 69% / 7% / 24% of applicants, with default rates of about 1% / 24% / 74%."],
    ["Explanation layer", "A surrogate decision tree of depth 4, fitted to the forest's out-of-fold decisions (93% agreement with the forest on unseen applicants), gives adverse-action reasons. The explanation layer also reports the top risk drivers for each applicant."],
    ["Fallback", "The same forest without any occupation information (21 inputs), if the fair-lending review requires it (about 10% more expected credit-error cost). The 12-input lean model costs about a fifth more, and we do not recommend it."],
    ["Policy rules to adopt now", "Make income and property-valuation verification mandatory. Decline or escalate above a 45% debt-to-income ratio. Refer an applicant with two or more delinquent lines (45% and above observed default) to an underwriter. Also refer an applicant with two or more derogatory reports (51% and above). We read these thresholds from the observed default rates. Hard rules take precedence over the score."],
    ["Why this is the best solution", "It has the lowest expected cost of credit errors among fifteen configurations and five final candidates. We chose it under a pre-stated rule without the test set. We then measured it once on the test set (93% recall, 68% precision, consistent with the out-of-fold estimate). It is stable: hundreds of averaged trees, out-of-fold and test agree, and the threshold is insensitive to cost assumptions. It is interpretable through the surrogate tree and reason codes. It is deployable on fields the underwriting process already captures."],
  ],
  [2300, 7060],
));
children.push(spacer());
children.push(p([bold("Caveats and next steps towards the final submission. "), txt("The data covers only loans the bank approved, so the models never saw the applicants the old process declined. We plan a shadow period on all applications and reject inference. The cost assumptions are indicative, and we will replace them with the bank's figures. The final submission will add the implementation plan, stakeholder actionables, a benefit and cost estimate, and the risks and further analysis in full.")]));

// ---------------------------------------------------------------- document
const doc = new Document({
  creator: "Shubham Garg",
  title: "Capstone Project: Loan Default Prediction - Milestone Report",
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    { reference: "goals", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    { reference: "kq", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1300, bottom: 1200, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Loan Default Prediction - Milestone Report  |  Page ", font: FONT, size: 18, color: GREY }),
                 new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GREY })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("wrote", OUT, (buf.length / 1024).toFixed(0), "KB"); });
