// The spoken script of the live presentation: one source for the speaker notes of the deck and for the presenter guide.
// build_presentation.js and build_presenter_guide.js read it.
//
// The text follows the ASD-STE100 writing rules (Simplified Technical English):
//   - one complete sentence for each line, 20 words or fewer in the timed talk (25 is the hard limit)
//   - active voice, simple tenses, no phrasal verbs, no semicolons, no figures of speech
//   - one term for one concept: "applicant", "defaulter", "credit error", "missing value", "input", "threshold"
// Check a change with the linter of the asd-ste100 skill (scripts/ste-lint.py) before you build the deck.

const WORDS_PER_MINUTE = 130; // calm pace, counted in spoken words
const SLIDE_CHANGE_SECONDS = 2;

// Slides 1 to 15: the timed talk. "message" is the one point of the slide (used in the timing plan of the guide).
const TALK = [
  { slide: 1, name: "Title", message: "The model decreases the cost of credit errors by about 80%", lines: [
    "Good morning. I am Saloni Priya.",
    "My model predicts which home equity loans will default.",
    "It decreases the cost of credit errors, which are wrong loan decisions, by about 80 percent.",
  ] },
  { slide: 2, name: "Key takeaways", message: "Problem, key finding, solution, benefit, recommendation", lines: [
    "I start with four key takeaways.",
    "First, one in five loans in the data defaulted.",
    "Second, when the debt-to-income ratio was missing, 62 percent of applicants defaulted.",
    "Third, among eleven models, a Random Forest has the lowest cost of credit errors.",
    "It catches 93 percent of defaulters.",
    "Fourth, the indicative benefit is about nine million dollars each year.",
    "I recommend mandatory income and valuation checks, and then the model after a shadow run.",
  ] },
  { slide: 3, name: "The problem", message: "Defaults remove the profit. Each decline needs a reason", lines: [
    "The bank earns interest on these loans, and defaults remove this profit.",
    "Today, manual decisions are slow and inconsistent.",
    "The law requires a specific reason for each declined application.",
    "So the bank wants a model that it can explain.",
  ] },
  { slide: 4, name: "Approach", message: "Five steps. I reserved the final test first", lines: [
    "My approach has five steps.",
    "I explored each attribute.",
    "Before all other work, I reserved 30 percent of the applicants for a final test.",
    "I built eleven models with four techniques.",
    "I measured the share of defaulters that each model catches, and then the cost of credit errors.",
  ] },
  { slide: 5, name: "Insight 1", message: "A missing ratio or valuation is a warning: 62% and 94% defaulted", lines: [
    "The most important insight is about two missing values.",
    "When the debt-to-income ratio was missing, 62 percent of the applicants defaulted.",
    "When the property valuation was missing, 94 percent defaulted.",
    "So I recorded each missing value as a separate input.",
  ] },
  { slide: 6, name: "Insight 2", message: "The default rate jumps above a 45% ratio. Late payments repeat", lines: [
    "The left chart shows the debt-to-income ratio.",
    "Up to 40 percent, few applicants defaulted.",
    "Above 45 percent, almost all defaulted.",
    "The right chart shows delinquent credit lines, which are credit lines with late payments.",
    "One delinquent line more than doubles the default rate.",
  ] },
  { slide: 7, name: "Insight 3", message: "Long credit history: lower risk. Small loans: highest risk", lines: [
    "Three more attributes have an effect.",
    "A long credit history decreases the risk.",
    "Small loans have the highest risk, not the lowest.",
    "Occupation has a moderate effect.",
  ] },
  { slide: 8, name: "Measure of success", message: "A missed defaulter costs 4.5 times more, so recall comes first", lines: [
    "The model can make two credit errors, and their costs are different.",
    "A missed defaulter costs the bank about 9,000 dollars.",
    "A wrongly declined good applicant costs about 2,000 dollars.",
    "So the primary measure is the share of defaulters that the model catches, named recall.",
    "The second measure is the share of flagged applicants who really default, named precision.",
  ] },
  { slide: 9, name: "Model comparison", message: "The Random Forest gives the best risk ranking and the lowest cost", lines: [
    "The logistic regression cannot follow sudden changes in risk.",
    "A single decision tree flags almost one good applicant for each defaulter that it catches.",
    "A Random Forest is an average of many decision trees, and it gives the best risk ranking.",
    "I selected the final model by the cost of credit errors on training applicants that the model did not see.",
    "Before the comparison, I set the selection rule.",
    "It selects the lowest cost, or the simplest model when costs are almost equal.",
    "With the Random Forest, credit errors cost the least: 324 thousand dollars for each 1,000 applicants.",
  ] },
  { slide: 10, name: "Proposed solution", message: "22 inputs, threshold 0.15, three bands, three rules, 93% caught", lines: [
    "I propose a Random Forest of 200 trees.",
    "It gives each applicant a risk score from 0 to 1.",
    "The selection rule removed five weak inputs, so 22 inputs stay.",
    "The model flags an applicant when the score is above 0.15.",
    "This value is the threshold.",
    "On the test applicants, the model catches 93 percent of the defaulters.",
    "Two of every three flagged applicants really defaulted.",
    "For daily use, I propose three bands: approve, refer to an underwriter, and decline.",
    "A small decision tree copies the forest and agrees with 93 percent of its decisions.",
    "The slide shows its three rules.",
  ] },
  { slide: 11, name: "Threshold", message: "Threshold 0.15 decreases the cost of credit errors by half", lines: [
    "The usual threshold of 0.5 is only a convention.",
    "At 0.5, the model misses 64 defaulters in each 1,000 applicants.",
    "At 0.15, it misses 15.",
    "In exchange, it flags about 90 good applicants, not 28.",
    "In dollars, the cost of credit errors decreases by half.",
    "The proposed threshold stays the cheapest when a missed defaulter costs 4.5 to 8 times a wrongly declined applicant.",
  ] },
  { slide: 12, name: "Business impact", message: "About $9 million each year, with stated assumptions", lines: [
    "Today, credit errors cost about 10.8 million dollars each year for 6,000 applications.",
    "With the model, they cost about 1.9 million dollars.",
    "The indicative benefit is about nine million dollars each year.",
    "The project costs up to 400 thousand dollars one time, and about 100 thousand each year.",
    "With only a quarter of the benefit, the bank still recovers the project cost in the first year.",
    "The finance team should replace my assumptions with real data.",
  ] },
  { slide: 13, name: "Recommendations", message: "Three phases, and policy rules that the bank can adopt now", lines: [
    "The roadmap has three phases: prepare, shadow run, and scale.",
    "In a shadow run, the model scores each application, but the underwriter decides.",
    "The bank can adopt the policy rules on this slide now, without the model.",
    "For example, limit the debt-to-income ratio to 45 percent.",
  ] },
  { slide: 14, name: "Risks", message: "Selection bias, weaker missing-value effect, fair lending", lines: [
    "First, the data has only loans that the bank approved.",
    "So the shadow run must score all applications.",
    "Second, mandatory checks will weaken the effect of missing values.",
    "For applicants with a recorded debt-to-income ratio, the model still catches 81 percent of defaulters.",
    "Third, no input is a protected characteristic, but occupation could be a proxy for one.",
    "So the compliance team tests approval rates across protected groups before the start.",
    "A model without occupation is ready.",
  ] },
  { slide: 15, name: "Close", message: "93% caught, each decision explained, about $9 million each year", lines: [
    "In summary, the model catches 93 percent of defaulters, and the bank can explain each decision.",
    "The indicative benefit is about nine million dollars each year.",
    "Thank you.",
  ] },
];

// Short answers for the question period. They stay in the notes of the closing slide.
const CRIB = [
  ["Why is recall the primary measure, if you select the final model by cost?", [
    "A missed defaulter costs about 4.5 times a wrongly declined applicant.",
    "So recall is the primary measure for each model.",
    "The cost of credit errors converts recall and precision to dollars.",
    "So I used this cost to select the final model and the threshold.",
  ]],
  ["Why is the threshold 0.15 and not 0.5?", [
    "At 0.5, the forest misses 64 defaulters in each 1,000 applicants.",
    "At 0.15, it misses 15.",
    "This threshold stays the cheapest when a missed defaulter costs 4.5 to 8 times a wrongly declined applicant.",
  ]],
  ["How stable is 0.15?", [
    "It stays the same on a finer grid.",
    "On two other train and test splits, 0.15 was also the cheapest threshold for the forest with 27 inputs.",
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
  ["Why did you not select a simpler model?", [
    "With the decision tree at its own best threshold, credit errors cost 607 thousand dollars for each 1,000 applicants.",
    "With the logistic regression, they cost 550 thousand dollars.",
    "With the forest, they cost 324 thousand dollars.",
    "The small decision tree gives the forest a rule list that people can read.",
  ]],
  ["How do you handle fair lending?", [
    "No input is a protected characteristic.",
    "Occupation and the length of the credit history could be proxies.",
    "So the compliance team tests approval rates and error rates across protected groups.",
    "It tests these rates before the start, each year, and when the threshold changes.",
    "A forest with 16 inputs and no occupation is ready.",
    "Its cost of credit errors is about 13 percent higher.",
  ]],
  ["What is your plan for applicants that the current procedure declined?", [
    "The data has only loans that the bank approved.",
    "The shadow run scores all applications.",
    "Reject inference estimates the loan results of declined applicants.",
    "It needs 12 months of loan results.",
  ]],
  ["Is a fully grown forest over-fitted?", [
    "Each tree fits its own training sample, but the average of 200 trees generalises.",
    "The ROC-AUC is 0.960 in cross-validation and 0.961 on the test applicants.",
    "The test cost of 310 thousand dollars agrees with the cost of 324 thousand dollars in cross-validation.",
  ]],
  ["What is the source of the 9,000 dollar and 2,000 dollar costs?", [
    "The average defaulted loan is 16,900 dollars.",
    "I assume that the collateral recovers about half, and that collection adds costs.",
    "So a missed defaulter costs about 9,000 dollars.",
    "For a wrongly declined applicant, the bank loses about 2,000 dollars.",
    "That is about three points of net margin on a balance of 16,000 to 17,000 dollars for three to four years.",
    "The cost of a replacement customer is also in this number.",
    "Both numbers are indicative, and the finance team should replace them.",
  ]],
  ["How do the bands change the numbers?", [
    "The numbers in the talk are for the single threshold of 0.15.",
    "With the bands, the model catches between 88 and 96 percent of defaulters.",
    "The result depends on the decisions of the underwriters for the 7 percent that they review.",
  ]],
];

// Notes for the backup slides. The presenter shows them only when the panel asks.
const BACKUP_USE = {
  16: "about the other models",
  17: "which inputs are the most important",
  18: "how the bank explains a decision",
  19: "about the data treatment",
  20: "about method and rigour",
};
const BACKUP = {
  16: [
    "The table shows all eleven models on the test applicants.",
    "I set the selection rule before the comparison.",
    "The rule finds the lowest mean cost.",
    "Then it selects the simplest model within one standard error of this cost.",
    "One standard error is about 10,500 dollars for each 1,000 applicants.",
    "On the input-reduction curve, one standard error is about 9,700 dollars, and the same rule kept 22 inputs.",
    "The ROC-AUC of the proposed model is 0.960 in cross-validation and 0.961 on the test applicants.",
  ],
  17: [
    "The debt-to-income ratio and its missing-value input have about one third of the decision power.",
    "With delinquent credit lines and the length of the credit history, the share is about one half.",
    "A second method, permutation importance, puts the same four inputs at the top.",
    "The five inputs that I removed have about 2 percent of the decision power.",
  ],
  18: [
    "The small decision tree has three rules.",
    "Rule 1: if the debt-to-income ratio is missing, the tree flags the applicant.",
    "Rule 2: if the ratio is above about 44 percent, the tree flags the applicant.",
    "Rule 3 applies to all other applicants.",
    "The tree flags an applicant with a delinquent credit line and a credit history of about 8 years or less.",
    "These rules agree with 93 percent of the decisions of the forest on the test applicants.",
    "If a rule flags no applicant, it agrees with 73 percent of the decisions.",
  ],
  19: [
    "The data has no duplicates, and I removed no rows.",
    "I recorded each missing value as a separate input.",
    "Then I replaced the missing value with the median or the mode of the training applicants.",
    "I capped outliers only for the logistic regression, because trees use the rank order of the values.",
    "I reserved the test applicants before I calculated the medians, the caps or the scaling.",
  ],
  20: [
    "Each row is one check that protects the result.",
    "The checks are: test applicants that I reserved first, cross-validation, and a selection rule that I set before the comparison.",
    "The next checks are: input reduction with three seeds, a stress test of the threshold, and a paired comparison.",
    "The last checks are: calibration, the fidelity of the small decision tree, and a sub-group check.",
  ],
};

const countWords = (text) => text.trim().split(/\s+/).length;

// Words as the presenter says them. A number is longer when spoken: "0.15" is "zero point one five", "324" is
// "three hundred twenty-four". A hyphenated term counts one word for each part.
function integerWords(n) {
  if (n < 20) return 1;
  if (n < 100) return n % 10 ? 2 : 1;
  if (n < 1000) return 2 + (n % 100 ? integerWords(n % 100) : 0);
  return integerWords(Math.floor(n / 1000)) + 1 + (n % 1000 ? integerWords(n % 1000) : 0);
}
function spokenWords(text) {
  return text.trim().split(/\s+/).reduce((sum, raw) => {
    const token = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
    if (!token) return sum;
    const number = token.match(/^(\d[\d,]*)(?:\.(\d+))?$/);
    if (number) return sum + integerWords(parseInt(number[1].replace(/,/g, ""), 10)) + (number[2] ? 1 + number[2].length : 0);
    return sum + token.split("-").filter(Boolean).length;
  }, 0);
}
const clockText = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const roundTo5 = (seconds) => Math.round(seconds / 5) * 5;

// Timing plan: the spoken words of each slide at the calm pace, plus the time to change the slide.
// "clock" is the timer value at the end of the slide. "target" is the difference between two timer values,
// so the targets always add up to the timer value.
function timing() {
  let total = 0;
  let previous = 0;
  return TALK.map((t, i) => {
    const words = t.lines.reduce((a, l) => a + countWords(l), 0);
    const spoken = t.lines.reduce((a, l) => a + spokenWords(l), 0);
    total += (spoken / WORDS_PER_MINUTE) * 60 + (i > 0 ? SLIDE_CHANGE_SECONDS : 0);
    const clock = roundTo5(total);
    const target = clock - previous;
    previous = clock;
    return { slide: t.slide, name: t.name, message: t.message, words, spoken, target, clock };
  });
}
const totalWords = () => timing().reduce((a, t) => a + t.words, 0);
const totalSpokenWords = () => timing().reduce((a, t) => a + t.spoken, 0);

// The time cue that starts the notes of a timed slide
function cue(slide) {
  const t = timing().find((x) => x.slide === slide);
  return `[Speak for ${t.target} seconds. Finish at ${clockText(t.clock)} on the timer.]`;
}

// The full text of the speaker notes of one slide
function noteText(slide) {
  const talk = TALK.find((t) => t.slide === slide);
  if (talk) {
    const parts = [cue(slide), ...talk.lines];
    if (slide === 15) {
      parts.push("", "[The talk ends here. The text below gives short answers for the question period.]");
      CRIB.forEach(([q, a]) => parts.push(`Q: ${q}`, `A: ${a.join(" ")}`));
    }
    return parts.join("\n");
  }
  if (BACKUP[slide]) return [`[This is a backup slide. It is not part of the timed talk. Use it if the panel asks ${BACKUP_USE[slide]}.]`, ...BACKUP[slide]].join("\n");
  throw new Error(`No notes for slide ${slide}`);
}

module.exports = { TALK, CRIB, BACKUP, WORDS_PER_MINUTE, SLIDE_CHANGE_SECONDS, timing, totalWords, totalSpokenWords, cue, noteText, clockText, countWords, spokenWords };

// Run this file directly to print the timing plan and a plain-text copy of the script (for the linter).
if (require.main === module) {
  const plan = timing();
  plan.forEach((t) => console.error(`slide ${String(t.slide).padStart(2)}  ${String(t.words).padStart(3)} written  ${String(t.spoken).padStart(3)} spoken  target ${clockText(t.target)}  timer ${clockText(t.clock)}`));
  console.error(`total ${totalWords()} written words, ${totalSpokenWords()} spoken words`);
  const out = [];
  TALK.forEach((t) => out.push(`## Slide ${t.slide}`, "", t.lines.join("\n\n"), ""));
  out.push("## Questions", "");
  CRIB.forEach(([q, a]) => out.push(q, "", a.join("\n\n"), ""));
  Object.keys(BACKUP).forEach((k) => out.push(`## Slide ${k}`, "", BACKUP[k].join("\n\n"), ""));
  console.log(out.join("\n"));
}
