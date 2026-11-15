// Builds presentation/Loan_Default_Prediction_Speech.docx: the speech of the live presentation in large print.
// The words come from presentation_script.js, so they are the same as the speaker notes of the deck and the script
// in the presenter guide. This file adds only the delivery marks: the words to stress, the pauses, where to point,
// and a memory card. The build stops if a mark does not match the words of the script.
// It is for the presenter only and is not a submission file.
// Run from the repository root:  node scripts/build_speech.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber, TabStopType, Tab,
} = require("docx");

const SCRIPT = require("./presentation_script");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "presentation", "Loan_Default_Prediction_Speech.docx");

const NAVY = "1E2761";
const GREY = "595959";
const LIGHT = "E8EEF7";
const FONT = "Calibri";
const WIDTH = 9360; // text width of a US Letter page with 1-inch margins, in twentieths of a point

// ---------- delivery marks ----------
// The words to stress in each slide. Each phrase must be in exactly one line of that slide.
const STRESS = {
  1: ["Saloni Priya", "about 80 percent"],
  2: ["four key takeaways", "one in five", "62 percent", "lowest cost", "93 percent", "nine million dollars", "after a shadow run"],
  3: ["remove this profit", "slow and inconsistent", "specific reason", "can explain"],
  4: ["five steps", "30 percent", "eleven models", "cost of credit errors"],
  5: ["two missing values", "62 percent", "94 percent", "separate input"],
  6: ["Up to 40 percent", "Above 45 percent", "more than doubles"],
  7: ["decreases the risk", "highest risk", "moderate"],
  8: ["their costs are different", "9,000 dollars", "2,000 dollars", "recall", "precision"],
  9: ["sudden changes", "almost one good applicant", "best risk ranking", "did not see", "Before the comparison", "cost the least"],
  10: ["200 trees", "22 inputs", "above 0.15", "93 percent of the defaulters", "Two of every three", "three bands", "three rules"],
  11: ["only a convention", "64 defaulters", "it misses 15", "not 28", "by half", "stays the cheapest"],
  12: ["10.8 million dollars", "1.9 million dollars", "nine million dollars", "a quarter of the benefit", "real data"],
  13: ["three phases", "the underwriter decides", "now, without the model", "45 percent"],
  14: ["First", "all applications", "Second", "81 percent", "Third", "before the start", "is ready"],
  15: ["93 percent", "three simple rules", "nine million dollars"],
};

// A longer breath after these lines. Each entry is the start of one line of that slide.
const PAUSE_AFTER = {
  1: ["It decreases the cost of credit errors"],
  2: ["Fourth, the indicative benefit"],
  5: ["When the property valuation was missing"],
  8: ["A wrongly declined good applicant"],
  10: ["On the test applicants, the model catches"],
  11: ["In dollars, the cost of credit errors"],
  12: ["The indicative benefit is about nine million"],
  14: ["So the shadow run must score"],
  15: ["The indicative benefit is about nine million"],
};
const PAUSE_SECONDS = 1;

// Where to point. Each entry: the start of one line of that slide, then the part of the slide.
const POINT = {
  6: [["The left chart shows", "the left chart"], ["The right chart shows", "the right chart"]],
  9: [["With the Random Forest, credit errors cost", "the cost line below the chart"]],
  10: [["The slide shows its three rules", "the three rules"]],
  11: [["At 0.5, the model misses", "the two cards on the right"]],
  12: [["Today, credit errors cost", "the last row of the table"]],
  13: [["The bank can adopt the first three", "the first three policy rules"]],
};

// A reminder for the presenter below the blue bar. It is not spoken.
const REMINDER = {
  1: "If the session is not in the morning, say 'Good afternoon' or 'Good evening'.",
};

// One line for each slide: the fewest words that bring the thread back.
const MEMORY = {
  1: "My name. Cost of credit errors: about 80% lower",
  2: "1 in 5. 62%. Random Forest, 93%. $9M. Checks, then model",
  3: "Defaults remove profit. A reason for each decline",
  4: "Five steps. 30% test first. Eleven models. Cost",
  5: "Missing ratio 62%. Missing valuation 94%. Separate inputs",
  6: "Ratio above 45%. One delinquent line doubles the rate",
  7: "Long history: lower risk. Small loans: highest risk",
  8: "$9,000 against $2,000. Recall, then precision",
  9: "Forest: best ranking, lowest cost, $324k. Rule set first",
  10: "200 trees, 22 inputs, 0.15, 93%, three bands, three rules",
  11: "0.5 misses 64. 0.15 misses 15. Cost: half",
  12: "$10.8M to $1.9M. $9M. Cost repaid in year one",
  13: "Prepare, shadow run, scale. Three rules now",
  14: "Approved loans only. Missing values. Fair lending",
  15: "93%. Three simple rules. $9M. Thank you",
};

// How to say the words of the speech that are hard to say
const SAY = [
  ["0.15, 0.5", "'zero point one five', 'zero point five'"],
  ["4.5 to 8 times", "'four and a half to eight times'"],
  ["10.8 million, 1.9 million", "'ten point eight million', 'one point nine million'"],
  ["324 thousand", "'three hundred and twenty-four thousand'"],
  ["delinquent", "'de-LIN-kwent'"],
  ["underwriter", "'UN-der-ry-ter'"],
  ["characteristic", "'ka-rak-te-RIS-tik'"],
  ["indicative", "'in-DIK-a-tiv'"],
  ["logistic regression", "'lo-JIS-tik re-GRE-shun'"],
  ["debt-to-income", "'DET to IN-kum' (the letter b is silent)"],
];

// ---------- helpers ----------
const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 21, ...opts });
const p = (runs, after = 100) => new Paragraph({ spacing: { after, line: 264 }, children: Array.isArray(runs) ? runs : [run(runs)] });
const h1 = (t, pageBreakBefore = false) => new Paragraph({ pageBreakBefore, keepNext: true, spacing: { before: pageBreakBefore ? 0 : 240, after: 120 }, children: [run(t, { bold: true, size: 28, color: NAVY })] });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 50, line: 260 }, children: Array.isArray(runs) ? runs : [run(runs)] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(header, rows, widths) {
  const cell = (text, isHeader, w, strong) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: 55, bottom: 55, left: 90, right: 90 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [run(String(text), { bold: isHeader || strong, size: 20, color: isHeader ? "FFFFFF" : "000000" })] })],
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => cell(h, true, widths[i], false)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, false, widths[i], i === 0)) })),
    ],
  });
}

// The pronunciation table: the term columns are bold
function sayTable(rows) {
  const widths = [1750, 2930, 1750, 2930];
  const cell = (text, w, isHeader, strong) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: 55, bottom: 55, left: 90, right: 90 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [run(String(text), { bold: isHeader || strong, size: 20, color: isHeader ? "FFFFFF" : "000000" })] })],
  });
  return new Table({
    width: { size: WIDTH, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: ["In the speech", "Say", "In the speech", "Say"].map((h, i) => cell(h, widths[i], true, false)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false, i % 2 === 0)) })),
    ],
  });
}

// The one line of the slide that holds the phrase (or that starts with the text). The build stops if there is not exactly one.
function lineIndex(talk, text, start) {
  const hits = talk.lines.map((l, i) => ((start ? l.startsWith(text) : l.includes(text)) ? i : -1)).filter((i) => i >= 0);
  if (hits.length !== 1) throw new Error(`Slide ${talk.slide}: "${text}" must be in exactly one line, found ${hits.length}`);
  return hits[0];
}

const SPEECH_SIZE = 29; // 14.5 pt
// One spoken line: the stressed words are bold, and a pause mark follows the line when the plan has one
function spokenLine(text, stress, pause, keepNext) {
  const runs = [];
  let rest = text;
  stress.map((s) => [text.indexOf(s), s]).sort((a, b) => a[0] - b[0]).forEach(([, s]) => {
    const at = rest.indexOf(s);
    if (at < 0) throw new Error(`Stressed words overlap in: ${text}`);
    if (at > 0) runs.push(run(rest.slice(0, at), { size: SPEECH_SIZE }));
    runs.push(run(s, { size: SPEECH_SIZE, bold: true, color: NAVY }));
    rest = rest.slice(at + s.length);
  });
  if (rest) runs.push(run(rest, { size: SPEECH_SIZE }));
  if (pause) runs.push(run("   (pause)", { size: 19, italics: true, color: GREY }));
  return new Paragraph({ keepLines: true, keepNext, spacing: { after: 90, line: 300 }, indent: { left: 200 }, children: runs });
}

const plan = SCRIPT.timing();
const endClock = plan[plan.length - 1].clock;
const pauseCount = Object.values(PAUSE_AFTER).reduce((a, l) => a + l.length, 0);
const endWithPauses = endClock + pauseCount * PAUSE_SECONDS;
const SLOW_WORDS_PER_MINUTE = 115;
const slowEnd = Math.round((SCRIPT.totalSpokenWords() / SLOW_WORDS_PER_MINUTE) * 60 + (plan.length - 1) * SCRIPT.SLIDE_CHANGE_SECONDS + pauseCount * PAUSE_SECONDS);

const children = [];

// ---------------------------------------------------------------- title and instructions
children.push(new Paragraph({ spacing: { after: 40 }, children: [run("Loan Default Prediction: the speech", { bold: true, size: 40, color: NAVY })] }));
children.push(new Paragraph({ spacing: { after: 160 }, children: [run("Saloni Priya  |  Live presentation, 8 minutes  |  Slides 1 to 15", { size: 22, color: GREY })] }));
children.push(p([
  run("Length. ", { bold: true }),
  run(`The speech has ${SCRIPT.totalWords()} words. At a calm pace (${SCRIPT.WORDS_PER_MINUTE} words for each minute), it ends at about ${SCRIPT.clockText(endWithPauses)} on the timer. At a slow pace (${SLOW_WORDS_PER_MINUTE} words for each minute), it ends at about ${SCRIPT.clockText(slowEnd)}. The hard stop is 9:00. These times are estimates, so measure your own time with a stopwatch.`),
]));
children.push(p([run("How to read this sheet", { bold: true })], 50));
[
  [run("Each line is one sentence. Say one sentence. Then stop for a short breath.")],
  [run("Stress the words in "), run("bold blue", { bold: true, color: NAVY }), run(". Say them slowly and clearly.")],
  [run("The mark "), run("(pause)", { italics: true, color: GREY }), run(" tells you to stop for one full second. Look at the panel during this time.")],
  [run("Do not say the grey text. It gives the time for the slide, the timer value at the end of the slide, and where to point.")],
  [run("Change the slide when you come to a new blue bar.")],
  [run("The words are the same as the speaker notes of the deck. Learn only this one version.")],
].forEach((r) => children.push(bullet(r)));

// ---------------------------------------------------------------- the speech
children.push(h1("The speech"));
SCRIPT.TALK.forEach((talk) => {
  const t = plan.find((x) => x.slide === talk.slide);
  const stress = talk.lines.map(() => []);
  (STRESS[talk.slide] || []).forEach((s) => stress[lineIndex(talk, s, false)].push(s));
  const pauses = new Set((PAUSE_AFTER[talk.slide] || []).map((s) => lineIndex(talk, s, true)));
  const points = new Map((POINT[talk.slide] || []).map(([s, where]) => [lineIndex(talk, s, true), where]));
  const hint = (SCRIPT.cue(talk.slide).match(/on the timer\.\s*(.+)\]$/) || [])[1] || REMINDER[talk.slide];

  // the blue bar: slide number and name on the left, the time on the right
  children.push(new Paragraph({
    keepNext: true, spacing: { before: 200, after: 70 },
    shading: { type: ShadingType.CLEAR, fill: LIGHT, color: "auto" },
    tabStops: [{ type: TabStopType.RIGHT, position: WIDTH - 80 }], indent: { left: 80 },
    children: [
      run(`Slide ${talk.slide}`, { bold: true, size: 26, color: NAVY }),
      run(`   ${talk.name}`, { bold: true, size: 24, color: NAVY }),
      new TextRun({ children: [new Tab(), `${t.target} seconds  |  finish at ${SCRIPT.clockText(t.clock)}`], font: FONT, size: 20, color: GREY }),
    ],
  }));
  if (hint) children.push(new Paragraph({ keepNext: true, spacing: { after: 60 }, indent: { left: 200 }, children: [run(hint, { size: 19, italics: true, color: GREY })] }));
  talk.lines.forEach((line, i) => {
    if (points.has(i)) children.push(new Paragraph({ keepNext: true, spacing: { after: 20 }, indent: { left: 200 }, children: [run(`→ Point to ${points.get(i)}.`, { size: 19, italics: true, color: GREY })] }));
    children.push(spokenLine(line, stress[i], pauses.has(i), i < talk.lines.length - 1));
  });
});

// ---------------------------------------------------------------- memory card
children.push(h1("Memory card", true));
children.push(p("Use this page if you lose your place. Each row gives the main words of one slide and the timer value at the end of the slide."));
children.push(table(
  ["Slide", "Remember", "Finish at"],
  SCRIPT.TALK.map((talk) => {
    if (!MEMORY[talk.slide]) throw new Error(`No memory line for slide ${talk.slide}`);
    return [`${talk.slide}. ${talk.name}`, MEMORY[talk.slide], SCRIPT.clockText(plan.find((x) => x.slide === talk.slide).clock)];
  }),
  [2300, 6060, 1000],
));
children.push(new Paragraph({ spacing: { before: 200, after: 50, line: 264 }, children: [run("If you are late", { bold: true })] }));
[
  `At the start of slide 7, look at the timer. If it shows more than ${SCRIPT.lateAt(7)}, say only the third sentence of slide 7.`,
  `At the start of slide 12, look at the timer. If it shows more than ${SCRIPT.lateAt(12)}, use the short version of slides 13 and 14.`,
  "Slide 13, short version: say only the first sentence and the third sentence.",
  "Slide 14, short version: say only the sentences that start with First, Second and Third.",
  "Do not speak faster. Always say the two sentences of the close and 'Thank you'.",
].forEach((t) => children.push(bullet(t)));
children.push(new Paragraph({ spacing: { before: 200, after: 50, line: 264 }, children: [run("After the speech", { bold: true })] }));
[
  "After 'Thank you', keep slide 15 on the screen. Wait for the first question.",
  "The short answers are in the note of slide 15 and in sections 5 and 6 of the presenter guide.",
].forEach((t) => children.push(bullet(t)));
children.push(new Paragraph({ spacing: { before: 200, after: 60, line: 264 }, children: [run("How to say the numbers and the hard words", { bold: true })] }));
// two word pairs in each row, so that the table stays on this page
const sayRows = [];
for (let i = 0; i < SAY.length; i += 2) sayRows.push([...SAY[i], ...(SAY[i + 1] || ["", ""])]);
children.push(sayTable(sayRows));

const doc = new Document({
  creator: "Saloni Priya",
  title: "Loan Default Prediction - Speech",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1150, bottom: 1100, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run("Loan Default Prediction - Speech  |  Saloni Priya  |  Page ", { size: 18, color: GREY }),
                 new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GREY })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024).toFixed(0), "KB");
});
