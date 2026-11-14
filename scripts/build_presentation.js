// Builds presentation/Loan_Default_Prediction_Presentation.pptx (Live Presentation, 8 minutes + Q&A).
// Run from the repository root:  node scripts/build_presentation.js
// Requires: pptxgenjs (npm). The applyTheme helper comes from the pptx skill if available; the deck
// still builds without it (scheme colours then fall back to Office defaults).

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "presentation", "Loan_Default_Prediction_Presentation.pptx");

// ---------------- theme ----------------
const THEME = {
  name: "Loan Default Navy",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F1F1F", lt1: "FFFFFF", dk2: "1E2761", lt2: "EEF2FA",
    accent1: "1E2761", accent2: "C44E52", accent3: "4C72B0", accent4: "9DB4DE", accent5: "3C8D5A", accent6: "8C8C8C",
    hlink: "1E2761", folHlink: "4C72B0",
  },
};
const H = THEME.colors; // hex values for the options that only take hex

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Saloni Priya";
pres.title = "Loan Default Prediction - Capstone Presentation";
const C = pres.SchemeColor;

// ---------------- layouts ----------------
pres.defineSlideMaster({
  title: "DARK",
  background: { color: H.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.7, w: 8.8, h: 1.3, fontSize: 40, bold: true, color: H.lt1, align: "left", valign: "bottom", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.1, w: 8.8, h: 1.2, fontSize: 18, color: H.lt2, align: "left", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: H.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.25, w: 9.0, h: 0.85, fontSize: 24, bold: true, color: H.dk2, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "Loan Default Prediction  |  Capstone", options: { x: 0.5, y: 5.22, w: 5, h: 0.3, fontSize: 9, color: H.accent6, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.22, w: 0.5, h: 0.3, fontSize: 9, color: H.accent6, align: "right" },
});

// ---------------- helpers ----------------
const chartFrame = () => ({
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", titleFontFace: "+mj-lt", legendFontFace: "+mn-lt",
  catAxisLabelColor: H.dk1, valAxisLabelColor: H.accent6, dataLabelColor: H.dk1,
  catAxisLabelFontSize: 10, valAxisLabelFontSize: 9, dataLabelFontSize: 10,
  valGridLine: { color: "E3E3E3", size: 0.5 }, catGridLine: { style: "none" }, valAxisMinVal: 0,
  showLegend: false, showTitle: true, titleFontSize: 12, titleColor: H.dk2,
});
function bullets(items, size = 14) {
  return items.map((t, i) => ({
    text: t, options: { bullet: { indent: 14 }, fontSize: size, color: C.text1, paraSpaceAfter: 8, breakLine: i < items.length - 1 },
  }));
}
function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: opts.fill || C.background2 }, line: { color: opts.line || C.background2, width: 0.75 },
    shadow: opts.shadow ? { type: "outer", blur: 4, offset: 1, angle: 90, color: "A0A0A0", opacity: 0.25 } : undefined,
    objectName: opts.name || "card",
  });
}
function stat(slide, x, y, w, big, label, color = C.accent1, bigSize = 36) {
  slide.addText(big, { x, y, w, h: 0.75, fontSize: bigSize, bold: true, color, align: "center", valign: "bottom", margin: 0, isTextBox: true, objectName: `stat ${big}` });
  slide.addText(label, { x, y: y + 0.78, w, h: 0.55, fontSize: 11, color: C.text1, align: "center", valign: "top", margin: 0, isTextBox: true, objectName: `stat label ${label}` });
}
function numberedCircle(slide, x, y, n, fill = C.accent1) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.42, h: 0.42, fill: { color: fill }, line: { color: fill }, objectName: `step ${n}` });
  slide.addText(String(n), { x, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `step number ${n}` });
}
function notes(slide, text) { slide.addNotes(text); }

// =====================================================================================
pres.addSection({ title: "Opening" });

// 1. Title
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Opening" });
  s.addText("Loan Default Prediction", { placeholder: "title" });
  s.addText([
    { text: "An interpretable credit-scoring model to approve home equity loans", options: { fontSize: 18, color: C.background2, breakLine: true } },
    { text: "Capstone Project  |  Practical Data Science  |  MIT Professional Education - Applied AI and Data Science Program", options: { fontSize: 12, color: C.accent4, breakLine: true } },
    { text: "Saloni Priya  |  November 2026", options: { fontSize: 12, color: C.accent4 } },
  ], { placeholder: "body" });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.45, w: 0.9, h: 0.08, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "title marker" });
  notes(s, "Good morning. In about nine minutes I will show how a bank can cut the cost of credit errors on the home equity loans it approves today. The cut is about four fifths, with a model the bank can also explain to regulators and applicants.");
}

// 2. Key takeaways
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Opening" });
  s.addText("Key takeaways", { placeholder: "title" });
  const items = [
    ["1 in 5", "home equity loans in the data ended in default. Accuracy alone is a misleading yardstick."],
    ["62%", "default rate when the applicant's debt-to-income ratio is missing, versus 8.6% when it is present. Unverified income is the strongest warning sign."],
    ["93%", "of defaulters among unseen applicants caught by the proposed Random Forest. 2 of every 3 applicants it flagged really defaulted."],
    ["~$9M", "indicative annual benefit on 6,000 applications, from roughly $10.8M of credit-error cost down to about $1.9M."],
  ];
  items.forEach(([big, text], i) => {
    const x = 0.5 + i * 2.3;
    card(s, x, 1.3, 2.15, 3.0, { shadow: true, name: `takeaway card ${i + 1}` });
    s.addText(big, { x: x + 0.15, y: 1.5, w: 1.85, h: 0.9, fontSize: 34, bold: true, color: i === 2 ? C.accent5 : C.accent1, align: "left", valign: "middle", margin: 0, isTextBox: true, objectName: `takeaway number ${i + 1}` });
    s.addText(text, { x: x + 0.15, y: 2.45, w: 1.85, h: 1.75, fontSize: 12, color: C.text1, align: "left", valign: "top", margin: 0, isTextBox: true, objectName: `takeaway text ${i + 1}` });
  });
  s.addText([
    { text: "Recommendation: ", options: { bold: true, color: C.accent2 } },
    { text: "make income and valuation checks mandatory. Deploy the forest at a 0.15 threshold with approve / refer / decline bands, after a shadow run of one to two months and a fairness review.", options: { color: C.accent1 } },
  ], { x: 0.5, y: 4.45, w: 9.0, h: 0.65, fontSize: 12.5, margin: 0, isTextBox: true, valign: "top", objectName: "recommendation line" });
  notes(s, "Four things to remember. One in five loans ends in default. The biggest red flag is income the bank could not check. The proposed model catches 93 percent of defaulters before the money leaves the bank. And under reasonable assumptions that is worth about nine million dollars a year. We recommend mandatory income and valuation checks first. Then deploy the forest at a 0.15 threshold with approve, refer and decline bands, after a shadow run of one to two months and a fairness review.");
}

// =====================================================================================
pres.addSection({ title: "Problem and approach" });

// 3. Problem
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problem and approach" });
  s.addText("The problem: approving home equity loans without losing the profit to defaults", { placeholder: "title" });
  s.addText(bullets([
    "Interest on home loans is a major share of retail bank profit. Defaults consume it.",
    "Today each decision is manual: slow, inconsistent across underwriters, open to error and bias.",
    "The consumer credit department wants an empirically derived credit-scoring model built on its own recent loans.",
    "Constraint: under the Equal Credit Opportunity Act (ECOA) every rejection needs a specific, defensible reason, so the model must be interpretable.",
  ], 13.5), { x: 0.5, y: 1.25, w: 5.3, h: 3.0, valign: "top", margin: 0, isTextBox: true, objectName: "problem bullets" });
  card(s, 6.1, 1.25, 3.4, 3.75, { name: "data card" });
  s.addText("The data: Home Equity dataset (HMEQ)", { x: 6.3, y: 1.35, w: 3.0, h: 0.4, fontSize: 12, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "data card title" });
  stat(s, 6.3, 1.75, 1.5, "5,960", "recent loans", C.accent1, 28);
  stat(s, 7.85, 1.75, 1.5, "12", "attributes known at application", C.accent1, 28);
  stat(s, 6.3, 3.15, 1.5, "19.9%", "defaulted or seriously delinquent", C.accent2, 28);
  stat(s, 7.85, 3.15, 1.5, "44%", "of applications have a blank field", C.accent3, 28);
  s.addText("Objective: predict which applicants are likely to default. Tell the bank which attributes to weigh when approving a loan.", { x: 0.5, y: 4.35, w: 5.3, h: 0.7, fontSize: 12.5, italic: true, color: C.accent1, margin: 0, isTextBox: true, valign: "top", objectName: "objective" });
  notes(s, "The business context: profit comes from interest, and losses come from defaulters. The current manual process is slow and inconsistent. The data is 5,960 recent home equity loans with 12 attributes and a 20 percent default rate. And 44 percent of the applications have at least one blank field. That matters a great deal.");
}

// 4. Approach
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problem and approach" });
  s.addText("Approach: from raw applications to a decision the bank can defend", { placeholder: "title" });
  const steps = [
    ["Explore", "Univariate, bivariate and correlation analysis. Default rate by band. Pattern of missing values"],
    ["Prepare", "Reserve a stratified 30% test set first. Flag every missing field. Impute median/mode learned on training rows. Cap outliers for the linear model only. One-hot encode"],
    ["Model", "Logistic Regression (linear benchmark), Decision Tree, Bagging, Random Forest. Class weights. Cross-validated grid search"],
    ["Measure", "Recall on defaulters as the primary metric. Precision, F1, ROC-AUC as guard-rails. Final model, inputs and threshold chosen on cross-validated expected cost"],
    ["Recommend", "Model specification, business rules, implementation plan, benefits, risks"],
  ];
  steps.forEach(([title, text], i) => {
    const x = 0.5 + i * 1.84;
    card(s, x, 1.35, 1.7, 3.5, { fill: i === 3 ? C.accent4 : C.background2, line: i === 3 ? C.accent4 : C.background2, name: `step card ${i + 1}` });
    numberedCircle(s, x + 0.15, 1.5, i + 1);
    s.addText(title, { x: x + 0.15, y: 2.0, w: 1.45, h: 0.4, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: `step title ${i + 1}` });
    s.addText(text, { x: x + 0.15, y: 2.45, w: 1.45, h: 2.3, fontSize: 11, color: C.text1, margin: 0, isTextBox: true, valign: "top", objectName: `step text ${i + 1}` });
  });
  notes(s, "Five steps. Explore the data. Prepare it. Build linear and non-linear models. Measure them on the metric that follows the money. Convert the result into recommendations. The key preparation decision was to keep a flag for every missing field instead of just filling the gaps.");
}

// =====================================================================================
pres.addSection({ title: "Key insights" });

// 5. Insight 1: missing information
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Key insights" });
  s.addText("Insight 1: missing information is the strongest warning sign", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [
    { name: "Field missing", labels: ["Property value", "Debt-to-income", "Credit-line age", "No. of credit lines", "Derogatory reports", "Occupation"], values: [93.8, 62.0, 25.3, 23.9, 12.3, 8.2] },
    { name: "Field present", labels: ["Property value", "Debt-to-income", "Credit-line age", "No. of credit lines", "Derogatory reports", "Occupation"], values: [18.5, 8.6, 19.7, 19.8, 21.0, 20.5] },
  ], { ...chartFrame(), x: 0.4, y: 1.2, w: 5.6, h: 3.9, barDir: "bar", catAxisOrientation: "maxMin", barGrouping: "clustered", barGapWidthPct: 60,
       chartColors: [H.accent2, H.accent3], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0", valAxisMaxVal: 100, valAxisLabelFormatCode: "0",
       showLegend: true, legendPos: "b", legendFontSize: 10, title: "Default rate (%) when a field is missing vs present", objectName: "missing fields chart" });
  s.addText(bullets([
    "No recorded debt-to-income ratio: 62% default (1,267 applicants, 21% of the data)",
    "No property valuation: 94% default (112 applicants)",
    "Overall default rate 20%: these gaps multiply risk 3 to 5 times, because the bank could not check income or collateral",
    "Action: a 'was missing' flag for every field with gaps, and mandatory verification in the process",
  ], 12.5), { x: 6.2, y: 1.25, w: 3.4, h: 3.9, valign: "top", margin: 0, isTextBox: true, objectName: "insight 1 bullets" });
  notes(s, "The single most important finding. When the debt-to-income ratio is missing, 62 percent of those applicants defaulted. When the property valuation is missing, 94 percent. The absence of information is itself a signal, so the models carry a flag for every missing field.");
}

// 6. Insight 2: debt burden and repayment history
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Key insights" });
  s.addText("Insight 2: debt burden has a cliff at 45%, and past delinquency repeats", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [
    { name: "Default rate", labels: ["0-20", "20-30", "30-35", "35-40", "40-45", "45-50", "50+"], values: [10.6, 4.4, 6.0, 7.0, 11.2, 87.2, 100] },
  ], { ...chartFrame(), x: 0.4, y: 1.2, w: 4.55, h: 3.3, barDir: "col", chartColors: [H.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
       valAxisMaxVal: 110, valAxisLabelFormatCode: "0", title: "Default rate (%) by debt-to-income ratio band (%)", objectName: "debt to income chart" });
  s.addChart(pres.charts.BAR, [
    { name: "Default rate", labels: ["0", "1", "2", "3", "4", "5", "6+"], values: [14.0, 33.9, 44.8, 55.0, 59.0, 81.6, 100] },
  ], { ...chartFrame(), x: 5.05, y: 1.2, w: 4.55, h: 3.3, barDir: "col", chartColors: [H.accent3], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
       valAxisMaxVal: 110, valAxisLabelFormatCode: "0", title: "Default rate (%) by delinquent credit lines", objectName: "delinquency chart" });
  s.addText(bullets([
    "Debt-to-income ratio 20-40%: only 4-7% default. Above 45%: 87-100%",
    "Delinquent credit lines: 14% default with none, 34% with one, 100% with six or more",
  ], 12), { x: 0.5, y: 4.55, w: 9.0, h: 0.6, margin: 0, isTextBox: true, valign: "top", objectName: "insight 2 bullets" });
  notes(s, "Two more drivers that are easy to explain. The debt-to-income ratio is not a slope but a cliff: between 20 and 40 percent, 4 to 7 percent default. Above 45 percent, 87 to 100 percent default. And repayment history repeats: the first delinquent credit line more than doubles the default rate, and each further one raises it again. Both are plain-language rules to give an applicant.");
}

// 7. Insight 3: credit history length, loan size, occupation
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Key insights" });
  s.addText("Insight 3: long credit histories protect, small loans do not, occupation matters less", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [
    { name: "Default rate", labels: ["<5 yrs", "5-10", "10-15", "15-20", "20-25", "25+"], values: [44.0, 26.2, 22.8, 15.3, 9.3, 10.7] },
  ], { ...chartFrame(), x: 0.4, y: 1.2, w: 2.9, h: 3.0, barDir: "col", chartColors: [H.accent3], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
       valAxisMaxVal: 70, valAxisLabelFormatCode: "0", title: "By age of oldest credit line", objectName: "credit age chart" });
  s.addChart(pres.charts.BAR, [
    { name: "Default rate", labels: ["<5k", "5-10k", "10-15k", "15-20k", "20-30k", "30k+"], values: [57.2, 25.1, 20.48, 16.2, 14.4, 19.5] },
  ], { ...chartFrame(), x: 3.3, y: 1.2, w: 2.9, h: 3.0, barDir: "col", chartColors: [H.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
       valAxisMaxVal: 70, valAxisLabelFormatCode: "0", title: "By loan amount ($)", objectName: "loan amount chart" });
  s.addChart(pres.charts.BAR, [
    { name: "Default rate", labels: ["Sales", "Self-employed", "Manager", "Other", "Professional / executive", "Office"], values: [34.9, 30.1, 23.3, 23.2, 16.6, 13.2] },
  ], { ...chartFrame(), x: 6.2, y: 1.2, w: 3.4, h: 3.0, barDir: "bar", catAxisOrientation: "maxMin", catAxisLabelFontSize: 9, chartColors: [H.accent6], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
       valAxisMaxVal: 70, valAxisLabelFormatCode: "0", title: "By occupation", objectName: "occupation chart" });
  s.addText(bullets([
    "Credit history under 5 years: 44% default, four times the rate at 20 years or more",
    "Loans under $5,000: 57% default, the riskiest band",
    "Occupation: from 13% (office) to 35% (sales), a moderate signal",
  ], 11.5), { x: 0.5, y: 4.27, w: 9.0, h: 0.9, margin: 0, isTextBox: true, valign: "top", objectName: "insight 3 bullets" });
  notes(s, "Three supporting drivers. A long credit history protects. Small loans are the riskiest, not the safest. Occupation matters a little: sales applicants default at 35 percent, office workers at 13 percent. We return to it with the model and the fair-lending review.");
}

// =====================================================================================
pres.addSection({ title: "Modelling" });

// 8. Measure of success
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  s.addText("Measure of success: the two mistakes do not cost the same", { placeholder: "title" });
  const colW = 4.4;
  [["Missed defaulter", "The model says 'will repay'. The customer defaults.", "The bank loses a large part of the principal plus collection cost: about $9,000 on an average $16,900 defaulted loan.", C.accent2],
   ["Wrongly declined", "The model says 'will default'. The customer is creditworthy.", "The bank forgoes the interest margin on one good applicant: about $2,000.", C.accent3]].forEach(([t, d, c, col], i) => {
    const x = 0.5 + i * (colW + 0.2);
    card(s, x, 1.3, colW, 2.2, { name: `error card ${i + 1}` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 1.5, w: 0.5, h: 0.5, fill: { color: col }, line: { color: col }, objectName: `error marker ${i + 1}` });
    s.addText(t, { x: x + 0.85, y: 1.45, w: colW - 1.0, h: 0.6, fontSize: 17, bold: true, color: col, margin: 0, isTextBox: true, valign: "middle", objectName: `error title ${i + 1}` });
    s.addText(d, { x: x + 0.2, y: 2.15, w: colW - 0.4, h: 0.5, fontSize: 12, color: C.text1, margin: 0, isTextBox: true, valign: "top", objectName: `error desc ${i + 1}` });
    s.addText(c, { x: x + 0.2, y: 2.7, w: colW - 0.4, h: 0.7, fontSize: 12, bold: true, color: C.text1, margin: 0, isTextBox: true, valign: "top", objectName: `error cost ${i + 1}` });
  });
  s.addText(bullets([
    "A missed defaulter costs about 4.5 times a wrongly declined customer",
    "Primary metric: Recall, the share of future defaulters the model catches",
    "Guard-rails: Precision (share of flagged applicants who really default), F1 and ROC-AUC (risk-ranking quality)",
    "Final model and threshold chosen on expected cost, training rows only. Test set scored once",
  ], 13.5), { x: 0.5, y: 3.7, w: 9.0, h: 1.45, valign: "top", margin: 0, isTextBox: true, objectName: "metric bullets" });
  notes(s, "Before comparing models, the yardstick. Approving a future defaulter costs the bank a large part of the principal. Declining a good customer costs only the margin. So the primary metric is recall, the share of defaulters we catch, with precision as the guard-rail against declining everyone.");
}

// 9. Model comparison
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  s.addText("Model comparison: the Random Forest gives the best balance", { placeholder: "title" });
  const labels = ["Logistic Regression (balanced)", "Decision Tree (tuned)", "Bagged trees (200)", "Random Forest, 22 inputs, at 0.5", "Random Forest (class weights)", "Random Forest, 22 inputs, at 0.15 (proposed)"];
  s.addChart(pres.charts.BAR, [
    { name: "Defaulters caught (recall)", labels, values: [79.6, 82.1, 68.3, 67.8, 77.3, 92.7] },
    { name: "Precision", labels, values: [60.8, 53.1, 82.7, 82.9, 76.9, 67.4] },
  ], { ...chartFrame(), x: 0.4, y: 1.2, w: 5.9, h: 3.3, barDir: "bar", barGrouping: "clustered", barGapWidthPct: 50, catAxisLabelFontSize: 10,
       chartColors: [H.accent1, H.accent4], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0", valAxisMaxVal: 100, valAxisLabelFormatCode: "0",
       showLegend: true, legendPos: "b", legendFontSize: 10, catAxisOrientation: "maxMin", title: "Test set (1,788 unseen applicants), % ", objectName: "model comparison chart" });
  s.addText(bullets([
    "Logistic regression: 80% caught at 61% precision. A straight line misses the step changes in risk",
    "Tuned decision tree: 82% caught, but almost one good customer declined per defaulter caught (53% precision)",
    "Bagged trees and fully grown forests: the best risk ranking (ROC-AUC 0.95 to 0.96)",
    "Chosen on expected cost, training rows only: plain forest, 22 inputs, threshold 0.15. On test: 93% caught at 67% precision",
  ], 12), { x: 6.45, y: 1.25, w: 3.15, h: 3.9, valign: "top", margin: 0, isTextBox: true, objectName: "comparison bullets" });
  s.addText([
    { text: "Expected cost of credit errors per 1,000 applicants, each technique at its own best threshold (out-of-fold, training rows)", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "Random Forest $324k   |   Bagged trees $390k   |   Logistic Regression $550k   |   Decision Tree $607k", options: { color: C.text1 } },
  ], { x: 0.5, y: 4.55, w: 5.8, h: 0.6, fontSize: 10, margin: 0, isTextBox: true, valign: "top", objectName: "cost strip" });
  notes(s, "We built eleven model variants, and Appendix A lists them. The chart shows four of them and the final forest at two thresholds. At the usual threshold the forest with class weights has the best balance. We then chose the final configuration and its threshold together on expected cost, using training rows only. Each training applicant was scored by a model that never saw that applicant, which is what out-of-fold means. We fixed the rule beforehand: lowest mean cost of mistakes, and the simplest set-up when several are within run-to-run noise. Three forests tied within that noise, so class weights added nothing, and we chose the plain forest at a 0.15 threshold. The strip under the chart shows the same yardstick for every technique at its own best threshold: 324 thousand dollars per thousand applicants for the forest, against 390, 550 and 607 thousand for the others. On the test set the forest costs 310 thousand, within the standard error of about 28 thousand.");
}

// 10. Proposed solution
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  s.addText("Proposed solution: a Random Forest scorer explained by a surrogate decision tree", { placeholder: "title" });
  card(s, 0.5, 1.25, 5.3, 3.85, { name: "spec card" });
  s.addText("Model specification", { x: 0.7, y: 1.35, w: 4.9, h: 0.4, fontSize: 14, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "spec title" });
  const spec = [
    ["Scoring engine: Random Forest, 200 fully grown trees, no class weights", 0],
    ["Inputs: 22 of 27: 10 numeric attributes, 6 missing-value flags, 6 occupation and loan-purpose indicators", 0],
    ["Threshold: flag above 0.15 (next slide)", 0],
    ["Bands: approve below 0.10 (69% of applicants), refer 0.10-0.25 to an underwriter (7%), decline above 0.25 (24%)", 0],
    ["Explanation: a depth-4 surrogate tree agrees with 93% of the forest's decisions. Its three rules:", 0],
    ["Debt-to-income ratio missing: flag", 1],
    ["Ratio above about 44%: flag", 1],
    ["Otherwise: flag a delinquent credit line with a credit history of about 8 years or less", 1],
    ["Per-applicant risk drivers give each decline its ECOA reason", 0],
  ];
  s.addText(spec.map(([t, level], i) => ({ text: t, options: { bullet: { indent: 14 }, indentLevel: level, fontSize: level ? 10.5 : 11, color: C.text1, paraSpaceAfter: level ? 3 : 8, breakLine: i < spec.length - 1 } })),
    { x: 0.7, y: 1.8, w: 4.9, h: 3.2, valign: "top", margin: 0, isTextBox: true, objectName: "spec bullets" });
  stat(s, 6.1, 1.3, 1.65, "93%", "of defaulters caught", C.accent5, 34);
  stat(s, 7.85, 1.3, 1.65, "67%", "of flagged applicants truly default", C.accent1, 34);
  stat(s, 6.1, 2.75, 1.65, "0.96", "ROC-AUC: risk ranking quality", C.accent1, 34);
  stat(s, 7.85, 2.75, 1.65, "90%", "overall accuracy", C.accent1, 34);
  s.addText("At the 0.15 threshold alone, per 1,000 applicants: 185 of 200 defaulters flagged in advance, 15 missed, about 90 good customers flagged.", { x: 6.1, y: 4.25, w: 3.4, h: 0.85, fontSize: 11.5, italic: true, color: C.text1, margin: 0, isTextBox: true, valign: "top", objectName: "per 1000 note" });
  notes(s, "The proposal. A Random Forest scores the applicants. After we chose the configuration, the same cost rule removed five weak missing flags, so the forest uses 22 of the 27 inputs. The decision rule has three bands around the threshold: approve below 0.10, refer 0.10 to 0.25 to an underwriter, and decline above 0.25. A surrogate decision tree reproduces 93 percent of the forest's decisions on unseen applicants. Its three rules are on the slide. Per-applicant risk drivers, built before the shadow run, give each decline its own reason. The result on 1,788 unseen applicants: 93 percent of defaulters caught, and two of every three flagged applicants really defaulted.");
}

// 11. Threshold choice
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  s.addText("Why a 0.15 threshold: it is a business dial, not a constant", { placeholder: "title" });
  const labels = ["0.05", "0.10", "0.15", "0.20", "0.25", "0.30", "0.35", "0.40", "0.45", "0.50", "0.55", "0.60", "0.65", "0.70"];
  s.addChart(pres.charts.LINE, [
    { name: "Defaulters caught (recall) %", labels, values: [98.4, 96.2, 93.7, 90.2, 86.7, 83.9, 81.2, 78.2, 75.1, 71.0, 66.7, 61.3, 53.0, 45.4] },
    { name: "Precision %", labels, values: [43.8, 56.6, 63.9, 68.0, 70.7, 73.0, 75.4, 77.8, 80.2, 82.7, 85.5, 87.8, 89.4, 91.0] },
  ], { ...chartFrame(), x: 0.4, y: 1.2, w: 5.3, h: 3.5, chartColors: [H.accent5, H.accent1], lineSize: 2.5, lineDataSymbol: "circle", lineDataSymbolSize: 6,
       showLegend: true, legendPos: "b", legendFontSize: 10, valAxisMinVal: 40, valAxisMaxVal: 100, valAxisLabelFormatCode: "0", catAxisTitle: "probability threshold", showCatAxisTitle: true, catAxisTitleFontSize: 10, catAxisTitleColor: H.accent6,
       title: "Selected Random Forest, out-of-fold on training rows", objectName: "threshold chart" });
  [["At 0.50, the usual threshold", "64 defaulters missed per 1,000", "28 good customers flagged per 1,000", "$635k indicative cost per 1,000", C.accent6],
   ["At 0.15, proposed", "15 defaulters missed per 1,000", "About 90 good customers flagged per 1,000", "$310k indicative cost per 1,000", C.accent5]].forEach(([t, a, b, c, col], i) => {
    const y = 1.25 + i * 1.75;
    card(s, 5.9, y, 3.7, 1.6, { name: `threshold card ${i + 1}` });
    s.addText(t, { x: 6.1, y: y + 0.1, w: 3.3, h: 0.4, fontSize: 14, bold: true, color: col, margin: 0, isTextBox: true, objectName: `threshold card title ${i + 1}` });
    s.addText(bullets([a, b, c], 12), { x: 6.1, y: y + 0.52, w: 3.3, h: 1.0, valign: "top", margin: 0, isTextBox: true, objectName: `threshold card body ${i + 1}` });
  });
  s.addText("Curves: out-of-fold predictions on the training rows. Cards: test set, at $9,000 per missed defaulter and $2,000 per wrongly declined customer. The optimum stays at 0.15 for cost ratios 4.5:1 to 8:1 and on a finer grid.", { x: 0.5, y: 4.78, w: 9.0, h: 0.36, fontSize: 9, color: C.accent6, margin: 0, isTextBox: true, objectName: "threshold footnote" });
  notes(s, "The model outputs a probability, and 0.5 is only a convention. We chose the threshold on out-of-fold predictions of the training rows, so the test set played no part. Moving it to 0.15 cuts missed defaulters from 64 to 15 per thousand applicants on the test set. The price is flagging about 90 instead of 28 good customers. It is the cheapest operating point for any cost ratio between four and a half and eight to one. Our assumed ratio of four and a half to one sits at the lower edge of that range. The threshold sits just below the textbook break-even of 0.18, because the forest's scores understate risk in the decision range.");
}

// =====================================================================================
pres.addSection({ title: "Recommendations" });

// 12. Business impact
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Recommendations" });
  s.addText("Business impact: an indicative $9 million a year", { placeholder: "title" });
  const rows = [
    [{ text: "Per year, 6,000 applications", options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 } } }, { text: "Current process", options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 } } }, { text: "With the proposed model", options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 } } }],
    ["Loans that default", "about 1,200 (20%)", "about 90 missed"],
    ["Default-related losses", "about $10.8M", "about $0.8M"],
    ["Good customers flagged at 0.15", "none", "about 540, margin forgone about $1.1M"],
    [{ text: "Total cost of credit errors", options: { bold: true } }, { text: "about $10.8M", options: { bold: true } }, { text: "about $1.9M", options: { bold: true } }],
  ];
  s.addTable(rows, { x: 0.5, y: 1.3, w: 5.8, colW: [2.4, 1.5, 1.9], fontSize: 11.5, fontFace: "Calibri", color: H.dk1, border: { type: "solid", pt: 0.5, color: "BFBFBF" }, rowH: 0.42, valign: "middle", margin: 0.06, objectName: "impact table" });
  card(s, 6.6, 1.3, 3.0, 2.1, { fill: C.accent1, line: C.accent1, name: "benefit card" });
  s.addText("~$9M", { x: 6.7, y: 1.4, w: 2.8, h: 0.95, fontSize: 40, bold: true, color: C.background1, align: "center", valign: "bottom", margin: 0, isTextBox: true, objectName: "benefit number" });
  s.addText("indicative gross annual benefit. About $8.8M after running costs, $8.5M in the first year live", { x: 6.7, y: 2.4, w: 2.8, h: 0.9, fontSize: 11, color: C.background2, align: "center", valign: "top", margin: 0, isTextBox: true, objectName: "benefit label" });
  s.addText(bullets([
    "Assumptions: 6,000 applications a year. $9,000 lost per missed defaulter. $2,000 margin forgone per wrongly declined customer. Test performance holds in production",
    "Measured on the loans the bank approves today, before mandatory verification",
    "Cost: $300-400k one-off and about $100k a year. Repaid in the first year live even at a quarter of the benefit",
    "Also: faster, consistent decisions and an auditable reason for every decline",
  ], 11.5), { x: 0.5, y: 3.6, w: 9.1, h: 1.55, valign: "top", margin: 0, isTextBox: true, objectName: "impact bullets" });
  notes(s, "With round-number assumptions, the bank's cost of credit errors falls from about 10.8 million to about 1.9 million a year on 6,000 applications. The benefit is an extra screen on loans the bank approves today. It costs roughly 300 to 400 thousand dollars one-off and about 100 thousand a year to run. So the net is about 8.8 million a year, and 8.5 million in the first year live, after the one-off cost. Even if the real benefit were a quarter of that, the project repays its cost inside a year. Finance should replace these assumptions with actual loss and margin figures.");
}

// 13. Recommendations and roadmap
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Recommendations" });
  s.addText("Recommendations and implementation roadmap", { placeholder: "title" });
  const phases = [
    ["Months 0-2: prepare", ["Mandatory income and valuation verification", "Scoring pipeline and per-applicant risk drivers", "Threshold check with real loss figures. Fairness review"]],
    ["Months 2-4: shadow run", ["Score every application alongside the manual decision", "Test on past applicants with a recorded ratio. Tune the bands", "Train underwriters on risk drivers and referrals"]],
    ["Month 4 onwards: scale", ["Automate clear approvals and declines", "Monitor the approval rate monthly, recall and precision as outcomes arrive", "Re-train after 12+ months of verified outcomes, then yearly"]],
  ];
  phases.forEach(([title, items], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.3, 2.9, 2.25, { name: `phase card ${i + 1}` });
    numberedCircle(s, x + 0.15, 1.42, i + 1);
    s.addText(title, { x: x + 0.65, y: 1.42, w: 2.15, h: 0.42, fontSize: 13, bold: true, color: C.accent1, margin: 0, isTextBox: true, valign: "middle", objectName: `phase title ${i + 1}` });
    s.addText(bullets(items, 11), { x: x + 0.15, y: 1.9, w: 2.6, h: 1.6, valign: "top", margin: 0, isTextBox: true, objectName: `phase bullets ${i + 1}` });
  });
  s.addText("Policy rules to adopt now, independent of the model", { x: 0.5, y: 3.68, w: 9.0, h: 0.35, fontSize: 13, bold: true, color: C.accent2, margin: 0, isTextBox: true, objectName: "rules title" });
  s.addText(bullets([
    "Decline or escalate above a 45% debt-to-income ratio (87-100% of these applicants defaulted)",
    "Refer 2+ delinquent credit lines (45% defaulted at two) or 2+ major derogatory reports (51% at two) to an underwriter",
    "Treat a missing income or property valuation as high risk, never as neutral",
    "Where a rule and the score disagree, the stricter outcome applies",
  ], 11.5), { x: 0.5, y: 4.03, w: 9.0, h: 1.15, valign: "top", margin: 0, isTextBox: true, objectName: "rules bullets" });
  notes(s, "The roadmap has three phases: prepare, shadow run, then scale. There are three policy rules the bank can adopt immediately, with or without the model. First, set a debt-to-income limit of 45 percent. Second, refer anyone with two or more delinquencies or derogatory reports to an underwriter. Third, treat a missing income or valuation as high risk and require verification. We read the first two thresholds straight from the observed default rates. Where a rule and the score disagree, the stricter outcome applies. The approve, refer and decline shares on the solution slide come from the score alone. Applicants referred by these rules come on top of the 7 percent referral band.");
}

// 14. Risks and next steps
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Recommendations" });
  s.addText("Risks, challenges and further analysis", { placeholder: "title" });
  card(s, 0.5, 1.3, 5.4, 3.85, { name: "risks card" });
  s.addText("Risks and mitigations", { x: 0.7, y: 1.4, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: C.accent2, margin: 0, isTextBox: true, objectName: "risks title" });
  s.addText(bullets([
    "Selection bias (the data holds approved loans only): shadow run on all applications, then estimate outcomes for declined applicants (reject inference)",
    "The missing-ratio signal fades once verification is mandatory: re-test on applicants with a recorded ratio before go-live (81% caught at 78% precision)",
    "Economic drift: monitor monthly, re-train yearly, review the threshold",
    "Fair lending: 11% of good applicants flagged at 0.15 (3% at 0.5). Disparate-impact test before go-live. Fallback without occupation ready (about 13% more cost)",
    "Automation bias: per-applicant risk drivers, a referral band, documented overrides",
  ], 12.5), { x: 0.7, y: 1.88, w: 5.0, h: 3.2, valign: "top", margin: 0, isTextBox: true, objectName: "risks bullets" });
  card(s, 6.1, 1.3, 3.5, 3.85, { name: "next steps card" });
  s.addText("Further analysis", { x: 6.3, y: 1.4, w: 3.1, h: 0.4, fontSize: 14, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "next title" });
  s.addText(bullets([
    "Reject inference (needs 12+ months of data)",
    "Engineered features: loan-to-value ratio, debt-to-income bands, interaction terms",
    "Gradient boosting and probability calibration",
    "Time-based validation once application dates exist",
  ], 12.5), { x: 6.3, y: 1.88, w: 3.1, h: 3.2, valign: "top", margin: 0, isTextBox: true, objectName: "next bullets" });
  notes(s, "Three risks matter most. First, selection bias: the data covers only loans the old process approved. So the shadow run scores every application, including the ones underwriters decline, and reject inference, which estimates how declined applicants would have performed, follows after a year of outcomes. Second, the missing-ratio signal fades once verification is mandatory. Before go-live we test the model on past applicants with a recorded ratio, where it already catches 81 percent of defaulters at 78 percent precision. Third, fair lending. No input is a protected characteristic, but occupation and credit-history length could act as proxies. The 0.15 threshold also wrongly flags 11 percent of creditworthy applicants, against 3 percent at 0.5. So compliance tests approval and error rates across protected groups before go-live, every year and at each threshold change. If the review requires it, the forest without occupation is ready at about 13 percent more cost. Next steps are reject inference, engineered ratios, calibration and time-based validation.");
}

// 15. Close
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Recommendations" });
  s.addText("Thank you", { placeholder: "title" });
  s.addText([
    { text: "Questions and discussion", options: { fontSize: 18, color: C.background2, breakLine: true } },
    { text: "Catch 93% of defaulters. Explain every decision. Save an indicative $9M a year.", options: { fontSize: 13, color: C.accent4 } },
  ], { placeholder: "body" });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.45, w: 0.9, h: 0.08, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "close marker" });
  notes(s, "Likely questions and short answers.\nWhy recall, if cost decides the final choice? Recall is the primary metric for the individual models, because a missed defaulter costs about 4.5 times a wrong decline. Expected cost puts recall and precision into dollars, so we used it for the final choice of model and threshold.\nWhy 0.15 and not 0.5? At 0.5 the forest misses 64 defaulters per thousand applicants. At 0.15 it misses 15. The threshold is the cheapest for cost ratios from 4.5 to 1 up to 8 to 1.\nHow robust is 0.15? It holds on a finer grid. On two other train and test splits, the 27-input forest also chose 0.15. Applicants scored 0.15 to 0.20 defaulted about 28 percent of the time, which is why the optimum sits just below the textbook break-even of 0.18.\nWhy remove five flags? They carry about 2 percent of the decision power, and the cost stays within one standard error without them. Fewer inputs are easier to explain and to monitor. A final check on the same folds compared 22 inputs with all 27 and kept the smaller set.\nWhy not a simpler model? At their own best thresholds the decision tree and the logistic regression cost 607 and 550 thousand dollars per thousand applicants, against 324 thousand for the forest. The surrogate tree gives the forest a readable rule list.\nHow is fair lending handled? No input is a protected characteristic. Occupation and credit-history length could act as proxies, so compliance tests approval and error rates across protected groups before go-live, yearly and at each threshold change. A 16-input forest without occupation is ready at about 13 percent more cost.\nWhat about applicants the old process declined? The data holds only approved loans. The shadow run scores every application, and reject inference follows after 12 months of outcomes.\nIs a fully grown forest over-fitted? Each tree fits its own training sample, but the average of 200 trees generalises. The ROC-AUC is 0.960 out-of-fold and 0.961 on the test set, and the test cost of 310 thousand is consistent with the out-of-fold 324 thousand.\nWhere do the 9,000 and 2,000 dollars come from? Defaulted loans average 16,900 dollars. With about half recovered through the collateral, plus collection costs, a missed defaulter costs about 9,000. A wrong decline forgoes about 2,000 of interest margin. Both are indicative, and finance should replace them.\nHow do the bands change the figures? The headline figures are for the single 0.15 threshold. Under the bands, the share of defaulters caught lies between 88 and 96 percent, depending on what underwriters do with the 7 percent they review.");
}

// =====================================================================================
pres.addSection({ title: "Appendix" });

// A1. Full comparison table
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
  s.addText("Appendix A: all models on the held-out test set", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 } } });
  const rows = [
    [hdr("Model"), hdr("Recall"), hdr("Precision"), hdr("F1"), hdr("Accuracy"), hdr("ROC-AUC"), hdr("Train recall")],
    ["Logistic Regression (plain)", "57%", "77%", "0.65", "88%", "0.91", "63%"],
    ["Logistic Regression (balanced, regularisation tuned)", "80%", "61%", "0.69", "86%", "0.91", "82%"],
    ["Decision Tree (standard settings)", "69%", "71%", "0.70", "88%", "0.81", "100%"],
    ["Decision Tree (class weights 0.2/0.8)", "62%", "72%", "0.66", "88%", "0.78", "100%"],
    ["Decision Tree (tuned: balanced, at least 20 per leaf)", "82%", "53%", "0.64", "82%", "0.88", "92%"],
    ["Bagged trees (200 fully grown trees)", "68%", "83%", "0.75", "91%", "0.95", "100%"],
    ["Bagged trees (class-weighted trees)", "60%", "81%", "0.69", "89%", "0.95", "100%"],
    ["Random Forest (standard settings, 200 trees)", "69%", "84%", "0.76", "91%", "0.96", "100%"],
    ["Random Forest (class weights 0.2/0.8)", "77%", "77%", "0.77", "91%", "0.96", "100%"],
    ["Random Forest (tuned for recall)", "79%", "66%", "0.72", "88%", "0.93", "92%"],
    ["Random Forest (tuned for recall, 12 inputs)", "78%", "66%", "0.72", "88%", "0.93", "92%"],
    [{ text: "Proposed: Random Forest, 22 inputs, threshold 0.15", options: { bold: true } }, { text: "93%", options: { bold: true } }, { text: "67%", options: { bold: true } }, { text: "0.78", options: { bold: true } }, { text: "90%", options: { bold: true } }, { text: "0.96", options: { bold: true } }, "-"],
  ];
  s.addTable(rows, { x: 0.5, y: 1.25, w: 9.0, colW: [3.9, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85], fontSize: 10.5, fontFace: "Calibri", color: H.dk1, border: { type: "solid", pt: 0.5, color: "BFBFBF" }, rowH: 0.27, valign: "middle", margin: 0.03, align: "left", objectName: "full comparison table" });
  s.addText("Test set of 1,788 applicants at the 0.5 threshold except the proposed model. A train recall of 100% is normal for fully grown trees and forests, so only the test columns show how a model generalises. Proposed model: ROC-AUC 0.960 out-of-fold on the training rows, 0.961 on test.", { x: 0.5, y: 4.82, w: 9.0, h: 0.33, fontSize: 9, color: C.accent6, margin: 0, isTextBox: true, objectName: "table footnote" });
  notes(s, "All models on the test set. We fixed the selection rule beforehand: lowest mean cost, and the simplest set-up among those within one standard error, about 10,500 dollars per thousand applicants. On the seed-averaged input curve one standard error is about 9,700 dollars, and the same rule kept 22 inputs. The mean out-of-fold ROC-AUC of the proposed model is 0.960, against 0.961 on the test set.");
}

// A2. Feature importance
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
  s.addText("Appendix B: what the Random Forest relies on", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [
    { name: "Importance", labels: ["Debt-to-income ratio missing", "Debt-to-income ratio", "Age of oldest credit line", "Delinquent credit lines", "Property value", "Loan amount", "Number of credit lines", "Mortgage balance", "Years at current job", "Major derogatory reports", "Recent credit inquiries", "Property value missing"],
      values: [17.2, 14.4, 8.7, 8.0, 7.5, 7.2, 6.8, 6.7, 5.3, 4.7, 3.6, 2.9] },
  ], { ...chartFrame(), x: 0.4, y: 1.2, w: 5.8, h: 3.9, barDir: "bar", chartColors: [H.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0",
       valAxisMaxVal: 24, valAxisLabelFormatCode: "0", catAxisOrientation: "maxMin", title: "Impurity-based importance (%), final Random Forest", objectName: "feature importance chart" });
  s.addText(bullets([
    "The debt-to-income ratio and its missing flag carry a third of the forest's decision power. With delinquent lines and credit-history length, about half",
    "Permutation importance ranks the same four at the top, delinquent credit lines first",
    "Loan, property and mortgage amounts matter in combination, little on their own",
    "The input-reduction step removed five weak missing flags (about 2% of the decision power) at no cost beyond one standard error",
    "Logistic-regression coefficients, tree rules and the surrogate tree point to the same drivers",
  ], 11.5), { x: 6.4, y: 1.25, w: 3.2, h: 3.9, valign: "top", margin: 0, isTextBox: true, objectName: "importance bullets" });
}

// A3. Decision rules
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
  s.addText("Appendix C: the explanation layer, rules of the surrogate tree that follows the forest", { placeholder: "title" });
  const rules = [
    ["1", "Is the debt-to-income ratio missing?", "Yes: flag, whatever the credit history (62% of these applicants defaulted). Check income before approving."],
    ["2", "If recorded, is the ratio above about 44%?", "Yes: flag (87-100% of applicants above 45% defaulted)."],
    ["3", "Ratio at or below 44%: a delinquent credit line and a credit history of about 8 years or less?", "Yes: flag. Otherwise clear. In this group, applicants with no delinquent line default only about 5% of the time."],
    ["4", "How faithful are these rules?", "They reproduce 93% of the forest's decisions on unseen applicants. A rule that never flags anyone would agree 73% of the time. Per-applicant risk drivers give each decline its own reason."],
    ["5", "What the rules do not use", "Loan size, derogatory reports, occupation and loan purpose do not change the surrogate's outcome. They matter only in combination inside the forest."],
  ];
  rules.forEach(([n, q, a], i) => {
    const y = 1.3 + i * 0.72;
    numberedCircle(s, 0.5, y + 0.1, Number(n));
    s.addText(q, { x: 1.1, y, w: 3.6, h: 0.66, fontSize: 12.5, bold: true, color: C.accent1, margin: 0, isTextBox: true, valign: "middle", objectName: `rule question ${n}` });
    s.addText(a, { x: 4.8, y, w: 4.8, h: 0.66, fontSize: 12, color: C.text1, margin: 0, isTextBox: true, valign: "middle", objectName: `rule answer ${n}` });
    if (i < rules.length - 1) s.addShape(pres.shapes.LINE, { x: 1.1, y: y + 0.69, w: 8.5, h: 0, line: { color: "E3E3E3", width: 0.75 }, objectName: `rule divider ${n}` });
  });
  s.addText("Surrogate: depth-4 tree, at least 20 applicants per leaf, fitted to the forest's out-of-fold flag/clear decisions at threshold 0.15 on the training rows. The stand-alone tuned tree (test recall 82%, precision 53%) found the same drivers.", { x: 0.5, y: 4.88, w: 9.0, h: 0.3, fontSize: 9, color: C.accent6, margin: 0, isTextBox: true, objectName: "tree footnote" });
}

// A4. Pre-processing summary
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
  s.addText("Appendix D: data treatment and pre-processing", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 } } });
  const rows = [
    [hdr("Step"), hdr("What we did"), hdr("Why")],
    ["Duplicates", "None found. No rows removed", "All 5,960 loans kept"],
    ["Missing values", "A 0/1 'was missing' flag per field, then median (numeric) or mode (categorical) imputation learned on the training rows", "A missing debt-to-income ratio or property value is the strongest default signal. Removing rows would lose 44% of the data"],
    ["Outliers", "Inter-quartile capping for the linear model only. Derogatory reports and delinquent lines capped at the 99th percentile. Tree models use raw values", "Extreme values distort a linear model (debt-to-income 203%, credit history 97 years). Trees split on rank order"],
    ["Encoding and scaling", "One-hot encoding of loan purpose and occupation (first level dropped). Standard scaling for the linear model only. Flags stay 0/1", "Comparable coefficients for the linear model"],
    ["Split", "70% train / 30% test, stratified on the target, fixed seed, reserved before we fitted any statistic", "No leakage from test rows into medians, caps or scaling"],
    ["Imbalance", "Class weights inside the individual models, then the decision threshold for the final model. No resampling", "Keeps every real applicant. Class weights added nothing once we chose the threshold on cost"],
    ["Model inputs", "22 of 27 columns: the 10 numeric attributes, 6 missing flags (property value, loan purpose, occupation, years at job, derogatory reports, debt-to-income) and 6 loan-purpose and occupation indicators", "The input-reduction step removed five flags (mortgage balance, delinquent lines, credit-line age, inquiries, number of credit lines). A final check compared 22 inputs against all 27"],
  ];
  s.addTable(rows, { x: 0.5, y: 1.25, w: 9.0, colW: [1.5, 3.9, 3.6], fontSize: 10.5, fontFace: "Calibri", color: H.dk1, border: { type: "solid", pt: 0.5, color: "BFBFBF" }, valign: "middle", margin: 0.04, align: "left", objectName: "preprocessing table" });
}

// ---------------- write ----------------
(async () => {
  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
  const themeScript = process.env.PPTX_APPLY_THEME;
  if (themeScript && fs.existsSync(themeScript)) {
    const { applyTheme } = require(themeScript);
    await applyTheme(OUT, THEME);
    console.log("applied theme");
  } else {
    console.log("applyTheme helper not found; scheme colours use Office defaults");
  }
})();
