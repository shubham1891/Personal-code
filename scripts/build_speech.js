// Builds presentation/Loan_Default_Prediction_Speech.docx: the speech of the live presentation in large print,
// prepared for a presenter who learns the speech and says it from memory.
// The words come from presentation_script.js, so they are the same as the speaker notes of the deck and the script
// in the presenter guide. This file adds only the delivery marks and the learning aids: the words to stress, the
// pauses, where to point, four parts to learn, a memory card and a self-test with missing words.
// The build stops if a mark does not match the words of the script.
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

// ---------- the four parts to learn: one page for each part ----------
const PARTS = [
  { slides: [1, 2, 3, 4], title: "Part 1: the key takeaways, the problem and the approach" },
  { slides: [5, 6, 7, 8], title: "Part 2: the insights and the measure of success" },
  { slides: [9, 10, 11], title: "Part 3: the model and the threshold" },
  { slides: [12, 13, 14, 15], title: "Part 4: the benefit, the recommendations and the risks" },
];

// ---------- delivery marks ----------
// The words to stress in each slide. Each phrase must be in exactly one line of that slide.
// The self-test replaces the same words with blanks.
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
];

// ---------- helpers ----------
const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 21, ...opts });
const p = (runs, after = 100) => new Paragraph({ spacing: { after, line: 264 }, children: Array.isArray(runs) ? runs : [run(runs)] });
const h1 = (t, pageBreakBefore = false) => new Paragraph({ pageBreakBefore, keepNext: true, spacing: { before: pageBreakBefore ? 0 : 240, after: 100 }, children: [run(t, { bold: true, size: 28, color: NAVY })] });
const h2 = (t) => new Paragraph({ keepNext: true, spacing: { before: 190, after: 50, line: 264 }, children: [run(t, { bold: true })] });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 45, line: 260 }, children: Array.isArray(runs) ? runs : [run(runs)] });
const step = (t) => new Paragraph({ numbering: { reference: "steps", level: 0 }, spacing: { after: 45, line: 260 }, children: [run(t)] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
// A table with a navy header row. "strong" lists the columns in bold.
function table(header, rows, widths, strong = [0]) {
  const cell = (text, isHeader, w, isStrong) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
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

// The one line of the slide that holds the phrase (or that starts with the text). The build stops if there is not exactly one.
function lineIndex(talk, text, start) {
  const hits = talk.lines.map((l, i) => ((start ? l.startsWith(text) : l.includes(text)) ? i : -1)).filter((i) => i >= 0);
  if (hits.length !== 1) throw new Error(`Slide ${talk.slide}: "${text}" must be in exactly one line, found ${hits.length}`);
  return hits[0];
}
// The stressed phrases of each line of a slide
function stressOf(talk) {
  const stress = talk.lines.map(() => []);
  (STRESS[talk.slide] || []).forEach((s) => stress[lineIndex(talk, s, false)].push(s));
  return stress;
}
// A line as pieces: [text, isStressed]. The build stops if two stressed phrases overlap.
function pieces(text, stress) {
  const out = [];
  let rest = text;
  stress.map((s) => [text.indexOf(s), s]).sort((a, b) => a[0] - b[0]).forEach(([, s]) => {
    const at = rest.indexOf(s);
    if (at < 0) throw new Error(`Stressed words overlap in: ${text}`);
    if (at > 0) out.push([rest.slice(0, at), false]);
    out.push([s, true]);
    rest = rest.slice(at + s.length);
  });
  if (rest) out.push([rest, false]);
  return out;
}

const SPEECH_SIZE = 28; // 14 pt
// One spoken line: the stressed words are bold, and a pause mark follows the line when the plan has one
function spokenLine(text, stress, pause, keepNext) {
  const runs = pieces(text, stress).map(([t, strong]) => run(t, strong ? { size: SPEECH_SIZE, bold: true, color: NAVY } : { size: SPEECH_SIZE }));
  if (pause) runs.push(run("   (pause)", { size: 19, italics: true, color: GREY }));
  return new Paragraph({ keepLines: true, keepNext, spacing: { after: 80, line: 290 }, indent: { left: 200 }, children: runs });
}
// The same line for the self-test: a blank replaces each group of stressed words
function testLine(text, stress, keepNext) {
  const runs = pieces(text, stress).map(([t, strong]) => run(strong ? "_".repeat(Math.max(6, Math.round(t.length * 1.1))) : t, { size: 19, color: strong ? GREY : "000000" }));
  return new Paragraph({ keepLines: true, keepNext, spacing: { after: 14, line: 236 }, indent: { left: 200 }, children: runs });
}

const plan = SCRIPT.timing();
const timeOf = (slide) => plan.find((x) => x.slide === slide);
const endClock = plan[plan.length - 1].clock;
const pauseCount = Object.values(PAUSE_AFTER).reduce((a, l) => a + l.length, 0);
const endWithPauses = endClock + pauseCount * PAUSE_SECONDS;
const SLOW_WORDS_PER_MINUTE = 115;
const slowEnd = Math.round((SCRIPT.totalSpokenWords() / SLOW_WORDS_PER_MINUTE) * 60 + (plan.length - 1) * SCRIPT.SLIDE_CHANGE_SECONDS + pauseCount * PAUSE_SECONDS);
const talkOf = (slide) => SCRIPT.TALK.find((t) => t.slide === slide);
const firstPage = 2; // the page of part 1
const partPages = `pages ${firstPage} to ${firstPage + PARTS.length - 1}`;

const children = [];

// ---------------------------------------------------------------- page 1: title and instructions
children.push(new Paragraph({ spacing: { after: 40 }, children: [run("Loan Default Prediction: the speech", { bold: true, size: 40, color: NAVY })] }));
children.push(new Paragraph({ spacing: { after: 150 }, children: [run("Saloni Priya  |  Live presentation, 8 minutes  |  Slides 1 to 15", { size: 22, color: GREY })] }));
children.push(p([
  run("Length. ", { bold: true }),
  run(`The speech has ${SCRIPT.totalWords()} words. At a calm pace (${SCRIPT.WORDS_PER_MINUTE} words for each minute), it ends at about ${SCRIPT.clockText(endWithPauses)} on the timer. At a slow pace (${SLOW_WORDS_PER_MINUTE} words for each minute), it ends at about ${SCRIPT.clockText(slowEnd)}. The hard stop is 9:00. These times are estimates, so measure your own time with a stopwatch.`),
]));

children.push(h2("How to read the speech"));
[
  [run("Each line is one sentence. Say one sentence. Then stop for a short breath.")],
  [run("Stress the words in "), run("bold blue", { bold: true, color: NAVY }), run(". Say them slowly and clearly.")],
  [run("The mark "), run("(pause)", { italics: true, color: GREY }), run(" tells you to stop for one full second. Look at the panel during this time.")],
  [run("Do not say the grey text. It gives the time for the slide, the timer value at the end of the slide, and where to point.")],
  [run("Change the slide when you come to a new blue bar.")],
  [run("The words are the same as the speaker notes of the deck. There is only one version to learn.")],
].forEach((r) => children.push(bullet(r)));

children.push(h2("How to learn the speech"));
[
  `The speech has four parts, and each part is one page (${partPages}). Learn one part at a time.`,
  "Show the slide on the screen. Read the lines of the slide aloud three times.",
  "Then hide the lines. Say them from memory while you look at the slide.",
  "If you stop, look at the row of the slide on the memory card. Then say the full slide again.",
  "When you know one slide, add the next slide. Then say the part again from its first slide.",
  "Learn the first sentence of each slide and all the numbers exactly. They start your memory of the other lines.",
  "For the other words, a small change is not an error. Continue with the next sentence.",
  "Do the self-test on the last pages. It shows each line without its stressed words.",
  "Learn in short sessions of 20 minutes. Repeat the parts that you know at the start of each session.",
  "Record the speech on your telephone. Listen to the recording, and say the speech together with it.",
  "Before the session, say the full speech three times with the slides and a stopwatch.",
].forEach((t) => children.push(step(t)));

children.push(h2("If you forget a line during the session"));
[
  "Stop for one breath. Look at the slide: it shows the numbers of your sentences.",
  "Look at the notes in Presenter View. They show the same lines in the same sequence.",
  "Continue with the next sentence that you know. Do not start the slide again, and do not speak faster.",
].forEach((t) => children.push(bullet(t)));

children.push(h2("How to say the numbers and the hard words"));
// two word pairs in each row, so that the table stays on the first page
const sayRows = [];
for (let i = 0; i < SAY.length; i += 2) sayRows.push([...SAY[i], ...(SAY[i + 1] || ["", ""])]);
children.push(table(["In the speech", "Say", "In the speech", "Say"], sayRows, [1750, 2930, 1750, 2930], [0, 2]));

// ---------------------------------------------------------------- the speech: one page for each part
PARTS.forEach((part) => {
  const talks = part.slides.map(talkOf);
  const words = part.slides.reduce((a, s) => a + timeOf(s).words, 0);
  const seconds = part.slides.reduce((a, s) => a + timeOf(s).target, 0);
  children.push(h1(part.title, true));
  children.push(new Paragraph({ keepNext: true, spacing: { after: 40 }, children: [run(`Slides ${part.slides[0]} to ${part.slides[part.slides.length - 1]}  |  ${words} words  |  about ${SCRIPT.clockText(seconds)} of the speech`, { size: 20, color: GREY })] }));
  talks.forEach((talk) => {
    const t = timeOf(talk.slide);
    const stress = stressOf(talk);
    const pauses = new Set((PAUSE_AFTER[talk.slide] || []).map((s) => lineIndex(talk, s, true)));
    const points = new Map((POINT[talk.slide] || []).map(([s, where]) => [lineIndex(talk, s, true), where]));
    const hint = (SCRIPT.cue(talk.slide).match(/on the timer\.\s*(.+)\]$/) || [])[1] || REMINDER[talk.slide];

    // the blue bar: slide number and name on the left, the time on the right
    children.push(new Paragraph({
      keepNext: true, spacing: { before: 170, after: 60 },
      shading: { type: ShadingType.CLEAR, fill: LIGHT, color: "auto" },
      tabStops: [{ type: TabStopType.RIGHT, position: WIDTH - 80 }], indent: { left: 80 },
      children: [
        run(`Slide ${talk.slide}`, { bold: true, size: 26, color: NAVY }),
        run(`   ${talk.name}`, { bold: true, size: 24, color: NAVY }),
        new TextRun({ children: [new Tab(), `${t.target} seconds  |  finish at ${SCRIPT.clockText(t.clock)}`], font: FONT, size: 20, color: GREY }),
      ],
    }));
    if (hint) children.push(new Paragraph({ keepNext: true, spacing: { after: 50 }, indent: { left: 200 }, children: [run(hint, { size: 19, italics: true, color: GREY })] }));
    talk.lines.forEach((line, i) => {
      if (points.has(i)) children.push(new Paragraph({ keepNext: true, spacing: { after: 15 }, indent: { left: 200 }, children: [run(`→ Point to ${points.get(i)}.`, { size: 19, italics: true, color: GREY })] }));
      children.push(spokenLine(line, stress[i], pauses.has(i), i < talk.lines.length - 1));
    });
  });
});

// ---------------------------------------------------------------- memory card
children.push(h1("Memory card", true));
children.push(p("Use this page when you learn the speech, and when you lose your place. Each row gives the first words of the slide and its main words. It also gives the timer value at the end of the slide."));
children.push(table(
  ["Slide", "First words", "Remember", "Finish at"],
  SCRIPT.TALK.map((talk) => {
    if (!MEMORY[talk.slide]) throw new Error(`No memory line for slide ${talk.slide}`);
    const first = talk.lines[0].split(/\s+/).slice(0, 4).join(" ").replace(/[.,:]$/, "");
    return [`${talk.slide}. ${talk.name}`, `${first} ...`, MEMORY[talk.slide], SCRIPT.clockText(timeOf(talk.slide).clock)];
  }),
  [2050, 2350, 4060, 900], [0],
));
children.push(h2("If you are late"));
[
  `At the start of slide 7, look at the timer. If it shows more than ${SCRIPT.lateAt(7)}, say only the third sentence of slide 7.`,
  `At the start of slide 12, look at the timer. If it shows more than ${SCRIPT.lateAt(12)}, use the short version of slides 13 and 14.`,
  "Slide 13, short version: say only the first sentence and the third sentence.",
  "Slide 14, short version: say only the sentences that start with First, Second and Third.",
  "Do not speak faster. Always say the two sentences of the close and 'Thank you'.",
].forEach((t) => children.push(bullet(t)));
children.push(h2("After the speech"));
[
  "After 'Thank you', keep slide 15 on the screen. Wait for the first question.",
  "The short answers are in the note of slide 15 and in sections 5 and 6 of the presenter guide. Learn their meaning, not their words.",
].forEach((t) => children.push(bullet(t)));

// ---------------------------------------------------------------- self-test
children.push(h1("Self-test: say the missing words", true));
children.push(p(`Each blank replaces the stressed words of the line. Say each line aloud with its missing words. Then compare it with the speech on ${partPages}.`, 40));
SCRIPT.TALK.forEach((talk) => {
  const stress = stressOf(talk);
  children.push(new Paragraph({ keepNext: true, spacing: { before: 80, after: 20 }, children: [run(`Slide ${talk.slide}   ${talk.name}`, { bold: true, size: 19, color: NAVY })] }));
  talk.lines.forEach((line, i) => children.push(testLine(line, stress[i], i < talk.lines.length - 1)));
});

const doc = new Document({
  creator: "Saloni Priya",
  title: "Loan Default Prediction - Speech",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1100, bottom: 1050, left: 1440, right: 1440 } } },
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
