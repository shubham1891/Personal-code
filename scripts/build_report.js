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
const FIG_H = (name, w) => { const b = FIG(name); return Math.round(w * b.readUInt32BE(20) / b.readUInt32BE(16) * 100) / 100; };
// Height of the interaction figure in inches, from the PNG header (width 6.6 in)
const FIG_H_INTERACTIONS = (() => { const b = FIG("report_interactions.png"); return Math.round(6.6 * b.readUInt32BE(20) / b.readUInt32BE(16) * 100) / 100; })();
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
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, keepLines: true,
  children: [new TextRun({ text: t, italics: true, font: FONT, size: 19, color: GREY })] });
const figure = (name, widthIn, heightIn) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
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
          const tc = cell(c, false, widths[i], i > 0 && /^[\d$.,%\-]+( \([a-z ]+\))?$/.test(String(c)), keepTogether && ri < rows.length - 1);
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
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 160 },
    children: [new TextRun({ text: "Capstone Project: Loan Default Prediction", font: FONT, bold: true, size: 44, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "Final Submission Report", font: FONT, size: 30, color: GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Practical Data Science track (Classification)", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "MIT Professional Education - Applied AI and Data Science Program", font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
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
  bullet([bold("Missing information is the strongest single risk signal. "), txt("Applicants with no recorded debt-to-income ratio defaulted 62% of the time versus 8.6% when the application included the ratio. Applicants with no property valuation defaulted 94% of the time (Figure A1). The bank should treat income or collateral that it cannot check as a warning sign, not a neutral gap.")]),
  bullet([bold("Debt-to-income has a hard threshold. "), txt("Between a 20% and a 40% ratio only 4% to 7% of applicants default. Between 40% and 45% the rate is 11%. Above 45% it is 87% to 100% (Figure A2). A 45% threshold is a simple, defensible policy rule.")]),
  bullet([bold("Past repayment behaviour predicts future behaviour. "), txt("The default rate rises from 17% with no major derogatory report to 39% with one, 51% with two and over 70% with three or more. Delinquent credit lines show the same pattern (14% at zero, 34% at one, 100% at six or more), as do recent credit inquiries (Figure A3).")]),
  bullet([bold("A long credit history protects. "), txt("Applicants whose oldest credit line is under five years old default 44% of the time. Above twenty years the rate is about 10% (Figure A2).")]),
  bullet([bold("Small loans are not safe loans. "), txt("Loans under $5,000 default 57% of the time, almost three times the average.")]),
  bullet([bold("Occupation and loan purpose matter little on their own. "), txt("Sales and self-employed applicants default more often (35% and 30%), and office workers default least (13%). At the conventional decision threshold, removing occupation, loan purpose and nine minor flags from the recall-tuned forest changes its performance by about a point. At the cost-optimal threshold, removing occupation from the final model's inputs raises the expected cost of credit errors by about 13%. We therefore keep occupation, subject to the fair-lending review, with a 16-input model without it as the fallback.")]),
  bullet([bold("Tree-based models beat the linear model. "), txt("The relationships in this data are thresholds and cliffs rather than straight lines, and the main drivers combine (Figure A4). The Random Forest scored 0.96 on risk-ranking quality (ROC-AUC, where 1.0 means every defaulter ranks above every repayer) against 0.91 for logistic regression. At a similar share of defaulters caught, it declined far fewer good applicants (Table 2, Figure 1). We chose the final model's configuration (class weights, tree size, input set) and its decision threshold together, on the training rows alone. We judged them by the expected cost, in dollars, of their out-of-fold mistakes, under a rule fixed in advance. That rule removed five minor missing flags, so the final model uses 22 of the 27 prepared inputs. We then measured performance once on the test set. Table 1 gives the full specification.")]),
);

children.push(h2("Final proposed model specification"));
children.push(table(
  ["Element", "Specification"],
  [
    ["Scoring engine", "Random Forest classifier: 200 fully grown trees, no class weights, random seed 1. Each split tries 4 of the 22 inputs at random (the library default). Extra weight for defaulters added nothing once we chose the threshold on cost."],
    ["Inputs", "22 model inputs of three kinds. First, the 10 financial attributes (LOAN, MORTDUE, VALUE, YOJ, DEROG, DELINQ, CLAGE, NINQ, CLNO, DEBTINC). Second, six 0/1 missing-value flags, for VALUE, REASON, JOB, YOJ, DEROG and DEBTINC. Third, six 0/1 indicators from one-hot encoding: one for REASON = HomeImp and five for JOB = Office, Other, ProfExe, Sales, Self. Stage 2 of the selection removed the missing flags of MORTDUE, DELINQ, CLAGE, NINQ and CLNO. Its rule keeps the smallest input set whose out-of-fold cost (averaged over three forest seeds) is within one standard error of the lowest cost. Fallback if the fair-lending review requires it: the same forest without any occupation information. This removes the five occupation indicators and the occupation-missing flag, leaving 16 inputs. Its expected cost of credit errors is about 13% higher."],
    ["Pre-processing", "Median imputation for numerical gaps and mode imputation for categorical gaps, both learned on the training rows. The medians are MORTDUE $66,293, VALUE $89,965, YOJ 7 years, DEROG 0, DELINQ 0, CLAGE 173.87 months, NINQ 1, CLNO 20 and DEBTINC 34.84%. The modes are DebtCon (REASON) and Other (JOB). LOAN has no blanks. A missing-value flag for six of the imputed fields (see Inputs), and no outlier capping for the tree model."],
    ["Decision threshold", "Flag an applicant as a likely defaulter when the predicted probability is above 0.15. The threshold minimises the indicative expected cost of credit errors on repeated out-of-fold predictions of the training rows. It is unchanged for cost ratios from 4.5:1 to 8:1 and on a finer grid. It sits just below the textbook break-even for the stated costs ($2,000 / $11,000 = 0.18). The reason is that the forest's scores understate risk in the decision range (applicants scored 0.15 to 0.20 defaulted about 28% of the time)."],
    ["Explanation layer", "A surrogate decision tree of depth 4, fitted to the forest's out-of-fold decisions. It reproduces 93% of them on unseen applicants (against 73% for never flagging). Its rules flag a missing debt-to-income ratio or a ratio above about 44%. At or below 44%, they flag a delinquent credit line together with a credit history of about 93 months or less. These rules give the plain-language summary of how the model decides. Each adverse-action notice that the Equal Credit Opportunity Act requires gives the applicant's own top risk drivers from the forest (for example SHAP values). The bank builds these drivers in the first two months, before the shadow run."],
    ["Measure of success", "Recall on the defaulter class (share of future defaulters caught), with precision and F1 as guard-rails against declining too many good applicants. We then chose the final model and its threshold on the expected cost of the two errors, so the expected cost includes precision explicitly."],
    ["Performance on unseen applicants", "92.7% of defaulters caught (recall), 67.4% precision, 89.6% accuracy, risk-ranking quality (ROC-AUC) 0.96. At the conventional 0.5 threshold the same model gives 67.8% recall, 82.9% precision and 90.8% accuracy."],
    ["Validation", "70/30 stratified split, with the test set kept separate before we fitted any pre-processing statistic. Grid searches by stratified cross-validation. We chose the final model in three stages: class weights and leaf size, then the input set, then a final comparison of eight candidates. Each stage used the expected cost of out-of-fold mistakes (three rounds of 5-fold cross-validation on the training rows). A rule fixed in advance decided each choice. Stage 3 checked the 22-input forest against all 27 inputs and kept it. Robustness checks: a finer threshold grid, two other splits, a calibration table. We scored the test set once."],
  ],
  [2300, 7060],
));
children.push(caption("Table 1. Final proposed model specification."));
children.push(h2("Key next steps"));
children.push(
  bullet([bold("Decide and check the threshold: "), txt("the head of consumer credit approves the three-band policy (approve / refer / decline). Finance supplies actual loss-given-default and margin figures so that we can check the 0.15 threshold.")]),
  bullet([bold("Prepare the process: "), txt("make income verification and property-valuation verification mandatory fields, because their absence is the strongest default signal. Build the scoring pipeline with per-applicant risk drivers (for example SHAP values) for the adverse-action notices.")]),
  bullet([bold("Prove it safely: "), txt("run the model in shadow mode alongside manual decisions for one to two months. Complete a fair-lending review before activating the model.")]),
  bullet([bold("Make the most of it: "), txt("automate clear approvals and declines. Route the uncertain band to underwriters. Monitor the approval rate monthly, and recall and precision as repayment outcomes arrive. Re-train yearly.")]),
  bullet([bold("Improve it: "), txt("add reject inference, a combined loan-to-value ratio, debt-to-income bands, interaction terms, probability calibration and time-based validation in the next iteration.")]),
);
children.push(p([
  txt("Per 1,000 applicants, we expect the proposed model to catch about 185 of the 200 defaulters and to miss about 15. At the 0.15 threshold we expect it to flag about 90 creditworthy applicants. Under the approve / refer / decline bands, the bank declines about 64 creditworthy applicants per 1,000 automatically and refers about 58 to an underwriter. The cost assumptions are indicative: a missed defaulter costs about $9,000, and a wrongly declined good applicant costs about $2,000. Under these assumptions the model cuts the cost of credit errors from roughly "),
  bold("$1.8 million per 1,000 applicants"), txt(" today to about "), bold("$0.3 million"), txt(". That is a reduction of about 83%."),
]));

// 2. Problem and solution summary
children.push(h1("2. Problem and Solution Summary"));
children.push(h2("Summary of the problem"));
children.push(p("A large share of a retail bank's profit comes from interest on home loans and home equity lines of credit. The single biggest threat to that profit is the borrower who does not repay. One non-performing loan erases the interest earned on many good ones. Today an underwriter reviews each application manually and decides whether to approve it. The process is slow, costly, inconsistent across underwriters and vulnerable to human error and bias. Earlier attempts to automate it relied on hand-written heuristics."));
children.push(p("The consumer credit department wants to replace that process with an empirically derived, statistically sound credit-scoring model. The department wants a model built from the bank's own data on recent applicants and in line with the Equal Credit Opportunity Act. The model must predict at application time which applicants are likely to default. At the same time, it must remain interpretable enough that the bank can give a specific, defensible reason for every rejection. Formally this is a supervised problem of binary classification on 5,960 historical loans. Each loan has 12 attributes known at application time and a target that indicates default or serious delinquency."));

children.push(h2("Why this solution design"));
children.push(p([bold("The metric follows the money. "), txt("The two errors a scoring model can make do not cost the same. Approving someone who then defaults (a missed defaulter) costs the bank a large part of the principal plus collection costs. Declining a creditworthy applicant costs only the interest margin on one customer. The primary measure of success is therefore the share of future defaulters the model catches (recall). We also track precision and F1 so that the model does not simply decline everyone.")]));
children.push(p([bold("We treated missing values as information, not noise. "), txt("The absence of a debt-to-income ratio or a property valuation was itself the strongest predictor of default. Therefore every imputed field received a 'was missing' flag before imputation. This single step is responsible for a large part of every model's performance.")]));
children.push(p([bold("We compared linear and non-linear techniques head to head. "), txt("We trained logistic regression (the transparent linear benchmark), a decision tree (readable rules), bagged trees and a random forest on the same 70/30 stratified split. We tuned the logistic regression, the decision tree and the random forest with cross-validated grid search that optimises recall. We evaluated each model on the test set (the held-out 30%). Moving from one tree to bagging to a forest shows what each idea contributes. Time-series techniques were not applicable because the applications carry no dates. Table 2 and Figure 1 summarise the result.")]));

children.push(table(
  ["Model (held-out test set, 1,788 applicants)", "Defaulters caught", "Precision", "Accuracy", "Risk-ranking quality (ROC-AUC)"],
  [
    ["Logistic Regression (plain)", "57%", "77%", "88%", "0.91"],
    ["Logistic Regression (balanced class weights)", "80%", "61%", "86%", "0.91"],
    ["Decision Tree (fully grown)", "69%", "71%", "88%", "0.81"],
    ["Decision Tree (tuned, pruned, balanced)", "82%", "53%", "82%", "0.88"],
    ["Bagged trees (200 trees)", "68%", "83%", "91%", "0.95"],
    ["Random Forest (standard settings, all 27 inputs)", "69%", "84%", "91%", "0.96"],
    ["Random Forest (class weights 0.2/0.8)", "77%", "77%", "91%", "0.96"],
    ["Random Forest (tuned for recall)", "79%", "66%", "88%", "0.93"],
    ["Random Forest (tuned, 12 inputs only)", "78%", "66%", "88%", "0.93"],
    ["Proposed: Random Forest, 22 inputs, threshold 0.15", "93%", "67%", "90%", "0.96"],
  ],
  [3860, 1400, 1200, 1200, 1700],
));
children.push(caption("Table 2. Performance of the techniques explored on the test set (1,788 applicants), at the conventional 0.5 threshold except for the proposed model."));

children.push(p([bold("We chose the Random Forest as the scoring engine "), txt("because it offers the best balance on the chosen metric. The tuned decision tree catches slightly more defaulters at the 0.5 threshold (82%). However, it declines almost one good applicant for every defaulter that it catches (53% precision). The balanced logistic regression catches 80% but with 61% precision, because a straight line cannot represent the threshold effects in the data. Bagging 200 trees shows the value of averaging. At the same recall as a single fully grown tree, precision rises from 71% to 83%. ROC-AUC rises from 0.81 to 0.95. The forests add feature sub-sampling. With class weights, the forest catches 77% at 77% precision at the 0.5 threshold. Both forests rank applicants by risk most accurately of all models (ROC-AUC 0.96). That ranking quality is what makes the next step, moving the decision threshold, possible.")]));
children.push(figure("report_model_comparison.png", 6.4, 2.71));
children.push(caption("Figure 1. Share of defaulters caught, precision and risk-ranking quality of each technique on the test set."));

children.push(p([bold("We chose the final model and its threshold on the training rows, from business cost rather than convention. "), txt("Two settings decide how readily a forest flags an applicant: the extra weight given to defaulters during training (class weights) and the probability threshold. We chose them together, on the training rows alone, by one yardstick: the expected dollar cost of the model's mistakes. We estimated that cost on training applicants that the model did not see (three rounds of 5-fold cross-validation). The selection had three stages, each with a rule that we fixed beforehand. Stage 1 scored fifteen forest configurations on all 27 inputs, each at its own cost-minimising threshold. They were five weightings, each with fully grown trees or with trees limited to at least 5 or 10 applicants per leaf. Stage 2 reduced the input set of the chosen forest. Stage 3 compared five final forest candidates and three other techniques. In each stage, the lowest average cost wins. When several candidates are within one standard error of the lowest cost, the simplest wins (fewest non-default settings, then fewest inputs). One standard error measures the run-to-run noise of the estimate (about $10,500 per 1,000 applicants in Stages 1 and 3).")]));
children.push(p([txt("Fully grown trees beat limited trees for every weighting. Among them, the unweighted, 0.3/0.7 and 0.2/0.8 forests were within that noise of each other, at thresholds of 0.15, 0.20 and 0.25. The balanced and 0.1/0.9 weightings cost about $13,000 and $27,000 more per 1,000 applicants. So Stage 1 chose the unweighted forest with fully grown trees.")]));
children.push(p([txt("Stage 2 is the counterpart of choosing how many principal components to keep. We ranked the inputs by the chosen forest's importance and removed the weakest input first. We removed the six occupation columns and the two loan-purpose columns only as whole groups. We scored each input set on the same folds with three forest seeds and averaged the cost (Figure 2). Three seeds are necessary because the randomness of a single forest moves the cost by about one standard error. The rule keeps the smallest input set whose cost is within one standard error (about $9,700) of the lowest cost on this curve. It kept 22 inputs: the 10 financial attributes, the six one-hot indicators and the missing flags of VALUE, REASON, JOB, YOJ, DEROG and DEBTINC. It removed the missing flags of MORTDUE, DELINQ, CLAGE, NINQ and CLNO. Together these five flags carry about 2% of the model's decision power. With 21 inputs the cost leaves the band, and it rises at every later step.")]));
children.push(figure("report_input_reduction.png", 6.4, FIG_H("report_input_reduction.png", 6.4)));
children.push(caption("Figure 2. Indicative expected cost per 1,000 applicants as Stage 2 removes the weakest inputs first. Each point is the mean out-of-fold cost over three forest seeds on the training rows. The shaded band ends one standard error above the lowest cost. The rule keeps the smallest input set inside the band (22 inputs)."));
children.push(p([txt("Stage 3 compared five forest candidates at their own best thresholds. Three were the chosen forest on the 22 selected inputs, on all 27 inputs and on 16 inputs without occupation. The other two were the recall-tuned forest on 27 and 12 inputs. The 12-input set keeps only the 10 financial attributes and the DEBTINC and VALUE missing flags. The forest on all 27 inputs had the lowest cost, about $317,000 per 1,000 applicants. The 22-input forest cost about $324,000, within one standard error, so the rule chose it as the simpler model. Averaged over three seeds, the two input sets differ by only about $1,100. Stage 3 therefore kept the simpler 22-input forest. The forest without occupation cost about 13% more. When precision also carries a cost, the recall-tuned grid winner cost about half again as much. We scored the bagged trees, the balanced logistic regression and the recall-tuned decision tree the same way, at their own best thresholds. They cost about $390,000, $550,000 and $607,000 per 1,000 applicants, against $324,000 for the selected forest. So the forest wins on the chosen yardstick as well as on ranking quality.")]));
children.push(p([txt("The cost-minimising threshold is 0.15 (Figure 3). It sits just below the textbook break-even of 0.18 for a perfectly calibrated score. The reason is that the forest's scores rank applicants well but understate risk in the decision range. Applicants scored 0.15 to 0.20 defaulted about 28% of the time. The threshold stays at 0.15 for cost ratios from 4.5:1 to 8:1 and on a finer grid. The stated ratio of 4.5:1 sits at the lower edge of that range. On two other train/test splits, the unweighted forest on all 27 inputs also chooses 0.15. We scored the forest once on the test set at that threshold. It catches 93% of defaulters at 67% precision, against 68% and 83% at the conventional 0.5. The test result (cost about $310,000 ± $28,000 per 1,000 applicants) is consistent with the out-of-fold estimate ($324,000). The choice between the closely matched configurations rests on the out-of-fold comparison. A single test evaluation is too noisy to decide between them.")]));
children.push(figure("report_threshold.png", 6.4, FIG_H("report_threshold.png", 6.4)));
children.push(caption("Figure 3. Recall, precision and indicative expected cost per 1,000 applicants as the forest's decision threshold moves. The top panel shows recall and precision, and the bottom panel shows the expected cost. We measured all three on out-of-fold predictions of the training rows. The test set played no part in the choice."));

children.push(p([bold("A surrogate decision tree that follows the forest provides interpretability. "), txt("No one can read a forest of 200 trees as a rule list. So we fitted a four-level decision tree to the forest's own decisions rather than to the original labels. Those decisions are flag or clear at the 0.15 threshold. We took them from the out-of-fold scores, so that the tree learns how the forest treats applicants that it did not see. The tree reproduces 93% of the forest's decisions on unseen applicants, against 73% for a rule that never flags anyone. Its rules are the same drivers that the analysis found throughout. First, if the debt-to-income ratio is missing, the tree flags the applicant. Second, if there is a recorded ratio above about 44%, the tree flags the applicant. Third, at or below 44%, the tree flags an applicant with a delinquent credit line and a credit history of about 93 months or less. Otherwise it clears the applicant. Those rules give the plain-language summary of how the model decides. The forest's feature importances (Figure 4) show what drives the score overall. For each decline, the adverse-action notice gives the applicant's own top risk drivers from the forest. The bank builds these drivers (for example SHAP values) in the first two months, before the shadow run.")]));

children.push(h2("How the solution affects the business"));
children.push(
  bullet([bold("Fewer bad loans. "), txt("Of every 200 defaulters in 1,000 applications the model flags about 185 before the money leaves the bank, against none today. Table A1 gives the test-set counts.")]),
  bullet([bold("Protected good business. "), txt("At the 0.15 threshold the model flags about 90 creditworthy applicants per 1,000. This is the price of catching defaulters. It is far lower than the single decision tree's 145. The bank can reduce it further by routing borderline cases to a human underwriter instead of declining them outright. Under the approve / refer / decline bands, the bank declines about 64 creditworthy applicants per 1,000 automatically and refers about 58. Stated as rates, the model flags about 27% of all applicants. That is an approval rate of about 73% on a population that the bank approves in full today, against 84% at the conventional 0.5 threshold. The model wrongly flags about 11% of creditworthy applicants at 0.15, against about 3% at 0.5. Every flag that ends in a decline needs an adverse-action notice, which is one more reason to route the uncertain middle to a person.")]),
  bullet([bold("Faster, more consistent decisions. "), txt("About seven in ten applications fall in the clear-approval band, and about a quarter fall in the clear-decline band. So the bank can automate both bands. Underwriters focus on the roughly 7% in the uncertain band around the threshold.")]),
  bullet([bold("Defensible decisions. "), txt("Every decline maps to a small set of plain-language reasons that match both the data and lending common sense. The reasons are debt burden, unverified income, delinquencies, derogatory reports and short credit history.")]),
);

// 3. Recommendations for implementation
children.push(figure("report_feature_importance.png", 5.9, FIG_H("report_feature_importance.png", 5.9)));
children.push(caption("Figure 4. The twelve inputs that the final Random Forest relies on most (impurity-based importance). Four inputs carry about half of the model's decision power. They are the debt-to-income ratio, its missing-value flag, delinquent credit lines and the credit-history length. Permutation importance ranks the same four at the top."));
children.push(h1("3. Recommendations for Implementation"));
children.push(h2("Key recommendations"));
children.push(
  numbered([bold("Deploy the Random Forest as a decision-support score. "), txt("Integrate it into the existing underwriting workflow, with the probability threshold of 0.15 as the initial setting. Use a three-band outcome. Approve when the predicted default probability is below about 0.10. Refer applications from 0.10 to 0.25 to an underwriter. Decline applications above 0.25. On the test set, these bands hold about 69%, 7% and 24% of applications, with observed default rates of about 1%, 21% and 73%. So the bands keep a human in the loop exactly where the model is least certain, without a large manual workload. The edges are round numbers around the threshold. We set them before we examined the test set, roughly where the expected cost rises 10% to 20% above its minimum. Tune them to underwriting capacity in the shadow period.")], "recs"),
  numbered([bold("Make income and collateral verification mandatory before scoring. "), txt("A missing debt-to-income ratio or property valuation is the strongest default signal in the data. Requiring these fields removes the ambiguity, improves the data for the model and is itself a prudent lending control. Sequence it with the shadow period. The current model relies most on the missing-ratio signal. So once verification is mandatory, that group shrinks. Before go-live, the bank tests the model on the historical applicants with a recorded ratio, and refits it if necessary. On those applicants the model already catches 81% of defaulters at 78% precision while flagging only 9%. Re-training on the outcomes of newly verified applicants needs 12 months or more of repayment data.")], "recs"),
  numbered([bold("Adopt the explicit policy rules the analysis surfaced. "), txt("Decline or escalate applications with a debt-to-income ratio above 45% (87% to 100% of them defaulted). Refer applications with two or more delinquent credit lines or two or more major derogatory reports to an underwriter. The observed default rates of these two groups are 45% and 51% and above. These are escalation rules that we read directly from the observed default rates. The bank applies them together with the score. They are transparent and easy to communicate, and they use the same drivers as the model. The model applies the drivers more finely. At any recorded ratio, its surrogate flags a delinquent line together with a credit history of about 93 months or less. Where a hard rule and the score disagree, the stricter outcome applies. The band shares in recommendation 1 do not include these rule-driven referrals.")], "recs"),
  numbered([bold("Give every decline its own documented reason. "), txt("Build per-applicant risk drivers from the forest (for example SHAP values) in the first two months, before the shadow run. They give the reason on each adverse-action notice, including the automatic declines above 0.25. The surrogate tree's rules reproduce 93% of the forest's flag decisions at the 0.15 threshold. They give the plain-language summary of how the model decides. A referral that ends in a decline carries the underwriter's reason. Store the reasons with the application record for audit and for responses to applicants and regulators.")], "recs"),
  numbered([bold("Check the threshold with real cost figures. "), txt("Replace the indicative $9,000 and $2,000 assumptions with the bank's actual loss-given-default and customer lifetime margin. Then re-derive the threshold on out-of-fold predictions before go-live. The analysis shows that the optimum stays at 0.15 for cost ratios from 4.5:1 to 8:1. The stated ratio of 4.5:1 sits at the lower edge of that range. The optimum would move to 0.20 if the ratio were nearer 2:1 or 3:1. So this step refines the operating point rather than the design.")], "recs"),
  numbered([bold("Run a shadow period and a fairness review before go-live. "), txt("Score every application alongside the manual decision for one to two months. Include applications that the current process declines, because the training data contains only approved loans. Compare the model's decisions with the manual decisions. The outcomes of declined applicants stay unknown, and reject inference needs 12 months or more of data. Test approval and error rates across protected groups. If the review requires the bank to remove occupation, switch to the 16-input fallback model without occupation. Its expected credit-error cost is about 13% higher.")], "recs"),
  numbered([bold("Monitor and re-train. "), txt("Track the approval rate, the score distribution and the share of applications with missing fields monthly. Track recall and precision as repayment outcomes arrive. The expected approval rate is about 73% on today's approved population at the 0.15 threshold. Under the bands, the bank approves about 69% automatically, refers about 7% and declines about 24%. Re-train at least yearly, or when the default rate or input distributions drift.")], "recs"),
);

children.push(h2("Key actionables for stakeholders"));
children.push(p("Table 3 lists the actions for each stakeholder.", { para: { keepNext: true } }));
children.push(table(
  ["Stakeholder", "Actionables"],
  [
    ["Head of Consumer Credit (sponsor)", "Approve the three-band decision policy and the initial 0.15 threshold. Own the risk-appetite decision that the threshold represents. Approve the go-live after the shadow period."],
    ["Credit risk and finance", "Supply actual loss-given-default and margin figures to check the threshold. Check the cost-benefit case. Define the monitoring limits that trigger re-training."],
    ["Underwriting operations", "Make income and valuation verification mandatory fields. Redesign the workflow around approve / refer / decline bands. Train underwriters to read the per-applicant risk drivers and to handle referred cases."],
    ["Data and technology", "Build the scoring pipeline (imputation, missing flags, model, threshold, per-applicant risk drivers such as SHAP values) in the first two months. Integrate it with the loan-origination system. Build logging, monitoring dashboards and a yearly re-training job."],
    ["Compliance and legal", "Review the adverse-action reasons against ECOA requirements. Run the disparate-impact analysis. Decide whether occupation may stay in the model. Approve model-risk documentation."],
    ["Data science", "Maintain the model. Run the shadow comparison. Extend the analysis (see further analysis below). Report monthly performance."],
  ],
  [2600, 6760], true,
));
children.push(caption("Table 3. Key actionables for each stakeholder."));

children.push(h2("Expected benefits and costs"));
children.push(p("The figures in Table 4 are indicative and rest on the stated assumptions. Their purpose is to size the opportunity. The bank should refine them with its own numbers."));
children.push(p([bold("Assumptions.")], { para: { keepNext: true } }));
children.push(
  bullet([bold("Volume and cost of a missed defaulter: "), txt("The application volume is 6,000 per year (the size of the dataset). Defaulted loans averaged $16,900 in the data. With about half recovered through the collateral, a missed defaulter costs about $9,000.")]),
  bullet([bold("Cost of a wrongly declined applicant: "), txt("It is about $2,000 in forgone net interest margin and acquisition spend. Illustratively, that figure combines two parts. One is a net margin of about three percentage points on a $16,000 to $17,000 balance over three to four years. The other is the cost of acquiring a replacement customer. Finance should replace both figures.")]),
  bullet([bold("Cost ratio: "), txt("If the true ratio were nearer 2:1 or 3:1, the cost-minimising threshold would move to 0.20. At 0.20, the out-of-fold data shows about 90% recall and 84 good applicants declined per 1,000.")]),
  bullet([bold("Performance in production: "), txt("We assume that production performance equals test-set performance (93% of defaulters caught, 67% precision at threshold 0.15). This assumption applies to an applicant population like the one that the current process approves. So the benefit is an additional screen on those applicants. The outcomes of applicants that the manual process declines today stay unknown.")]),
  bullet([bold("Before verification: "), txt("Two thirds of defaulters sit in the fifth of applicants with no recorded debt-to-income ratio. The model flags that group almost entirely (97%), and mandatory verification will shrink it. On applicants with a recorded ratio, the model catches 81% of defaulters at 78% precision while flagging 9%. That is the better guide to its behaviour once verification is in place.")]),
  bullet([bold("Bands: "), txt("All figures are for the single 0.15 threshold. The approve / refer / decline bands are the operating procedure around it. Whatever underwriters approve inside the referral band trades some of the modelled benefit for a human check. The referral band holds about 7% of applications, and about one in five of them defaulted. Under the bands, the share of defaulters caught lies between about 88% (if underwriters approved every referral) and 96% (if they declined every referral). The single-threshold figure is 93%.")]),
);
children.push(table(
  ["Item (per year, 6,000 applications)", "Current process", "With the proposed model"],
  [
    ["Loans that default", "about 1,200 (20%)", "about 90 missed (15 per 1,000)"],
    ["Default-related losses", "about $10.8 million", "about $0.8 million"],
    ["Good applicants flagged at the 0.15 threshold", "none attributable to a model", "about 540 (90 per 1,000), margin forgone about $1.1 million"],
    ["Total indicative cost of credit errors", "about $10.8 million", "about $1.9 million"],
    ["Indicative annual benefit", "", "about $8.9 million gross, about $8.8 million after running costs, and about $8.5 million in the first year after the one-off implementation cost"],
  ],
  [3760, 2500, 3100], true,
));
children.push(caption("Table 4. Indicative annual benefit of the proposed solution under the stated assumptions."));
children.push(p([bold("Costs. "), txt("The one-off implementation costs roughly $300,000 to $400,000 (data pipeline and integration, validation, fairness review, documentation and training). Running costs are roughly $100,000 per year (monitoring, re-training, model-risk reviews). Even if the realised benefit were only a quarter of the indicative figure, the solution would recover its cost within the first year.")]));
children.push(p([bold("Non-financial benefits. "), txt("The non-financial benefits are faster decisions for clear cases, consistent treatment of applicants, and documented and auditable reasons for every decline. Another benefit is a data asset (verified income and valuation on every application) that improves every future model.")]));

children.push(h2("Potential risks and challenges"));
children.push(p("Table 5 lists the main risks and how the bank can reduce them.", { para: { keepNext: true } }));
children.push(table(
  ["Risk or challenge", "Why it matters", "Mitigation"],
  [
    ["Selection bias in the training data", "The data covers only loans that the bank approved. Applicants declined under the old process are absent, so the model did not see the full applicant population.", "Run a shadow period on all applications. Use reject inference in the next iteration. Keep a conservative referral band."],
    ["The missing-value signal may change", "Part of the 'ratio missing' signal reflects how the old process recorded data. Once verification is mandatory the feature will shift.", "Introduce mandatory verification alongside the shadow period. Before go-live, test the model on historical applicants with a recorded ratio. Re-train on verified outcomes after 12 months or more. Monitor the share of missing fields. On applicants with a recorded ratio, the model already catches 81% of defaulters at 78% precision."],
    ["Economic drift", "Default rates move with interest rates and employment. A model trained on one period can mis-calibrate in another.", "Monitor the default rate and score distribution monthly. Re-train yearly. Review the threshold."],
    ["Fair-lending and proxy effects", "Occupation, credit-history length (an age proxy) and the missing-ratio flag could act as proxies for protected characteristics. The lower threshold multiplies adverse actions against creditworthy applicants (about 11% of them at 0.15 against 3% at 0.5).", "Test approval and error rates for disparate impact before go-live, annually and whenever the threshold or bands move. Switch to the 16-input fallback (no occupation information, about 13% more expected credit-error cost) if the review requires it."],
    ["Interpretability of the ensemble", "Regulators and applicants need specific reasons. A forest alone is hard to narrate.", "Give each decline the applicant's own top risk drivers (built in the first two months). Use the surrogate tree as the plain-language summary. Keep model-risk documentation."],
    ["Over-reliance on the score", "Automation bias could lead underwriters to stop exercising judgement on referred cases.", "Keep the referral band. Require documented overrides. Audit override outcomes."],
    ["Data quality", "Implausible values exist (debt-to-income above 100%, credit history of 97 years).", "Use input validation rules at capture. Use range checks in the scoring pipeline."],
  ],
  [2400, 3480, 3480],
));
children.push(caption("Table 5. Potential risks and challenges, with mitigations."));

children.push(h2("Further analysis and associated problems to solve"));
children.push(
  bullet([bold("Reject inference: "), txt("obtain outcomes or proxies (for example credit-bureau data) for applicants that the manual process declined. Then the model can reflect the whole applicant population. This needs 12 months or more of data.")]),
  bullet([bold("Feature engineering: "), txt("add a combined loan-to-value ratio ((LOAN + MORTDUE) / VALUE), debt-to-income bands and interaction terms, which the trees currently approximate. The data has no income or loan-term field, so payment-to-income measures need new data.")]),
  bullet([bold("Alternative ensembles and calibration: "), txt("test gradient boosting. Calibrate predicted probabilities so that a score of 0.15 means exactly a 15% chance of default. This simplifies threshold setting and pricing. The unweighted forest's scores rank applicants well but understate risk in the decision range: applicants scored 0.15 to 0.20 defaulted about 28% of the time.")]),
  bullet([bold("Time-based validation: "), txt("once application dates are available, check the model on later periods rather than a random split to measure drift realistically.")]),
  bullet([bold("Risk-based pricing: "), txt("use the probability of default to set interest rates or loan limits for the referral band. This replaces a binary approve/decline.")]),
  bullet([bold("Collections and early warning: "), txt("extend the model to existing loans, using payment behaviour after origination to flag accounts heading towards delinquency.")]),
  bullet([bold("Reason wording: "), txt("turn the per-applicant risk drivers (built in the first two months) into applicant-friendly language, and test that wording with compliance staff and with applicants.")]),
);

// Appendix
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Appendix: Supporting Analysis"));
children.push(figure("report_missing_vs_present.png", 6.4, 2.71));
children.push(caption("Figure A1. Default rate when an attribute is missing versus present. A missing debt-to-income ratio or property valuation is the strongest signal in the data."));
children.push(figure("report_default_rate_bands.png", 6.6, FIG_H("report_default_rate_bands.png", 6.6)));
children.push(caption("Figure A2. Default rate by debt-to-income band, age of oldest credit line and loan amount."));
children.push(figure("report_credit_history.png", 6.6, FIG_H("report_credit_history.png", 6.6)));
children.push(caption("Figure A3. Default rate by number of derogatory reports, delinquent credit lines and recent credit inquiries."));
children.push(figure("report_interactions.png", 6.6, FIG_H_INTERACTIONS));
children.push(caption("Figure A4. Default rate for pairs of variables. At a debt-to-income ratio of 45% or less, two or more delinquent lines raise the default rate from 3-9% to 25-30%. Loan purpose changes the risk within some occupations."));
children.push(table(
  ["Proposed model on the 1,788 test-set applicants", "Model flags as likely default", "Model clears as likely to repay", "Total"],
  [
    ["Actually defaulted", "331 (caught)", "26 (missed)", "357"],
    ["Actually repaid", "160 (wrongly flagged)", "1,271 (correctly cleared)", "1,431"],
    ["Total", "491", "1,297", "1,788"],
  ],
  [3460, 2000, 2300, 1600], true,
));
children.push(caption("Table A1. Decisions of the proposed model (Random Forest, threshold 0.15) on the test set. The model caught 92.7% of defaulters. Of the flagged applicants, 67.4% were real defaulters. Of all decisions, 89.6% were correct."));
children.push(p([txt("The project notebook "), new TextRun({ text: "Loan_Default_Prediction_Capstone.html", font: FONT, size: 22, italics: true }), txt(" holds the complete analysis, including all exploratory charts, model code, cross-validation results and the full decision-tree rules. This report does not depend on it.")]));

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
