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
const FIG_H = (name, w) => { const b = FIG(name); return Math.round(w * b.readUInt32BE(20) / b.readUInt32BE(16) * 100) / 100; };
// Height of the interaction figure in inches, from the PNG header (width 6.6 in)
const FIG_H_INTERACTIONS = (() => { const b = FIG("report_interactions.png"); return Math.round(6.6 * b.readUInt32BE(20) / b.readUInt32BE(16) * 100) / 100; })();
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
const numbered = (runs, ref, keepNext = false) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 100, line: 264 }, keepNext, children: Array.isArray(runs) ? runs : [txt(runs)] });
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, keepLines: true, children: [new TextRun({ text: t, italics: true, font: FONT, size: 19, color: GREY })] });
const figure = (name, w, h) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
  children: [new ImageRun({ type: "png", data: FIG(name), transformation: { width: Math.round(w * 96), height: Math.round(h * 96) } })] });
const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });
// One shaded box with a title and bold-lead bullets (summary for the Data Science lead)
function summaryBox(title, items) {
  const edge = { style: BorderStyle.SINGLE, size: 8, color: NAVY };
  const children = [
    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: title, bold: true, font: FONT, size: 24, color: NAVY })] }),
    ...items.map(([lead, rest]) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 70, line: 252 },
      children: [new TextRun({ text: lead, bold: true, font: FONT, size: 20 }), new TextRun({ text: rest, font: FONT, size: 20 })] })),
  ];
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [new TableRow({ cantSplit: true, children: [
    new TableCell({ width: { size: 9360, type: WidthType.DXA }, borders: { top: edge, bottom: edge, left: edge, right: edge },
      shading: { type: ShadingType.CLEAR, fill: "E8EEF7", color: "auto" }, margins: { top: 140, bottom: 120, left: 200, right: 200 }, children }),
  ] })] });
}

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
    ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, false, widths[i], i > 0 && /^[\d$.,%\-]+( \([a-z ]+\))?$/.test(String(c)), keepTogether && ri < rows.length - 1)) })),
  ] });
}

const children = [];

// ---------------------------------------------------------------- title
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "Capstone Project: Loan Default Prediction", font: FONT, bold: true, size: 44, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Milestone Report", font: FONT, size: 30, color: GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Problem Definition, Data Exploration, Building Models, Comparison of Techniques, Final Solution Design", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Practical Data Science track (Classification)", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "MIT Professional Education - Applied AI and Data Science Program", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [new TextRun({ text: "Shubham Garg  |  November 2026", font: FONT, size: 22, color: GREY })] }),
);
children.push(summaryBox("Summary for the Data Science lead", [
  ["Problem: ", "The bank approved all 5,960 loans in this book, and 1,189 (19.9%) defaulted. If the bank recovers about half of each defaulted loan through the collateral, it lost about $10 million on this book."],
  ["Approach: ", "We compared logistic regression, decision trees, bagged trees and random forests. We chose the final model and its threshold on the expected cost of errors, with cross-validation on the training rows only. We scored the test set once."],
  ["Finding 1: ", "A missing debt-to-income ratio is the strongest risk signal. 62% of these applicants defaulted, against 8.6% with a recorded ratio."],
  ["Finding 2: ", "Above a 45% debt-to-income ratio, 87% to 100% of applicants defaulted (84 applicants)."],
  ["Finding 3: ", "With two delinquent credit lines, 45% defaulted. With two major derogatory reports, 51% defaulted."],
  ["Proposed solution: ", "A random forest of 200 trees flags an applicant when the score is above 0.15. On 1,788 unseen applicants, it caught 92.7% of defaulters at 68.1% precision (ROC-AUC 0.96). A four-level surrogate tree reproduces 93% of its decisions and gives the plain-language rules."],
  ["Benefit: ", "With our cost assumptions, the cost of credit errors falls from about $1.8 million to about $0.3 million per 1,000 applicants (83% less). With approve, refer and decline bands, the bank would approve about 69% of applicants automatically. About 1% of these applicants defaulted on the test set."],
  ["Recommendations: ", "Make income and property-value verification mandatory. Decline or refer applicants above a 45% debt-to-income ratio. Refer applicants with two or more delinquent lines or two or more derogatory reports. Run the model in shadow mode for one to two months, with a fairness review, before go-live."],
]));

// ---------------------------------------------------------------- 1. problem definition
children.push(h1("1. Problem Definition"));
children.push(h2("Context: why this problem is important to solve"));
children.push(p("A large share of a retail bank's profit comes from the interest it earns on home loans and home equity lines of credit. The single biggest threat to that profit is the borrower who does not repay the loan. Every loan that becomes a non-performing asset removes the interest earned on many good loans. Today an underwriter studies each application manually and decides whether to approve it. That process is slow, expensive, inconsistent between underwriters and open to human error and bias. Earlier attempts to automate it relied on hand-written heuristics."));
children.push(p([txt("The numbers size the problem. In the bank's own recent book of "), bold("5,960 home equity loans, 1,189 (19.9%) ended in default or serious delinquency"), txt(". The current process approved all of them. Those loans averaged about $16,900, so the bank put roughly $20 million of principal at risk. The data does not record recoveries. We assume that the bank recovers about half of each defaulted loan through the collateral. On that assumption, the bank lost roughly $10 million on this book alone. With collection costs, we assume that each missed defaulter costs about $9,000. So every ten defaulters that the model stops save about $90,000. Every good applicant wrongly declined costs only the interest margin on one loan, about $2,000.")]));
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
children.push(p("The Home Equity (HMEQ) dataset contains baseline and loan-performance information for 5,960 recent home equity loans that the bank approved. The target BAD indicates whether the applicant ultimately defaulted or became seriously delinquent (1,189 cases, 19.9%). The data has 5,960 rows and 13 columns. Each row is one loan. The columns are the target BAD and twelve inputs. BAD is a 0/1 integer with no missing values. Ten inputs are numeric, and four of these are counts. REASON and JOB are categorical. Table 1 gives the type and the missing-value rate of each input:"));
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
children.push(caption("Table 1. The twelve applicant attributes, their data types and missing-value rates."));
children.push(p([bold("Statistical summary. "), txt("There are no duplicate rows. 44% of applications have at least one blank field, so we cannot simply remove those rows. Loan amounts range from $1,100 to $89,900 (median $16,300). Property values range from $8,000 to $855,909 (median $89,236). Mortgage balances range from $2,063 to $399,550 (median $65,019). All three amounts are right-skewed. The median applicant has 7 years in the present job, one recent credit inquiry and 20 credit lines. The debt-to-income ratio has a median of 34.8%. It is tightly concentrated between 29% and 39% for the middle half of applicants but contains impossible values (a maximum of 203%). The age of the oldest credit line has an implausible maximum of 97 years. Among applicants with a record, 86% have no major derogatory report and 78% have no delinquent credit line.")]));
children.push(p([bold("Ranges and outliers. "), txt("Box plots show outliers in almost every numeric column. Most are genuine extreme values, such as loans above about $41,000 and property values up to $855,909. We keep them for the tree models and cap them only for the linear model. Only debt-to-income ratios above 100% and credit lines older than about 50 years (600 months) look like data errors.")]));

children.push(h2("Observations and insights"));
children.push(p([bold("Missing information is the strongest single risk signal. "), txt("Applicants with no recorded debt-to-income ratio defaulted 62% of the time, against 8.6% for applicants with a recorded ratio. Applicants with no property valuation defaulted 94% of the time (Figure 1). For the problem this means that the bank should treat an unverifiable income or collateral as a red flag, not a neutral gap. It also means that the models must be able to see whether a field was blank. The signal does not point the same way for every field. Figure 1 shows five fields where a blank goes with a lower default rate (8% to 15%, against 20% overall). These are occupation, job tenure, derogatory reports, delinquent lines and recent inquiries. This probably shows how the bank recorded the data, for example 'no record found' stored as a blank. A flag for each field lets the models learn both directions.")]));
children.push(figure("report_missing_vs_present.png", 6.4, 2.71));
children.push(caption("Figure 1. Default rate when an attribute is missing versus present."));
children.push(p([bold("Debt burden has a hard threshold. Credit history protects. Small loans are not safe loans. "), txt("Between a 20% and a 40% debt-to-income ratio only 4% to 7% of applicants default. Between 40% and 45% the rate is 11%, and above 45% it is 87% to 100%. Applicants with under five years of credit history default 44% of the time against about 10% with over twenty years. Loans under $5,000 default 57% of the time, almost three times the average (Figure 2). These are threshold-shaped relationships that a straight line cannot represent well. This already suggests that tree-based models will do better than a purely linear one.")]));
children.push(figure("report_default_rate_bands.png", 6.6, 2.14));
children.push(caption("Figure 2. Default rate by debt-to-income band, length of credit history and loan amount."));
children.push(p([bold("Past repayment behaviour predicts future behaviour. "), txt("The default rate rises from 17% with no major derogatory report to 39% with one, 51% with two and about 75% with three or more. It rises from 14% with no delinquent credit line to 34% with one, 45% with two and 100% with six or more. It rises from 16% with no recent credit inquiry to 39% with four, and to about 46% with five or more (252 applicants, Figure 3). Each of these is a plain-language reason that the bank can give an applicant.")]));
children.push(figure("report_credit_history.png", 6.6, 2.14));
children.push(caption("Figure 3. Default rate by number of derogatory reports, delinquent credit lines and recent credit inquiries."));
children.push(p([bold("Occupation matters moderately. Loan purpose barely matters on its own. "), txt("'Other' is the largest occupation group (42% of stated occupations). Sales (35%) and self-employed (30%) applicants default most. Office workers (13%) and professionals (17%) default least. Sales (109 applicants) and self-employed (193 applicants) are small groups, so we read their default rates with care. Debt consolidation is 69% of the stated loan purposes. Home-improvement loans default slightly more often than debt-consolidation loans (22% vs 19%). Both relationships are statistically significant (chi-square tests, p = 0.005 for loan purpose, p < 0.001 for occupation). On its own, loan purpose is too weak to drive decisions, but it changes the risk within some occupations (see below). The bank must handle occupation with care under fair-lending rules.")]));
children.push(p([bold("Amounts differ significantly but modestly. "), txt("Defaulters borrowed less (median $14,900 vs $16,900) and had slightly lower property values ($82,000 vs $90,659) and mortgage balances ($60,279 vs $66,839). Mann-Whitney tests give p < 0.001 for each, but the gaps are small relative to the amounts. Property value and mortgage balance are correlated at 0.88, so they carry much the same information.")]));

children.push(p([bold("Risk factors combine rather than act alone. "), txt("Crossing the strongest drivers shows how they work together (Figure 4). When the debt-to-income ratio is 45% or less, delinquency still decides much of the risk. In that group, 3% to 9% defaulted with no delinquent lines, and 25% to 30% with two or more. Above 45%, 91% to 100% defaulted, whatever the number of delinquent lines. When the ratio is missing, delinquency adds risk on top: 50% defaulted with no delinquent lines and 87% with two or more. A derogatory report raises the default rate at every credit-history length, from 8% to 32% even with 20 years or more of history. When both the ratio and the property value are missing, 99% of the 81 applicants defaulted. Loan purpose, weak on its own, changes the risk within some occupations. Self-employed applicants defaulted 44% of the time on debt consolidation and 18% on home improvement. These combined effects favour tree-based models, which split on one driver inside another.")]));
children.push(figure("report_interactions.png", 6.6, FIG_H_INTERACTIONS));
children.push(caption("Figure 4. Default rate for pairs of variables: debt-to-income band by delinquent credit lines, and occupation by loan purpose. Each cell shows the default rate and the number of applicants."));

children.push(h2("Data treatments and pre-processing"));
children.push(
  bullet([bold("Test set reserved first. "), txt("We reserved a stratified 30% of applicants (1,788, including 357 defaulters) as the test set before we fitted any statistic. This ensures that outlier fences, imputation values and scaling never see the test rows.")]),
  bullet([bold("Missing values. "), txt("We created a 0/1 'was missing' flag for each of the eleven columns with gaps. We then filled numerical gaps with the training-row median and categorical gaps with the training-row mode. We removed no rows.")]),
  bullet([bold("Outliers. "), txt("For the linear model only, we capped LOAN, MORTDUE, VALUE, YOJ, CLAGE, NINQ, CLNO and DEBTINC at the inter-quartile whiskers of the training rows. This removes the impossible debt-to-income and credit-age values. We capped DEROG and DELINQ at their 99th percentile (5 and 6) instead, because their inter-quartile range is zero. Tree models use the untouched values. They split on rank order, so extreme values do not distort them. Capping would only merge the largest values into one value.")]),
  bullet([bold("Encoding and scaling. "), txt("We one-hot encoded loan purpose and occupation (first level removed). We standardised the continuous inputs for the logistic regression only. We left the flags as 0/1 so their coefficients read as the effect of the flag.")]),
  bullet([bold("Imbalance. "), txt("We handled the 1:4 class imbalance inside the models rather than by resampling, so we kept every real applicant. We used class weights while we built the individual models, and the decision threshold when we chose the final model.")]),
);

// ---------------------------------------------------------------- 3. building models
children.push(h1("3. Building Models"));
children.push(h2("Measure of success"));
children.push(p("The two errors a scoring model can make do not cost the same. Approving an applicant who then defaults (a missed defaulter) costs a large part of the principal plus collection costs. Defaulted loans averaged $16,900. If the bank recovers about half through the collateral, a missed defaulter costs roughly $9,000 with collection costs. Declining a creditworthy applicant costs the interest margin on one customer, roughly $2,000. The primary metric is therefore recall on the default class (the share of future defaulters the model flags). Recall alone rewards a model that flags everyone, so we track precision (the share of flagged applicants who really default) and F1 as guard-rails. We report accuracy for completeness. ROC-AUC measures how well the model ranks applicants by risk, which matters when we move the threshold. We tuned the logistic regression, the decision tree and the random forest by cross-validated grid search that optimises recall. We then chose the final model's configuration and its threshold on the expected cost of the two errors. We estimated that cost with repeated out-of-fold predictions on the training rows, so that precision has an explicit price in the choice."));

children.push(h2("Models built and what each one taught us"));
children.push(p([bold("Why these techniques. "), txt("The data exploration found four facts that set the choice. (1) Risk changes in steps, not in straight lines, for example at a 45% debt-to-income ratio. (2) Risk factors combine, for example delinquency inside the lower debt-to-income bands. (3) A blank field is itself a risk signal. (4) Only one applicant in five defaults. A decision tree splits on thresholds and on one driver inside another, so it fits facts 1 and 2. It also gives readable rules for adverse-action reasons. A single tree is unstable, so we added bagging to reduce variance. The random forest also picks a random subset of inputs at each split, which makes the trees less alike. Logistic regression is the transparent linear benchmark. It measures how much the non-linear models add. Every model receives a missing-value flag for each field with gaps, which covers fact 3. Class weights and the decision threshold handle fact 4, and we keep every real applicant. We did not explore k-nearest neighbours or support vector machines. The bank cannot easily explain their decisions to an applicant, and the ECOA requires such an explanation.")]));
children.push(p("Table 2 lists the main models, their performance on the held-out applicants and the insight that each one contributed. Two more models gave no gain at the 0.5 threshold. A fully grown tree with 0.2/0.8 class weights caught 62% of defaulters at 72% precision. Bagging with class-weighted trees caught 60% at 81% precision. In both cases, each fully grown tree still fits its training sample perfectly."));
children.push(table(
  ["Model (test set, 0.5 threshold)", "Recall", "Precision", "Accuracy", "ROC-AUC", "Meaningful insight"],
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
  [1900, 850, 1100, 1100, 1000, 3410],
));
children.push(caption("Table 2. Models built, their held-out performance and the insight each one contributed."));
children.push(p([bold("Validation scores before and after tuning. "), txt("Cross-validation on the training rows shows the tuning gains, so they do not depend on the test set. Cross-validated recall rose from 63% to 81% for the logistic regression (plain to balanced weights). It rose from 64% to 83% for the decision tree (fully grown to grid search). It rose from 70% to 81% for the random forest (default to grid search). Cross-validated precision fell at the same time, from 79% to 60%, from 66% to 53% and from 83% to 64%. So the final step tuned the forest's decision threshold on expected cost. This step used three different 5-fold splits of the training rows, not the forest's single 3-fold split above. This explains the small difference in its scores. On these out-of-fold predictions, the default forest caught 71.4% of defaulters at 82.5% precision with the 0.5 threshold. With the 0.15 threshold it caught 93.7% at 64.7% precision. The cost per 1,000 applicants fell from about $575,000 to about $317,000, which is 45% lower.")]));
children.push(p([bold("What the models say drives default. "), txt("The techniques agree on four main drivers: the debt-to-income ratio, whether it was recorded, the number of delinquent credit lines and the credit-history length. Derogatory reports also matter in the linear model and in both trees, but the final forest gives them less weight (10th of 27 inputs). Loan, property and mortgage amounts matter in combination. Occupation and loan purpose add little on their own. A linear model, a single tree and the ensembles agree, and this is the best evidence that the signal is real.")]));

// ---------------------------------------------------------------- 4. comparison
children.push(h1("4. Comparison of Techniques and their Performance"));
children.push(p("Figure 5 compares the techniques on the held-out applicants. Table 3 lists their pros and cons for this problem."));
children.push(figure("report_model_comparison.png", 6.4, 2.71));
children.push(caption("Figure 5. Share of defaulters caught, precision and risk-ranking quality of each technique on the held-out applicants."));
children.push(p([bold("Why recall with a precision guard-rail is the right metric. "), txt("A missed defaulter costs about 4.5 times a wrongly declined good applicant, so the bank should prefer models that catch defaulters. This preference holds only while the number of declined good applicants stays proportionate. Accuracy would reward approving everyone (80% accurate and useless). Recall alone would reward declining everyone. The business sets the order: recall first, precision second, and expected cost to settle the trade-off.")]));
children.push(p([bold("Which technique performs better. "), txt("Linear vs non-linear: the balanced logistic regression reaches 80% recall but only 61% precision and a ROC-AUC of 0.91. Every forest beats it on precision and ranking at a similar recall, because the data is made of thresholds. Single tree vs ensembles: the pruned tree catches the most defaulters at the 0.5 threshold (82%) but with the lowest precision (53%). Bagging shows that averaging alone lifts precision to 83%. At the 0.5 threshold, the class-weighted forest gives the best balance. It reaches 77% recall at 77% precision, the highest F1 score (0.77) of all models at that threshold, and a ROC-AUC of 0.96. On the chosen yardstick (expected cost at each model's own best threshold), the unweighted Random Forest performs best (Table 5). It costs about $317,000 per 1,000 applicants, against $550,000 for the logistic regression and $607,000 for the tuned tree. It wins because it ranks applicants best (ROC-AUC 0.96). At its own best threshold it catches more defaulters than the logistic regression and the tuned tree, and its precision is still higher. Out of fold, it catches 93.7% of defaulters at 64.7% precision. The logistic regression catches 81.5% at 59.9%, and the tuned tree catches 80.0% at 56.3%.")]));
children.push(p([bold("Is there scope to improve further? "), txt("Yes, and we already apply the first improvement below. Choosing the operating threshold on expected cost rather than at 0.5 moves the forest's recall above 90% at a controlled precision cost. We expect further gains from engineered features such as a combined loan-to-value ratio ((loan + mortgage due) / property value), debt-to-income bands and interaction terms. These features would also help the linear model. Gradient boosting is the next technique to explore. It builds trees one after another, and each new tree corrects the errors of the earlier trees. It keeps what makes trees fit this data: thresholds, combined risk factors and blank fields. On tabular data like this it often ranks applicants better than a random forest. Probability calibration would let the bank read the score as a default rate. This matters because the forest's scores understate risk in the decision range (Section 5). We also expect gains from reject inference. Reject inference matters because the data only covers loans the bank approved, so the models never saw the applicants the old process declined.")]));
children.push(table(
  ["Technique", "Pros", "Cons"],
  [
    ["Logistic Regression", "It is fully transparent: one coefficient per attribute, and the bank can quote odds ratios. It is trivial to run and very stable.", "It under-fits threshold effects on the raw inputs. At the same recall it declines many more good applicants, and it is sensitive to outliers and correlated inputs."],
    ["Decision Tree", "It is a readable rule list that captures thresholds, and it is cheap.", "It is unstable between re-trainings and has the lowest precision when tuned for recall. It over-fits unless pruned."],
    ["Bagged trees", "It reduces variance by a large amount and is stable. Its precision and ranking quality are high.", "It has no rule list, and class weights do not move its recall. The forest supersedes it."],
    ["Random Forest", "It has the best balance of recall and precision, the best ranking quality, and is stable. Importances and a surrogate tree explain it now. Per-applicant risk drivers (for example SHAP values) are a build item before the shadow run.", "It is not a rule list on its own. Some stakeholders perceive it as a black box. It needs model-risk documentation and drift monitoring."],
  ],
  [1800, 3780, 3780], true,
));
children.push(caption("Table 3. Pros and cons of the techniques for this problem."));
children.push(p([bold("Do the drivers remain significant after modelling? "), txt("Yes, for the main drivers. The debt-to-income ratio, its missing flag, delinquent credit lines and credit-history length are strong in the EDA. They stay strong in every model. In the logistic regression, a missing ratio multiplies the odds of default by about 13. Each standard deviation of delinquent lines multiplies them by about 2.4. The pruned tree and the surrogate tree split first on the missing flag, then on the ratio and on delinquent lines. In the final forest these four carry about half of the decision power and give the four largest permutation drops. Some EDA findings weaken after modelling. Loan purpose is significant in the EDA (p = 0.005) but adds little to any model. The loan, property and mortgage amounts differ significantly but modestly. The linear model gives the loan amount almost no weight (odds ratio 0.995). A missing property valuation has the largest linear odds ratio (about 45). But it ranks only 12th in the forest, because only 1.9% of applicants have no valuation. Each occupation indicator ranks outside the forest's top 12. But the forest without occupation costs about 10% more, so occupation stays significant as a group.")]));
children.push(p([bold("Most meaningful insights.")], { para: { keepNext: true } }));
children.push(
  numbered("Unverified affordability is the largest risk. Applicants with no recorded debt-to-income ratio defaulted 62% of the time. They make up two thirds of all defaulters.", "insights", true),
  numbered("Debt burden has a cliff. Above a 45% ratio, 87% to 100% of applicants defaulted.", "insights", true),
  numbered("Past repayment behaviour predicts default. The default rate rises from 14% with no delinquent line to 45% with two.", "insights", true),
  numbered("A long credit history protects. Under five years of history, 44% defaulted. Over twenty years, about 10% did.", "insights", true),
  numbered("The decision threshold is a business dial. The same forest catches 69% of defaulters at 0.5 and 93% at 0.15.", "insights", true),
  numbered("The bank can act on the first four insights now, through its approval rules, before it deploys a model.", "insights"),
);

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
  [1300, 1300, 1150, 1150, 1250, 1700, 1510],
));
children.push(caption("Table 4. Stage 1 of the selection: forest configurations (200 trees, all 27 inputs) on repeated out-of-fold predictions of the training rows, sorted by mean expected cost. Costs assume $9,000 per missed defaulter and $2,000 per wrongly declined applicant. The standard error of a mean cost is the fold-to-fold SD divided by the square root of the 15 folds. For the lowest-cost row this is about $10,500. We treat configurations within one standard error of it as tied."));
children.push(p("Fully grown trees beat constrained trees by a wide margin for every weighting. A minimum leaf of 5 or 10 applicants (10 was the recall-only grid search's choice) makes the probabilities cruder. This costs dearly once the threshold is free to move. Among the fully grown forests the class weights barely matter. The unweighted, 0.3/0.7 and 0.2/0.8 forests lie within one standard error (about $10,500) of each other. They simply reach their minimum at different thresholds (0.15, 0.20 and 0.25). By the pre-stated rule we kept the unweighted forest, the simplest configuration with the lowest mean cost. Its score also keeps a natural reading as an estimated default rate, which we checked with a calibration table on the out-of-fold scores. It understates risk in the decision range, as we discuss below. Stage 2 pitted it against the recall-tuned grid winner, each on all 27 inputs and on the 12-input subset. The same stage also tested it without any occupation information, the fallback a fair-lending review might require. We scored the balanced logistic regression and the recall-tuned tree the same way at their own cost-minimising thresholds. This compares every technique on the chosen yardstick (Table 5)."));
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
children.push(p([bold("The forest wins on cost. "), txt("The unweighted forest on all 27 inputs has the lowest expected cost. The recall-tuned grid winner costs about half again as much once precision has a price. This shows that recall-only tuning over-shoots. The balanced logistic regression and the tuned tree cost about $550,000 and $607,000 per 1,000 even at their own best thresholds. So the forest wins on the chosen yardstick as well as on ranking quality.")]));
children.push(p([bold("Simpler models cost more. "), txt("Removing all occupation information costs about 10% more, and the 12-input version costs about a fifth more. Both are well outside one standard error. So occupation, loan purpose and the minor flags do add value at the cost-optimal operating point, and we choose neither simpler model. Removing occupation is therefore a policy choice with a measurable price.")]));
children.push(p([bold("The threshold is stable. "), txt("The cost-minimising threshold is 0.15 (flag every applicant whose score exceeds 0.15, an estimated default risk of roughly one in five). It stays at 0.15 for any cost ratio between 3:1 and 6:1. It moves to 0.20 at 2:1, and to 0.10 at 8:1 and 9:1. Figure 6 shows the curves at the 4.5:1 costs. The threshold also stays at 0.15 on a finer 0.01 grid. We repeated the class-weight search for fully grown trees on two other 70/30 splits. The unweighted forest was again the cheapest, and its threshold stayed at 0.15.")]));
children.push(p([bold("Calibration and pipeline. "), txt("The threshold sits just below the textbook break-even of 0.18 for a perfectly calibrated score, because the forest's scores understate risk in the decision range. The scores still rank applicants well (Brier score 0.062 against 0.160 for the base rate). Applicants scored 0.15 to 0.20 defaulted about 23% of the time, so a score of 0.15 reads as roughly one-in-five estimated risk. Table 7 lists the 27 inputs and the model settings. We fill blanks with the training-row medians and modes, for example 34.84% for the debt-to-income ratio, DebtCon for loan purpose and Other for occupation.")]));
children.push(figure("report_threshold.png", 6.4, FIG_H("report_threshold.png", 6.4)));
children.push(caption("Figure 6. Recall and precision (top) and indicative expected cost (bottom) as the forest's threshold moves, on out-of-fold predictions of the training rows."));

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
children.push(p("Scaled to 1,000 applicants, the test results show the following (Table 6):", { para: { keepNext: true } }));
children.push(
  bullet([bold("Defaulters: "), txt("the model flags about 185 of 200 defaulters before the money leaves the bank. It misses about 15.")]),
  bullet([bold("Good applicants: "), txt("it wrongly flags about 87. This is 11% of creditworthy applicants, against 3% at the 0.5 threshold.")]),
  bullet([bold("Cost: "), txt("with the indicative costs, the cost of credit errors falls from about $1.8 million to about $0.3 million (83% less). Today the bank approves every applicant, and 20% default.")]),
  bullet([bold("Consistency: "), txt("test and out-of-fold results agree (recall 93% vs 94%, precision 68% vs 65%, cost $304,000 ± $28,000 vs $317,000). One test evaluation is too noisy to choose between the close configurations, so that choice rests on the out-of-fold comparison.")]),
  bullet([bold("Approval rate: "), txt("the model flags about 27% of applicants, so the bank would approve about 73%. At the 0.5 threshold it flags 16%.")]),
  bullet([bold("Bands at 0.10 and 0.25: "), txt("the bank would approve about 69% automatically (about 1% defaulted) and refer about 7% (about 24% defaulted). It would decline about 24% (74% defaulted, 87% of all defaulters). It declines about 62 creditworthy applicants automatically and refers about 55.")]),
  bullet([bold("Decision rule: "), txt("Table 6 and the cost figures are for the single 0.15 threshold. The bands are the operating procedure around it. Under the bands, the model catches between 87% and 96% of defaulters. The low end holds if underwriters approve every referral, and the high end if they decline every referral.")]),
  bullet([bold("Recorded ratio: "), txt("about a fifth of applicants have no recorded debt-to-income ratio. They include two thirds of all defaulters. The model flags 96% of these applicants and catches 98% of their defaulters. On applicants with a recorded ratio, it flags 9% and catches 83% of their defaulters at 80% precision. This is the better guide once income verification is mandatory.")]),
);

children.push(h2("Performance versus interpretability"));
children.push(p([bold("The trade-off. "), txt("The forest performs best, but nobody can read it as a rule list. The ECOA requires a specific reason for each adverse decision. The proposal resolves the trade-off with a surrogate decision tree and per-applicant risk drivers.")]));
children.push(p([bold("The surrogate tree. "), txt("This is a four-level tree that we fit to the forest's out-of-fold flag/clear decisions on the training rows. We use out-of-fold decisions because a fully grown forest reproduces its training labels almost perfectly. In-sample decisions would therefore teach the tree the labels rather than the forest's behaviour on new applicants. The surrogate reproduces 93% of the forest's decisions on unseen applicants, against 73% for a rule that never flags anyone. Its rules are the same drivers the analysis found throughout. If the debt-to-income ratio is missing, the tree flags the applicant. If the ratio is recorded and above about 44%, the tree flags the applicant. At or below 44%, the tree flags the applicant if there is a delinquent credit line together with a major derogatory report. Otherwise the tree clears the applicant.")]));
children.push(p([bold("Reasons for each applicant. "), txt("Each adverse-action notice must also give the reasons for that applicant. So the bank builds per-applicant risk drivers from the forest (for example SHAP values) in the first two months, before the shadow run. These drivers give the reason for each decline, including the automatic declines above 0.25. They also cover the roughly 7% of decisions that the surrogate does not reproduce. The surrogate rules give the plain-language summary of how the model decides.")]));
children.push(p([bold("What the forest relies on. "), txt("Figure 7 shows the inputs that the forest relies on most. The debt-to-income ratio, its missing flag, delinquent lines and credit-history length together carry about half of its decision power. Permutation importance ranks the same four at the top.")]));
children.push(figure("report_feature_importance.png", 5.9, 2.99));
children.push(caption("Figure 7. The twelve inputs the final Random Forest relies on most."));

children.push(h2("The proposed solution design"));
children.push(p("Table 7 summarises the proposed solution design.", { para: { keepNext: true } }));
children.push(table(
  ["Element", "Proposal"],
  [
    ["Scoring engine", "Random Forest, 200 fully grown trees, no class weights. The configuration search showed that class weights add nothing once we choose the threshold on cost. The 0.3/0.7 and 0.2/0.8 weightings lie within one standard error of the unweighted forest. The balanced and 0.1/0.9 weightings cost about $13,000 and $27,000 more per 1,000 applicants. The 27 inputs are of three kinds. The 10 financial attributes (LOAN, MORTDUE, VALUE, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). A 0/1 missing-value flag for each of the 11 fields with gaps (MORTDUE, VALUE, REASON, JOB, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). Six 0/1 indicators from one-hot encoding (REASON = HomeImp, and JOB = Office, Other, ProfExe, Sales, Self). Median/mode imputation learned on training rows, plus a missing flag per field. No outlier capping, no scaling."],
    ["Decision rule", "Flag when predicted probability > 0.15. This threshold is cost-minimising on repeated out-of-fold predictions and stable for cost ratios 3:1 to 6:1. It is just below the textbook break-even of 0.18, as expected for a score that understates risk, and unchanged on two other train/test splits. We will re-derive it with the bank's own loss and margin figures. Approve / refer / decline bands at 0.10 and 0.25 keep an underwriter in the loop around the threshold. On the test set the bands hold about 69% / 7% / 24% of applicants, with default rates of about 1% / 24% / 74%. The headline figures (92.7% recall, 68.1% precision, 83% lower cost) are for the 0.15 threshold alone."],
    ["Explanation layer", "A surrogate decision tree of depth 4, fitted to the forest's out-of-fold decisions, gives the plain-language summary of the rules. It agrees with the forest on 93% of unseen applicants. Per-applicant risk drivers from the forest (for example SHAP values, built before the shadow run) give the reason on each adverse-action notice."],
    ["Fallback", "The same forest without any occupation information (21 inputs), if the fair-lending review requires it (about 10% more expected credit-error cost). The 12-input lean model costs about a fifth more, and we do not recommend it."],
    ["Policy rules to adopt now", "Make income and property-valuation verification mandatory. Decline or escalate above a 45% debt-to-income ratio. Refer an applicant with two or more delinquent lines (45% and above observed default) to an underwriter. Also refer an applicant with two or more derogatory reports (51% and above). We read these thresholds from the observed default rates. Where a hard rule and the score disagree, the stricter outcome applies. The band shares above do not include these rule-driven referrals."],
    ["Why this is the best solution", "It has the lowest expected cost of credit errors among the fifteen forest configurations (Table 4) and the seven final candidates (Table 5). We chose it under a pre-stated rule without the test set. We then measured it once on the test set (93% recall, 68% precision, consistent with the out-of-fold estimate). It is stable: hundreds of averaged trees, out-of-fold and test agree, and the threshold is insensitive to cost assumptions. It is interpretable through the surrogate tree and per-applicant risk drivers. It is deployable on fields the underwriting process already captures."],
  ],
  [2300, 7060],
));
children.push(caption("Table 7. The proposed solution design."));
children.push(h2("Is the model ready for production? Yes, with conditions"));
children.push(p("The model's performance is good enough for production. On 1,788 unseen applicants it catches 92.7% of defaulters at 68.1% precision (ROC-AUC 0.96). This agrees with the out-of-fold estimate (recall 94%, precision 65%). Under the indicative costs it cuts the cost of credit errors by about 83%. The surrogate tree and the per-applicant risk drivers make its decisions explainable. But the model must not affect real lending decisions until the bank meets five conditions:", { para: { keepNext: true } }));
children.push(
  numbered("Run the model in shadow mode on all applications for one to two months. Compare its flags with the underwriters' decisions, and set the band edges to match underwriting capacity.", "conds"),
  numbered("Build the per-applicant risk drivers, so that every decline has a specific reason under the ECOA.", "conds"),
  numbered("Pass a fair-lending review of approval and error rates across protected groups. Use the 21-input model without occupation if the review requires it.", "conds"),
  numbered("Re-derive the 0.15 threshold from the bank's own loss and margin figures.", "conds"),
  numbered("Test the model on past applicants with a recorded debt-to-income ratio, and refit it if necessary. On the test set it catches 83% of their defaulters at 80% precision. This test matters because mandatory income verification removes the model's strongest signal.", "conds"),
);
children.push(p("After go-live, an underwriter reviews every applicant in the 0.10 to 0.25 band. The bank monitors the approval rate monthly, and it monitors recall and precision as repayment outcomes arrive. It re-trains the model at least once a year, or sooner if the default rate drifts."));
children.push(p([bold("Caveats and next steps towards the final submission. "), txt("The data covers only loans the bank approved, so the models never saw the applicants the old process declined. The shadow period and, later, reject inference address this gap. The cost assumptions are indicative, and we will replace them with the bank's figures. The final submission will add the implementation plan, stakeholder actionables, a benefit and cost estimate, and the risks and further analysis in full.")]));

// ---------------------------------------------------------------- document
const doc = new Document({
  creator: "Shubham Garg",
  title: "Capstone Project: Loan Default Prediction - Milestone Report",
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    { reference: "goals", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    { reference: "kq", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    { reference: "insights", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    { reference: "conds", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
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
