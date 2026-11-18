// Builds presentation/Loan_Default_Prediction_Study_Guide.docx: the whole project in plain words, for the presenter.
// It explains each idea from the start, then each slide, the numbers, easy answers for the questions and a self-test.
// The time values come from presentation_script.js. Every other number is a number of the deck, the Final Report or
// the executed notebook. It is for the presenter only and is not a submission file.
// Run from the repository root:  node scripts/build_study_guide.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber,
} = require("docx");

const SCRIPT = require("./presentation_script");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "presentation", "Loan_Default_Prediction_Study_Guide.docx");

const NAVY = "1E2761";
const GREY = "595959";
const LIGHT = "E8EEF7";
const CREAM = "FBF3E4";
const FONT = "Calibri";
const WIDTH = 9360;

// ---------- helpers ----------
const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 22, ...opts });
const p = (runs, after = 110) => new Paragraph({ spacing: { after, line: 276 }, children: Array.isArray(runs) ? runs : [run(runs)] });
const h1 = (t, pageBreakBefore = true) => new Paragraph({ pageBreakBefore, keepNext: true, spacing: { before: pageBreakBefore ? 0 : 260, after: 130 }, children: [run(t, { bold: true, size: 32, color: NAVY })] });
const h2 = (t) => new Paragraph({ keepNext: true, spacing: { before: 230, after: 90 }, children: [run(t, { bold: true, size: 25, color: NAVY })] });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 55, line: 270 }, children: Array.isArray(runs) ? runs : [run(runs)] });
const step = (t, ref) => new Paragraph({ numbering: { reference: `steps-${ref}`, level: 0 }, spacing: { after: 55, line: 270 }, children: [run(t)] });
// One idea: the term in bold, its meaning, and then how it appears in the project
function idea(term, meaning, project) {
  const out = [new Paragraph({ keepLines: true, keepNext: Boolean(project), spacing: { after: project ? 25 : 95, line: 274 }, children: [run(`${term}. `, { bold: true, color: NAVY }), run(meaning)] })];
  if (project) out.push(new Paragraph({ keepLines: true, spacing: { after: 95, line: 268 }, indent: { left: 300 }, children: [run("In this project: ", { bold: true, size: 21 }), run(project, { size: 21 })] }));
  return out;
}
// A comparison with daily life, in a shaded box
const think = (text) => new Paragraph({
  keepLines: true, spacing: { before: 40, after: 130, line: 270 }, indent: { left: 160, right: 160 },
  shading: { type: ShadingType.CLEAR, fill: CREAM, color: "auto" },
  children: [run("Think of it this way. ", { bold: true, size: 21 }), run(text, { size: 21 })],
});
// A labelled line, used in the slide part
const labelled = (label, text, keepNext = true) => new Paragraph({ keepLines: true, keepNext, spacing: { after: 55, line: 268 }, indent: { left: 200 }, children: [run(`${label} `, { bold: true, size: 21 }), run(text, { size: 21 })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(header, rows, widths, strong = [0], pad = 55) {
  const cell = (text, isHeader, w, isStrong) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: pad, bottom: pad, left: 90, right: 90 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [run(String(text), { bold: isHeader || isStrong, size: 20, color: isHeader ? "FFFFFF" : "000000" })] })],
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => cell(h, true, widths[i], false)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, false, widths[i], strong.includes(i))) })),
    ],
  });
}
const gap = (after = 120) => new Paragraph({ spacing: { after }, children: [] });

const plan = SCRIPT.timing();
const END = SCRIPT.clockText(plan[plan.length - 1].clock);

const children = [];

// ================================================================= title
children.push(new Paragraph({ spacing: { after: 40 }, children: [run("Loan Default Prediction: the project in plain words", { bold: true, size: 40, color: NAVY })] }));
children.push(new Paragraph({ spacing: { after: 170 }, children: [run("Saloni Priya  |  A study guide for the presenter  |  Read it before you learn the speech", { size: 22, color: GREY })] }));

children.push(h2("How to use this guide"));
[
  "Read part 1 and part 2 one time, slowly. They explain each idea from the start, with no technical knowledge necessary.",
  "Then read part 3 with the slides open. It tells you what each slide means and why it is there.",
  "Part 4 shows where each number comes from. Part 5 gives easy answers for the questions of the panel.",
  "Part 6 is a test with answers. Part 7 helps you on the day of the presentation.",
  "The speech sheet has the exact words of the talk. This guide gives you the meaning behind the words.",
].forEach((t) => children.push(bullet(t)));

// ================================================================= part 1
children.push(h2("Part 1. The project in one minute"));
[
  "A bank gives home equity loans. For a home equity loan, the home of the applicant is the security: if the applicant does not repay, the bank can sell the home.",
  "Some applicants stop their payments. This is a default. In the data, one in five loans defaulted, and each default costs the bank money.",
  "Today, bank employees decide each application manually. This is slow, and two employees can decide the same application differently.",
  "You built a model. A model is a program that learns from past loans. Here it learned from the loans that the bank approved in the past.",
  "For each new applicant, the model gives a risk score from 0 to 1. If the score is above 0.15, the model flags the applicant as a probable defaulter.",
  "You tested the model on 1,788 applicants that it did not see before. It caught 93% of the applicants who later defaulted.",
  "With your cost assumptions, the model decreases the cost of wrong loan decisions by about 80%. For 6,000 applications, that is about $9 million each year.",
  "The law requires a reason for each declined application. So you also give three simple rules that explain the model, and the reasons for each applicant.",
  "Your recommendation: first make the income check and the property valuation mandatory. Then operate the model in parallel with the employees for one to two months. Then use it.",
].forEach((t) => children.push(p(t, 80)));

// ================================================================= part 2
children.push(h1("Part 2. The ideas, from the start"));
children.push(p("Each idea has its plain meaning first. The line 'In this project' gives the number that you say in the talk."));

children.push(h2("2.1 The bank and its loans"));
children.push(...idea("Home equity loan", "A loan that uses the home of the applicant as security. If the applicant does not repay, the bank can get money from the sale of the home. The technical word for this security is 'collateral'."));
children.push(...idea("Default", "The applicant stops the payments. This is the result that the model predicts. In the data, this result also includes applicants who were seriously late with their payments ('seriously delinquent').", "1,189 of the 5,960 loans defaulted. That is 19.9%, or one in five."));
children.push(...idea("Applicant, defaulter, good applicant", "An applicant is a person who asks for a loan. A defaulter is an applicant who later defaults. A good applicant is an applicant who repays."));
children.push(...idea("Underwriter", "The bank employee who examines an application and decides."));
children.push(...idea("Debt-to-income ratio", "The share of the monthly income that pays debts. A ratio of 40% means that 40 cents of each dollar of income pay debts.", "When the ratio was between 20% and 40%, only 4% to 7% of applicants defaulted. When it was between 45% and 50%, 87% defaulted. Above 50%, all applicants defaulted. The risk does not increase slowly. It increases in one large step."));
children.push(...idea("Property valuation", "An estimate of the value of the home, made by an expert."));
children.push(...idea("Delinquent credit line", "A loan or a credit card on which the applicant paid late.", "14% of applicants with no delinquent line defaulted, 34% with one line and 45% with two lines."));
children.push(...idea("Derogatory report", "A serious negative entry in the credit record of the applicant. The credit record is the list of the loans and the payments of a person. An example is a debt that the applicant never repaid."));
children.push(...idea("Credit history", "The time since the applicant got the first loan or credit card.", "44% of applicants with a credit history below 5 years defaulted. With 20 years or more, about 10% defaulted."));
children.push(...idea("The data", "The Home Equity data set, with the short name HMEQ. It has 5,960 loans that the bank approved. For each loan, it has 12 facts from the application and the result: repaid or defaulted.", "Six facts describe the loan and the applicant. They are the loan amount, the mortgage balance, the property valuation, the loan purpose, the occupation and the years at the current job. Six facts describe debts and credit. They are the derogatory reports, the delinquent credit lines, the credit history, the recent credit inquiries, the number of credit lines and the debt-to-income ratio."));
children.push(...idea("Mortgage balance", "The amount that the applicant still owes on the existing home loan."));
children.push(...idea("Credit inquiry", "A lender examines the credit record because the applicant asked for credit."));

children.push(h2("2.2 What a model is"));
children.push(...idea("Model", "A program that learns patterns from past loans. Then it estimates the risk of a new applicant."));
children.push(think("An experienced underwriter read thousands of old files and knows which signs came before a default. The model does the same work with 4,172 old loans, and it applies the same knowledge to each applicant in the same way."));
children.push(...idea("Input", "One value about the applicant that the model uses, for example the loan amount. 'Feature' is another word for an input. An attribute is one of the 12 facts in the data. One attribute can give more than one input.", "The final model uses 22 inputs. 10 inputs are numbers, for example the loan amount. 6 inputs are missing-value flags (section 2.3). 6 inputs are yes-or-no inputs for the occupation and the loan purpose."));
children.push(...idea("Risk score", "The answer of the model for one applicant: a number from 0 to 1. A higher score means a higher risk of default."));
children.push(...idea("Training applicants and test applicants", "The model learns from the training applicants. The test applicants are the final examination of the model.", "70% of the loans (4,172) are training applicants. 30% (1,788) are test applicants. 357 of the test applicants defaulted."));
children.push(think("A student who sees the examination questions before the examination gets a result that means nothing. So you reserved the test applicants before the data preparation. You tested the final model on them one time, after all decisions."));
children.push(...idea("Data leakage", "Information from the test applicants reaches the training. Then the test result looks better than the truth.", "You prevented it. The data preparation fills the empty fields and converts words to numbers (section 2.3). Each value that it uses, for example a median, comes from the training applicants only."));

children.push(h2("2.3 Missing values"));
children.push(...idea("Missing value", "An empty field in an application.", "44% of the applications have one empty field or more."));
children.push(...idea("The most important finding", "An empty field is information. When the debt-to-income ratio was missing, 62% of the applicants defaulted. When the bank recorded the ratio, only 8.6% defaulted. When the property valuation was missing, 94% defaulted.", "The probable reason is that the bank could not check the income or the home. The data cannot prove this reason."));
children.push(...idea("Missing-value flag", "A new yes-or-no input that answers one question: was this field empty? You fill each empty field with a typical value (see 'Imputation' below). After that, only the flag shows the model that the field was empty.", "The final model has 6 of these flags. The flag for the debt-to-income ratio is its strongest input."));
children.push(...idea("Imputation", "The model cannot calculate with an empty field. So you fill the field with a typical value from the training applicants. For a number, this value is the median. For a word, it is the most frequent value (the 'mode'). The median is the middle value when you put all values in order."));
children.push(...idea("Outlier", "An extreme value, for example a debt-to-income ratio of 203%.", "You replaced each extreme value with a maximum or a minimum value ('capping'), only for the logistic regression (section 2.7). The tree techniques do not need it. A tree only asks if a value is above a limit, so the size of an extreme value has no effect."));
children.push(...idea("One-hot encoding", "A model needs numbers. So an occupation becomes a yes-or-no input, for example 'Sales: yes or no'. The first occupation gets no input, because the other inputs already identify it.", "6 occupations give 5 inputs, and 2 loan purposes give 1 input."));

children.push(h2("2.4 From the score to a decision"));
children.push(...idea("Threshold", "The limit for the score. When the score is above the threshold, the model flags the applicant.", "The threshold is 0.15. Many projects use 0.5, but 0.5 is only a convention: a common choice, not a rule."));
children.push(...idea("Flag", "To mark an applicant as a probable defaulter. A 'missing-value flag' (section 2.3) is a different thing: it is an input."));
children.push(think("A smoke alarm can be more sensitive or less sensitive. A sensitive alarm misses almost no fire, but it gives more false alarms. A low threshold does the same: the model misses fewer defaulters, but it flags more good applicants."));
children.push(...idea("Three bands", "For daily use, one limit is too simple. So you propose three groups of scores around the threshold of 0.15. The limits 0.10 and 0.25 are round numbers near 0.15, and they are your proposal. All results in the talk (93%, 67% and the costs) use the single threshold of 0.15. For these results, each flagged applicant counts as declined.", "Approve: score of 0.10 or less (69% of applicants, about 1% of them defaulted). Refer to an underwriter: 0.10 to 0.25 (7%, about 21% defaulted). Decline: above 0.25 (24%, about 73% defaulted)."));

children.push(h2("2.5 The four results of a decision"));
children.push(p("Each applicant is a defaulter or a good applicant. The model flags the applicant or it does not. So four results are possible. This table of four numbers has the name 'confusion matrix'. The numbers are for the 1,788 test applicants at the 0.15 threshold."));
children.push(table(
  ["", "The model flags the applicant", "The model does not flag the applicant"],
  [
    ["The applicant defaulted (357)", "331: defaulter caught. Technical name: true positive", "26: defaulter missed. Technical name: false negative"],
    ["The applicant repaid (1,431)", "160: good applicant flagged. Technical name: false positive", "1,271: good applicant approved. Technical name: true negative"],
  ],
  [2360, 3500, 3500],
));
children.push(gap(70));
children.push(p("'Positive' means that the model flags the applicant. It does not mean 'good'. 'True' means that the model was right."));
children.push(...idea("Recall", "Of all defaulters, the share that the model catches. This is the primary measure.", "331 of 357 defaulters: 93%."));
children.push(...idea("Precision", "Of all flagged applicants, the share that really defaulted.", "331 of 491 flagged applicants: 67%. In the talk you say 'two of every three'."));
children.push(...idea("Accuracy", "Of all decisions, the share that is correct.", "1,602 of 1,788: 90%. Accuracy is a bad primary measure here. A bank that approves all applicants is 80% accurate, and it catches no defaulter."));
children.push(...idea("F1", "One number that combines recall and precision. It is high only when the two are high.", "0.78."));
children.push(...idea("The same result for each 1,000 applicants", "200 of 1,000 applicants are defaulters. The model catches 185 and misses 15. It also flags about 90 good applicants."));

children.push(h2("2.6 The cost of credit errors"));
children.push(...idea("Credit error", "A wrong loan decision. There are two types, and their costs are different."));
children.push(...idea("Missed defaulter", "The bank approves an applicant who defaults.", "You assume a cost of about $9,000. The average defaulted loan is $16,900. You assume that the sale of the home recovers about half and that collection adds costs. Collection is the work of the bank to get back the unpaid money."));
children.push(...idea("Wrongly declined good applicant", "The bank declines an applicant who would repay. The bank loses its margin on this loan. The margin is the interest that the bank earns minus the amount that the bank pays for the money.", "You assume a cost of about $2,000."));
children.push(...idea("The cost ratio", "A missed defaulter costs about 4.5 times a wrongly declined applicant ($9,000 divided by $2,000). This is the reason that recall is the primary measure: the expensive error is the missed defaulter."));
children.push(...idea("Cost of credit errors for each 1,000 applicants", "Missed defaulters multiplied by $9,000, plus wrongly declined applicants multiplied by $2,000. This one number converts recall and precision to dollars. The slides name it 'expected cost'.", "For the test applicants at 0.15: 14.5 missed and 89.5 wrongly declined, so about $310,000. At 0.5: 64.3 missed and 28.0 wrongly declined, so about $635,000. The lower threshold decreases the cost by half."));
children.push(...idea("Indicative", "An indicative value is an estimate that shows the approximate size. It is not an exact result. The dollar values depend on your two assumptions. The finance team of the bank must replace them with real data. So you always say 'indicative' and 'about'."));
children.push(...idea("Stress test", "A check with other assumptions.", "The threshold of 0.15 stays the cheapest when a missed defaulter costs 4.5 to 8 times a wrongly declined applicant. So the result does not depend on one exact number."));

children.push(h2("2.7 The four techniques"));
children.push(p("A technique is a method to build a model. You built eleven models with four techniques. The eleven models are the four techniques with different settings."));
children.push(...idea("Logistic regression", "It multiplies each input by a number, the weight of that input. It adds the results and converts the sum to a score from 0 to 1. It is easy to explain, because each input has one weight.", "Its weakness: the debt-to-income ratio has one weight. Each additional point of the ratio adds the same quantity to the sum, so the score changes gradually. So your logistic regression cannot follow the sudden step at 45%."));
children.push(...idea("Decision tree", "A list of yes-or-no questions that ends in a decision, for example 'Is the debt-to-income ratio above 44%?'. The tree learns its questions from the training applicants. Each question divides the applicants into two groups. The tree selects the question that separates defaulters from good applicants best. People can read it easily.", "Its weakness: one tree is not stable. Small changes in the data change the tree. The tuned tree (see 'Tuning' below) catches 82% of defaulters, but it flags almost one good applicant for each defaulter that it catches."));
children.push(...idea("Bagged trees", "Many trees, each trained on a different random sample of the training applicants. The model uses the average of their answers."));
children.push(...idea("Random Forest", "Bagged trees with one more rule: at each question, a tree can select from only a few inputs, chosen at random. So the trees are more different, and their average is more stable.", "200 trees. At each question, a tree selects from 4 of the 22 inputs. Each tree is 'fully grown': it asks questions until each final group has only defaulters or only good applicants."));
children.push(think("You ask 200 underwriters for an opinion. Each underwriter studied different old files and looks at different facts. One underwriter can be wrong, but the average opinion of 200 underwriters is usually good. In simple terms, the risk score is the share of the 200 trees that expect a default. The model does not need a majority. With the threshold of 0.15, it flags an applicant when more than 30 of the 200 trees expect a default."));
children.push(...idea("Class weights", "A setting that makes an error on a defaulter more important during the training. 'Balanced' on the slides means that the software sets these weights automatically from the share of defaulters.", "You tested class weights. When you select the threshold by cost, they give no advantage. So the final forest has no class weights."));
children.push(...idea("Tuning", "A search for the best settings of a technique. A grid search tries each combination from a list of settings."));

children.push(h2("2.8 How you selected the final model"));
children.push(...idea("Cross-validation", "A method to test a model with the training applicants only. You divide them into 5 parts. The model learns from 4 parts, and you test it on the fifth part. You test the model on each of the 5 parts one time. The technical name of one part is 'fold'.", "You did this 3 times with different divisions. That gives 15 results for each model."));
children.push(think("Cross-validation is a set of practice examinations before the final examination. You make each decision with the practice results. No selection uses the final examination, the test applicants. Each model got one report on them, but you selected nothing with these reports."));
children.push(...idea("Selection rule", "You set the rule before you compared the models: the lowest cost of credit errors wins. The cost counts the two credit errors. Recall alone is not sufficient, because a model that flags all applicants has a recall of 100%. When two costs are almost equal, the simplest model wins.", "A rule that you set in advance is fair. You cannot adjust it later to help one model."));
children.push(...idea("Standard error", "A measure of how much a result changes by chance, for example with a different division of the applicants. Slide 20 names this random change 'noise'. A difference that is smaller than one standard error is not a real difference.", "For the cost in cross-validation, one standard error is about $10,500 for each 1,000 applicants. So 'almost equal' in the selection rule means a difference of less than about $10,500."));
children.push(...idea("The result of the comparison", "In cross-validation, you calculated the cost of each technique at many thresholds, from 0.05 to 0.70. The next line shows each technique at its cheapest threshold, for each 1,000 applicants. For the Random Forest, the cheapest threshold is 0.15.", "Random Forest $324,000. Bagged trees $390,000. Logistic regression $550,000. Decision tree $607,000."));
children.push(...idea("Fewer inputs", "You removed the weakest input and calculated the cost again. You repeated this as long as the cost stayed almost equal.", "22 of the 27 inputs stay. The five removed inputs are weak missing-value flags. Fewer inputs are easier to explain and to monitor."));
children.push(...idea("The final examination", "After all decisions, you tested the final model on the test applicants one time.", "The cost was $310,000 for each 1,000 applicants. The practice result was $324,000. The two numbers agree, so the model also works on new applicants."));

children.push(h2("2.9 Checks of the quality"));
children.push(...idea("ROC-AUC", "A number that measures how well the model puts applicants in order of risk. 0.5 is the result of a random guess. 1 is perfect.", "0.96. Take one defaulter and one good applicant at random. In 96 of 100 such pairs, the model gives the defaulter the higher score."));
children.push(...idea("Over-fitting", "The model memorises the training applicants. It is very good on them and worse on new applicants. A model 'generalises' when it is also good on new applicants.", "The forest is not over-fitted. Each tree memorises its own sample, but the average of 200 trees works on new applicants. The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants. The two numbers come from applicants that the model did not learn from."));
children.push(...idea("Calibration", "A calibrated score of 0.15 means a 15% chance of default.", "The scores are not perfectly calibrated. Of the applicants with scores from 0.15 to 0.20, 28% defaulted. This is not a problem for the decision, because you selected the threshold by cost."));

children.push(h2("2.10 How you explain the model"));
children.push(...idea("Why an explanation is necessary", "A United States law, the Equal Credit Opportunity Act (ECOA), requires a specific reason for each declined application. A forest of 200 trees is too large to read. So you add three things: the importance of each input, three rules for the full model, and the reasons for each applicant."));
children.push(...idea("Importance of an input", "How much the forest uses an input.", "The strongest input is the missing-value flag of the debt-to-income ratio (17%). The next inputs are the ratio (14%), the credit history (9%) and the delinquent credit lines (8%). Together, these four inputs have about half of the decision power."));
children.push(...idea("Small decision tree (surrogate tree)", "A small tree that you trained to copy the decisions of the forest. It gives three rules that a person can read.", "Rule 1: the ratio is missing, so flag. Rule 2: the ratio is above about 44%, so flag. Rule 3: for all other applicants, flag an applicant with a delinquent credit line and a credit history of about 8 years or less. The rules agree with 93% of the decisions of the forest. The small tree learned the limit of 44%. The policy rule on slide 13 uses 45%. The two numbers describe the same step in the data."));
children.push(...idea("Two different numbers of 93%", "Be careful. The forest catches 93% of the defaulters. The small tree agrees with 93% of the decisions of the forest. These are two different results that are equal by chance."));
children.push(...idea("Risk drivers of one applicant (SHAP values)", "For one applicant, a SHAP value shows how much each input increased or decreased the score. The average score (0.20) plus the 22 contributions gives the score of the applicant.", "Example on slide 21: an applicant has a ratio of 63%. This adds 0.39 to the score. Three derogatory reports add 0.11. These are the reasons in the decline letter."));

children.push(h2("2.11 The risks"));
children.push(...idea("Selection bias", "The data has only loans that the bank approved. The model did not learn from the applicants that the bank declined. So nobody knows how well the model works for such applicants.", "So you do not use the model immediately. First comes a shadow run."));
children.push(...idea("Shadow run", "The model scores each application, but the underwriter still decides. The bank compares the two results. No customer gets a decision from the model.", "One to two months."));
children.push(...idea("Reject inference", "A method that estimates the loan results of applicants that the bank declined. It needs 12 months of loan results or more."));
children.push(...idea("The missing-value signal becomes weaker", "You recommend mandatory checks. Then fewer fields are empty, and the strongest input has less effect.", "You tested the model on the applicants with a recorded ratio. It still catches 81% of defaulters, with a precision of 78%."));
children.push(...idea("Fair lending and proxy", "The law forbids decisions that depend on protected characteristics, for example race, sex or age. A proxy is an input that is not protected, but it is closely linked to a protected characteristic. For example, one occupation can have many more women than men.", "No input is a protected characteristic. But occupation could be a proxy. The compliance team checks that the bank follows the law. So, before the bank uses the model, this team compares the share of approved applicants between protected groups, for example men and women. A forest without occupation is ready, and its cost is about 13% higher."));
children.push(...idea("Changes in the economy", "The patterns in the data can change with time.", "The bank monitors the model each month, and it trains the model again each year."));

children.push(h2("2.12 The money"));
children.push(...idea("Today", "The data has only loans that the bank approved, and one in five of them defaulted. So the present procedure of the bank missed each of these defaulters. The model is a second check on the applications that the bank approves today.", "You assume 6,000 applications each year. That is about the size of the data (5,960 loans), not a real number of the bank. Of 6,000 such applications, about 1,200 default. 1,200 multiplied by $9,000 is about $10.8 million each year."));
children.push(...idea("With the model", "In 6,000 applications, the model misses about 90 defaulters (15 for each 1,000). It flags about 540 good applicants (90 for each 1,000).", "90 multiplied by $9,000 is about $0.8 million. 540 multiplied by $2,000 is about $1.1 million. The sum is about $1.9 million."));
children.push(...idea("The benefit", "$10.8 million minus $1.9 million is about $9 million each year. That is a decrease of about 80%. The exact value is 83%."));
children.push(...idea("The cost of the project", "$300,000 to $400,000 one time, and about $100,000 each year.", "A quarter of the benefit is about $2.2 million. So the bank recovers the project cost in the first year, also when the real benefit is much smaller."));
children.push(...idea("A second cost scenario", "You also tested other assumptions: the bank loses 40% of a defaulted loan and earns 4% on a good loan. The share of a defaulted loan that the bank loses has the name 'loss given default'. In the main case, it is about 53%: $9,000 of $16,900.", "A missed defaulter then costs about $6,800 and a wrongly declined applicant about $760. That is a cost ratio of about 9 to 1. At this ratio, the thresholds 0.10 and 0.15 cost almost the same, so the model does not change. The benefit is about $7.1 million each year."));
children.push(...idea("Time of the underwriters", "With the three bands, underwriters review only the referral band.", "About 440 applications each year, not 6,000. That saves up to $0.4 million each year. This saving is not in the $9 million."));

// ================================================================= part 3
children.push(h1("Part 3. The talk, slide by slide"));
children.push(p(`The talk has 15 slides and ends at about ${END}. For each slide: the point that the panel must remember, the meaning in plain words, and one probable question with an easy answer.`));
const SLIDES = [
  [1, "Title", "The model predicts defaults and decreases the cost of credit errors by about 80%.",
    "You give your name and the result in one sentence. A credit error is a wrong loan decision. The 80% compares the cost with the model against the cost today.",
    "'80% lower than what?' Lower than today. Today the cost is about $10.8 million each year. With the model it is about $1.9 million."],
  [2, "Key takeaways", "Four numbers: 1 in 5, 62%, 93% and $9 million. Then the recommendation.",
    "This slide is the full talk in 35 seconds. The problem: one in five loans defaulted. The finding: a missing ratio is a warning. The solution: a Random Forest that catches 93% of defaulters. The benefit: about $9 million each year.",
    "'Why is accuracy not sufficient?' A bank that approves all applicants is 80% accurate, and it catches no defaulter."],
  [3, "The problem", "Defaults remove the profit, and the law requires a reason for each decline.",
    "The bank earns interest on loans. Each default removes a part of this profit. Manual decisions are slow and not consistent. The bank wants a model, but the model must be explainable. On the slides, the word for this is 'interpretable'.",
    "'What data did you use?' 5,960 loans that the bank approved, with 12 facts from each application. Section 2.1 has the list. From these 12 facts you made 27 inputs, and 22 stay in the final model."],
  [4, "Approach", "Five steps. You reserved the final test before the data preparation.",
    "Explore the data. Prepare the data. Build the models. Measure them. Recommend. The important point is the sequence: you reserved the test applicants early, so the final result is honest.",
    "'How did you prevent leakage?' Each value in the preparation comes from the training applicants only. No model selection used the test applicants."],
  [5, "Insight 1", "A missing ratio or a missing valuation is the strongest warning: 62% and 94% defaulted.",
    "An empty field is information. The red bars on the chart are the applicants with an empty field. So you gave the model a yes-or-no input for each empty field.",
    "'Is this a real signal?' You cannot prove it from the data. You think that the bank could not check the income of these applicants. So you also tested the model on applicants with a recorded ratio: 81% caught."],
  [6, "Insight 2", "Above a ratio of 45%, almost all applicants defaulted. With one delinquent line, the default rate was more than double.",
    "The left chart shows a sudden step, not a slow increase. The right chart shows that late payments in the past predict a default.",
    "'How many loans are above 45%?' Only 84 of 5,960. But 87% to 100% of them defaulted. So the bank can use this limit to decline an applicant or to refer the applicant to an underwriter."],
  [7, "Insight 3", "A long credit history decreases the risk. Small loans have the highest risk. Occupation has a moderate effect.",
    "Three more facts about the applicant show a difference in risk. The surprise is the loan amount: the smallest loans defaulted most often.",
    "'Why do small loans default most?' The data does not show the reason. 57% of the 194 loans below $5,000 defaulted. The group is small, so the result is uncertain."],
  [8, "Measure of success", "The two credit errors have different costs, so recall is the primary measure.",
    "You assume that a missed defaulter costs about $9,000 and a wrongly declined good applicant about $2,000. The expensive error is the missed defaulter. So the first question for each model is: how many defaulters does it catch? On the slide, the 'principal' is the money that the bank lent, without the interest. The 'guard-rails' are the other measures: precision, F1 and ROC-AUC. A model that flags all applicants has a recall of 100%, but its precision is only 20%. The guard-rails show this problem.",
    "'Where do the costs come from?' They are assumptions. The average defaulted loan is $16,900. You assume that the home recovers about half and that collection adds costs. The finance team must replace them with real data."],
  [9, "Model comparison", "The Random Forest gives the best risk ranking and the lowest cost: $324,000 for each 1,000 applicants.",
    "Your logistic regression cannot follow the sudden steps. One tree flags too many good applicants. The forest is the average of many trees. You selected by cost, without the test applicants, with a rule that you set in advance.",
    "'Why not a simpler model?' The logistic regression costs $550,000 and the tree $607,000, against $324,000 for the forest. The small tree explains the forest with three rules that people can read."],
  [10, "Proposed solution", "200 trees, 22 inputs, threshold 0.15, 93% of defaulters caught, three bands and three rules.",
    "This slide is the specification of the model. On the test applicants it catches 93% of defaulters, and two of every three flagged applicants really defaulted. The three bands are for daily use. The three rules explain the model.",
    "'Is a fully grown forest over-fitted?' No. Each tree memorises its own sample, but the average of 200 trees works on new applicants. The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants."],
  [11, "Threshold", "The threshold of 0.15 decreases the cost of credit errors by half, compared with 0.5.",
    "At 0.5 the model misses 64 defaulters in each 1,000 applicants. At 0.15 it misses 15, but it flags about 90 good applicants, not 28. In dollars, the lower threshold is much cheaper. The title says 'business dial': the bank can change the threshold when its costs change.",
    "'Is 0.15 stable?' Yes. It stays the cheapest when a missed defaulter costs 4.5 to 8 times a wrongly declined applicant. It also stays the cheapest on a finer grid: steps of 0.01 between thresholds, not 0.05. On two other divisions into training and test applicants ('splits'), 0.15 was also the cheapest threshold for the forest with 27 inputs."],
  [12, "Business impact", "About $9 million each year, with stated assumptions.",
    "Today the credit errors cost about $10.8 million each year for 6,000 applications. With the model they cost about $1.9 million. The project costs up to $400,000 one time. So the bank recovers the cost in the first year. 'Gross' on the slide means before the project cost: about $8.9 million each year. After the yearly cost of about $100,000, the benefit is about $8.8 million. In the first year, the bank also pays the one-time cost, so the benefit is about $8.5 million. The slide also assumes that the model works in real use ('in production') as well as on the test applicants.",
    "'How sure is the $9 million?' It is indicative. It depends on the two cost assumptions and on 6,000 applications. With only a quarter of the benefit, the bank still recovers the project cost in the first year."],
  [13, "Recommendations", "Three phases: prepare, shadow run and scale. Three policy rules that the bank can adopt now.",
    "The three policy rules are on the slide. They are not the three rules of the small tree, and they do not need the model. The first rule is a limit of 45% on the debt-to-income ratio. The second rule refers applicants with two or more delinquent credit lines, or two or more derogatory reports, to an underwriter. The third rule treats a missing income or valuation as high risk. In 'prepare', the bank makes the checks mandatory and builds the scoring pipeline: the software that calculates the score for each application. In the shadow run, the model scores each application, but the underwriter decides. In 'scale', the model decides the clear cases automatically, and underwriters decide the referral band.",
    "'Why not use the model now?' The data has only approved loans. The shadow run shows how the model behaves on all applications."],
  [14, "Risks", "Three risks: selection bias, a weaker missing-value signal and fair lending.",
    "First, the data has only approved loans, so the shadow run must score all applications. Second, mandatory checks make the strongest input weaker. But for applicants with a recorded ratio, the model still catches 81% of defaulters. Third, occupation could be a proxy, so compliance tests the model before the start. The slide shows two more risks. Economic drift: the patterns change with time, so the bank monitors the model and trains it again. Over-reliance on the score: underwriters could stop using their own judgement. So the referral band stays, and an underwriter who decides against the score records the reason (a 'documented override').",
    "'Is the model fair?' You could not test this, because the data has no protected characteristic. The compliance team tests it. A model without occupation is ready."],
  [15, "Close", "93% of defaulters caught, three simple rules, about $9 million each year.",
    "You repeat the three results and say 'Thank you'. The slide shows only 'Thank you' and 'Questions and discussion', so you must know these two sentences from memory.",
    "After 'Thank you', wait for the first question. Give the short answer first, and then one number."],
];
SLIDES.forEach(([n, name, point, plain, ask]) => {
  const t = plan.find((x) => x.slide === n);
  children.push(new Paragraph({
    keepNext: true, spacing: { before: 170, after: 70 }, indent: { left: 80 },
    shading: { type: ShadingType.CLEAR, fill: LIGHT, color: "auto" },
    children: [run(`Slide ${n}   ${name}`, { bold: true, size: 24, color: NAVY }), run(`     ${t.target} seconds`, { size: 20, color: GREY })],
  }));
  children.push(labelled("The point.", point));
  children.push(labelled("In plain words.", plain));
  children.push(labelled("If they ask.", ask, false));
});
children.push(gap(60));
children.push(p([run("Slides 16 to 21 are backup slides. ", { bold: true }), run("They are not part of the talk. Use them only for a question. Slide 16 shows all eleven models. Slide 17 shows the importance of the inputs. Slide 18 shows the three rules. Slide 19 shows the data preparation. Slide 20 shows the checks of the method. Slide 21 shows the reasons for three applicants.")]));

children.push(h2("Words on slide 14 and on the backup slides"));
children.push(p("You do not say these words in the talk. Learn them, because the slides show them and the panel can ask."));
[
  ["Gradient boosting", "A technique that builds trees in sequence. Each tree corrects the errors of the tree before it. You did not test it."],
  ["Engineered feature", "A new input that you calculate from other inputs."],
  ["Loan-to-value ratio", "The new loan plus the mortgage balance, divided by the value of the home. A high ratio means less security for the bank."],
  ["Debt-to-income bands", "Groups of the ratio, for example 40% to 45%. With bands, a logistic regression can follow the sudden step. You did not test this."],
  ["Interaction term", "A new input that combines two inputs, so the model sees their combined effect."],
  ["Time-based validation", "You train on older loans and test on newer loans. It needs application dates, and the data has none."],
  ["Permutation importance", "You mix the values of one input at random. A large decrease in ROC-AUC shows an important input."],
  ["Fidelity", "How well the small tree copies the forest: 93%. A rule that flags no applicant agrees with 73%, because the forest flags only 27% of the applicants."],
  ["Seed", "The start number for the random choices of the software. The same seed gives the same result."],
  ["Standard scaling", "It puts all number inputs on the same scale. You used it only for the logistic regression, because trees do not need it."],
  ["Imbalance and resampling", "The data has few defaulters: one in five. This is the 'imbalance'. Resampling copies defaulters or removes good applicants to correct it. You did not resample. The low threshold corrects the imbalance, and you keep each real applicant."],
].forEach(([term, meaning]) => children.push(new Paragraph({ keepLines: true, spacing: { after: 70, line: 268 }, children: [run(`${term}. `, { bold: true, color: NAVY, size: 21 }), run(meaning, { size: 21 })] })));

// ================================================================= part 4
children.push(h1("Part 4. The numbers and where they come from"));
children.push(p("Learn the numbers in the first column exactly. The third column shows you that each number has a simple origin."));
children.push(table(
  ["Number", "What it is", "Where it comes from"],
  [
    ["5,960 loans, 12 attributes", "The data", "The HMEQ data set: loans that the bank approved"],
    ["1 in 5", "The share of loans that defaulted", "1,189 of 5,960 = 19.9%"],
    ["62% and 94%", "Default rate when the ratio or the valuation was missing", "1,267 applicants had no ratio. 112 applicants had no valuation"],
    ["30%", "The test applicants", "1,788 of 5,960. 357 of them defaulted"],
    ["11 models, 4 techniques", "What you built", "Logistic regression, decision tree, bagged trees and Random Forest, with different settings"],
    ["$9,000 and $2,000", "The cost of the two credit errors", "Your assumptions. The ratio is 4.5 to 1"],
    ["$324,000", "Cost of the forest for each 1,000 applicants, in cross-validation", "The lowest of the four techniques"],
    ["200 trees, 22 inputs", "The final forest", "22 of 27 inputs stay after the input reduction"],
    ["0.15", "The threshold", "The cheapest threshold in cross-validation"],
    ["93%", "Recall: defaulters caught", "331 of 357 test defaulters"],
    ["Two of every three (67%)", "Precision", "331 of 491 flagged test applicants"],
    ["0.96", "ROC-AUC: the quality of the risk ranking", "Test applicants. 0.5 is a random guess, 1 is perfect"],
    ["64 and 15", "Missed defaulters in each 1,000 applicants at 0.5 and at 0.15", "Test applicants"],
    ["28 and about 90", "Good applicants flagged in each 1,000 at 0.5 and at 0.15", "Test applicants"],
    ["By half", "The cost at 0.15 against the cost at 0.5", "$310,000 against $635,000 for each 1,000 applicants"],
    ["4.5 to 8 times", "The cost ratios for which 0.15 stays the cheapest", "The stress test"],
    ["$10.8 million", "Cost of credit errors today, each year", "1,200 defaulters multiplied by $9,000"],
    ["$1.9 million", "Cost with the model, each year", "$0.8 million for 90 missed defaulters plus $1.1 million for 540 flagged good applicants"],
    ["About $9 million", "The indicative benefit each year", "$10.8 million minus $1.9 million"],
    ["About 80%", "The decrease of the cost of credit errors", "$1.9 million against $10.8 million. The exact value is 83%"],
    ["$400,000 and $100,000", "The project cost: one time and each year", "Your estimate: $300,000 to $400,000 one time"],
    ["45%", "The limit for the debt-to-income ratio", "Above 45%, 87% to 100% of applicants defaulted"],
    ["81%", "Defaulters caught among applicants with a recorded ratio", "The check for the second risk on slide 14"],
  ],
  [2300, 3330, 3730], [0], 30,
));

// ================================================================= part 5
children.push(h1("Part 5. Easy answers for the questions"));
children.push(p("Give the short answer first. Then give one number. You do not need the exact words: learn the meaning. The presenter guide has longer answers in sections 5 and 6."));
const QA = [
  ["What does your model do?", "It gives each applicant a risk score from 0 to 1. Above 0.15, it flags the applicant. On the test applicants, it caught 93% of the defaulters."],
  ["Why a Random Forest and not a simpler model?", "The risk changes in sudden steps, and trees can follow them. For each 1,000 applicants, the forest costs $324,000 in credit errors. The logistic regression costs $550,000 and the single tree $607,000."],
  ["How does a Random Forest work?", "It is an average of 200 decision trees. Each tree learned from a different random sample of applicants. One tree can be wrong, but the average is stable."],
  ["Why is the threshold 0.15 and not 0.5?", "A missed defaulter costs about 4.5 times a wrongly declined applicant. At 0.5 the model misses 64 defaulters in each 1,000 applicants. At 0.15 it misses 15. The cost of credit errors decreases by half."],
  ["What is the break-even threshold of 0.18?", "It is $2,000 divided by the sum of $9,000 and $2,000. For an applicant with a real 18% chance of default, approval and decline cost the same on average. With perfectly calibrated scores, 0.18 is the cheapest threshold. My scores are too low near the threshold, so the cheapest threshold is a little lower: 0.15."],
  ["Why is recall the primary measure, and not accuracy?", "The expensive error is the missed defaulter, and recall counts the defaulters that the model catches. Accuracy is not useful here: a bank that approves all applicants is 80% accurate."],
  ["How do you know that the model works on new applicants?", "I reserved 30% of the applicants before the data preparation. I tested the final model on them one time. The test cost of $310,000 agrees with the $324,000 from cross-validation."],
  ["What is cross-validation?", "I divide the training applicants into 5 parts. The model learns from 4 parts, and I test it on the fifth part. I do this 3 times with different divisions, so each model gets 15 results. It is a practice examination before the final test."],
  ["Is the model over-fitted?", "No. The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants. The two values are almost equal, and both come from applicants that the model did not learn from."],
  ["Where do the costs of $9,000 and $2,000 come from?", "They are my assumptions. The average defaulted loan is $16,900. I assume that the home recovers about half and that collection adds costs. The $2,000 is the margin that the bank loses on one good loan. I assume a margin of about 3% each year ('three points') on $16,000 to $17,000, for three to four years. The cost to find a replacement customer is also in this number. The finance team must replace the two numbers with real data."],
  ["How sure is the $9 million?", "It is an indicative number with stated assumptions. With a second set of cost assumptions, the benefit is about $7.1 million each year. With only a quarter of the benefit, the bank still recovers the project cost in the first year."],
  ["How do you explain a declined application?", "Three plain rules summarise the model. Rule 1: the ratio is missing. Rule 2: the ratio is above about 44%. Rule 3: the applicant has a delinquent line and a short credit history. Each decline also gets the risk drivers of that applicant."],
  ["Is the model fair?", "I could not test this, because the data has no protected characteristic. No input is a protected characteristic, but occupation could be a proxy. The compliance team tests the model before the start, and a model without occupation is ready."],
  ["Why does the bank not use the model immediately?", "The data has only loans that the bank approved. So the model must first score all applications in a shadow run of one to two months, while the underwriters still decide."],
  ["Your recommendation removes the strongest input. Does the model still work?", "For applicants with a recorded ratio, the model still catches 81% of defaulters. I cannot calculate how much of the $9 million stays. Two thirds of all defaulters have a missing ratio. With the mandatory checks, the bank already treats a missing income or valuation as high risk, without the model. So the checks give a part of the benefit, and the model gives the remainder."],
  ["How many good applicants does the bank lose?", "At 0.15, the model flags about 90 good applicants in each 1,000. That is 11% of the good applicants. The referral band sends the uncertain cases to an underwriter, so the bank does not decline all of them."],
  ["What are the limits of your work?", "The data has only approved loans and no dates, so I could not test the model on later loans. The costs are assumptions. I did not test gradient boosting, and the scores are not perfectly calibrated. Slide 14 shows the further analysis for the data, gradient boosting and calibration."],
];
QA.forEach(([q, a]) => children.push(new Paragraph({ keepLines: true, spacing: { after: 120, line: 272 }, children: [run(`${q} `, { bold: true, color: NAVY }), run(a)] })));
children.push(h2("Three sentences for a difficult moment"));
[
  "When you do not know the answer: 'I did not test this. I would add it to the further analysis.'",
  "When the panel doubts a dollar value: 'This number is indicative. It depends on my two cost assumptions, and the finance team must replace them.'",
  "When you need time: 'That is a good question. Let me think for a moment.' If a backup slide helps the answer, type its slide number and press Enter.",
].forEach((t) => children.push(bullet(t)));

// ================================================================= part 6
children.push(h1("Part 6. Test yourself"));
children.push(p("Hide the answers. Say each answer aloud. Then compare."));
const QUIZ = [
  ["What is a default?", "The applicant stops the payments on the loan."],
  ["How many loans are in the data, and how many defaulted?", "5,960 loans. One in five defaulted (19.9%)."],
  ["What is the debt-to-income ratio?", "The share of the monthly income that pays debts."],
  ["What happened when the ratio was missing?", "62% of those applicants defaulted, against 8.6% with a recorded ratio."],
  ["Why did you reserve test applicants?", "They are the final examination. The model did not see them, so the result is honest."],
  ["What is the risk score?", "A number from 0 to 1. A higher score means a higher risk of default."],
  ["What is the threshold, and what is its value?", "The limit for the score. Above 0.15, the model flags the applicant."],
  ["What is recall, and what is its value?", "The share of defaulters that the model catches: 93% (331 of 357)."],
  ["What is precision, and what is its value?", "The share of flagged applicants who really defaulted: 67%, or two of every three."],
  ["What are the two credit errors, and what do they cost?", "A missed defaulter, about $9,000. A wrongly declined good applicant, about $2,000."],
  ["Why is accuracy a bad primary measure here?", "A bank that approves all applicants is 80% accurate and catches no defaulter."],
  ["What is a Random Forest?", "The average of many decision trees. Here it has 200 trees."],
  ["Why can your logistic regression not follow the data?", "The risk stays low and then increases in a sudden step at a ratio of 45%. The logistic regression has one weight for the ratio, so its score can only change gradually."],
  ["What is cross-validation?", "A check inside the training applicants: 5 parts, and you test the model on each part one time."],
  ["What does ROC-AUC 0.96 mean?", "In 96 of 100 pairs, the model gives the defaulter a higher score than the good applicant."],
  ["What are the three bands?", "Approve at 0.10 or less. Refer to an underwriter from 0.10 to 0.25. Decline above 0.25."],
  ["What are the three rules of the small tree?", "The ratio is missing. The ratio is above about 44%. A delinquent line with a credit history of about 8 years or less."],
  ["What is a shadow run?", "The model scores each application, but the underwriter decides."],
  ["Where does the $9 million come from?", "$10.8 million today minus $1.9 million with the model, for 6,000 applications each year."],
  ["What are the three risks?", "The data has only approved loans. Mandatory checks make the missing-value signal weaker. Occupation could be a proxy for a protected characteristic."],
];
children.push(table(["Question", "Answer"], QUIZ.map(([q, a], i) => [`${i + 1}. ${q}`, a]), [4000, 5360]));

// ================================================================= part 7
children.push(h1("Part 7. How to present"));
children.push(h2("Before the day"));
[
  "Read part 1 and part 2 of this guide until you can explain each idea in your own words.",
  "Learn the speech with the speech sheet: one part on each day, and repeat the parts that you know.",
  `Say the full talk three times with the slides and a stopwatch. The plan is ${END}, and the limit is 8 minutes. If the talk is longer than 7:45, use the rules for a late talk.`,
  "Ask a friend to ask you the questions of part 5. Answer aloud, without the page.",
  "Open the slides in Presenter View and make sure that you can read the notes.",
].forEach((t) => children.push(step(t, "before")));
children.push(h2("During the talk"));
[
  "Speak slowly. Say one sentence. Then stop for a short breath.",
  "Point to the chart or the number when you say it.",
  "Look at the timer when you change the slide. Each note starts with the time for that slide.",
  "If you forget a line, look at the slide or at the notes. Then continue with the next sentence.",
  `Do not speak faster when you are late. If the timer shows more than ${SCRIPT.lateAt(7)} at the start of slide 7, say only the third sentence of slide 7.`,
  `If the timer shows more than ${SCRIPT.lateAt(12)} at the start of slide 12, use the short version of slides 13 and 14. The notes show these rules.`,
].forEach((t) => children.push(step(t, "during")));
children.push(h2("During the questions"));
[
  "Listen to the full question. Wait one second before you answer.",
  "Give the short answer first. Then give one number as evidence.",
  "Say 'I assume' for the costs and 'indicative' for the dollar benefit.",
  "If you do not know the answer, tell the panel. Then tell them how you would find it.",
  "A business question needs a plain answer about money, risk and next steps. An academic question needs the method and the check.",
].forEach((t) => children.push(step(t, "questions")));

const doc = new Document({
  creator: "Saloni Priya",
  title: "Loan Default Prediction - Study Guide",
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ...["before", "during", "questions"].map((ref) => ({ reference: `steps-${ref}`, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] })),
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1150, bottom: 1100, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run("Loan Default Prediction - Study Guide  |  Saloni Priya  |  Page ", { size: 18, color: GREY }),
                 new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GREY })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024).toFixed(0), "KB");
});
