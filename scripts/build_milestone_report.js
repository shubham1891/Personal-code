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
children.push(p("A large share of a retail bank's profit comes from the interest it earns on home loans and home equity lines of credit, and the single biggest threat to that profit is the borrower who does not pay back: every loan that turns into a non-performing asset wipes out the interest earned on many good loans. Today the approval decision is made by an underwriter's manual study of each application. That process is slow, expensive, inconsistent between underwriters and open to human error and bias, and earlier attempts to automate it relied on hand-written heuristics."));
children.push(p([txt("The numbers size the problem. In the bank's own recent book of "), bold("5,960 home equity loans, 1,189 (19.9%) ended in default or serious delinquency"), txt(", all of them approved by the current process. Those loans averaged about $16,900, so roughly $20 million of principal was put at risk and, with about half recovered through the collateral, roughly $10 million was lost on this book alone. Every ten defaulters avoided saves about $85,000; every good customer wrongly turned away costs only the interest margin on one loan, a few thousand dollars at most.")]));
children.push(p([bold("Advantages of solving it. "), txt("A reliable, explainable scoring model (1) cuts credit losses by stopping likely defaulters at the door, (2) protects revenue by not declining good customers unnecessarily, (3) speeds up and standardises decisions so underwriters spend their time on the genuinely uncertain cases, and (4) gives the bank documented, consistent reasons for every decision, which is both a regulatory requirement under the Equal Credit Opportunity Act (ECOA) and a fairness safeguard.")]));

children.push(h2("Objectives: the intended goals"));
children.push(p("Build a classification model that predicts, at application time, whether a client is likely to default on a home equity loan, and give the bank recommendations on which applicant attributes matter most when approving a loan. In priority order:"));
children.push(
  numbered([bold("Catch defaulters early: "), txt("maximise the share of future defaulters identified at application time (recall on the default class), because a missed defaulter is the costliest error.")], "goals"),
  numbered([bold("Protect good business: "), txt("keep the share of wrongly declined good customers acceptable (precision), so that risk reduction does not come at the price of lost revenue.")], "goals"),
  numbered([bold("Stay interpretable: "), txt("the bank must be able to give an applicant a specific, defensible reason for an adverse decision; a black box that cannot explain a rejection is not usable in production.")], "goals"),
  numbered([bold("Guide policy: "), txt("identify the attributes that matter most, so the bank can tighten its approval rules and data collection even before a model is deployed.")], "goals"),
);

children.push(h2("The key questions"));
children.push(
  numbered("What share of past applicants defaulted, and how imbalanced is the problem?", "kq"),
  numbered("Which applicant attributes (debt burden, credit history, loan size, job, loan purpose, property value) separate defaulters from repayers?", "kq"),
  numbered("How should missing information be treated? Is the absence of information itself a risk signal?", "kq"),
  numbered("Which technique (linear vs tree-based vs ensemble) gives the best trade-off between catching defaulters and wrongly rejecting good customers?", "kq"),
  numbered("What is the right measure of success for this business problem, and how do the models compare on it?", "kq"),
  numbered("Which model should the bank adopt, with what settings, and what rules can it communicate to applicants and regulators?", "kq"),
);

children.push(h2("The problem formulation"));
children.push(p("As a data-science problem this is supervised binary classification. Each row of the data is a past loan with 12 attributes known at application time and a target BAD (1 = defaulted or seriously delinquent, 0 = repaid). Data science fits into the approval process as a scoring step: the model converts an application into a probability of default, the bank converts that probability into approve / refer / decline using a threshold set from the cost of the two possible errors, and an explanation layer turns the decision into reasons. The work therefore covers exploring and cleaning the data, training a linear model (Logistic Regression) and non-linear models (Decision Tree, bagged trees, Random Forest), tuning them with cross-validation, choosing the final model and its threshold on a business-cost criterion, and proposing a solution design that balances performance with interpretability."));

// ---------------------------------------------------------------- 2. data exploration
children.push(h1("2. Data Exploration"));
children.push(h2("Data description"));
children.push(p("The Home Equity (HMEQ) dataset contains baseline and loan-performance information for 5,960 recent home equity loans approved by the bank. The target BAD indicates whether the applicant ultimately defaulted or became seriously delinquent (1,189 cases, 19.9%). Twelve inputs were registered for each applicant:"));
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
children.push(p("There are no duplicate rows. 44% of applications have at least one blank field, so rows cannot simply be dropped. Loan amounts range from $1,100 to $89,900 (median $16,300) and are right-skewed, as are property values and mortgage balances; the debt-to-income ratio is tightly concentrated between 29% and 39% for the middle half of applicants but contains impossible values (a maximum of 203%), and the age of the oldest credit line has an implausible maximum of 97 years. Three quarters of applicants have no derogatory report and no delinquent credit line."));

children.push(h2("Observations and insights"));
children.push(p([bold("Missing information is the strongest single risk signal. "), txt("Applicants with no recorded debt-to-income ratio defaulted 62% of the time against 8.6% when the ratio was recorded; applicants with no property valuation defaulted 94% of the time (Figure 1). For the problem this means that an unverifiable income or collateral should be treated as a red flag, not a neutral gap, and that the models must be able to see whether a field was blank.")]));
children.push(figure("report_missing_vs_present.png", 6.4, 2.71));
children.push(caption("Figure 1. Default rate when an attribute is missing versus present."));
children.push(p([bold("Debt burden has a hard threshold, credit history protects, and small loans are not safe loans. "), txt("Between a 20% and a 40% debt-to-income ratio only 4% to 7% of applicants default; between 40% and 45% the rate is 11%; above 45% it is 87% to 100%. Applicants with under five years of credit history default 44% of the time against about 10% with over twenty years. Loans under $5,000 default 57% of the time, almost three times the average (Figure 2). These are threshold-shaped relationships that a straight line cannot represent well, which already suggests tree-based models will do better than a purely linear one.")]));
children.push(figure("report_default_rate_bands.png", 6.6, 2.14));
children.push(caption("Figure 2. Default rate by debt-to-income band, length of credit history and loan amount."));
children.push(p([bold("Past repayment behaviour predicts future behaviour. "), txt("The default rate rises from 17% with no major derogatory report to 39% with one, 51% with two and about 75% with three or more; from 14% with no delinquent credit line to 34% with one, 45% with two and 100% with six or more; and from 16% with no recent credit inquiry to about 45-50% with five or more (Figure 3). Each of these is a plain-language reason an applicant can be given.")]));
children.push(figure("report_credit_history.png", 6.6, 2.14));
children.push(caption("Figure 3. Default rate by number of derogatory reports, delinquent credit lines and recent credit inquiries."));
children.push(p([bold("Occupation matters moderately; loan purpose barely. "), txt("Sales (35%) and self-employed (30%) applicants default most, office workers (13%) and professionals (17%) least; home-improvement loans default slightly more often than debt-consolidation loans (22% vs 19%). Both relationships are statistically significant (chi-square tests, p = 0.005 for loan purpose, p < 0.001 for occupation), but loan purpose is too weak to drive decisions, and occupation must be handled with care under fair-lending rules.")]));
children.push(p([bold("Amounts differ significantly but modestly. "), txt("Defaulters borrowed less (median $14,900 vs $16,900), had slightly lower property values ($82,000 vs $90,659) and mortgage balances ($60,279 vs $66,839); Mann-Whitney tests give p < 0.001 for each, but the gaps are small relative to the amounts. Property value and mortgage balance are correlated at 0.88, so they carry much the same information.")]));

children.push(h2("Data treatments and pre-processing"));
children.push(
  bullet([bold("Test set held out first. "), txt("A stratified 30% of applicants (1,788, including 357 defaulters) was set aside before any statistic was fitted, so that outlier fences, imputation values and scaling never see the test rows.")]),
  bullet([bold("Missing values. "), txt("A 0/1 'was missing' flag was created for each of the eleven columns with gaps, then numerical gaps were filled with the training-row median and categorical gaps with the training-row mode. No rows were dropped.")]),
  bullet([bold("Outliers. "), txt("For the linear model only, continuous variables were capped at the inter-quartile whiskers computed on the training rows (which removes the impossible debt-to-income and credit-age values) and the two count variables at their 99th percentile, because their inter-quartile range is zero. Tree models use the untouched values, since they split on rank order and would otherwise lose information such as 'above 50% always defaults'.")]),
  bullet([bold("Encoding and scaling. "), txt("Loan purpose and occupation were one-hot encoded (first level dropped); the continuous inputs were standardised for the logistic regression only, leaving the flags as 0/1 so their coefficients read as the effect of the flag.")]),
  bullet([bold("Imbalance. "), txt("The 1:4 class imbalance was handled inside the models (class weights while building the individual models, the decision threshold in the final selection) rather than by resampling, so every real applicant is kept.")]),
);

// ---------------------------------------------------------------- 3. building models
children.push(h1("3. Building Models"));
children.push(h2("Measure of success"));
children.push(p("The two errors a scoring model can make do not cost the same. Approving an applicant who then defaults (a missed defaulter) costs most of the principal plus collection costs: with defaulted loans averaging $16,900 and about half recovered through collateral, roughly $9,000. Declining an applicant who would have repaid costs the interest margin on one customer, roughly $2,000. The primary metric is therefore recall on the default class (the share of future defaulters the model flags). Because recall alone rewards flagging everyone, precision (the share of flagged applicants who really default) and F1 are tracked as guard-rails, accuracy is reported for completeness, and ROC-AUC measures how well applicants are ranked by risk, which matters when the threshold is moved. Individual models were tuned by cross-validated grid search optimising recall; the final model's configuration and its threshold were then chosen on the expected cost of the two errors, estimated with repeated out-of-fold predictions on the training rows, so that precision is priced in explicitly."));

children.push(h2("Models built and what each one taught us"));
children.push(table(
  ["Model (test set, 0.5 threshold)", "Defaulters caught", "Precision", "Accuracy", "ROC-AUC", "Meaningful insight"],
  [
    ["Logistic Regression, plain", "57%", "77%", "88%", "0.91", "Accurate overall but biased to the majority class: it misses 43% of defaulters because 80% of applicants repay."],
    ["Logistic Regression, balanced class weights (C tuned)", "80%", "61%", "86%", "0.91", "Class weights buy 23 points of recall for 16 points of precision. Coefficients confirm the EDA: no property valuation (odds of default about 45 times higher), no debt-to-income ratio (13 times), delinquencies, debt burden and short credit history drive risk. The straight line cannot represent the thresholds, which caps its precision."],
    ["Decision Tree, fully grown", "69%", "71%", "88%", "0.81", "Memorises the training data (100% on train, depth 28, 366 leaves). Even so its test recall beats the plain linear model, showing that splits capture the thresholds."],
    ["Decision Tree, pruned and balanced (grid search)", "82%", "53%", "82%", "0.88", "Pruning to at least 20 applicants per leaf plus balanced weights gives the highest recall of any single model, but it declines almost one good customer per defaulter caught. Its first splits read as business rules: ratio missing (62% default), ratio above 44% (77%), delinquent lines, credit-history length."],
    ["Bagged trees (200)", "68%", "83%", "91%", "0.95", "Averaging bootstrapped trees lifts precision from 71% to 83% and ranking quality from 0.81 to 0.95 at the same recall as one tree: variance reduction in action. Class-weighting the base trees does not raise recall, because each fully grown tree still fits its sample perfectly."],
    ["Random Forest, default (200 trees)", "69%", "84%", "91%", "0.96", "Feature sub-sampling adds a little more ranking quality (the best ROC-AUC) but the forest is conservative: it still misses almost a third of defaulters."],
    ["Random Forest, class weights 0.2/0.8", "77%", "77%", "91%", "0.96", "Class weights shift the forest towards recall with almost no loss of precision: the best balance at the conventional threshold."],
    ["Random Forest, grid-searched on recall", "79%", "66%", "88%", "0.93", "Recall-only tuning picks larger leaves and balanced weights; it generalises with a smaller train-test gap but buys little extra recall with a lot of precision, which is why the final selection uses expected cost rather than recall alone."],
    ["Random Forest, tuned, 12 inputs", "78%", "66%", "88%", "0.93", "Dropping occupation, loan purpose and nine minor flags changes performance by about a point at the 0.5 threshold; whether it holds at the cost-optimal threshold is tested in the selection step."],
  ],
  [2300, 1000, 900, 900, 800, 3460],
));
children.push(caption("Table 2. Models built, their held-out performance and the insight each one contributed."));
children.push(p([bold("What the models say drives default. "), txt("All techniques agree: the debt-to-income ratio and whether it was recorded, the number of delinquent credit lines and derogatory reports, and the length of the credit history are the main drivers; loan, property and mortgage amounts matter in combination; occupation and loan purpose add little on their own. The agreement between a linear model, a single tree and ensembles is the strongest evidence that the signal is real.")]));

// ---------------------------------------------------------------- 4. comparison
children.push(h1("4. Comparison of Techniques and their Performance"));
children.push(figure("report_model_comparison.png", 6.4, 2.71));
children.push(caption("Figure 4. Share of defaulters caught, precision and risk-ranking quality of each technique on the held-out applicants."));
children.push(p([bold("Why recall with a precision guard-rail is the right metric. "), txt("A missed defaulter costs about 4.5 times a wrongly declined good customer, so the bank should prefer models that catch defaulters, but only while the number of good customers declined stays proportionate. Accuracy would reward approving everyone (80% accurate and useless); recall alone would reward declining everyone. Recall first, precision second, and expected cost to settle the trade-off is the ordering that follows from the business.")]));
children.push(p([bold("Which technique performs better. "), txt("Linear vs non-linear: the balanced logistic regression reaches 80% recall but only 61% precision and a ROC-AUC of 0.91; every forest beats it on precision and ranking at a similar recall because the data is made of thresholds. Single tree vs ensembles: the pruned tree catches the most defaulters at the 0.5 cut-off (82%) but with the lowest precision (53%); bagging shows that averaging alone lifts precision to 83%; the class-weighted forest reaches 77% recall at 77% precision with a ROC-AUC of 0.96, the best balance.")]));
children.push(table(
  ["Technique", "Pros", "Cons"],
  [
    ["Logistic Regression", "Fully transparent (one coefficient per attribute, odds ratios can be quoted); trivial to run; very stable", "Under-fits threshold effects on the raw inputs; at the same recall declines many more good customers; sensitive to outliers and correlated inputs"],
    ["Decision Tree", "A readable rule list; captures thresholds; cheap", "Unstable between re-trainings; lowest precision when tuned for recall; over-fits unless pruned"],
    ["Bagged trees", "Large variance reduction; robust; strong precision and ranking", "No rule list; class weights do not move its recall; superseded by the forest"],
    ["Random Forest", "Best balance of recall and precision; best ranking quality; robust; explained through importances, a surrogate tree and per-applicant reason codes", "Not a rule list on its own; perceived as a black box; needs model-risk documentation and drift monitoring"],
  ],
  [1800, 3780, 3780],
));
children.push(caption("Table 3. Pros and cons of the techniques for this problem."));
children.push(p([bold("Is there scope to improve further? "), txt("Yes, and the first improvement is already applied below: choosing the operating threshold on expected cost rather than at 0.5 moves the forest's recall above 90% at a controlled precision cost. Further gains are expected from engineered features such as a loan-to-value ratio and a payment-to-income measure (which would also help the linear model), from gradient boosting and probability calibration, and from reject inference, because the data only covers loans the bank approved and the models have never seen the applicants the old process declined.")]));

// ---------------------------------------------------------------- 5. proposal
children.push(h1("5. Proposal for the Final Solution Design"));
children.push(h2("Choosing the model and its threshold on training data only"));
children.push(p("Class weights and the decision threshold are two dials for the same trade-off (how readily the model flags an applicant), so they were chosen together and on the business criterion, with a rule fixed before the search: the candidate with the lowest mean out-of-fold expected cost wins, and among candidates within one fold-to-fold standard error of it the simplest is preferred. Every candidate was scored with repeated 5-fold out-of-fold predictions on the training rows (three different splits, 15 validation folds) and judged at its own cost-minimising threshold. The test set played no part in the choice. Stage 1 searched the forest's class weights and minimum leaf size on all 27 inputs (Table 4)."));
children.push(table(
  ["Class weights", "Min. applicants per leaf", "Best threshold", "Recall at best", "Precision at best", "Mean expected cost per 1,000", "Fold-to-fold SD"],
  [
    ["none", "1", "0.15", "93.7%", "64.7%", "$317,000", "$41,000"],
    ["0.3 / 0.7", "1", "0.20", "94.0%", "64.0%", "$320,000", "$34,000"],
    ["0.2 / 0.8", "1", "0.25", "93.2%", "65.1%", "$321,000", "$39,000"],
    ["balanced", "1", "0.25", "92.7%", "65.0%", "$330,000", "$36,000"],
    ["0.1 / 0.9", "1", "0.30", "93.5%", "62.0%", "$345,000", "$38,000"],
    ["0.3 / 0.7", "10", "0.30", "87.7%", "57.7%", "$477,000", "$55,000"],
    ["none", "10", "0.20", "86.5%", "58.6%", "$485,000", "$48,000"],
    ["0.2 / 0.8", "10", "0.40", "86.5%", "58.6%", "$486,000", "$52,000"],
    ["balanced", "10", "0.35", "89.9%", "53.9%", "$488,000", "$52,000"],
    ["0.1 / 0.9", "10", "0.50", "89.0%", "53.7%", "$503,000", "$54,000"],
  ],
  [1300, 1300, 1150, 1150, 1250, 1700, 1510], true,
));
children.push(caption("Table 4. Stage 1 of the selection: forest configurations (200 trees, all 27 inputs) on repeated out-of-fold predictions of the training rows, sorted by mean expected cost. Costs assume $9,000 per missed defaulter and $2,000 per wrongly declined customer."));
children.push(p("Fully grown trees beat constrained trees by a wide margin for every weighting: the leaf size of 10 that the recall-only grid search chose makes the probabilities cruder, which costs dearly once the threshold is free to move. Among the fully grown forests the class weights barely matter: the unweighted, 0.3/0.7 and 0.2/0.8 forests lie within one standard error (about $10,500) of each other and simply reach their minimum at different thresholds (0.15, 0.20 and 0.25). By the pre-stated rule the unweighted forest went forward as the simplest configuration with the lowest mean cost; its score also keeps its natural meaning as an estimated default rate. Stage 2 pitted it against the recall-tuned grid winner, each on all 27 inputs and on the 12-input subset (Table 5)."));
children.push(table(
  ["Candidate", "Out-of-fold ROC-AUC", "Best threshold", "Recall at best", "Precision at best", "Expected cost per 1,000 applicants"],
  [
    ["Random Forest, unweighted, fully grown, 27 inputs", "0.96", "0.15", "93.7%", "64.7%", "$317,000"],
    ["Random Forest, unweighted, fully grown, 12 inputs", "0.95", "0.15", "91.3%", "62.1%", "$378,000"],
    ["Random Forest, recall-tuned grid winner, 27 inputs", "0.93", "0.35", "89.7%", "54.0%", "$490,000"],
    ["Random Forest, recall-tuned grid winner, 12 inputs", "0.92", "0.35", "88.3%", "53.7%", "$513,000"],
  ],
  [3160, 1200, 1100, 1200, 1300, 1400], true,
));
children.push(caption("Table 5. Stage 2 of the selection: final candidates on repeated out-of-fold predictions of the training rows (mean of three 5-fold splits). Same cost assumptions as Table 4."));
children.push(p("The unweighted forest on all 27 inputs has the lowest expected cost. The recall-tuned grid winner costs about half again as much once precision is priced in, confirming that recall-only tuning over-shoots; the 12-input version costs about a fifth more, well outside one standard error, so occupation, loan purpose and the minor flags do add value at the cost-optimal operating point and the simpler model is not chosen. The cost-minimising threshold is 0.15 (flag every applicant whose estimated default probability exceeds 15%); it stays at 0.15 for any cost ratio between 3:1 and 6:1 (Figure 5) and agrees with the theoretical break-even for a calibrated score at the stated costs, $2,000 / $11,000 = 0.18. The final pipeline is written out step by step in the notebook, with the exact 27 input columns, the training-row imputation values and the model settings, so that every input to the scoring model is explicit."));
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
children.push(p("Per 1,000 applicants the model flags about 185 of 200 defaulters before the money leaves the bank, misses about 15 and declines or refers about 87 customers who would have repaid. Under the indicative costs this cuts default-related cost from roughly $1.8 million per 1,000 applicants (today: all approved, 20% default) to about $0.3 million, a reduction of about 83%. Out-of-fold and test results agree within a few points (recall 93% vs 94%, precision 68% vs 65%), which is the evidence that the selection did not over-fit."));

children.push(h2("Performance versus interpretability"));
children.push(p("The forest is the best performer but cannot be read as a rule list, and the ECOA requires a specific reason for each adverse decision. The proposal resolves the trade-off with a surrogate decision tree: a four-level tree fitted to the forest's own flag/clear decisions on the training rows, which reproduces 90% of the forest's decisions on unseen applicants. Its rules are the same drivers the analysis found throughout: is the debt-to-income ratio missing; if recorded, is it above about 45%; are there two or more delinquent credit lines; how long is the credit history; are there derogatory reports. For each applicant the production system should also report the top risk drivers from the forest itself, so that the roughly 10% of decisions the surrogate does not reproduce still carry a specific reason. Figure 6 shows what the forest relies on: the debt-to-income ratio, its missing flag, delinquent lines and credit-history length together carry about half of its decision power, and permutation importance ranks the same four at the top."));
children.push(figure("report_feature_importance.png", 5.9, 2.99));
children.push(caption("Figure 6. The twelve inputs the final Random Forest relies on most."));

children.push(h2("The proposed solution design"));
children.push(table(
  ["Element", "Proposal"],
  [
    ["Scoring engine", "Random Forest, 200 fully grown trees, no class weights (the configuration search showed they add nothing once the threshold is chosen on cost), all 27 inputs: the 10 financial attributes (LOAN, MORTDUE, VALUE, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC), a 0/1 missing-value flag for each of the 11 fields with gaps (MORTDUE, VALUE, REASON, JOB, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC) and six 0/1 indicators from one-hot encoding (REASON = HomeImp; JOB = Office, Other, ProfExe, Sales, Self); median/mode imputation learned on training rows plus a missing flag per field; no outlier capping, no scaling"],
    ["Decision rule", "Flag when predicted probability > 0.15 (cost-minimising on repeated out-of-fold predictions, stable for cost ratios 3:1 to 6:1, equal to the theoretical break-even of 0.18 within the search step, to be re-derived with the bank's own loss and margin figures); approve / refer / decline bands keep an underwriter in the loop around the threshold"],
    ["Explanation layer", "Depth-4 surrogate decision tree (90% agreement with the forest) for adverse-action reasons, plus per-applicant top risk drivers"],
    ["Fallback", "The same forest on 12 inputs without occupation and loan purpose, if the fair-lending review requires it (about a fifth more expected credit-error cost)"],
    ["Policy rules to adopt now", "Make income and property-valuation verification mandatory; decline or escalate above a 45% debt-to-income ratio, or with two or more delinquent lines or derogatory reports"],
    ["Why this is the best solution", "Lowest expected cost of credit errors among ten configurations and four final candidates, chosen under a pre-stated rule without the test set and confirmed on it (93% recall, 68% precision); robust (hundreds of averaged trees, out-of-fold and test agree, threshold insensitive to cost assumptions); interpretable through the surrogate tree and reason codes; deployable on fields the underwriting process already captures"],
  ],
  [2300, 7060],
));
children.push(spacer());
children.push(p([bold("Caveats and next steps towards the final submission. "), txt("The data covers only loans the bank approved, so the models have not seen the applicants the old process declined; a shadow period on all applications and reject inference are planned. The cost assumptions are indicative and will be replaced with the bank's figures. The final submission will add the implementation plan, stakeholder actionables, a benefit and cost estimate, and the risks and further analysis in full.")]));

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
