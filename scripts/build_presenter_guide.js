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
  ["How much does the model save, and how sure are you?", "The indicative benefit is about $9 million each year for 6,000 applications. The cost of credit errors decreases from about $10.8 million to about $1.9 million. The number uses stated assumptions, so the finance team should replace them with real data. With only a quarter of the benefit, the bank still recovers the project cost in the first year."],
  ["Where does the $10.8 million for today come from?", "It is the loss on the defaulters that the bank approves today. The data has only loans that the bank approved, and one in five of them defaulted. So the current procedure missed each of these defaulters. For 6,000 such applications, that is about 1,200 defaulters at $9,000 each. The model is a second check on the applications that the bank approves today."],
  ["Are 6,000 applications and a 20% default rate the real numbers of the bank?", "I do not know the real numbers of the bank. 6,000 is the size of the data, and 20% is the default rate in the data. The data has no dates, so it does not show the number of applications in one year. If the real default rate is lower, the benefit is smaller. I did not calculate this case. The shadow run measures the real rate, and the finance team replaces both numbers."],
  ["Your first recommendation removes the strongest input. How much of the $9 million stays?", "I cannot calculate this from the data. The $9 million is for the loans that the bank approves today, before the mandatory checks. Two thirds of all defaulters have a missing ratio. With mandatory checks, the checks give a part of the benefit, and the model gives the remainder. For applicants with a recorded ratio, the model still catches 81% of defaulters at 78% precision. The bank tests the model on these applicants before the start. With only a quarter of the benefit, the bank still recovers the project cost in the first year."],
  ["What if the loss given default is 40% and the profit on a good loan is 4%?", "I tested this second scenario. A missed defaulter then costs about $6,800, and a wrongly declined applicant costs about $760. The cost ratio is about 9 to 1. The indicative benefit is about $7.1 million each year, against about $8.9 million in the main case. In cross-validation, the thresholds 0.10 and 0.15 cost almost the same: about $164,000 and $165,000 for each 1,000 applicants. So the model and the bands do not change. The bank sets the final threshold with its own loss data."],
  ["How much underwriter time does the model save?", "Today, underwriters review all 6,000 applications. With the bands, they review the referral band: about 440 applications each year. I assume a salary of $62,000, 15% overhead and about 1,000 reviews each year for one underwriter. So one review costs about $71, and the saving is up to $0.4 million each year. The policy rules on slide 13 also refer applicants to an underwriter. I did not count these referrals, so $0.4 million is an upper limit. The $8.9 million does not include this saving."],
  ["What does the project cost?", "The project costs about $300,000 to $400,000 one time. Then it costs about $100,000 each year to operate and monitor the model."],
  ["What should the bank do first?", "Make the income check and the property valuation check mandatory. Set a limit of 45% on the debt-to-income ratio. Refer applicants with two or more delinquent credit lines, or two or more derogatory reports, to an underwriter. These rules do not need a model."],
  ["How many good applicants does the bank lose?", "At the 0.15 threshold, the model flags about 90 good applicants in each 1,000. That is 11% of the good applicants. With the three bands, the bank declines about 64 good applicants in each 1,000 automatically. It refers about 58 good applicants to an underwriter. These two numbers add to 122, which is more than 90. The reason is that the referral band starts at a score of 0.10, below the threshold. So the bands send some good applicants to an underwriter, not to a decline."],
  ["How do you explain a declined application?", "Three plain rules summarise the model. Rule 1: the ratio is missing. Rule 2: the ratio is above about 44%. Rule 3: the applicant has a delinquent credit line and a short credit history. Each decline notice also gives the top risk drivers of that applicant. I calculated these risk drivers as SHAP values for the test applicants (slide 21). The bank puts them into the scoring pipeline in months 0 to 2."],
  ["The small tree says 44% and the policy rule says 45%. Which limit is correct?", "Both describe the same step in the data. The 45% limit is a policy rule from the data exploration. There, 11% of applicants with a ratio from 40% to 45% defaulted, against 87% from 45% to 50%. The 44% is the limit that the small tree learned when it copied the forest. The policy rules do not depend on the model. Where a rule and the score disagree, the stricter result applies."],
  ["Is the model fair?", "I could not test this, because the data has no protected characteristic. The model uses no protected characteristic as an input. Occupation and the length of the credit history could be proxies. So the compliance team tests approval rates and error rates across protected groups before the start. A model without occupation is ready. It costs about 13% more. In cross-validation, it catches 92% of defaulters at 63% precision. I did not score it on the test applicants."],
  ["How can the compliance team test protected groups, if the data has no such field?", "My data has no protected characteristic, so I could not do this test. The compliance team needs the records of the bank for it. For home-secured loans, United States law requires most lenders to record the race, ethnicity and sex of applicants. If the bank has no such records, the team can estimate the groups. I did not check which case applies to this bank."],
  ["What if the economy changes?", "The bank monitors the approval rate each month. It monitors recall and precision when the loan results arrive. It trains the model again at least one time each year."],
  ["Why does the bank not use the model now?", "The data has only loans that the bank approved. First, a shadow run of one to two months scores all applications in parallel with the manual decision."],
  ["What can a shadow run of one to two months show, if loan results need 12 months?", "It cannot show the share of defaulters caught. It shows three things. First, it shows the share of applications in each band, against 69%, 7% and 24% for the test applicants. Second, it shows the applications where the model and the underwriter disagree. Third, it shows the scores of applications that the bank declines today, which my data does not have. The bank measures recall and precision later, when the loan results arrive."],
  ["How did you select the band limits of 0.10 and 0.25?", "They are round numbers near the 0.15 threshold. They are my proposal, not the result of an optimisation. I set them before I examined the test applicants. In cross-validation, the cost of credit errors at these two limits is 12% and 18% above its minimum. In cross-validation, 1% of the applicants in the approve band defaulted, 20% in the referral band and 71% in the decline band. The test applicants give 1%, 21% and 73%. The shadow run adjusts the two limits to the capacity of the underwriters."],
  ["What is the source of the $9,000 and $2,000 costs?", "The average defaulted loan is $16,900. I assume that the collateral recovers about half, and that collection adds costs. So a missed defaulter costs about $9,000. That is a loss given default of about 53%. For a wrongly declined applicant, the bank loses about $2,000. That is about three points of net margin on $16,000 to $17,000 for three to four years. The cost of a replacement customer is also in this number. Both numbers are indicative."],
];
// Academic questions in groups: [group title, [[question, answer], ...]]
const ACADEMIC = [
  ["Model selection and tuning", [
    ["Why did you select a Random Forest and not logistic regression?", "The risk changes in steps, and the attributes combine. Trees can follow both. At its own best threshold, the logistic regression costs $550,000 for each 1,000 applicants. The forest costs $324,000."],
    ["Can a logistic regression with debt-to-income bands follow the step changes?", "Yes, it can. I did not test it. My logistic regression used the ratio as one number, without bands. It costs $550,000 for each 1,000 applicants, against $324,000 for the forest. Debt-to-income bands are in the further analysis on slide 14. With bands, the difference can decrease. This test is important, because a logistic regression needs no separate explanation method. Its coefficients give the reason for each decline directly."],
    ["Why is accuracy not the primary measure?", "Four of five applicants repay. So a model that approves all applicants is 80% accurate and catches no defaulter. The final forest is 91% accurate at the 0.5 threshold and 90% at 0.15. But at 0.15 it misses 15 defaulters in each 1,000 applicants, not 64. The cost of credit errors decreases from $635,000 to $310,000 for each 1,000 applicants."],
    ["Why is recall the primary measure, if you select the final model by cost?", "A missed defaulter costs about 4.5 times a wrongly declined applicant. So recall is the primary measure for each model. The cost of credit errors converts recall and precision to dollars. So I used this cost to select the final model and the threshold."],
    ["How did you tune the models?", "I used grid search with cross-validation on the training applicants, and I scored recall. The logistic regression search tried four regularisation strengths on 5 folds. The decision tree search tried 210 combinations on 5 folds. The Random Forest search tried 72 combinations on 3 folds. Tuning increased the recall of each technique in cross-validation to 0.81 or more, but it decreased precision each time. So a second search scored cost: 15 forest settings on 15 folds. The cost search changed two settings: five class-weight options, which include no weights, and three minimum leaf sizes. The number of trees stayed at 200, and each split tried the default number of inputs. The recall search tried other values for the inputs of each split and for the depth. It kept the defaults for both. So the final forest uses the standard settings, and its improvement comes from the threshold."],
    ["Why does the recall-tuned forest score lower than the standard forest?", "Tuning for recall alone selected larger leaves: at least 10 applicants in each leaf. Larger leaves give less exact scores. The ROC-AUC in cross-validation decreased from 0.954 to 0.921. At its own best threshold, the recall-tuned forest costs about $490,000 for each 1,000 applicants. The proposed forest costs $324,000. That is why I selected the final model by the cost of credit errors, not by recall."],
    ["Why 200 trees? Did you tune this number?", "I did not tune it by cost. The recall search tried 150 and 300 trees, and it kept 300. The cost search used 200 trees for each forest. More trees do not over-fit: they only decrease the random noise of the forest. I measured this noise with three seeds. For the 22-input forest, the costs were $324,000, $319,000 and $321,000 for each 1,000 applicants. That range of about $5,000 is smaller than one standard error. For the input reduction, I used the average of the three seeds."],
    ["Is the cost comparison fair? Only the forest got a cost search.", "The cost search selected the standard forest: no class weights and fully grown trees. So the forest gained nothing from the additional search. The decision tree and the logistic regression used their recall-tuned settings, each at its own cheapest threshold. The differences are large: $550,000 and $607,000 against $324,000. One standard error is about $10,500. A cost-tuned decision tree is a fair additional check. I calculated the cost for seven of the eleven models, with one or more for each technique. I did not calculate it for the plain logistic regression, the two fully grown single trees and the class-weighted bagged trees."],
    ["A fully grown forest fits the training data perfectly. Is it over-fitted?", "Each tree fits its own training sample, but the average of 200 trees generalises. The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants. The test cost of $310,000 agrees with the cost of $324,000 in cross-validation."],
    ["Why did you not resample the data to correct the imbalance?", "Class weights and the threshold correct the imbalance, so I keep every real applicant. For the final model, the threshold alone was sufficient."],
  ]],
  ["Threshold and cost", [
    ["Why is the threshold 0.15, and is it stable with other assumptions?", "It gives the lowest cost of credit errors in cross-validation. It stays the same for cost ratios from 4.5:1 to 8:1 and on a finer grid. On two other train and test splits, 0.15 was also the cheapest threshold for the forest with all 27 inputs."],
    ["What if a missed defaulter costs less than you assume?", "My ratio of 4.5:1 is at the lower edge of the stable range. At 3:1 the best threshold is 0.20, and at 9:1 it is 0.10. I did not test ratios between 3:1 and 4.5:1. The cost curve is flat near the minimum. Thresholds from 0.13 to 0.18 cost at most about $9,000 more for each 1,000 applicants. That is less than one standard error. So the bank sets the final threshold with its own loss data in months 0 to 2."],
    ["How do the bands change the numbers?", "The numbers in the talk are for the single threshold of 0.15. With the bands, the model catches between 88% and 96% of defaulters. The result depends on the decisions of the underwriters for the 7% of applicants that they review."],
  ]],
  ["Validation and leakage", [
    ["How did you prevent data leakage?", "I reserved the test applicants before I fitted any statistic. The medians, modes, caps and scaling come from the training applicants only. No selection used the test applicants. I scored the final model on them one time, after all selections."],
    ["Appendix A shows eleven models on the test applicants. How is that 'scored once'?", "Each model got one test report at the 0.5 threshold when I built it. The balanced logistic regression also got a table of four thresholds on the test applicants, as an illustration. No selection uses those reports. The class weights, the inputs and the threshold all came from cross-validation on the training applicants. The forest also wins there: $324,000 against $390,000, $550,000 and $607,000. I scored the final forest on the test applicants one time, after I set its specification."],
    ["Did you fit the imputation inside each cross-validation fold?", "No. I calculated the medians and modes one time, on all 4,172 training applicants. Then I did the cross-validation inside those applicants. The same is true for the caps and the scaling of the logistic regression. The effect is small, because a median of 4,172 values changes very little without one fold. I also ranked the inputs on all training applicants before the input reduction. This can help the smaller input sets a little. The test applicants are not affected: the test cost of $310,000 agrees with the $324,000 in cross-validation. A pipeline that imputes inside each fold is the cleaner method."],
    ["Did the exploration use the test applicants?", "Yes. The charts on slides 5 to 7 describe all 5,960 loans. I took one decision from them: a missing-value input for each field with missing values. Each fitted statistic and each model selection used the 4,172 training applicants only. The main pattern is the same on the training applicants alone. There, 61.7% of applicants with a missing ratio defaulted, against 62.0% in all the data."],
    ["The test set has only 357 defaulters. How sure is the 93%?", "The model missed 26 of the 357 defaulters. A second estimate agrees: in cross-validation on the 4,172 training applicants, the forest caught 93.7%. The test cost is $310,000 for each 1,000 applicants, with a standard error of about $28,000. That is sufficiently exact to check the model, but not to select between close candidates. So each selection used the 15 cross-validation folds, not the test applicants."],
    ["How do you calculate the standard error?", "It is the standard deviation of the 15 fold costs, $40,675, divided by the square root of 15. The result is about $10,500 for each 1,000 applicants. The 15 folds use the same applicants more than one time, so this value is a little optimistic."],
    ["The paired difference of $6,800 is larger than its standard error of $6,300. Does that break your rule?", "No. The rule uses the fold-to-fold standard error of the cheapest candidate, about $10,500. The difference of $6,800 is inside that value. The paired check is a second look. The difference is about one paired standard error, and a significant difference needs about two. As an average of three seeds, the difference decreases to about $1,100."],
    ["Why did you remove five inputs?", "They have about 2% of the decision power. I used the average of three seeds. With 22 inputs, the cost of credit errors is about $321,000 for each 1,000 applicants. With all 27 inputs, it is about $320,000. The rule keeps the smallest set within one standard error. The slides show $324,000: that is the forest with one seed, against $317,000 for all 27 inputs."],
  ]],
  ["Data and missing values", [
    ["Why did you use median imputation, and why did you keep the missing-value inputs?", "The median is not sensitive to the skew and the outliers. The missing-value input keeps the information that the value was missing. For the ratio and the valuation, that information is the strongest signal in the data."],
    ["Is the missing ratio a real warning sign, or an artefact of the data?", "I cannot prove it from this data. I read a missing ratio as income that the bank could not check. If the bank recorded the missing value after the default, this input would leak the result. So I also report the model on test applicants with a recorded ratio. There it catches 81% of the defaulters at 78% precision, with a ROC-AUC of 0.965. Two thirds of all defaulters are in the missing-ratio group, so the 93% in the talk depends on this input. The 81% is the better guide after verification becomes mandatory, but it is not a forecast. The data has no verified ratio for the applicants with a missing ratio."],
    ["Why do some missing values occur with fewer defaults?", "This is true for derogatory reports, delinquent credit lines, years at job, credit inquiries and occupation. There, 8% to 15% of applicants defaulted when the value was missing, against 20% to 21% with a recorded value. This is probably an effect of how the bank recorded the data. The forest keeps the missing-value inputs of derogatory reports, years at job and occupation, so it learns that direction. The input reduction removed the missing-value inputs of delinquent credit lines and credit inquiries."],
    ["How many loans are behind the 45% limit?", "Only 84 of 5,960: 39 loans with a ratio from 45% to 50%, and 45 loans above 50%. 87% and 100% of them defaulted. The rate is far above the 20% average, so the rule is safe as a signal to decline or refer. But the data has only approved loans. It cannot show the results if the bank approved many applicants above 45%. The shadow run shows only how many applications are above 45%."],
    ["Why do the smallest loans default most often?", "The data does not show the reason. 57% of the 194 loans below $5,000 defaulted, against 25% of the loans from $5,000 to $10,000. This group is only 3% of the data, so the result is uncertain. A small loan against a home can be a sign of financial stress, but I did not test this. The forest uses the loan amount as one of its 22 inputs."],
    ["Did you check the inputs for multicollinearity?", "Yes, with the correlation matrix of the numeric attributes. Only one pair is strong: property value and mortgage balance, at 0.88. I did not calculate variance inflation factors (VIF). For this pair, the two logistic regression coefficients have opposite signs (+0.10 and -0.13). So I do not interpret these two coefficients separately. The correlation does not harm the predictions, and trees are not sensitive to it. So I kept both inputs."],
    ["Why did you not cap outliers for the trees?", "Trees split on the rank order of the values, so extreme values do not distort them. I capped outliers only for the logistic regression."],
    ["What are the limits of the data?", "It has 5,960 loans that the bank approved, and no application dates. So I cannot test the model across time or on declined applicants now. The shadow run and reject inference correct the first limit. A test across time is possible when application dates exist."],
  ]],
  ["Explanation and calibration", [
    ["Why did you fit the small tree to the out-of-fold decisions of the forest?", "A fully grown forest repeats its training labels almost perfectly. The decisions of the forest on its own training applicants would teach the small tree the labels. They would not teach it the behaviour of the forest on new applicants."],
    ["If three rules agree with 93% of the decisions, why does the bank need the forest?", "The rules explain the forest, but they cannot replace it. The 93% includes the applicants that the forest and the rules both clear. A rule that flags no applicant agrees with 73%. I did not score the three rules against the loan results. The rules never flag an applicant with a recorded ratio of 44% or less and no delinquent credit line. On the training applicants, 4.5% of the 2,695 applicants in this group defaulted. That is about 120 of the 832 defaulters, or about 15%. So the rules alone miss 15% of the defaulters or more. The forest misses about 7% on the test applicants."],
    ["Did you calculate the per-applicant risk drivers?", "Yes, as a demonstration. I calculated SHAP values of the final forest for the 1,788 test applicants. For each applicant, the average score plus the contributions of the 22 inputs equals the score. For 66% of the 491 flagged applicants, the largest reason is the missing debt-to-income ratio. Slide 21 shows three examples. Slide 21 also ranks the inputs by their mean absolute contribution, as a share of the total. The missing debt-to-income ratio has 24% of this total. I use absolute values, because positive and negative contributions cancel in a plain mean. The bank puts the calculation into the scoring pipeline in months 0 to 2. It is necessary because the three rules agree with 93% of the decisions of the forest, not with all of them."],
    ["How does SHAP work for a forest?", "A SHAP value is the Shapley value of one input: its average contribution to the score across all orders of the inputs. For trees, the TreeSHAP algorithm calculates it exactly. The contributions of all inputs add up to the difference between the score and the average score. When a value is missing, I add the contribution of the missing-value input and the contribution of the imputed value."],
    ["On slide 21, why do the three reasons not add to the score?", "The table shows only the three largest increases. The other 19 inputs also move the score up or down. For the third applicant, the sum of all 22 contributions is about minus 0.045. So the score is 0.155, which is below the average score of 0.20."],
    ["Why does the model flag an applicant with a score below the average score?", "The model compares the score with the threshold of 0.15, not with the average score. The average score is 0.20 because one in five applicants defaulted. Most applicants have a much lower score: 69% of the test applicants have a score of 0.10 or less. The threshold is low because a missed defaulter costs about 4.5 times a wrongly declined applicant. A score of 0.155 is in the referral band, so an underwriter decides."],
    ["Are the scores calibrated?", "Not perfectly. The Brier score is the mean squared error of the scores. It is 0.063, against 0.160 for a constant base-rate score. So the scores contain real information. But near the threshold the scores are too low: 28% of applicants with scores from 0.15 to 0.20 defaulted. So I read 0.15 as a decision limit, not as a 15% probability. The threshold does not need calibration, because I selected it directly by cost. The ROC-AUC of 0.96 measures the ranking. Calibration is a next step."],
  ]],
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
const SPOKEN = SCRIPT.totalSpokenWords();
const CHANGES = (PLAN.length - 1) * SCRIPT.SLIDE_CHANGE_SECONDS;
const endAt = (pace) => SCRIPT.clockText(Math.round((SPOKEN / pace) * 60 + CHANGES));
children.push(p(`The script in the speaker notes has ${SCRIPT.totalWords()} written words. When you say the numbers in full, it has about ${SPOKEN} spoken words. At a calm pace of ${SCRIPT.WORDS_PER_MINUTE} spoken words each minute, with 2 seconds for each slide change, the talk ends at about ${END}. At a slow pace of 120 spoken words each minute, it ends at about ${endAt(120)}.`));

// ---------------------------------------------------------------- 2. timing plan
children.push(h1("2. Timing plan"));
children.push(table(
  ["Slide", "The one message", "Target", "Timer at the end"],
  PLAN.map((t) => [`${t.slide}. ${t.name}`, t.message, SCRIPT.clockText(t.target), SCRIPT.clockText(t.clock)]),
  [2100, 5360, 800, 1100],
));
children.push(gap());
children.push(
  bullet([bold("Time cue. "), txt("The first line of each speaker note gives the same target and the same timer value.")]),
  bullet([bold("Checkpoints. "), txt(`Look at the timer at the start of slide 7 and at the start of slide 12. The plan is ${clockAt(6)} and ${clockAt(11)}. You are late if the timer shows more than ${SCRIPT.lateAt(7)} or ${SCRIPT.lateAt(12)}.`)]),
  bullet([bold("If you are late at slide 7. "), txt("Say only the third sentence of slide 7.")]),
  bullet([bold("If you are late at slide 12. "), txt("On slide 13, say only the first sentence and the third sentence. On slide 14, say only the sentences that start with First, Second and Third.")]),
  bullet([bold("Reminder in the notes. "), txt("The cues of slides 7, 12, 13 and 14 repeat these rules, so you do not need to remember them.")]),
  bullet([bold("Do not cut. "), txt("Slides 2, 10 and 12 contain the takeaways, the solution and the benefit.")]),
  bullet([bold("Backup slides. "), txt("Slide 16 (Appendix A) shows all eleven models. Slide 17 (Appendix B) shows the importance of the inputs. Slide 18 (Appendix C) shows the three rules. Slide 19 (Appendix D) shows the data treatment. Slide 20 (Appendix E) shows the rigour checks. Slide 21 (Appendix F) shows the reasons for three applicants.")]),
);

// ---------------------------------------------------------------- 3. how to present
children.push(h1("3. How to present"));
children.push(p([bold("Before the session")], 60));
[
  "Open the deck in Presenter View. The notes show one sentence on each line.",
  "Adjust the size of the notes pane and the size of the text. Make sure that you see the full note of slide 10 without the scroll bar.",
  "If the session is online, test Presenter View in the meeting tool. Make sure that the panel sees only the slide. Make sure that you can see your notes.",
  "Read the script aloud with a timer. Do this three times or more.",
  "At each slide change, compare the timer with the time cue.",
  "If the talk is longer than 7:45, apply the two rules for a late talk in section 2.",
  "If the talk is still longer than 7:45, do not say the last sentence of slide 11.",
  "Say the answers in sections 5 and 6 aloud. Use your own words when you know the answer.",
  "Print sections 5 and 6 and the speech sheet. Keep the pages on the desk during the session.",
].forEach((t) => children.push(step(t, "before")));
children.push(p([bold("During the talk")], 60));
[
  "Start the slide show before your turn. When you start to speak, restart the timer in Presenter View.",
  "If the session is not in the morning, say 'Good afternoon' or 'Good evening'.",
  "Say one sentence. Then stop for a short breath.",
  "Point to the chart or the number when you say it. On slide 9, point to the cost line below the chart. On slide 11, point to the two cards on the right.",
  "Look at the timer and the time cue each time you change the slide.",
  "After 'Thank you', keep slide 15 on the screen. Its note has short answers, but the note is long. Use the paper copy of sections 5 and 6 first.",
].forEach((t) => children.push(step(t, "during")));
children.push(p([bold("During the questions")], 60));
[
  "Give the short answer first. Then give one number as evidence.",
  "Show a backup slide only if it helps the answer. To show it, type its slide number. Then press Enter.",
  "To go back to the short answers, type 15. Then press Enter. Test these keys before the session.",
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
    ["4.5 times", "'four and a half times'"],
    ["ROC-AUC 0.96", "'R-O-C, A-U-C of zero point nine six'. In plain words: the quality of the risk ranking"],
    ["0.960, 0.961", "'zero point nine six zero', 'zero point nine six one'"],
    ["Indicative", "'in-DIK-a-tiv'"],
    ["F1", "'F one'"],
    ["ECOA", "'the Equal Credit Opportunity Act'"],
    ["HMEQ", "'the home equity data'"],
    ["Debt-to-income ratio", "Say the full name one time on each slide. Then say 'the ratio'"],
    ["Delinquent, derogatory, surrogate", "'de-LIN-kwent', 'de-ROG-a-tory', 'SUR-o-git'"],
    ["SHAP, Shapley, TreeSHAP", "'shap' as one word (it means Shapley additive explanations), 'SHAP-lee', 'tree shap'. In plain words: the reasons for the score of one applicant"],
  ],
  [2700, 6660],
));

// ---------------------------------------------------------------- 4. concepts
children.push(h1("4. Concepts in plain words"));
children.push(p("Use the middle column with a business audience. Use the right column if the expert asks."));
children.push(table(
  ["Term", "Plain words", "If the expert asks"],
  [
    ["Confusion matrix", "A table that counts the four results: defaulters caught, defaulters missed, good applicants flagged and good applicants approved", "Test applicants (1,788) at 0.15: 331 true positives (defaulters caught), 26 false negatives (defaulters missed), 160 false positives (good applicants flagged), 1,271 true negatives. False positive rate: 160 of 1,431 good applicants, 11%"],
    ["Recall", "Of the applicants who defaulted later, the share that the model flagged", "True positives divided by all actual defaulters. This model: 92.7% on the test applicants"],
    ["Precision", "Of the applicants that the model flagged, the share who really defaulted", "True positives divided by all flagged applicants. This model: 67.4%"],
    ["Accuracy", "Of all decisions, the share that is correct", "It misleads when one in five applicants defaults. A model that approves all applicants is 80% accurate and catches no defaulter. This model: 90% at 0.15, against 91% at 0.5"],
    ["F1", "One number that balances recall and precision", "The harmonic mean of recall and precision. This model: 0.78"],
    ["ROC-AUC", "How well the model ranks applicants by risk", "The chance that a random defaulter gets a higher score than a random good applicant. A value of 0.5 is a random guess. This model: 0.96"],
    ["Threshold", "The score above which the model flags an applicant", "The value 0.5 is a convention. I selected 0.15 by the cost of credit errors"],
    ["Expected cost (cost of credit errors)", "The dollar cost of the wrong decisions of the model", "Missed defaulters times $9,000, plus wrongly declined applicants times $2,000, for each 1,000 applicants"],
    ["Loss given default (LGD)", "The share of a defaulted loan that the bank does not recover", "Main case: about 53%, which is $9,000 of the $16,900 average defaulted loan, with collection costs. Second scenario: 40%"],
    ["Decision tree", "A list of yes-or-no questions that ends in a decision", "People can read it, but it is unstable: small changes in the data change the tree"],
    ["Gini impurity (how a tree selects a question)", "How mixed a group is. It is 0 when all applicants in the group have the same result", "At each step, the tree tests the inputs and their cut-off values. It selects the question that gives the two least mixed groups. The formula is 1 minus the sum of the squared class shares. The search for the decision tree tried the Gini measure and entropy, and it kept Gini. The forest also uses Gini. The importance of an input is the total decrease in impurity from its questions, as an average of the 200 trees"],
    ["Bagging", "Many trees, each trained on a random resample of the data. The model uses their average", "The average decreases the instability (the variance) of a single tree"],
    ["Random Forest", "Bagging, but each question can use only a random few of the inputs", "Each split tries 4 of the 22 inputs. The trees are more different, so their average is more stable"],
    ["Logistic regression", "A weighted sum of the inputs, which the model converts to a probability", "It is transparent, but its decision boundary is a straight line. With the ratio as one number, it cannot follow sudden changes such as the increase in defaults above a 45% ratio"],
    ["Regularisation", "A penalty on large weights, which keeps the logistic regression simple", "The penalty type is L2, the library default. The search tried four strengths (C = 0.01, 0.1, 1 and 10). A smaller C is a stronger penalty. It kept C = 1, with a recall of 0.814 in cross-validation"],
    ["Class weights", "During training, an error on a defaulter counts more", "At the 0.5 threshold, they increased recall for the logistic regression (57% to 80%) and the forest (69% to 77%). They decreased recall for the fully grown single tree (69% to 62%) and the bagged trees (68% to 60%). A fully grown tree fits each training applicant with or without weights. They add nothing after I select the threshold by cost"],
    ["Test set (test applicants)", "30% of the applicants, which no selection used", "Stratified 70/30 split. I reserved it before I fitted any statistic. I scored the final model on it one time, after all selections"],
    ["Stratified split", "The training part and the test part have the same share of defaulters", "832 of the 4,172 training applicants and 357 of the 1,788 test applicants defaulted: 20% in each part"],
    ["Cross-validation, out-of-fold", "Each training applicant gets a score from a model that did not see that applicant", "5 folds, repeated 3 times: 15 validation folds for each candidate"],
    ["Data leakage", "Information from the test applicants that reaches the training step", "Prevented: the medians, the caps and the scaling come from the training applicants only"],
    ["Missing-value input (the slides say 'missing-value flag')", "A 0/1 input that records where a value was missing", "Then I replace the missing value with the training median or mode. The missing-value input keeps the signal"],
    ["One-hot encoding", "One 0/1 input for each category of occupation and loan purpose", "I remove the first category of each attribute, because the other indicators already identify it. The final forest has five occupation indicators and one loan-purpose indicator"],
    ["One-standard-error rule", "A difference smaller than the noise is a tie, and the simpler model wins", "One standard error is about $10,500 for each 1,000 applicants: the standard deviation of the 15 fold costs divided by the square root of 15"],
    ["Over-fitting", "The model memorises the training applicants and does worse on new applicants", "Example: the standard decision tree has 100% recall on the training applicants. Its ROC-AUC on the test applicants is only 0.81. A fully grown forest also has 100% recall on the training applicants. But its ROC-AUC is 0.96 in cross-validation and on the test applicants. So I judge each model on test and cross-validation results only"],
    ["Surrogate tree", "A small tree that I trained to copy the decisions of the forest", "I fitted it to the out-of-fold decisions of the forest. It agrees with 93% of the test decisions of the forest (93.2%). This is not the share of defaulters caught (92.7%). I did not score the three rules as a separate model"],
    ["Risk drivers (SHAP values)", "For one applicant, how much each input moved the score up or down", "I calculated them for the 1,788 test applicants (slide 21). The average score of 0.20 plus the contributions of the 22 inputs equals the score. The bank puts them into the scoring pipeline in months 0 to 2. Then each decline notice gives its specific reasons"],
    ["Calibration", "Whether a score of 0.15 really means a 15% chance of default", "Near the threshold the scores are too low: 28% of applicants with scores of 0.15 to 0.20 defaulted"],
    ["Brier score", "The average squared difference between the score and the result (1 or 0). Lower is better", "0.063 for the forest and 0.160 for the base rate. It measures the accuracy of the scores, not the ranking"],
    ["Feature importance", "How much the forest uses each input", "The share of the decision power (impurity-based). I checked it with permutation importance: the decrease in ROC-AUC when I shuffle the values of one input"],
    ["Reject inference", "An estimate of the loan results of declined applicants", "It is necessary because the data has only loans that the bank approved"],
    ["Gradient boosting", "Trees that the model builds in sequence. Each tree corrects the errors of the tree before it", "The next technique to test. This project did not test it"],
  ],
  [2000, 3560, 3800],
));

// ---------------------------------------------------------------- 5. business questions
children.push(h1("5. Likely business questions"));
BUSINESS.forEach(([q, a]) => children.push(qa(q, a)));

// ---------------------------------------------------------------- 6. academic questions
children.push(h1("6. Likely academic questions"));
ACADEMIC.forEach(([group, items]) => {
  children.push(new Paragraph({ keepNext: true, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: group, font: FONT, bold: true, size: 23, color: NAVY })] }));
  items.forEach(([q, a]) => children.push(qa(q, a)));
});

// ---------------------------------------------------------------- 7. the script
children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, keepNext: true, spacing: { before: 0, after: 140 }, children: [new TextRun({ text: "7. The script", font: FONT, bold: true, size: 28, color: NAVY })] }));
children.push(p("This is the text of the speaker notes. Each line is one sentence. The cue gives the target time and the timer value at the end of the slide. The speech sheet (Loan_Default_Prediction_Speech.pdf) has the same words in large print, with the words to stress and the pauses."));
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
