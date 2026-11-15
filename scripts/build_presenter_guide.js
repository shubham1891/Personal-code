// Builds presentation/Loan_Default_Prediction_Presenter_Guide.docx: a preparation sheet for the live presentation.
// It holds the timing plan for the 8-minute talk, a rehearsal procedure, the concepts in plain words, answers to likely
// questions and a paper copy of the script. The timing plan and the script come from presentation_script.js.
// It is for the presenter only and is not a submission file.
// Run from the repository root:  node scripts/build_presenter_guide.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber,
} = require("docx");

const SCRIPT = require("./presentation_script");

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
// A numbered step of a procedure. Each list (ref) starts at 1
const step = (t, ref) => new Paragraph({ numbering: { reference: `steps-${ref}`, level: 0 }, spacing: { after: 50, line: 260 }, children: [txt(t)] });

// ---------- likely questions: [question, answer] ----------
const BUSINESS = [
  ["How much does the model save, and how sure are you?", "About $9 million each year for 6,000 applications. The cost of credit errors decreases from $10.8 million to $1.9 million. The number uses stated assumptions, so the finance team must replace them. With only a quarter of the benefit, the bank still recovers the project cost in the first year."],
  ["What does the project cost?", "About $300,000 to $400,000 one time. Then about $100,000 each year to operate and monitor the model."],
  ["What should the bank do first?", "Make the income check and the property valuation check mandatory. Set a limit of 45% on the debt-to-income ratio. Refer applicants with two or more delinquent credit lines or derogatory reports to an underwriter. These rules do not need a model."],
  ["How many good applicants does the bank lose?", "At the 0.15 threshold, the model flags about 90 good applicants in each 1,000. That is 11% of the good applicants. With the three bands, the bank declines about 64 automatically and refers about 58 to an underwriter."],
  ["How do you explain a declined application?", "Three plain rules summarise the model. Rule 1: the ratio is missing. Rule 2: the ratio is above about 44%. Rule 3: the applicant has a delinquent credit line and a short credit history. Each decline notice will also give the top risk drivers of that applicant. The bank builds these risk drivers in months 0 to 2."],
  ["Is the model fair?", "No input is a protected characteristic. Occupation and the length of the credit history could be proxies. So the compliance team tests approval rates and error rates across protected groups before the start. A model without occupation is ready. It costs about 13% more."],
  ["What if the economy changes?", "The bank monitors the approval rate each month. It monitors recall and precision when the loan results arrive. It trains the model again at least one time each year."],
  ["Why not use the model now?", "The data has only loans that the bank approved. First, a shadow run of one to two months scores all applications in parallel with the manual decision."],
];
const ACADEMIC = [
  ["Why a Random Forest and not logistic regression?", "The risk changes in steps, and the attributes combine. Trees can follow both. At its own best threshold, the logistic regression costs $550,000 for each 1,000 applicants. The forest costs $324,000."],
  ["Why recall, if cost makes the final selection?", "Recall is the primary measure for each model, because a missed defaulter costs about 4.5 times a wrong decline. The expected cost converts recall and precision to dollars. So it makes the final selection of the model and the threshold."],
  ["Why 0.15, and is it stable with other assumptions?", "It gives the lowest expected cost. It stays the same for cost ratios from 4.5:1 to 8:1 and on a finer grid. On two other train and test splits, the forest with all 27 inputs also selected 0.15."],
  ["A fully grown forest fits the training data perfectly. Is it over-fitted?", "Each tree fits its own sample, but the average of 200 trees generalises. The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants. The test cost of $310,000 agrees with the cost of $324,000 in cross-validation."],
  ["How did you prevent data leakage?", "I reserved the test applicants before I fitted any statistic. The medians, modes, caps and scaling come from the training applicants only. No selection used the test applicants. I scored the final model on them one time, after all selections. The test results of the other models in Appendix A are for the report only."],
  ["Why did you not resample the data to correct the imbalance?", "Class weights and the threshold correct the imbalance, so I keep every real applicant. For the final model, the threshold alone was sufficient."],
  ["Why median imputation, and why keep the flags?", "The median is not sensitive to the skew and the outliers. The flag keeps the information that the value was missing. For the ratio and the valuation, that information is the strongest signal in the data."],
  ["Why did you remove five inputs?", "They have about 2% of the decision power. As an average of three seeds, 22 inputs cost about $321,000 and all 27 inputs cost about $320,000. The rule keeps the smallest set within one standard error."],
  ["Why no outlier caps for the trees?", "Trees split on the rank order of the values, so extreme values do not distort them. I capped outliers only for the logistic regression."],
  ["Why did you fit the small tree to the out-of-fold decisions of the forest?", "A fully grown forest repeats its training labels almost perfectly. In-sample decisions would teach the small tree the labels. They would not teach it the behaviour of the forest on new applicants."],
  ["Are the scores calibrated?", "The probabilities are accurate in general: the Brier score is 0.063, against 0.160 for the base rate. The ROC-AUC of 0.96 measures the ranking. Near the threshold the scores are too low, so calibration is a next step."],
  ["What are the limits of the data?", "It has 5,960 loans that the bank approved, and no application dates. So I cannot test the model across time or on declined applicants now. The shadow run and reject inference correct both limits."],
  ["What is the source of the $9,000 and $2,000 costs?", "The average defaulted loan is $16,900. The collateral recovers about half, and collection adds costs. So a missed defaulter costs about $9,000. With a wrong decline, the bank loses about $2,000 of interest margin. Both numbers are indicative."],
];

const children = [];

// ---------------------------------------------------------------- title
children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Loan Default Prediction: presenter guide", font: FONT, bold: true, size: 36, color: NAVY })] }));
children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Preparation sheet for the live presentation. For the presenter only: do not upload this file.", font: FONT, size: 21, color: GREY })] }));

// ---------------------------------------------------------------- 1. the session
const PLAN = SCRIPT.timing();
const clockAt = (slide) => SCRIPT.clockText(PLAN.find((t) => t.slide === slide).clock);
const END = clockAt(15);

children.push(h1("1. The session and the marks"));
children.push(
  bullet([bold("Time. "), txt("You have 8 minutes for the talk. The panel stops you at 9 minutes. Then the panel asks questions for 4 to 5 minutes.")]),
  bullet([bold("Questions. "), txt("The questions can be business questions or academic questions. A subject-matter expert may ask about concepts.")]),
  bullet([bold("Language. "), txt("Explain each result in plain words first. Then give the technical term. Say 'share of defaulters caught' before 'recall'.")]),
  bullet([bold("Marks (40). "), txt("Quality of slides: 10. Understanding of the solution (your ability to explain concepts): 15. Depth of analysis (methodology and rigour): 15.")]),
);
children.push(p(`The script in the speaker notes has ${SCRIPT.totalWords()} words. At a calm pace of ${SCRIPT.WORDS_PER_MINUTE} words each minute, the talk ends at about ${END}. This gives you a margin before the 8-minute limit.`));

// ---------------------------------------------------------------- 2. timing plan
children.push(h1("2. Timing plan"));
children.push(table(
  ["Slide", "The one message", "Target", "Clock at the end"],
  PLAN.map((t) => [`${t.slide}. ${t.name}`, t.message, SCRIPT.clockText(t.target), SCRIPT.clockText(t.clock)]),
  [1900, 5160, 900, 1400],
));
children.push(gap());
children.push(
  bullet([bold("Time cue. "), txt("The first line of each speaker note gives the same target and the same clock time.")]),
  bullet([bold("Checkpoints. "), txt(`Start slide 9 before ${clockAt(8)}. Start slide 12 before ${clockAt(11)}.`)]),
  bullet([bold("If you are late at slide 7. "), txt("Say one sentence on slide 7 and continue.")]),
  bullet([bold("If you are late at slide 12. "), txt("On slide 13, say only the first sentence and the third sentence. On slide 14, say only the sentences that start with First, Second and Third.")]),
  bullet([bold("Do not cut. "), txt("Slides 2, 10 and 12 contain the takeaways, the solution and the benefit.")]),
  bullet([bold("Backup slides. "), txt("Appendix A shows all eleven models. Appendix B shows the importance of the inputs. Appendix C shows the three rules. Appendix D shows the data treatment. Appendix E shows the rigour checks.")]),
);

// ---------------------------------------------------------------- 3. how to present
children.push(h1("3. How to present"));
children.push(p([bold("Before the session")], 60));
[
  "Open the deck in Presenter View. The notes show one sentence on each line.",
  "Read the script aloud with a timer. Do this three times or more.",
  "At each slide change, compare the timer with the clock time in the cue.",
  "If the talk is longer than 7 minutes 45 seconds, apply the two rules for a late talk in section 2.",
  "Say the answers in sections 5 and 6 aloud. Use your own words when you know the answer.",
  "Print section 7 as a paper copy of the script.",
].forEach((t) => children.push(step(t, "before")));
children.push(p([bold("During the talk")], 60));
[
  "Start the timer when you say 'Good morning'.",
  "Say one sentence. Then stop for a short breath.",
  "Point to the chart or the number when you say it.",
  "Look at the clock cue each time you change the slide.",
  "After 'Thank you', keep slide 15 on the screen. Its note has short answers.",
].forEach((t) => children.push(step(t, "during")));
children.push(p([bold("During the questions")], 60));
[
  "Give the short answer first. Then give one number as evidence.",
  "Show a backup slide only if it helps the answer.",
  "If you do not know the answer, tell the panel. Then tell them how you would find it.",
].forEach((t) => children.push(step(t, "questions")));
children.push(new Paragraph({ pageBreakBefore: true, keepNext: true, spacing: { after: 60, line: 264 }, children: [bold("How to say the numbers and the terms")] }));
children.push(table(
  ["On the slide", "Say"],
  [
    ["0.15, 0.10, 0.25, 0.5", "'zero point one five', 'zero point one zero', 'zero point two five', 'zero point five'"],
    ["$324k", "'three hundred and twenty-four thousand dollars'"],
    ["$10.8M, $1.9M, ~$9M", "'ten point eight million dollars', 'one point nine million dollars', 'about nine million dollars'"],
    ["4.5:1 to 8:1", "'from four and a half to one, to eight to one'"],
    ["ROC-AUC 0.96", "'R, O, C, A, U, C of zero point nine six'. In plain words: the quality of the risk ranking"],
    ["F1", "'F one'"],
    ["ECOA", "'the Equal Credit Opportunity Act'"],
    ["HMEQ", "'the home equity data'"],
    ["Debt-to-income ratio", "Say the full name one time on each slide. Then say 'the ratio'"],
    ["Delinquent, derogatory, surrogate", "'de-LIN-kwent', 'de-ROG-a-tory', 'SUR-o-git'"],
  ],
  [2700, 6660],
));

// ---------------------------------------------------------------- 4. concepts
children.push(h1("4. Concepts in plain words"));
children.push(p("Use the middle column with a business audience. Use the right column if the expert asks."));
children.push(table(
  ["Term", "Plain words", "If the expert asks"],
  [
    ["Recall", "Of the applicants who defaulted later, the share that the model flagged", "True positives divided by all actual defaulters. This model: 92.7% on the test applicants"],
    ["Precision", "Of the applicants that the model flagged, the share who really defaulted", "True positives divided by all flagged applicants. This model: 67.4%"],
    ["Accuracy", "Of all decisions, the share that is correct", "It misleads when one in five applicants defaults. A model that approves all applicants is 80% accurate and catches no defaulter"],
    ["F1", "One number that balances recall and precision", "The harmonic mean of recall and precision. This model: 0.78"],
    ["ROC-AUC", "How well the model ranks applicants by risk", "The chance that a random defaulter gets a higher score than a random good applicant. A value of 0.5 is a random guess. This model: 0.96"],
    ["Threshold", "The score above which the model flags an applicant", "The value 0.5 is a convention. I selected 0.15 by the expected cost"],
    ["Expected cost (cost of credit errors)", "The dollar cost of the wrong decisions of the model", "Missed defaulters times $9,000, plus wrongly declined applicants times $2,000, for each 1,000 applicants"],
    ["Decision tree", "A list of yes-or-no questions that ends in a decision", "People can read it, but it is unstable: small changes in the data change the tree"],
    ["Bagging", "Many trees, each trained on a random resample of the data. The model uses their average", "The average decreases the instability (the variance) of a single tree"],
    ["Random Forest", "Bagging, but each question can use only a random few of the inputs", "Each split tries 4 of the 22 inputs. The trees are more different, so their average is more stable"],
    ["Logistic regression", "A weighted sum of the inputs, which the model converts to a probability", "It is transparent, but it draws straight lines. It cannot follow sudden changes such as the jump at a 45% ratio"],
    ["Class weights", "During training, an error on a defaulter counts more", "At the 0.5 threshold, they increased recall for the logistic regression (57% to 80%) and the forest (69% to 77%). They did not help the single tree or the bagged trees. They add nothing after I select the threshold by cost"],
    ["Test set (test applicants)", "30% of the applicants, which no selection used", "Stratified 70/30 split. I reserved it before I fitted any statistic. I scored the final model on it one time, after all selections"],
    ["Cross-validation, out-of-fold", "Each training applicant gets a score from a model that did not see that applicant", "5 folds, repeated 3 times: 15 validation folds for each candidate"],
    ["Data leakage", "Information from the test applicants that reaches the training step", "Prevented: the medians, the caps and the scaling come from the training applicants only"],
    ["Missing-value flag", "A 0/1 input that records where a value was missing", "Then I replace the missing value with the training median or mode. The flag keeps the signal"],
    ["One-standard-error rule", "A difference smaller than the noise is a tie, and the simpler model wins", "One standard error is about $10,500 for each 1,000 applicants on 15 folds"],
    ["Surrogate tree", "A small tree that I trained to copy the decisions of the forest", "I fitted it to the out-of-fold decisions of the forest. It agrees with 93% of the test decisions of the forest"],
    ["Risk drivers (SHAP values)", "For one applicant, how much each input moved the score up or down", "This project did not calculate them. The bank builds them in months 0 to 2. They will give the specific reason on each decline notice"],
    ["Calibration", "Whether a score of 0.15 really means a 15% chance of default", "Near the threshold the scores are too low: 28% of applicants with scores of 0.15 to 0.20 defaulted"],
    ["Brier score", "The average squared difference between the score and the result (1 or 0). Lower is better", "0.063 for the forest and 0.160 for the base rate. It measures the accuracy of the probabilities, not the ranking"],
    ["Feature importance", "How much the forest uses each input", "The share of the split power (impurity-based). I checked it with permutation importance: the decrease in ROC-AUC when I shuffle the values of one input"],
    ["Reject inference", "An estimate of the results of declined applicants", "It is necessary because the data has only loans that the bank approved"],
    ["Gradient boosting", "Trees that the model builds in sequence. Each tree corrects the errors of the tree before it", "The next technique to test. It frequently ranks better on table data"],
  ],
  [2000, 3560, 3800],
));

// ---------------------------------------------------------------- 5. business questions
children.push(h1("5. Likely business questions"));
BUSINESS.forEach(([q, a]) => children.push(qa(q, a)));

// ---------------------------------------------------------------- 6. academic questions
children.push(h1("6. Likely academic questions"));
ACADEMIC.forEach(([q, a]) => children.push(qa(q, a)));

// ---------------------------------------------------------------- 7. the script
children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, keepNext: true, spacing: { before: 0, after: 140 }, children: [new TextRun({ text: "7. The script", font: FONT, bold: true, size: 28, color: NAVY })] }));
children.push(p("This is the text of the speaker notes. Each line is one sentence. The cue gives the target time and the clock time at the end of the slide."));
children.push(p("The script follows the ASD-STE100 rules (Simplified Technical English). Each sentence is complete, short and in the active voice. One term has one meaning."));
SCRIPT.TALK.forEach((t) => {
  children.push(new Paragraph({ keepNext: true, spacing: { before: 140, after: 50 }, children: [bold(`Slide ${t.slide}: ${t.name}  `), new TextRun({ text: SCRIPT.cue(t.slide), font: FONT, size: 19, color: GREY })] }));
  t.lines.forEach((l, i) => children.push(new Paragraph({ keepLines: true, keepNext: i < t.lines.length - 1, spacing: { after: 30, line: 250 }, indent: { left: 280 }, children: [txt(l)] })));
});

const doc = new Document({
  creator: "Saloni Priya",
  title: "Loan Default Prediction - Presenter Guide",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ...["before", "during", "questions"].map((ref) => ({ reference: `steps-${ref}`, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] })),
  ] },
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
