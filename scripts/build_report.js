// Builds reports/Loan_Default_Prediction_Final_Report.docx (Final Submission).
// Run from the repository root:  node scripts/build_report.js
// Requires the figures produced by scripts/extract_figures.py.

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, LevelFormat, PageBreak, Footer, PageNumber,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const FIG = (name) => fs.readFileSync(path.join(ROOT, "reports", "figures", name));
const OUT = path.join(ROOT, "reports", "Loan_Default_Prediction_Final_Report.docx");

const NAVY = "1E2761";
const GREY = "595959";
const LIGHT = "E8EEF7";
const FONT = "Calibri";

// ---------- helpers ----------
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 140, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: Array.isArray(text) ? text : [new TextRun({ text, font: FONT, size: 22, ...opts.run })],
    ...opts.para,
  });
const bold = (t) => new TextRun({ text: t, bold: true, font: FONT, size: 22 });
const txt = (t) => new TextRun({ text: t, font: FONT, size: 22 });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 320, after: 160 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: NAVY })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: NAVY })] });
const bullet = (runs, level = 0) =>
  new Paragraph({ numbering: { reference: "bullets", level }, spacing: { after: 90, line: 264 },
    children: Array.isArray(runs) ? runs : [txt(runs)] });
const numbered = (runs, ref) =>
  new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 100, line: 264 },
    children: Array.isArray(runs) ? runs : [txt(runs)] });
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
  children: [new TextRun({ text: t, italics: true, font: FONT, size: 19, color: GREY })] });
const figure = (name, widthIn, heightIn) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
    children: [new ImageRun({ type: "png", data: FIG(name), transformation: { width: Math.round(widthIn * 96), height: Math.round(heightIn * 96) } })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(header, rows, widths, keepTogether = false) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (text, isHeader, w, alignRight, keep = false) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 0 }, keepNext: keep,
        children: [new TextRun({ text: String(text), bold: isHeader, font: FONT, size: 19, color: isHeader ? "FFFFFF" : "000000" })] })],
    });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => cell(h, true, widths[i], false, keepTogether)) }),
      ...rows.map((r, ri) => new TableRow({
        cantSplit: true,
        children: r.map((c, i) => {
          const tc = cell(c, false, widths[i], i > 0 && /^[\d$.,%\-]+$/.test(String(c)), keepTogether && ri < rows.length - 1);
          if (ri % 2 === 1) tc.options = tc.options || {};
          return tc;
        }),
      })),
    ],
  });
}
const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });

// ---------- content ----------
const children = [];

// Title block
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 200 },
    children: [new TextRun({ text: "Capstone Project: Loan Default Prediction", font: FONT, bold: true, size: 44, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "Final Submission Report", font: FONT, size: 30, color: GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Practical Data Science track (Classification)", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "MIT Professional Education - Applied AI and Data Science Program", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Shubham Garg  |  November 2026", font: FONT, size: 22, color: GREY })] }),
);

// 1. Executive summary
children.push(h1("1. Executive Summary"));
children.push(p([
  txt("A bank's consumer credit department asked for an empirically derived, interpretable model that predicts which home equity loan applicants are likely to default, together with guidance on which applicant attributes should drive approval decisions. Using the Home Equity (HMEQ) dataset of "),
  bold("5,960 recent loans"), txt(", of which "), bold("19.9% defaulted"),
  txt(", this project explored the data, built and tuned linear and tree-based classifiers, compared them on a business-driven metric and arrived at a deployable solution design."),
]));

children.push(h2("Most important findings from the analysis"));
children.push(
  bullet([bold("Missing information is the strongest single risk signal. "), txt("Applicants with no recorded debt-to-income ratio defaulted 62% of the time versus 8.6% when the ratio was recorded. Applicants with no property valuation defaulted 94% of the time. Unverifiable income or collateral should be treated as a red flag, not a neutral gap.")]),
  bullet([bold("Debt-to-income has a hard threshold. "), txt("Below a 40% ratio only 4% to 7% of applicants default; between 40% and 45% the rate is 11%; above 45% it is 87% to 100%. A 45% cut-off is a simple, defensible policy rule.")]),
  bullet([bold("Past repayment behaviour predicts future behaviour. "), txt("The default rate rises from 17% with no major derogatory report to 39% with one, 51% with two and over 70% with three or more. Delinquent credit lines show the same pattern (14% at zero, 34% at one, 100% at six or more), as do recent credit inquiries.")]),
  bullet([bold("A long credit history protects. "), txt("Applicants whose oldest credit line is under five years old default 43% of the time; above twenty years the rate is about 10%.")]),
  bullet([bold("Small loans are not safe loans. "), txt("Loans under $5,000 default 57% of the time, almost three times the average.")]),
  bullet([bold("Occupation and loan purpose matter little once financial behaviour is known. "), txt("Sales and self-employed applicants default more often (35% and 30%) and office workers least (13%), but removing occupation and loan purpose from the final model changed its performance by at most one point. The production model can run without them, which simplifies fair-lending compliance.")]),
  bullet([bold("Tree-based models beat the linear model. "), txt("The relationships in this data are thresholds and cliffs rather than straight lines. A class-weighted Random Forest scored 0.96 on risk-ranking quality (ROC-AUC, where 1.0 means every defaulter is ranked above every repayer) against 0.91 for logistic regression, and at a similar share of defaulters caught it declined far fewer good customers.")]),
);

children.push(h2("Final proposed model specification"));
children.push(table(
  ["Element", "Specification"],
  [
    ["Scoring engine", "Random Forest classifier, 200 trees, class weights {repaid: 0.2, default: 0.8}, scikit-learn defaults otherwise"],
    ["Inputs", "The 10 financial attributes (LOAN, MORTDUE, VALUE, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC) plus two indicator flags: debt-to-income ratio missing and property value missing. Occupation and loan purpose are not required."],
    ["Pre-processing", "Median imputation for numerical gaps, mode for categorical gaps, a missing-value flag for every imputed field; no outlier capping for the tree model"],
    ["Decision threshold", "Flag as likely default when predicted probability > 0.25 (cost-minimising value under the stated loss assumptions), instead of the default 0.5"],
    ["Explanation layer", "A pruned Decision Tree (balanced class weights, minimum 20 applicants per leaf) trained on the same data; its rules on debt-to-income, delinquencies, derogatory reports and credit-history length supply the adverse-action reasons required under the Equal Credit Opportunity Act"],
    ["Measure of success", "Recall on the defaulter class (share of future defaulters caught), with precision and F1 as guard-rails against declining too many good customers"],
    ["Performance on unseen applicants", "93.3% of defaulters caught (recall), 67.0% precision, 89.5% accuracy, risk-ranking quality (ROC-AUC) 0.96. At the default 0.5 threshold: 78.4% recall, 77.3% precision, 91.1% accuracy."],
    ["Validation", "70/30 stratified train/test split; hyper-parameters chosen by 3- and 5-fold stratified cross-validation on the training set only"],
  ],
  [2300, 7060],
));
children.push(spacer());
children.push(h2("Key next steps"));
children.push(
  bullet([bold("Decide and calibrate: "), txt("the head of consumer credit approves the three-band policy (approve / refer / decline); finance supplies actual loss-given-default and margin figures so the 0.25 threshold can be confirmed.")]),
  bullet([bold("Prepare the process: "), txt("make income and property-valuation verification mandatory fields, since their absence is the strongest default signal; build the scoring pipeline with reason codes.")]),
  bullet([bold("Prove it safely: "), txt("run the model in shadow mode alongside manual decisions for one to two months and complete a fair-lending review before switching it on.")]),
  bullet([bold("Make the most of it: "), txt("automate clear approvals and declines, route the uncertain band to underwriters, monitor recall, precision and approval rate monthly, and re-train yearly.")]),
  bullet([bold("Improve it: "), txt("add reject inference, loan-to-value and payment-to-income features, probability calibration and time-based validation in the next iteration.")]),
);
children.push(p([
  txt("Per 1,000 applicants the proposed model is expected to catch about 187 of the 200 defaulters, miss about 13, and decline about 92 customers who would have repaid. Under indicative cost assumptions (a missed defaulter costs about $9,000, a wrongly declined good customer about $2,000) this cuts default-related cost from roughly "),
  bold("$1.8 million per 1,000 applicants"), txt(" today to about "), bold("$0.3 million"), txt(", a reduction of more than 80%."),
]));

// 2. Problem and solution summary
children.push(h1("2. Problem and Solution Summary"));
children.push(h2("Summary of the problem"));
children.push(p("A large share of a retail bank's profit comes from interest on home loans and home equity lines of credit, and the single biggest threat to that profit is the borrower who does not repay: one non-performing loan wipes out the interest earned on many good ones. Today the approval decision is made by an underwriter's manual review of each application. The process is slow, costly, inconsistent across underwriters and vulnerable to human error and bias. Earlier attempts to automate it relied on hand-written heuristics."));
children.push(p("The consumer credit department wants to replace that process with an empirically derived, statistically sound credit-scoring model built from the bank's own data on recent applicants, in line with the Equal Credit Opportunity Act. The model must do two things at once: predict at application time which applicants are likely to default, and remain interpretable enough that the bank can give a specific, defensible reason for every rejection. Formally this is a supervised binary classification problem on 5,960 historical loans with 12 attributes known at application time and a target indicating default or serious delinquency."));

children.push(h2("Why this solution design"));
children.push(p([bold("The metric follows the money. "), txt("The two errors a scoring model can make do not cost the same. Approving someone who then defaults (a missed defaulter) costs the bank most of the principal plus collection costs; declining someone who would have repaid costs only the interest margin on one customer. The primary measure of success is therefore the share of future defaulters the model catches (recall), with precision and F1 tracked so the model does not simply decline everyone.")]));
children.push(p([bold("Missing values were treated as information, not noise. "), txt("Because the absence of a debt-to-income ratio or a property valuation was itself the strongest predictor of default, every imputed field received a 'was missing' indicator before imputation. This single step is responsible for a large part of every model's performance.")]));
children.push(p([bold("Linear and non-linear techniques were compared head to head. "), txt("Logistic regression (the transparent linear benchmark), a decision tree (readable rules), a bagged ensemble of trees and a random forest were trained on the same 70/30 stratified split, tuned with cross-validated grid search optimising recall, and evaluated on the held-out 30%. Building up from one tree to bagging to a forest makes the contribution of each idea visible. Time-series techniques were not applicable because the applications carry no dates. The table below summarises the result.")]));

children.push(table(
  ["Model (held-out test set, 1,788 applicants)", "Defaulters caught", "Precision", "Accuracy", "Risk-ranking quality (ROC-AUC)"],
  [
    ["Logistic Regression (plain)", "57%", "77%", "88%", "0.91"],
    ["Logistic Regression (balanced class weights)", "80%", "61%", "86%", "0.91"],
    ["Decision Tree (fully grown)", "69%", "71%", "88%", "0.81"],
    ["Decision Tree (tuned, pruned, balanced)", "82%", "53%", "82%", "0.88"],
    ["Bagged trees (200 trees)", "68%", "83%", "91%", "0.95"],
    ["Random Forest (default)", "69%", "85%", "91%", "0.96"],
    ["Random Forest (class weights 0.2/0.8)", "78%", "77%", "91%", "0.96"],
    ["Random Forest (tuned for recall)", "78%", "65%", "87%", "0.93"],
    ["Random Forest (tuned, 12 features only)", "78%", "66%", "88%", "0.93"],
    ["Proposed: RF (class weights), threshold 0.25", "93%", "67%", "90%", "0.96"],
  ],
  [3860, 1400, 1200, 1200, 1700],
));
children.push(caption("Table 1. Performance of the techniques explored on the held-out test set."));

children.push(figure("report_model_comparison.png", 6.4, 2.71));
children.push(caption("Figure 1. Share of defaulters caught, precision and risk-ranking quality of each technique on the held-out applicants."));

children.push(p([bold("The Random Forest was chosen as the scoring engine "), txt("because it offers the best balance on the chosen metric. The tuned decision tree catches slightly more defaulters at the 0.5 threshold (82%) but declines almost one good customer for every defaulter it catches (53% precision). The balanced logistic regression catches 80% but with 61% precision, because a straight line cannot represent the threshold effects in the data. Bagging 200 trees shows the value of averaging: at the same recall as a single fully grown tree, precision rises from 71% to 83% and ROC-AUC from 0.81 to 0.95. The class-weighted forest adds feature sub-sampling and class weights, catches 78% at 77% precision and ranks applicants by risk most accurately (ROC-AUC 0.96), which is what makes the next step possible.")]));
children.push(p([bold("The decision threshold was set from business cost, not convention. "), txt("Because the forest ranks risk so well, lowering its decision threshold from 0.5 to 0.25 raises the share of defaulters caught from 78% to 93% while precision falls only from 77% to 67%. Under the indicative cost assumptions this is the cost-minimising operating point, and every threshold between 0.20 and 0.30 is within 12% of it, so the choice is robust.")]));
children.push(figure("report_threshold.png", 6.4, 2.71));
children.push(caption("Figure 2. Recall, precision and indicative expected cost per 1,000 applicants as the forest's decision threshold moves."));

children.push(p([bold("Interpretability is provided by a companion decision tree. "), txt("A forest of 200 trees cannot be read as a rule list, but the pruned decision tree trained on the same data can, and it uses the same drivers in the same order: is the debt-to-income ratio missing; is it above about 44%; how many delinquent credit lines; how many derogatory reports; how long is the credit history. Those rules supply the adverse-action reasons, while the forest's feature importances (Figure 3) and per-applicant reason codes document the score itself.")]));
children.push(figure("report_feature_importance.png", 5.9, 2.99));
children.push(caption("Figure 3. The twelve inputs the Random Forest relies on most. The debt-to-income ratio and its missing-value flag together carry more than half (52.6%) of the model's decision power."));

children.push(h2("How the solution affects the business"));
children.push(
  bullet([bold("Fewer bad loans. "), txt("Of every 200 defaulters in 1,000 applications the model flags about 187 before the money leaves the bank, against none today.")]),
  bullet([bold("Protected good business. "), txt("About 92 of every 1,000 applicants would be declined or referred although they would have repaid. This is the price of catching defaulters; it is far lower than the single decision tree's 143 and can be reduced further by routing borderline cases to a human underwriter instead of declining them outright.")]),
  bullet([bold("Faster, more consistent decisions. "), txt("Clear approvals and clear declines can be automated; underwriters focus on the uncertain band around the threshold.")]),
  bullet([bold("Defensible decisions. "), txt("Every rejection maps to a small set of plain-language reasons (debt burden, unverified income, delinquencies, derogatory reports, short credit history) that match both the data and lending common sense.")]),
);

// 3. Recommendations for implementation
children.push(h1("3. Recommendations for Implementation"));
children.push(h2("Key recommendations"));
children.push(
  numbered([bold("Deploy the class-weighted Random Forest as a decision-support score, "), txt("integrated into the existing underwriting workflow, with the probability threshold of 0.25 as the initial setting and a three-band outcome: approve (probability below about 0.15), refer to an underwriter (0.15 to 0.40) and decline (above 0.40). The bands keep a human in the loop where the model is least certain.")], "recs"),
  numbered([bold("Make income and collateral verification mandatory before scoring. "), txt("A missing debt-to-income ratio or property valuation is the strongest default signal in the data. Requiring these fields removes the ambiguity, improves the data for the model and is itself a prudent lending control.")], "recs"),
  numbered([bold("Adopt the explicit policy rules the analysis surfaced. "), txt("Decline or escalate applications with a debt-to-income ratio above 45%, with two or more delinquent credit lines, or with two or more major derogatory reports. These rules are transparent, easy to communicate and consistent with the model.")], "recs"),
  numbered([bold("Use the pruned decision tree for adverse-action reasons. "), txt("Generate the reason codes for every decline from the tree's rules and the applicant's top risk drivers, and store them with the application record for audit and for responses to applicants and regulators.")], "recs"),
  numbered([bold("Calibrate the threshold with real cost figures. "), txt("Replace the indicative $9,000 and $2,000 assumptions with the bank's actual loss-given-default and customer lifetime margin, and re-run the cost table before go-live. The analysis shows the optimum is stable across a range of thresholds, so this step refines rather than changes the design.")], "recs"),
  numbered([bold("Run a shadow period and a fairness review before switching on. "), txt("Score every application alongside the manual decision for one to two months, compare outcomes, and test approval and error rates across protected groups. Occupation should stay out of the model unless the review clears it.")], "recs"),
  numbered([bold("Monitor and re-train. "), txt("Track recall, precision, approval rate and the share of applications with missing fields monthly; re-train at least yearly or when the default rate or input distributions drift.")], "recs"),
);

children.push(h2("Key actionables for stakeholders"));
children.push(table(
  ["Stakeholder", "Actionables"],
  [
    ["Head of Consumer Credit (sponsor)", "Approve the three-band decision policy and the initial 0.25 threshold; own the risk-appetite decision the threshold represents; sign off the go-live after the shadow period."],
    ["Credit risk and finance", "Supply actual loss-given-default and margin figures to calibrate the threshold; validate the cost-benefit case; define the monitoring thresholds that trigger re-training."],
    ["Underwriting operations", "Make income and valuation verification mandatory fields; redesign the workflow around approve / refer / decline bands; train underwriters on reading reason codes and handling referred cases."],
    ["Data and technology", "Build the scoring pipeline (imputation, missing flags, model, threshold, reason codes); integrate with the loan-origination system; set up logging, monitoring dashboards and a yearly re-training job."],
    ["Compliance and legal", "Review adverse-action reason codes against ECOA requirements; run the disparate-impact analysis; approve model-risk documentation."],
    ["Data science", "Maintain the model, run the shadow comparison, extend the analysis (see further analysis below) and report monthly performance."],
  ],
  [2600, 6760],
));

children.push(h2("Expected benefits and costs"));
children.push(p("The figures below are indicative and rest on the stated assumptions; they are meant to size the opportunity and to be refined with the bank's own numbers."));
children.push(p([bold("Assumptions. "), txt("Application volume of 6,000 per year (the size of the dataset). Average loan of $18,600 (the dataset mean). Loss given default of about 50% of the loan, so a missed defaulter costs about $9,000 after recovery of collateral. A wrongly declined good customer costs about $2,000 in forgone net interest margin and acquisition spend. Model performance in production equals test-set performance (93% of defaulters caught, 67% precision at threshold 0.25).")]));
children.push(table(
  ["Item (per year, 6,000 applications)", "Current process", "With the proposed model"],
  [
    ["Loans that default", "about 1,200 (20%)", "about 80 slip through (13 per 1,000)"],
    ["Default-related losses", "about $10.8 million", "about $0.7 million"],
    ["Good customers declined or referred", "none attributable to a model", "about 550 (92 per 1,000), margin forgone about $1.1 million"],
    ["Total indicative cost of credit errors", "about $10.8 million", "about $1.8 million"],
    ["Indicative annual benefit", "", "about $9 million gross; about $8.5 million after running costs"],
  ],
  [3760, 2500, 3100], true,
));
children.push(caption("Table 2. Indicative annual benefit of the proposed solution under the stated assumptions."));
children.push(p([bold("Costs. "), txt("A one-off implementation of roughly $300,000 to $400,000 (data pipeline and integration, validation, fairness review, documentation and training) and running costs of roughly $100,000 per year (monitoring, re-training, model-risk reviews). Even if the realised benefit were only a quarter of the indicative figure, the solution would pay back within the first year.")]));
children.push(p([bold("Non-financial benefits. "), txt("Faster decisions for clear cases, consistent treatment of applicants, documented and auditable reasons for every decline, and a data asset (verified income and valuation on every application) that improves every future model.")]));

children.push(h2("Potential risks and challenges"));
children.push(table(
  ["Risk or challenge", "Why it matters", "Mitigation"],
  [
    ["Selection bias in the training data", "The data covers only loans the bank approved; applicants declined under the old process are absent, so the model has not seen the full applicant population.", "Shadow period on all applications; reject inference in the next iteration; conservative referral band."],
    ["The missing-value signal may change", "Part of the 'ratio missing' signal reflects how the old process recorded data. Once verification is mandatory the feature will shift.", "Re-train after the verification rule is in place; monitor the share of missing fields."],
    ["Economic drift", "Default rates move with interest rates and employment; a model trained on one period can mis-calibrate in another.", "Monthly monitoring of default rate and score distribution; yearly re-training; threshold review."],
    ["Fair-lending and proxy effects", "Occupation and some flags could act as proxies for protected characteristics.", "Exclude occupation from the production model; disparate-impact testing before launch and annually."],
    ["Interpretability of the ensemble", "Regulators and applicants need specific reasons; a forest alone is hard to narrate.", "Decision-tree explanation layer, per-applicant reason codes, model-risk documentation."],
    ["Over-reliance on the score", "Automation bias could lead underwriters to stop exercising judgement on referred cases.", "Keep the referral band, require documented overrides, audit override outcomes."],
    ["Data quality", "Implausible values exist (debt-to-income above 100%, credit history of 97 years).", "Input validation rules at capture; range checks in the scoring pipeline."],
  ],
  [2400, 3480, 3480],
));

children.push(h2("Further analysis and associated problems to solve"));
children.push(
  bullet([bold("Reject inference: "), txt("obtain outcomes or proxies for applicants declined under the manual process so the model reflects the whole applicant population.")]),
  bullet([bold("Feature engineering: "), txt("add a loan-to-value ratio ((LOAN + MORTDUE) / VALUE) and payment-to-income measures, which the trees currently approximate.")]),
  bullet([bold("Alternative ensembles and calibration: "), txt("test gradient boosting and calibrate predicted probabilities so that a score of 0.25 means a 25% chance of default, which simplifies threshold setting and pricing.")]),
  bullet([bold("Time-based validation: "), txt("once application dates are available, validate on later periods rather than a random split to measure drift realistically.")]),
  bullet([bold("Risk-based pricing: "), txt("use the probability of default to set interest rates or loan limits for the referral band instead of a binary approve/decline.")]),
  bullet([bold("Collections and early warning: "), txt("extend the model to existing loans, using payment behaviour after origination to flag accounts heading towards delinquency.")]),
  bullet([bold("Per-applicant explanations: "), txt("add SHAP-style reason codes so each decision lists the attributes that moved the score most, in applicant-friendly language.")]),
);

// Appendix
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Appendix: Supporting Analysis"));
children.push(figure("report_missing_vs_present.png", 6.4, 2.71));
children.push(caption("Figure A1. Default rate when an attribute is missing versus present. A missing debt-to-income ratio or property valuation is the strongest signal in the data."));
children.push(figure("report_default_rate_bands.png", 6.6, 2.14));
children.push(caption("Figure A2. Default rate by debt-to-income band, age of oldest credit line and loan amount."));
children.push(figure("report_credit_history.png", 6.6, 2.14));
children.push(caption("Figure A3. Default rate by number of derogatory reports, delinquent credit lines and recent credit inquiries."));
children.push(table(
  ["Proposed model on the 1,788 held-out applicants", "Model flags as likely default", "Model clears as likely to repay", "Total"],
  [
    ["Actually defaulted", "333 (caught)", "24 (missed)", "357"],
    ["Actually repaid", "164 (wrongly flagged)", "1,267 (correctly cleared)", "1,431"],
    ["Total", "497", "1,291", "1,788"],
  ],
  [3460, 2000, 2300, 1600], true,
));
children.push(caption("Table A1. Decisions of the proposed model (class-weighted Random Forest, threshold 0.25) on the held-out applicants: 93.3% of defaulters caught; 67.0% of flagged applicants were real defaulters; 89.5% of all decisions correct."));
children.push(p([txt("The complete analysis, including all exploratory charts, model code, cross-validation results and the full decision-tree rules, is in the accompanying notebook "), new TextRun({ text: "Loan_Default_Prediction_Capstone.html", font: FONT, size: 22, italics: true }), txt(".")]));

// ---------- document ----------
const doc = new Document({
  creator: "Shubham Garg",
  title: "Capstone Project: Loan Default Prediction - Final Report",
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 300 } } } },
      ] },
      { reference: "recs", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1300, bottom: 1200, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Loan Default Prediction - Final Report  |  Page ", font: FONT, size: 18, color: GREY }),
                 new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GREY })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024).toFixed(0), "KB");
});
