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
  txt("A bank's consumer credit department asked for an empirically derived, interpretable model that predicts which applicants for home equity loans are likely to default. The department also asked for guidance on which applicant attributes should drive approval decisions. The project used the Home Equity (HMEQ) dataset of "),
  bold("5,960 recent loans"), txt(", of which "), bold("19.9% defaulted"),
  txt(". The project explored the data, then built and tuned linear and tree-based classifiers. It compared them on a business-driven metric. The result is a deployable solution design."),
]));

children.push(h2("Most important findings from the analysis"));
children.push(
  bullet([bold("Missing information is the strongest single risk signal. "), txt("Applicants with no recorded debt-to-income ratio defaulted 62% of the time versus 8.6% when the ratio was recorded. Applicants with no property valuation defaulted 94% of the time. The bank should treat income or collateral that it cannot check as a warning sign, not a neutral gap.")]),
  bullet([bold("Debt-to-income has a hard threshold. "), txt("Between a 20% and a 40% ratio only 4% to 7% of applicants default. Between 40% and 45% the rate is 11%. Above 45% it is 87% to 100%. A 45% threshold is a simple, defensible policy rule.")]),
  bullet([bold("Past repayment behaviour predicts future behaviour. "), txt("The default rate rises from 17% with no major derogatory report to 39% with one, 51% with two and over 70% with three or more. Delinquent credit lines show the same pattern (14% at zero, 34% at one, 100% at six or more), as do recent credit inquiries.")]),
  bullet([bold("A long credit history protects. "), txt("Applicants whose oldest credit line is under five years old default 44% of the time. Above twenty years the rate is about 10%.")]),
  bullet([bold("Small loans are not safe loans. "), txt("Loans under $5,000 default 57% of the time, almost three times the average.")]),
  bullet([bold("Occupation and loan purpose matter little on their own. "), txt("Sales and self-employed applicants default more often (35% and 30%), and office workers default least (13%). At the conventional decision threshold, removing occupation, loan purpose and nine minor flags from the forest changes its performance by about a point. At the cost-optimal threshold, removing occupation alone raises the expected cost of credit errors by about 10%. We therefore keep occupation, subject to the fair-lending review, with a 21-input model without it as the fallback.")]),
  bullet([bold("Tree-based models beat the linear model. "), txt("The relationships in this data are thresholds and cliffs rather than straight lines. The Random Forest scored 0.96 on risk-ranking quality (ROC-AUC, where 1.0 means every defaulter ranks above every repayer) against 0.91 for logistic regression. At a similar share of defaulters caught, it declined far fewer good applicants. We chose the final model's configuration (class weights, tree size, input set) and its decision threshold together, on the training rows alone. We judged them by the expected cost, in dollars, of their out-of-fold mistakes, under a rule fixed in advance. We then measured performance once on the test set.")]),
);

children.push(h2("Final proposed model specification"));
children.push(table(
  ["Element", "Specification"],
  [
    ["Scoring engine", "Random Forest classifier, 200 fully grown trees, no class weights, standard settings otherwise. Extra weight for defaulters in training made no measurable difference once we chose the decision threshold on cost."],
    ["Inputs", "All 27 model inputs, in the order the pipeline produces them. First, the 10 financial attributes (LOAN, MORTDUE, VALUE, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). Second, a 0/1 missing-value flag for each of the 11 fields with gaps (MORTDUE, VALUE, REASON, JOB, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). Third, six 0/1 indicators from one-hot encoding: one for REASON = HomeImp and five for JOB = Office, Other, ProfExe, Sales, Self. Fallback if the fair-lending review requires it: the same forest without any occupation information. This removes the five occupation indicators and the occupation-missing flag, leaving 21 inputs. Its expected cost of credit errors is about 10% higher. We also tested a 12-input lean model (the ten attributes plus the DEBTINC and VALUE missing flags). It costs about a fifth more."],
    ["Pre-processing", "Median imputation for numerical gaps and mode imputation for categorical gaps, both learned on the training rows. A missing-value flag for every imputed field, and no outlier capping for the tree model."],
    ["Decision threshold", "Flag an applicant as a likely defaulter when the predicted probability is above 0.15. The threshold minimises the indicative expected cost of credit errors on repeated out-of-fold predictions of the training rows. It is unchanged for cost ratios between 3:1 and 6:1, on a finer grid and on two other train/test splits. It sits just below the textbook break-even for the stated costs ($2,000 / $11,000 = 0.18). The reason is that the forest's scores understate risk in the decision range (applicants scored 0.15 to 0.20 defaulted about 23% of the time)."],
    ["Explanation layer", "A surrogate decision tree of depth 4, fitted to the forest's out-of-fold decisions. It reproduces 93% of them on unseen applicants (against 73% for never flagging). It has three rules. The first two rules are a missing debt-to-income ratio and a ratio above about 44%. The third rule, at or below 44%, is a delinquent credit line together with a major derogatory report. These rules supply the adverse-action reasons that the Equal Credit Opportunity Act requires. The top risk drivers for each applicant complement them."],
    ["Measure of success", "Recall on the defaulter class (share of future defaulters caught), with precision and F1 as guard-rails against declining too many good applicants. We then chose the final model and its threshold on the expected cost of the two errors, so the expected cost includes precision explicitly."],
    ["Performance on unseen applicants", "92.7% of defaulters caught (recall), 68.1% precision, 89.9% accuracy, risk-ranking quality (ROC-AUC) 0.96. At the conventional 0.5 threshold the same model gives 68.6% recall, 84.2% precision and 91.2% accuracy."],
    ["Validation", "70/30 stratified split, with the test set kept separate before we fitted any pre-processing statistic. Grid searches by 3- and 5-fold stratified cross-validation. We chose the final model's settings and its threshold on the expected cost of out-of-fold mistakes on the training rows. We fixed this rule in advance. The out-of-fold predictions came from three rounds of 5-fold cross-validation (15 validation folds). Robustness checks: a finer threshold grid, two other train/test splits and a calibration table. We scored the test set once for performance. We also computed permutation importance on it, for interpretation only."],
  ],
  [2300, 7060],
));
children.push(spacer());
children.push(h2("Key next steps"));
children.push(
  bullet([bold("Decide and check the threshold: "), txt("the head of consumer credit approves the three-band policy (approve / refer / decline). Finance supplies actual loss-given-default and margin figures so that we can check the 0.15 threshold.")]),
  bullet([bold("Prepare the process: "), txt("make income verification and property-valuation verification mandatory fields, because their absence is the strongest default signal. Build the scoring pipeline with reason codes.")]),
  bullet([bold("Prove it safely: "), txt("run the model in shadow mode alongside manual decisions for one to two months. Complete a fair-lending review before activating the model.")]),
  bullet([bold("Make the most of it: "), txt("automate clear approvals and declines. Route the uncertain band to underwriters. Monitor recall, precision and approval rate monthly. Re-train yearly.")]),
  bullet([bold("Improve it: "), txt("add reject inference, loan-to-value and payment-to-income features, probability calibration and time-based validation in the next iteration.")]),
);
children.push(p([
  txt("Per 1,000 applicants, we expect the proposed model to catch about 185 of the 200 defaulters and to miss about 15. We expect it to decline about 87 applicants who would have repaid. The cost assumptions are indicative: a missed defaulter costs about $9,000, and a wrongly declined good applicant costs about $2,000. Under these assumptions the model cuts default-related cost from roughly "),
  bold("$1.8 million per 1,000 applicants"), txt(" today to about "), bold("$0.3 million"), txt(", a reduction of about 83%."),
]));

// 2. Problem and solution summary
children.push(h1("2. Problem and Solution Summary"));
children.push(h2("Summary of the problem"));
children.push(p("A large share of a retail bank's profit comes from interest on home loans and home equity lines of credit. The single biggest threat to that profit is the borrower who does not repay. One non-performing loan erases the interest earned on many good ones. Today an underwriter reviews each application manually and decides whether to approve it. The process is slow, costly, inconsistent across underwriters and vulnerable to human error and bias. Earlier attempts to automate it relied on hand-written heuristics."));
children.push(p("The consumer credit department wants to replace that process with an empirically derived, statistically sound credit-scoring model. The department wants a model built from the bank's own data on recent applicants and in line with the Equal Credit Opportunity Act. The model must predict at application time which applicants are likely to default. At the same time, it must remain interpretable enough that the bank can give a specific, defensible reason for every rejection. Formally this is a supervised problem of binary classification on 5,960 historical loans. Each loan has 12 attributes known at application time and a target that indicates default or serious delinquency."));

children.push(h2("Why this solution design"));
children.push(p([bold("The metric follows the money. "), txt("The two errors a scoring model can make do not cost the same. Approving someone who then defaults (a missed defaulter) costs the bank most of the principal plus collection costs. Declining someone who would have repaid costs only the interest margin on one customer. The primary measure of success is therefore the share of future defaulters the model catches (recall). We also track precision and F1 so that the model does not simply decline everyone.")]));
children.push(p([bold("We treated missing values as information, not noise. "), txt("The absence of a debt-to-income ratio or a property valuation was itself the strongest predictor of default. Therefore every imputed field received a 'was missing' flag before imputation. This single step is responsible for a large part of every model's performance.")]));
children.push(p([bold("We compared linear and non-linear techniques head to head. "), txt("We trained logistic regression (the transparent linear benchmark), a decision tree (readable rules), bagged trees and a random forest on the same 70/30 stratified split. We tuned each model with cross-validated grid search that optimises recall and evaluated each on the test set (the held-out 30%). Moving from one tree to bagging to a forest shows what each idea contributes. Time-series techniques were not applicable because the applications carry no dates. The table below summarises the result.")]));

children.push(table(
  ["Model (held-out test set, 1,788 applicants)", "Defaulters caught", "Precision", "Accuracy", "Risk-ranking quality (ROC-AUC)"],
  [
    ["Logistic Regression (plain)", "57%", "77%", "88%", "0.91"],
    ["Logistic Regression (balanced class weights)", "80%", "61%", "86%", "0.91"],
    ["Decision Tree (fully grown)", "69%", "71%", "88%", "0.81"],
    ["Decision Tree (tuned, pruned, balanced)", "82%", "53%", "82%", "0.88"],
    ["Bagged trees (200 trees)", "68%", "83%", "91%", "0.95"],
    ["Random Forest (standard settings: the proposed model at the 0.5 threshold)", "69%", "84%", "91%", "0.96"],
    ["Random Forest (class weights 0.2/0.8)", "77%", "77%", "91%", "0.96"],
    ["Random Forest (tuned for recall)", "79%", "66%", "88%", "0.93"],
    ["Random Forest (tuned, 12 features only)", "78%", "66%", "88%", "0.93"],
    ["Proposed: Random Forest, threshold 0.15", "93%", "68%", "90%", "0.96"],
  ],
  [3860, 1400, 1200, 1200, 1700],
));
children.push(caption("Table 1. Performance of the techniques explored on the test set (1,788 applicants), at the conventional 0.5 threshold except for the proposed model."));

children.push(figure("report_model_comparison.png", 6.4, 2.71));
children.push(caption("Figure 1. Share of defaulters caught, precision and risk-ranking quality of each technique on the test set."));

children.push(p([bold("We chose the Random Forest as the scoring engine "), txt("because it offers the best balance on the chosen metric. The tuned decision tree catches slightly more defaulters at the 0.5 threshold (82%). However, it declines almost one good applicant for every defaulter that it catches (53% precision). The balanced logistic regression catches 80% but with 61% precision, because a straight line cannot represent the threshold effects in the data. Bagging 200 trees shows the value of averaging. At the same recall as a single fully grown tree, precision rises from 71% to 83%. ROC-AUC rises from 0.81 to 0.95. The forests add feature sub-sampling. With class weights, the forest catches 77% at 77% precision at the 0.5 threshold. Both forests rank applicants by risk most accurately of all models (ROC-AUC 0.96). That ranking quality is what makes the next step, moving the decision threshold, possible.")]));
children.push(p([bold("We chose the final model and its threshold on the training rows, from business cost rather than convention. "), txt("Two settings decide how readily a forest flags an applicant: the extra weight given to defaulters during training (class weights) and the probability threshold. We chose them together, on the training rows alone, by one yardstick: the expected dollar cost of the model's mistakes. We estimated that cost on training applicants that the model did not see (three rounds of 5-fold cross-validation). We scored fifteen forest configurations and then five final candidates, each at its own cost-minimising threshold, under a rule that we fixed beforehand. The fifteen configurations were five weightings, each with fully grown trees or with trees limited to at least 5 or 10 applicants per leaf. Three candidates used the best configuration: on all 27 inputs, without occupation, and on a 12-input subset. The other two were the recall-tuned forest on 27 and 12 inputs. Under that rule, the lowest average cost wins. When several candidates are within the run-to-run noise of the estimate (about $10,500 per 1,000 applicants), the simplest wins. Fully grown trees beat limited trees for every weighting. Among them, the weightings made no measurable difference. The unweighted, 0.3/0.7 and 0.2/0.8 forests were within that noise of each other, at thresholds of 0.15, 0.20 and 0.25. So we chose the unweighted forest on all 27 inputs. When precision also carries a cost, the recall-tuned grid winner cost about half again as much. The forest without occupation cost about 10% more. The 12-input forest cost about a fifth more. We scored the balanced logistic regression and the recall-tuned decision tree the same way, at their own best thresholds. They cost about $550,000 and $607,000 per 1,000 applicants, against $317,000 for the forest. So the forest wins on the chosen yardstick as well as on ranking quality. The cost-minimising threshold is 0.15. It stays at 0.15 for any cost ratio between 3:1 and 6:1, on a finer grid and on two other train/test splits. It sits just below the textbook break-even of 0.18 for a perfectly calibrated score. The reason is that the forest's scores rank applicants well but understate risk in the decision range. Applicants scored 0.15 to 0.20 defaulted about 23% of the time. We scored the forest once on the test set at that threshold. It catches 93% of defaulters at 68% precision, against 69% and 84% at the conventional 0.5. The test result (cost about $304,000 ± $28,000 per 1,000 applicants) is consistent with the out-of-fold estimate ($317,000). The choice between the closely matched configurations rests on the out-of-fold comparison. A single test evaluation is too noisy to decide between them.")]));
children.push(figure("report_threshold.png", 6.4, 2.71));
children.push(caption("Figure 2. Recall, precision and indicative expected cost per 1,000 applicants as the forest's decision threshold moves. We measured all three on out-of-fold predictions of the training rows. The test set played no part in the choice."));

children.push(p([bold("A surrogate decision tree that follows the forest provides interpretability. "), txt("No one can read a forest of 200 trees as a rule list. So we fitted a four-level decision tree to the forest's own decisions rather than to the original labels. Those decisions are flag or clear at the 0.15 threshold. We took them from the out-of-fold scores, so that the tree learns how the forest treats applicants that it did not see. The tree reproduces 93% of the forest's decisions on unseen applicants, against 73% for a rule that never flags anyone. Its rules are the same drivers that the analysis found throughout. First, if the debt-to-income ratio is missing, the tree flags the applicant. Second, if there is a recorded ratio above about 44%, the tree flags the applicant. Third, at or below 44%, the tree flags the applicant when there is a delinquent credit line together with a major derogatory report. Otherwise it clears the applicant. Those rules supply the adverse-action reasons. The forest's feature importances (Figure 3) and the top risk drivers for each applicant document the score itself.")]));
children.push(figure("report_feature_importance.png", 5.9, 2.99));
children.push(caption("Figure 3. The twelve inputs that the final Random Forest relies on most (impurity-based importance). Four inputs together carry about half of the model's decision power. They are the debt-to-income ratio, its missing-value flag, the number of delinquent credit lines and the age of the credit history. Permutation importance ranks the same four at the top."));

children.push(h2("How the solution affects the business"));
children.push(
  bullet([bold("Fewer bad loans. "), txt("Of every 200 defaulters in 1,000 applications the model flags about 185 before the money leaves the bank, against none today.")]),
  bullet([bold("Protected good business. "), txt("The bank would decline or refer about 87 of every 1,000 applicants although they would have repaid. This is the price of catching defaulters. It is far lower than the single decision tree's 145. The bank can reduce it further by routing borderline cases to a human underwriter instead of declining them outright. Stated as rates, the model flags about 27% of all applicants. That is an approval rate of about 73% on a population that the bank approves in full today, against 84% at the conventional 0.5 threshold. The model wrongly flags about 11% of creditworthy applicants at 0.15, against about 3% at 0.5. Every flag that ends in a decline needs an adverse-action notice, which is one more reason to route the uncertain middle to a person.")]),
  bullet([bold("Faster, more consistent decisions. "), txt("About seven in ten applications fall in the clear-approval band, and about a quarter fall in the clear-decline band. So the bank can automate both bands. Underwriters focus on the roughly 7% in the uncertain band around the threshold.")]),
  bullet([bold("Defensible decisions. "), txt("Every decline maps to a small set of plain-language reasons that match both the data and lending common sense. The reasons are debt burden, unverified income, delinquencies, derogatory reports and short credit history.")]),
);

// 3. Recommendations for implementation
children.push(h1("3. Recommendations for Implementation"));
children.push(h2("Key recommendations"));
children.push(
  numbered([bold("Deploy the Random Forest as a decision-support score. "), txt("Integrate it into the existing underwriting workflow, with the probability threshold of 0.15 as the initial setting. Use a three-band outcome. Approve when the predicted default probability is below about 0.10. Refer applications from 0.10 to 0.25 to an underwriter. Decline applications above 0.25. On the test set, these bands hold about 69%, 7% and 24% of applications, with observed default rates of about 1%, 24% and 74%. So the bands keep a human in the loop exactly where the model is least certain, without a large manual workload. The edges are round numbers around the threshold. We set them before we examined the test set, roughly where the expected cost rises 10% to 20% above its minimum. Tune them to underwriting capacity in the shadow period.")], "recs"),
  numbered([bold("Make income and collateral verification mandatory before scoring. "), txt("A missing debt-to-income ratio or property valuation is the strongest default signal in the data. Requiring these fields removes the ambiguity, improves the data for the model and is itself a prudent lending control. Sequence it with the shadow period. The current model relies most on the missing-ratio signal. So once verification is mandatory, that group shrinks. The bank must then re-train the model on the verified population before go-live. On applicants with a recorded ratio, the model already catches 83% of defaulters at 80% precision while flagging only 9%.")], "recs"),
  numbered([bold("Adopt the explicit policy rules the analysis surfaced. "), txt("Decline or escalate applications with a debt-to-income ratio above 45% (87% to 100% of them defaulted). Refer applications with two or more delinquent credit lines or two or more major derogatory reports to an underwriter. The observed default rates of these two groups are 45% and 51% and above. These are escalation rules that we read directly from the observed default rates. The bank applies them before the score. They are transparent and easy to communicate, and they use the same drivers as the model. The model applies the drivers more finely: its surrogate flags a delinquent line together with a derogatory report at any recorded ratio. Where a hard rule and the score disagree, the rule takes precedence.")], "recs"),
  numbered([bold("Use the surrogate decision tree for adverse-action reasons. "), txt("Generate the reason codes for every decline from two sources. The first is the surrogate tree's rules, which reproduce 93% of the forest's flag decisions at the 0.15 threshold. The second is the applicant's top risk drivers from the forest. Store the reason codes with the application record for audit and for responses to applicants and regulators. Because declines above 0.25 are automatic, the forest's own top risk drivers are the primary reason for those. For those declines, the surrogate rule is the plain-language summary. A referral that ends in a decline carries the underwriter's reason.")], "recs"),
  numbered([bold("Check the threshold with real cost figures. "), txt("Replace the indicative $9,000 and $2,000 assumptions with the bank's actual loss-given-default and customer lifetime margin. Then re-derive the threshold on out-of-fold predictions before go-live. The analysis shows that the optimum stays at 0.15 for any cost ratio between 3:1 and 6:1. It would move to 0.20 if the ratio were nearer 2:1. So this step refines the operating point rather than the design.")], "recs"),
  numbered([bold("Run a shadow period and a fairness review before go-live. "), txt("Score every application alongside the manual decision for one to two months. Include applications that the current process declines. The training data contains only approved loans. Compare outcomes. Test approval and error rates across protected groups. If the review requires the bank to remove occupation, switch to the 21-input fallback model without occupation. Its expected credit-error cost is about 10% higher.")], "recs"),
  numbered([bold("Monitor and re-train. "), txt("Track recall, precision, approval rate and the share of applications with missing fields monthly. The expected approval rate is about 73% on today's approved population at the 0.15 threshold. Under the bands, the bank approves about 69% automatically, refers about 7% and declines about 24%. Re-train at least yearly, or when the default rate or input distributions drift.")], "recs"),
);

children.push(h2("Key actionables for stakeholders"));
children.push(table(
  ["Stakeholder", "Actionables"],
  [
    ["Head of Consumer Credit (sponsor)", "Approve the three-band decision policy and the initial 0.15 threshold. Own the risk-appetite decision that the threshold represents. Approve the go-live after the shadow period."],
    ["Credit risk and finance", "Supply actual loss-given-default and margin figures to check the threshold. Check the cost-benefit case. Define the monitoring limits that trigger re-training."],
    ["Underwriting operations", "Make income and valuation verification mandatory fields. Redesign the workflow around approve / refer / decline bands. Train underwriters to read reason codes and to handle referred cases."],
    ["Data and technology", "Build the scoring pipeline (imputation, missing flags, model, threshold, reason codes). Integrate it with the loan-origination system. Build logging, monitoring dashboards and a yearly re-training job."],
    ["Compliance and legal", "Review adverse-action reason codes against ECOA requirements. Run the disparate-impact analysis. Decide whether occupation may stay in the model. Approve model-risk documentation."],
    ["Data science", "Maintain the model. Run the shadow comparison. Extend the analysis (see further analysis below). Report monthly performance."],
  ],
  [2600, 6760],
));

children.push(h2("Expected benefits and costs"));
children.push(p("The figures below are indicative and rest on the stated assumptions. Their purpose is to size the opportunity. The bank should refine them with its own numbers."));
children.push(p([bold("Assumptions. "), txt("The application volume is 6,000 per year (the size of the dataset). Defaulted loans averaged $16,900 in the data. With about half recovered through the collateral, a missed defaulter costs about $9,000. A wrongly declined good applicant costs about $2,000 in forgone net interest margin and acquisition spend. Illustratively, that figure combines two parts. One is a net margin of about three percentage points on a $16,000 to $17,000 balance over three to four years. The other is the cost of acquiring a replacement customer. Finance should replace both figures. If the true ratio were nearer 2:1, the cost-minimising threshold would move to 0.20. At 0.20, the out-of-fold data shows about 90% recall and 83 good applicants declined per 1,000. We assume that model performance in production equals test-set performance (93% of defaulters caught, 68% precision at threshold 0.15). This assumption applies to an applicant population like the one that the current process approves. So the benefit is an additional screen on applicants that the current process approves. The outcomes of applicants that the manual process declines today are unknown until the shadow period. It is also a before-verification estimate. Two thirds of defaulters sit in the fifth of applicants with no recorded debt-to-income ratio. The model flags that group almost entirely (96%), and mandatory verification will shrink it. On applicants with a recorded ratio, the model catches 83% of defaulters at 80% precision while flagging 9%. That is the better guide to its behaviour once verification is in place and the bank re-trains the model. All figures are for the single 0.15 threshold. The approve / refer / decline bands are the operating procedure around it. Whatever underwriters approve inside the referral band trades some of the modelled benefit for a human check. The referral band holds about 7% of applications, and one in four of them defaulted. Under the bands, the share of defaulters caught lies between about 87% (if underwriters approved every referral) and 96% (if they declined every referral). The single-threshold figure is 93%.")]));
children.push(table(
  ["Item (per year, 6,000 applications)", "Current process", "With the proposed model"],
  [
    ["Loans that default", "about 1,200 (20%)", "about 90 missed (15 per 1,000)"],
    ["Default-related losses", "about $10.8 million", "about $0.8 million"],
    ["Good applicants declined or referred", "none attributable to a model", "about 520 (87 per 1,000), margin forgone about $1.0 million"],
    ["Total indicative cost of credit errors", "about $10.8 million", "about $1.8 million"],
    ["Indicative annual benefit", "", "about $9.0 million gross, about $8.9 million after running costs, and about $8.5 million in the first year after the one-off implementation cost"],
  ],
  [3760, 2500, 3100], true,
));
children.push(caption("Table 2. Indicative annual benefit of the proposed solution under the stated assumptions."));
children.push(p([bold("Costs. "), txt("The one-off implementation costs roughly $300,000 to $400,000 (data pipeline and integration, validation, fairness review, documentation and training). Running costs are roughly $100,000 per year (monitoring, re-training, model-risk reviews). Even if the realised benefit were only a quarter of the indicative figure, the solution would recover its cost within the first year.")]));
children.push(p([bold("Non-financial benefits. "), txt("The non-financial benefits are faster decisions for clear cases, consistent treatment of applicants, and documented and auditable reasons for every decline. Another benefit is a data asset (verified income and valuation on every application) that improves every future model.")]));

children.push(h2("Potential risks and challenges"));
children.push(table(
  ["Risk or challenge", "Why it matters", "Mitigation"],
  [
    ["Selection bias in the training data", "The data covers only loans that the bank approved. Applicants declined under the old process are absent, so the model did not see the full applicant population.", "Run a shadow period on all applications. Use reject inference in the next iteration. Keep a conservative referral band."],
    ["The missing-value signal may change", "Part of the 'ratio missing' signal reflects how the old process recorded data. Once verification is mandatory the feature will shift.", "Introduce mandatory verification alongside the shadow period. Re-train on the verified population before go-live. Monitor the share of missing fields. On applicants with a recorded ratio, the model already catches 83% of defaulters at 80% precision."],
    ["Economic drift", "Default rates move with interest rates and employment. A model trained on one period can mis-calibrate in another.", "Monitor the default rate and score distribution monthly. Re-train yearly. Review the threshold."],
    ["Fair-lending and proxy effects", "Occupation, credit-history length (an age proxy) and the missing-ratio flag could act as proxies for protected characteristics. The lower threshold multiplies adverse actions against creditworthy applicants (about 11% of them at 0.15 against 3% at 0.5).", "Test approval and error rates for disparate impact before go-live, annually and whenever the threshold or bands move. Switch to the 21-input fallback (no occupation information, about 10% more expected credit-error cost) if the review requires it."],
    ["Interpretability of the ensemble", "Regulators and applicants need specific reasons. A forest alone is hard to narrate.", "Use a decision-tree explanation layer, reason codes for each applicant, and model-risk documentation."],
    ["Over-reliance on the score", "Automation bias could lead underwriters to stop exercising judgement on referred cases.", "Keep the referral band. Require documented overrides. Audit override outcomes."],
    ["Data quality", "Implausible values exist (debt-to-income above 100%, credit history of 97 years).", "Use input validation rules at capture. Use range checks in the scoring pipeline."],
  ],
  [2400, 3480, 3480],
));

children.push(h2("Further analysis and associated problems to solve"));
children.push(
  bullet([bold("Reject inference: "), txt("obtain outcomes or proxies for applicants declined under the manual process so the model reflects the whole applicant population.")]),
  bullet([bold("Feature engineering: "), txt("add a loan-to-value ratio ((LOAN + MORTDUE) / VALUE) and payment-to-income measures, which the trees currently approximate.")]),
  bullet([bold("Alternative ensembles and calibration: "), txt("test gradient boosting. Calibrate predicted probabilities so that a score of 0.15 means exactly a 15% chance of default. This simplifies threshold setting and pricing. The unweighted forest's scores rank applicants well but understate risk in the decision range: applicants scored 0.15 to 0.20 defaulted about 23% of the time.")]),
  bullet([bold("Time-based validation: "), txt("once application dates are available, check the model on later periods rather than a random split to measure drift realistically.")]),
  bullet([bold("Risk-based pricing: "), txt("use the probability of default to set interest rates or loan limits for the referral band. This replaces a binary approve/decline.")]),
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
  ["Proposed model on the 1,788 test-set applicants", "Model flags as likely default", "Model clears as likely to repay", "Total"],
  [
    ["Actually defaulted", "331 (caught)", "26 (missed)", "357"],
    ["Actually repaid", "155 (wrongly flagged)", "1,276 (correctly cleared)", "1,431"],
    ["Total", "486", "1,302", "1,788"],
  ],
  [3460, 2000, 2300, 1600], true,
));
children.push(caption("Table A1. Decisions of the proposed model (Random Forest, threshold 0.15) on the test set. The model caught 92.7% of defaulters. Of the flagged applicants, 68.1% were real defaulters. Of all decisions, 89.9% were correct."));
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
