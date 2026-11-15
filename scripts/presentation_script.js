// The spoken script of the live presentation: one source for the speaker notes of the deck and for the presenter guide.
// build_presentation.js and build_presenter_guide.js read it.
//
// The text follows the ASD-STE100 writing rules (Simplified Technical English):
//   - one complete sentence for each line, 20 words or fewer in the timed talk (25 is the hard limit)
//   - active voice, simple tenses, no phrasal verbs, no semicolons, no figures of speech
//   - one term for one concept: "applicant", "defaulter", "credit error", "missing value", "input", "threshold"
// Check a change with the linter of the asd-ste100 skill (scripts/ste-lint.py) before you build the deck.

const WORDS_PER_MINUTE = 125; // calm pace for a talk with many numbers
const SLIDE_CHANGE_SECONDS = 2;

// Slides 1 to 15: the timed talk. "message" is the one point of the slide (used in the timing plan of the guide).
const TALK = [
  { slide: 1, name: "Title", message: "A model that the bank can explain decreases the cost of credit errors by about four fifths", lines: [
    "Good morning. I am Saloni Priya.",
    "My model predicts which home equity loans will default.",
    "It decreases the cost of credit errors, which are wrong loan decisions, by about four fifths.",
  ] },
  { slide: 2, name: "Key takeaways", message: "Problem, key finding, solution, benefit, recommendation", lines: [
    "I start with four key takeaways.",
    "First, one in five loans in the data defaulted.",
    "Second, when the debt-to-income ratio was missing, 62 percent of applicants defaulted.",
    "Third, of eleven models, a Random Forest has the lowest cost of credit errors.",
    "It catches 93 percent of defaulters.",
    "Fourth, the indicative benefit is about nine million dollars each year.",
    "I recommend mandatory income and valuation checks, and then the model after a shadow run.",
  ] },
  { slide: 3, name: "The problem", message: "Defaults remove the profit. Decisions are manual. Each decline needs a reason", lines: [
    "The bank earns interest on these loans, and defaults remove this profit.",
    "Today, manual decisions are slow and inconsistent.",
    "The law requires a specific reason for each declined application.",
    "So the bank wants a model that it can explain.",
    "The data has almost 6,000 recent loans and 12 attributes.",
  ] },
  { slide: 4, name: "Approach", message: "Five steps. I reserved the final test first", lines: [
    "My approach has five steps.",
    "I explored each attribute.",
    "Before all other work, I reserved 30 percent of the applicants for a final test.",
    "I built eleven models with four techniques.",
    "I measured each model by the cost of its credit errors.",
    "Then I wrote the recommendations.",
  ] },
  { slide: 5, name: "Insight 1", message: "A missing ratio or valuation is a warning: 62% and 94% defaulted", lines: [
    "The most important insight is about two missing values.",
    "When the debt-to-income ratio was missing, 62 percent of the applicants defaulted.",
    "When the property valuation was missing, 94 percent defaulted.",
    "So the models record each missing value as a separate input.",
  ] },
  { slide: 6, name: "Insight 2", message: "The default rate jumps above a 45% ratio. Late payments repeat", lines: [
    "The left chart shows the debt-to-income ratio.",
    "Up to 40 percent, few applicants defaulted.",
    "Above 45 percent, almost all defaulted.",
    "The right chart shows delinquent credit lines, which are credit lines with late payments.",
    "One delinquent line more than doubles the default rate.",
    "Each additional line increases the rate again.",
  ] },
  { slide: 7, name: "Insight 3", message: "A long credit history decreases the risk. Small loans have the highest risk", lines: [
    "Three more attributes have an effect.",
    "A long credit history decreases the risk.",
    "Small loans have the highest risk, not the lowest.",
    "Occupation has a moderate effect.",
  ] },
  { slide: 8, name: "Measure of success", message: "A missed defaulter costs 4.5 times a wrong decline, so recall comes first", lines: [
    "The model can make two credit errors, and their costs are different.",
    "A missed defaulter costs the bank about 9,000 dollars.",
    "A wrongly declined good applicant costs about 2,000 dollars.",
    "So the primary measure is the share of defaulters that the model catches, named recall.",
    "The second measure is the share of flagged applicants who really default, named precision.",
  ] },
  { slide: 9, name: "Model comparison", message: "The Random Forest gives the best risk ranking and the lowest cost", lines: [
    "The logistic regression, a weighted sum of the inputs, cannot follow sudden changes in risk.",
    "A single decision tree, a list of yes-or-no questions, flags almost one good applicant for each defaulter caught.",
    "A Random Forest is an average of many decision trees, and it gives the best risk ranking.",
    "I selected the final model by the cost of credit errors on training applicants that the model did not see.",
    "Before the comparison, I set the rule: the lowest cost, or the simplest model when costs are almost equal.",
    "For each 1,000 applicants, the Random Forest costs 324 thousand dollars.",
    "The other techniques cost from 390 to 607 thousand dollars.",
  ] },
  { slide: 10, name: "Proposed solution", message: "22 inputs, a 0.15 threshold, three bands, three rules, 93% of defaulters caught", lines: [
    "I propose a Random Forest of 200 trees.",
    "It gives each applicant a risk score from 0 to 1.",
    "The selection rule removed five weak inputs, so 22 inputs stay.",
    "The model flags an applicant when the score is above 0.15.",
    "This limit is the threshold.",
    "On the test applicants, the model catches 93 percent of the defaulters.",
    "Two of every three flagged applicants really defaulted.",
    "For daily use, I propose three bands: approve, refer to an underwriter, and decline.",
    "A small decision tree copies the forest and agrees with 93 percent of its decisions.",
    "The slide shows its three rules.",
  ] },
  { slide: 11, name: "Threshold", message: "A threshold of 0.15 decreases the cost of credit errors by half against 0.5", lines: [
    "The usual threshold of 0.5 is only a convention.",
    "At 0.5, the model misses 64 defaulters in each 1,000 applicants.",
    "At 0.15, it misses 15.",
    "In exchange, it flags about 90 good applicants, not 28.",
    "In dollars, the cost of credit errors decreases by half.",
    "The threshold of 0.15 stays the cheapest when a missed defaulter costs from 4.5 to 8 times a wrong decline.",
  ] },
  { slide: 12, name: "Business impact", message: "About $9 million each year, with stated assumptions", lines: [
    "For 6,000 applications each year, the cost of credit errors decreases from about 10.8 million to about 1.9 million dollars.",
    "The saving is about nine million dollars each year.",
    "The project costs up to 400 thousand dollars one time, and about 100 thousand each year.",
    "With only a quarter of the benefit, the bank still recovers the cost in the first year.",
    "The finance team should replace my assumptions with real data.",
  ] },
  { slide: 13, name: "Recommendations", message: "Three phases, and three policy rules that the bank can adopt now", lines: [
    "The roadmap has three phases: prepare, shadow run, and scale.",
    "In a shadow run, the model scores each application, but the underwriter decides.",
    "The bank can adopt the three policy rules on this slide now, without the model.",
    "For example, set a limit of 45 percent on the debt-to-income ratio.",
  ] },
  { slide: 14, name: "Risks", message: "Selection bias, a weaker signal, fair lending: each one has a mitigation", lines: [
    "I see three main risks.",
    "First, the data has only loans that the bank approved.",
    "So the shadow run must score all applications.",
    "Second, the missing-value signal will become weaker when verification is mandatory.",
    "For applicants with a recorded ratio, the model still catches 81 percent of defaulters.",
    "Third, no input is a protected characteristic, but occupation could be a proxy for one.",
    "So the compliance team tests approval rates across groups before the start.",
    "A model without occupation is ready.",
  ] },
  { slide: 15, name: "Close", message: "93% of defaulters caught, each decision explained, about $9 million each year", lines: [
    "In summary, the model catches 93 percent of defaulters, and the bank can explain each decision.",
    "The indicative saving is about nine million dollars each year.",
    "Thank you.",
  ] },
];

// Short answers for the question period. They stay in the notes of the closing slide.
const CRIB = [
  ["Why recall, if cost makes the final selection?", [
    "A missed defaulter costs about 4.5 times a wrong decline.",
    "So recall is the primary measure for each model.",
    "The cost of credit errors converts recall and precision to dollars.",
    "So I used this cost for the final selection of the model and the threshold.",
  ]],
  ["Why 0.15 and not 0.5?", [
    "At 0.5, the forest misses 64 defaulters in each 1,000 applicants.",
    "At 0.15, it misses 15.",
    "The threshold of 0.15 is the cheapest for cost ratios from 4.5 to 1 to 8 to 1.",
  ]],
  ["How stable is 0.15?", [
    "It stays the same on a finer grid.",
    "On two other train and test splits, the forest with 27 inputs also selected 0.15.",
    "About 28 percent of applicants with scores from 0.15 to 0.20 defaulted.",
    "That is why the best threshold is a little below the theoretical break-even of 0.18.",
  ]],
  ["Why did you remove five inputs?", [
    "They have about 2 percent of the decision power.",
    "Without them, the cost stays within one standard error.",
    "Fewer inputs are easier to explain and to monitor.",
    "A final check on the same folds compared 22 inputs with all 27 inputs.",
    "It kept the smaller set.",
  ]],
  ["Why not a simpler model?", [
    "At its own best threshold, the decision tree costs 607 thousand dollars for each 1,000 applicants.",
    "The logistic regression costs 550 thousand dollars.",
    "The forest costs 324 thousand dollars.",
    "The small decision tree gives the forest a rule list that people can read.",
  ]],
  ["How do you handle fair lending?", [
    "No input is a protected characteristic.",
    "Occupation and the length of the credit history could be proxies.",
    "So the compliance team tests approval rates and error rates across protected groups.",
    "It does this test before the start, each year, and at each threshold change.",
    "A forest with 16 inputs and no occupation is ready.",
    "It costs about 13 percent more.",
  ]],
  ["What about applicants that the old procedure declined?", [
    "The data has only approved loans.",
    "The shadow run scores all applications.",
    "Reject inference follows after 12 months of results.",
    "Reject inference estimates the results of declined applicants.",
  ]],
  ["Is a fully grown forest over-fitted?", [
    "Each tree fits its own training sample, but the average of 200 trees generalises.",
    "The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants.",
    "The test cost of 310 thousand dollars agrees with the cost of 324 thousand dollars in cross-validation.",
  ]],
  ["What is the source of the 9,000 dollar and 2,000 dollar costs?", [
    "The average defaulted loan is 16,900 dollars.",
    "The collateral recovers about half, and collection adds costs.",
    "So a missed defaulter costs about 9,000 dollars.",
    "With a wrong decline, the bank loses about 2,000 dollars.",
    "That is about three points of net margin on a balance of 16,000 to 17,000 dollars for three to four years.",
    "The cost of a replacement customer is also in this number.",
    "Both numbers are indicative, and the finance team should replace them.",
  ]],
  ["How do the bands change the numbers?", [
    "The headline numbers are for the single threshold of 0.15.",
    "With the bands, the model catches between 88 and 96 percent of defaulters.",
    "The result depends on the decisions of the underwriters for the 7 percent that they review.",
  ]],
];

// Notes for the backup slides. The presenter shows them only when the panel asks.
const BACKUP = {
  16: [
    "Use this slide if the panel asks about the other models.",
    "The table shows all eleven models on the test applicants.",
    "I set the selection rule before the comparison.",
    "The rule takes the lowest mean cost.",
    "Then it takes the simplest model within one standard error.",
    "One standard error is about 10,500 dollars for each 1,000 applicants.",
    "On the input-reduction curve, one standard error is about 9,700 dollars, and the same rule kept 22 inputs.",
    "The ROC-AUC of the proposed model is 0.960 in cross-validation and 0.961 on the test applicants.",
  ],
  17: [
    "Use this slide if the panel asks which inputs are the most important.",
    "The debt-to-income ratio and its missing-value input have one third of the decision power.",
    "With delinquent credit lines and the length of the credit history, the share is about one half.",
    "A second method, permutation importance, puts the same four inputs at the top.",
    "The five inputs that I removed have about 2 percent of the decision power.",
  ],
  18: [
    "Use this slide if the panel asks how the bank explains a decision.",
    "The small decision tree has three rules.",
    "Rule 1: if the debt-to-income ratio is missing, the model flags the applicant.",
    "Rule 2: if the ratio is above about 44 percent, the model flags the applicant.",
    "Rule 3 applies to all other applicants.",
    "The model flags an applicant with a delinquent credit line and a credit history of about 8 years or less.",
    "These rules agree with 93 percent of the decisions of the forest on the test applicants.",
    "A rule that flags nobody agrees with 73 percent.",
  ],
  19: [
    "Use this slide if the panel asks about the data treatment.",
    "I removed no rows, because the data has no duplicates.",
    "I recorded each missing value as a separate input.",
    "Then I replaced the missing value with the median or the mode of the training applicants.",
    "I capped outliers only for the logistic regression, because trees use the rank order of the values.",
    "I reserved the test applicants before I calculated any statistic.",
  ],
  20: [
    "Use this slide if the panel asks about method and rigour.",
    "Each row is one check that protects the result.",
    "The checks are: a test set reserved first, cross-validation, and a rule set before the search.",
    "The next checks are: input reduction with three seeds, a stress test of the threshold, and a paired comparison.",
    "The last checks are: calibration, the fidelity of the small decision tree, and a sub-group check.",
  ],
};

const countWords = (text) => text.trim().split(/\s+/).length;
const clockText = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const roundTo5 = (seconds) => Math.round(seconds / 5) * 5;

// Timing plan: the words of each slide at the calm pace, plus the time to change the slide
function timing() {
  let total = 0;
  return TALK.map((t, i) => {
    const words = t.lines.reduce((a, l) => a + countWords(l), 0);
    const seconds = (words / WORDS_PER_MINUTE) * 60 + (i > 0 ? SLIDE_CHANGE_SECONDS : 0);
    total += seconds;
    return { slide: t.slide, name: t.name, message: t.message, words, target: roundTo5(seconds), clock: roundTo5(total) };
  });
}
const totalWords = () => timing().reduce((a, t) => a + t.words, 0);

// The time cue that starts the notes of a timed slide
function cue(slide) {
  const t = timing().find((x) => x.slide === slide);
  return `[Speak for ${t.target} seconds. Finish at ${clockText(t.clock)} on the clock.]`;
}

// The full text of the speaker notes of one slide
function noteText(slide) {
  const talk = TALK.find((t) => t.slide === slide);
  if (talk) {
    const parts = [cue(slide), ...talk.lines];
    if (slide === 15) {
      parts.push("", "Short answers for the question period:");
      CRIB.forEach(([q, a]) => parts.push(`Q: ${q}`, `A: ${a.join(" ")}`));
    }
    return parts.join("\n");
  }
  if (BACKUP[slide]) return ["[Backup slide. It is not part of the timed talk.]", ...BACKUP[slide]].join("\n");
  throw new Error(`No notes for slide ${slide}`);
}

module.exports = { TALK, CRIB, BACKUP, WORDS_PER_MINUTE, SLIDE_CHANGE_SECONDS, timing, totalWords, cue, noteText, clockText, countWords };

// Run this file directly to print the timing plan and a plain-text copy of the script (for the linter).
if (require.main === module) {
  const plan = timing();
  plan.forEach((t) => console.error(`slide ${String(t.slide).padStart(2)}  ${String(t.words).padStart(3)} words  target ${clockText(t.target)}  clock ${clockText(t.clock)}`));
  console.error(`total ${totalWords()} words`);
  const out = [];
  TALK.forEach((t) => out.push(`## Slide ${t.slide}`, "", t.lines.join("\n\n"), ""));
  out.push("## Questions", "");
  CRIB.forEach(([q, a]) => out.push(q, "", a.join("\n\n"), ""));
  Object.keys(BACKUP).forEach((k) => out.push(`## Slide ${k}`, "", BACKUP[k].join("\n\n"), ""));
  console.log(out.join("\n"));
}
