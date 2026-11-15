// Builds presentation/Loan_Default_Prediction_Presenter_Guide.docx: a preparation sheet for the live presentation.
// It holds the timing plan for the 8-minute talk, the concepts in plain words and answers to likely questions.
// It is for the presenter only and is not a submission file.
// Run from the repository root:  node scripts/build_presenter_guide.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "presentation", "Loan_Default_Prediction_Presenter_Guide.docx");

const NAVY = "1E2761";
const GREY = "595959";
const LIGHT = "E8EEF7";
const FONT = "Calibri";

// ---------- helpers ----------
const txt = (t) => new TextRun({ text: t, font: FONT, size: 21 });
const bold = (t) => new TextRun({ text: t, bold: true, font: FONT, size: 21 });
const p = (runs, after = 120) => new Paragraph({ spacing: { after, line: 264 }, children: Array.isArray(runs) ? runs : [txt(runs)] });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 280, after: 140 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 28, color: NAVY })] });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 70, line: 260 }, children: Array.isArray(runs) ? runs : [txt(runs)] });
// A question in bold, then its answer in the same paragraph
const qa = (q, a) => new Paragraph({ spacing: { after: 110, line: 260 }, keepLines: true, children: [bold(q + " "), txt(a)] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(header, rows, widths, boldFirst = true) {
  const cell = (text, isHeader, w, strong) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: String(text), bold: isHeader || strong, font: FONT, size: 19, color: isHeader ? "FFFFFF" : "000000" })] })],
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => cell(h, true, widths[i], false)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, false, widths[i], boldFirst && i === 0)) })),
    ],
  });
}
const gap = () => new Paragraph({ spacing: { after: 100 }, children: [] });

const children = [];

// ---------------------------------------------------------------- title
children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Loan Default Prediction: presenter guide", font: FONT, bold: true, size: 36, color: NAVY })] }));
children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Preparation sheet for the live presentation. For the presenter only: do not upload this file.", font: FONT, size: 21, color: GREY })] }));

// ---------------------------------------------------------------- 1. the session
children.push(h1("1. The session and how it is graded"));
children.push(
  bullet([bold("Time. "), txt("You have 8 minutes to present. The panel stops you at 9 minutes. Then 4 to 5 minutes of questions follow.")]),
  bullet([bold("Questions. "), txt("They can be business questions or academic questions. A subject-matter expert may ask about concepts.")]),
  bullet([bold("Language. "), txt("Explain each result in plain words first, then give the technical term. Say 'share of defaulters caught' before 'recall'.")]),
  bullet([bold("Marks (40). "), txt("Quality of slides: 10. Understanding of the solution, which is your ability to explain concepts: 15. Depth of analysis, which is methodology and rigour: 15.")]),
);
children.push(p("The script in the speaker notes runs about 900 words. At a calm pace that is about 7 minutes, which leaves a margin before the 8-minute mark."));

// ---------------------------------------------------------------- 2. timing plan
children.push(h1("2. Timing plan"));
children.push(table(
  ["Slide", "The one message", "Target", "Clock at the end"],
  [
    ["1. Title", "A model the bank can explain cuts the cost of bad lending decisions by about four fifths", "0:15", "0:15"],
    ["2. Key takeaways", "Problem, key finding, solution, benefit, recommendation", "0:40", "0:55"],
    ["3. The problem", "Defaults consume the profit. Decisions are manual. Every rejection needs a reason", "0:30", "1:25"],
    ["4. Approach", "Five steps. The test set was set aside first", "0:20", "1:45"],
    ["5. Insight 1", "A blank field is a warning: 62% and 94% default", "0:25", "2:10"],
    ["6. Insight 2", "Debt burden has a cliff at 45%. Past delinquency repeats", "0:25", "2:35"],
    ["7. Insight 3", "Long credit histories protect. Small loans are the riskiest", "0:15", "2:50"],
    ["8. Measure of success", "A missed defaulter costs 4.5 times a wrong decline, so recall comes first", "0:25", "3:15"],
    ["9. Model comparison", "The Random Forest ranks best and costs least", "1:00", "4:15"],
    ["10. Proposed solution", "22 inputs, three bands, three plain rules, 93% of defaulters caught", "0:45", "5:00"],
    ["11. Threshold", "0.15 halves the cost of mistakes against 0.5", "0:30", "5:30"],
    ["12. Business impact", "About $9 million a year under stated assumptions", "0:30", "6:00"],
    ["13. Recommendations", "Three phases and three policy rules to adopt now", "0:30", "6:30"],
    ["14. Risks", "Selection bias, a fading signal, fair lending, each with its mitigation", "0:45", "7:15"],
  ],
  [1900, 5160, 900, 1400],
));
children.push(gap());
children.push(
  bullet([bold("Checkpoints. "), txt("You must reach slide 9 by 3:15 and slide 12 by 5:30.")]),
  bullet([bold("If you are late at slide 7. "), txt("Say one sentence on slide 7 and move on.")]),
  bullet([bold("If you are late at slide 12. "), txt("On slide 13, give only the three policy rules. On slide 14, name the three risks without the detail.")]),
  bullet([bold("Never cut. "), txt("Slides 2, 10 and 12 carry the takeaways, the solution and the benefit.")]),
  bullet([bold("Backup slides. "), txt("Appendix A has all eleven models. B has what the forest relies on. C has the three rules. D has the data treatment. E has the rigour checks.")]),
);

// ---------------------------------------------------------------- 3. concepts
children.push(h1("3. Concepts in plain words"));
children.push(p("Use the middle column with a business audience. Use the right column if the expert asks."));
children.push(table(
  ["Term", "Plain words", "If the expert asks"],
  [
    ["Recall", "Of the applicants who later defaulted, the share that the model flagged", "True positives divided by all actual defaulters. Ours: 92.7% on the test set"],
    ["Precision", "Of the applicants that the model flagged, the share who really defaulted", "True positives divided by all flagged applicants. Ours: 67.4%"],
    ["F1", "One number that balances recall and precision", "Their harmonic mean. Ours: 0.78"],
    ["ROC-AUC", "How well the model ranks applicants by risk", "The chance that a random defaulter gets a higher score than a random repayer. 0.5 is a coin toss. Ours: 0.96"],
    ["Threshold", "The score above which the model flags an applicant", "0.5 is a convention. We chose 0.15 on expected cost"],
    ["Expected cost", "The dollar cost of the model's mistakes", "Missed defaulters times $9,000 plus wrongly declined applicants times $2,000, per 1,000 applicants"],
    ["Decision tree", "A list of yes or no questions that ends in a decision", "Readable, but unstable: small changes in the data change the tree"],
    ["Bagging", "Many trees, each trained on a random resample of the data, then averaged", "The average removes the instability of a single tree"],
    ["Random Forest", "Bagging, but each question may use only a random few of the inputs", "Each split tries 4 of the 22 inputs. The trees differ more, so their average is steadier"],
    ["Logistic regression", "A weighted sum of the inputs turned into a probability", "Transparent, but it draws straight lines. It misses step changes such as the 45% cliff"],
    ["Class weights", "Make mistakes on defaulters count more during training", "They lift recall at the 0.5 threshold. They add nothing once we choose the threshold on cost"],
    ["Test set", "30% of applicants that no choice ever used", "Stratified 70/30 split. We reserved it before we fitted any statistic, and we scored it once"],
    ["Cross-validation, out-of-fold", "Each training applicant is scored by a model that did not see that applicant", "5 folds, repeated 3 times, so 15 validation folds for each candidate"],
    ["Data leakage", "Information from the test applicants that reaches the training step", "Avoided: medians, caps and scaling come from the training rows only"],
    ["Missing-value flag", "A 0/1 column that marks where a field was blank", "Then we fill the blank with the training median or mode. The flag keeps the signal"],
    ["One-standard-error rule", "Differences smaller than the noise count as a tie, and the simpler model wins", "One standard error is about $10,500 per 1,000 applicants on 15 folds"],
    ["Surrogate tree", "A small tree trained to copy the forest's decisions", "Fitted to the forest's out-of-fold decisions. It agrees with 93% of the forest's test decisions"],
    ["Risk drivers (SHAP values)", "For one applicant, how much each input moved the score up or down", "They give the specific reason on each rejection notice"],
    ["Calibration", "Whether a score of 0.15 really means a 15% chance of default", "Our scores rank well but understate risk near the threshold: scores of 0.15 to 0.20 defaulted 28%"],
    ["Feature importance", "How much the forest relies on each input", "Impurity-based share of split power, checked with permutation importance (drop in ROC-AUC when an input is shuffled)"],
    ["Reject inference", "Estimating how declined applicants would have performed", "Needed because the data holds only loans that the bank approved"],
    ["Gradient boosting", "Trees built one after another, each correcting the errors of the last", "The next technique to test. It often ranks better on tabular data"],
  ],
  [2000, 3560, 3800],
));

// ---------------------------------------------------------------- 4. business questions
children.push(h1("4. Likely business questions"));
children.push(
  qa("How much does it save, and how sure are you?", "About $9 million a year on 6,000 applications: the cost of credit errors falls from $10.8 million to $1.9 million. The figure rests on stated assumptions, so finance must replace them. Even a quarter of the benefit repays the project in the first year."),
  qa("What does it cost?", "About $300,000 to $400,000 once, and about $100,000 a year to run and monitor."),
  qa("What should the bank do first?", "Make income and property-valuation checks mandatory. Set a 45% limit on the debt-to-income ratio. Refer applicants with two or more delinquent lines or derogatory reports to an underwriter. These rules need no model."),
  qa("How many good customers do we lose?", "At the 0.15 threshold the model flags about 90 good applicants per 1,000, which is 11% of good applicants. Under the three bands, the bank declines about 64 automatically and refers about 58 to an underwriter."),
  qa("How do you explain a rejection?", "Three plain rules summarise the model. The ratio is missing, or it is above about 44%, or a delinquent line comes with a short credit history. Each rejection notice also gives that applicant's own top risk drivers."),
  qa("Is the model fair?", "No input is a protected characteristic. Occupation and credit-history length could act as proxies. So compliance tests approval and error rates across protected groups before go-live. A version without occupation is ready at about 13% more cost."),
  qa("What if the economy changes?", "The bank monitors the approval rate monthly, and recall and precision as outcomes arrive. It re-trains the model at least yearly."),
  qa("Why not go live now?", "The data holds only loans that the bank approved. A shadow run of one to two months scores every application first, next to the manual decision."),
);

// ---------------------------------------------------------------- 5. academic questions
children.push(h1("5. Likely academic questions"));
children.push(
  qa("Why a Random Forest and not logistic regression?", "The risk changes in steps, and the drivers combine. Trees capture both. At its own best threshold the logistic regression costs $550,000 per 1,000 applicants, against $324,000 for the forest."),
  qa("Why recall, if cost decides the final choice?", "Recall is the primary metric for the individual models, because a missed defaulter costs about 4.5 times a wrong decline. Expected cost puts recall and precision into dollars, so it decides the final model and threshold."),
  qa("Why 0.15, and does it hold under other assumptions?", "It gives the lowest expected cost. It holds for cost ratios from 4.5:1 to 8:1 and on a finer grid. On two other train and test splits, the forest on all 27 inputs also chose 0.15."),
  qa("A fully grown forest fits the training data perfectly. Is it over-fitted?", "Each tree fits its own sample, but the average of 200 trees generalises. The ROC-AUC is 0.960 out-of-fold and 0.961 on the test set. The test cost of $310,000 agrees with the out-of-fold $324,000."),
  qa("How did you avoid data leakage?", "We reserved the test set before we fitted any statistic. Medians, modes, caps and scaling come from the training rows only. The test set played no part in any choice, and we scored it once."),
  qa("Why not resample the data to correct the imbalance?", "Class weights and the threshold handle the imbalance, so we keep every real applicant. The threshold alone was enough for the final model."),
  qa("Why median imputation, and why keep the flags?", "The median resists the skew and the outliers. The flag keeps the information that the field was blank, which is the strongest signal in the data."),
  qa("Why remove five inputs?", "They carry about 2% of the decision power. Averaged over three seeds, 22 inputs cost about $321,000 against $320,000 for all 27. The rule keeps the smallest set within one standard error."),
  qa("Why no outlier capping for the trees?", "Trees split on rank order, so extreme values do not distort them. We capped outliers only for the logistic regression."),
  qa("Why fit the explanation tree to the forest's out-of-fold decisions?", "A fully grown forest reproduces its training labels almost perfectly. In-sample decisions would teach the small tree the labels, not the forest's behaviour on new applicants."),
  qa("Are the scores calibrated?", "They rank applicants well: the Brier score is 0.063 against 0.160 for the base rate. Near the threshold they understate risk, so we list calibration as a next step."),
  qa("What are the limits of the data?", "It holds 5,960 loans that the bank approved, with no application dates. So we cannot test the model over time or on declined applicants yet. The shadow run and reject inference address both."),
  qa("Where do the $9,000 and $2,000 come from?", "Defaulted loans average $16,900. With about half recovered through the collateral, plus collection costs, a missed defaulter costs about $9,000. A wrong decline forgoes about $2,000 of interest margin. Both are indicative."),
);

const doc = new Document({
  creator: "Saloni Priya",
  title: "Loan Default Prediction - Presenter Guide",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1150, bottom: 1100, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Loan Default Prediction - Presenter Guide  |  Page ", font: FONT, size: 18, color: GREY }),
                 new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GREY })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024).toFixed(0), "KB");
});
