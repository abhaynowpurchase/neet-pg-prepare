import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env.local");
  process.exit(1);
}

const SubjectSchema = new mongoose.Schema({
  name: String, description: String,
  icon: { type: String, default: "BookOpen" },
  color: { type: String, default: "green" },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const ChapterSchema = new mongoose.Schema({
  subjectId: mongoose.Schema.Types.ObjectId,
  title: String, description: String,
  storyContent: String, highYieldNotes: String,
  order: Number, estimatedReadTime: Number,
}, { timestamps: true });

const QuestionSchema = new mongoose.Schema({
  chapterId: mongoose.Schema.Types.ObjectId,
  question: String, options: [String],
  correctAnswer: Number, explanation: String,
  examType: String, year: Number,
  difficulty: { type: String, default: "medium" },
}, { timestamps: true });

const HighYieldTopicSchema = new mongoose.Schema({
  chapterId: mongoose.Schema.Types.ObjectId,
  title: String, description: String,
  keyPoints: [String], order: Number,
}, { timestamps: true });

const Subject = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", ChapterSchema);
const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);
const HighYieldTopic = mongoose.models.HighYieldTopic || mongoose.model("HighYieldTopic", HighYieldTopicSchema);

// ─── Chapter data ──────────────────────────────────────────────────────────────

const chapters = [
  {
    title: "Epidemiology — Principles & Outbreak Investigation",
    description: "Distribution and determinants of disease; outbreak investigation and epidemic types.",
    order: 1, estimatedReadTime: 20,
    storyContent: `<h2>The Measles Outbreak in Rampur</h2>
<p>Dr. Priya Sharma stepped off the government jeep onto the dusty road of Rampur village. Twelve children had fallen ill with fever and rash in the past week. She needed to think like an epidemiologist — <em>Who, When, Where, Why.</em></p>
<h2>Building the Epidemic Curve</h2>
<p>She visited every household and recorded each case. By evening she had 14 confirmed cases clustered between Day 1 and Day 14 — a single-peaked curve. <strong>Point source epidemic</strong> — all exposed to the same source at roughly the same time.</p>
<p>Two cases appeared 16 days after the main cluster — children with infected siblings. Classic <strong>propagated spread</strong> overlaid on point source.</p>
<div class="highlight-box"><strong>The Epidemiological Triad</strong><br>• <strong>Agent</strong> — Measles virus (Morbillivirus)<br>• <strong>Host</strong> — Unvaccinated children aged 2–8<br>• <strong>Environment</strong> — Crowded school, poor ventilation</div>
<h2>Key Calculations</h2>
<p><strong>Attack Rate</strong> = 14/120 × 100 = <strong>11.7%</strong><br>
<strong>SAR</strong> = 2/8 susceptible siblings × 100 = <strong>25%</strong><br>
<strong>R₀ of measles</strong> = 12–18 (highest of any infectious disease)<br>
<strong>Herd immunity threshold</strong> = 1 − 1/R₀ = 1 − 1/15 = <strong>≥93%</strong></p>
<h2>Iceberg Phenomenon</h2>
<p>Several children had mild symptoms parents dismissed. Geoffrey Rose's <strong>Iceberg Phenomenon</strong>: the visible clinical cases are only the tip; many more subclinical cases lie hidden. Polio ratio = 1:200; measles ≈ 1:1.</p>
<h2>Control Measures</h2>
<p>Ring vaccination, isolation of cases (4 days after rash onset), notification on IDSP P-form and L-form. Measles is notifiable under IDSP within 24 hours.</p>`,
    highYieldNotes: `EPIDEMIC TYPES:
• Point source: All cases within 1 incubation period — single peak curve
• Propagated: Person-to-person — multiple peaks, each separated by 1 incubation period
• Mixed: Point source + propagated (classic example: measles in school)
• Common vehicle: Water/food-borne — explosive onset

ATTACK RATE = New cases / Population at risk × 100
SAR = Cases in contacts / Susceptible contacts × 100
R₀ (Basic Reproduction Number): Measles 12–18, Polio 5–7, Chickenpox 10–12, COVID-19 ~2.5
Herd immunity threshold = 1 – (1/R₀)

EPIDEMIOLOGICAL TRIAD: Agent → Host → Environment
Web of causation (Brian MacMahon) — multiple factors
Wheel model (Mausner) — genetic core + environment layers

ICEBERG PHENOMENON (Geoffrey Rose):
• Clinical cases = tip; subclinical = hidden mass
• Polio = 1:200, Measles ≈ 1:1, HIV = variable
• Implication: Disease burden is underestimated

NOTIFIABLE DISEASES (IDSP):
• Immediately: Cholera, Plague, Yellow Fever, AFP
• 24 hours: Dengue, Malaria, AES, measles, viral hepatitis
• Weekly: S-form (suspected), P-form (probable), L-form (lab-confirmed)`,
  },
  {
    title: "Screening — Principles & Test Validity",
    description: "Principles of screening, validity (sensitivity, specificity, predictive values), and Wilson-Jungner criteria.",
    order: 2, estimatedReadTime: 18,
    storyContent: `<h2>Dr. Mehta's Diabetes Screening Camp</h2>
<p>World Diabetes Day. Dr. Arjun Mehta organized a free blood sugar screening camp. His senior Dr. Kavitha pulled him aside: "What makes a good screening test?"</p>
<h2>The 2×2 Table</h2>
<div class="highlight-box">
<strong>In 1000 people screened (prevalence 10%):</strong><br>
100 have DM, 900 don't<br><br>
Sensitivity 80% → TP=80, FN=20<br>
Specificity 90% → TN=810, FP=90<br><br>
PPV = 80/(80+90) = <strong>47%</strong> — barely a coin flip!<br>
NPV = 810/(810+20) = <strong>97.6%</strong>
</div>
<p>This is why PPV collapses at low prevalence. Kamala's positive strip test needed confirmatory fasting glucose.</p>
<h2>The Threshold Dilemma</h2>
<p>Lower cutoff → ↑ sensitivity, ↓ specificity. The <strong>ROC curve</strong> shows this trade-off at every threshold. Best cutoff = closest to top-left corner (AUC → 1.0).</p>
<h2>Wilson-Jungner Criteria (1968)</h2>
<p>10 criteria for a good screening programme: Important condition, recognizable latent stage, effective treatment available, facilities exist, suitable test, acceptable test, natural history understood, agreed treatment policy, cost justified, continuing process.</p>`,
    highYieldNotes: `SENSITIVITY = TP/(TP+FN) × 100 — how well it detects the sick
• High sensitivity → few missed cases (↓ FN) — RULING OUT (SnNout)
SPECIFICITY = TN/(TN+FP) × 100 — how well it excludes healthy
• High specificity → few false alarms (↓ FP) — RULING IN (SpPin)

PPV = TP/(TP+FP) — rises with prevalence
NPV = TN/(TN+FN) — falls with prevalence
LR+ = Sensitivity/(1–Specificity) →>10 very useful
LR– = (1–Sensitivity)/Specificity → <0.1 very useful

CUTOFF EFFECTS:
• Lower cutoff → ↑ Sensitivity, ↓ Specificity
• Higher cutoff → ↓ Sensitivity, ↑ Specificity

BIASES IN SCREENING:
• Lead time bias — earlier diagnosis appears to increase survival without changing natural history
• Length bias — slow-progressing (less aggressive) cases over-represented
• Volunteer bias (healthy worker effect) — screened pop healthier than average

WILSON-JUNGNER (10 criteria — WHO 1968): Important condition, latent stage recognizable, effective treatment, facilities available, suitable test, acceptable, natural history known, agreed policy, economic balance, continuing process`,
  },
  {
    title: "Biostatistics — Research Methods & Statistics",
    description: "Study designs, statistical tests, p-values, confidence intervals, and types of error.",
    order: 3, estimatedReadTime: 22,
    storyContent: `<h2>The Journal Club Nobody Could Understand</h2>
<p>Dr. Neha stared at an RCT paper — p-values, CIs, standard deviations. Her statistician friend Rohit explained everything over coffee.</p>
<h2>Types of Data</h2>
<p><strong>Qualitative:</strong> Nominal (blood group), Ordinal (mild/severe), Dichotomous (yes/no)<br>
<strong>Quantitative:</strong> Discrete (number of children), Continuous (BP, weight)</p>
<h2>Normal Distribution — The 68-95-99.7 Rule</h2>
<p>In normal distribution: ±1 SD = 68%, ±2 SD = 95%, ±3 SD = 99.7%. Lab reference ranges = mean ± 2 SD (5% healthy people are "abnormal" by chance).</p>
<div class="highlight-box"><strong>Choosing the Right Test:</strong><br>
2 independent groups, normal → t-test<br>
2 paired groups → Paired t-test<br>
≥3 groups, normal → ANOVA (post-hoc: Tukey/Bonferroni)<br>
2 groups, non-normal → Mann-Whitney U<br>
Categorical → Chi-square (Fisher's if n&lt;5)<br>
Correlation: Pearson (normal), Spearman (non-normal)</div>
<h2>The p-value Explained</h2>
<p>p = 0.03 means: "If the null hypothesis (no effect) were true, there's only a 3% chance of getting results this extreme by random variation." p &lt; 0.05 = statistically significant — but NOT necessarily clinically important.</p>`,
    highYieldNotes: `STATISTICAL TESTS:
• 2 groups, normal, continuous → Independent t-test
• 2 paired/before-after, normal → Paired t-test
• ≥3 groups, normal → ANOVA; post-hoc: Tukey/Bonferroni
• 2 groups, non-normal/ordinal → Mann-Whitney U
• Before-after, non-normal → Wilcoxon signed-rank
• ≥3 groups, non-normal → Kruskal-Wallis
• Categorical association → Chi-square (expected ≥5) / Fisher's exact (<5)
• Correlation: Pearson (normal), Spearman (non-normal/ordinal)
• Survival analysis → Kaplan-Meier curve, Log-rank test, Cox proportional hazards

ERRORS:
• Type I (α) = False positive = 0.05 (5%)
• Type II (β) = False negative = 0.20 (20%)
• Power = 1 – β = 80%

NORMAL DISTRIBUTION: Mean = Median = Mode; ±2 SD = 95%
Positive skew: mean > median > mode (tail to right)
Negative skew: mean < median < mode (tail to left)

MEASURES:
• Variance = SD² ; CV = SD/Mean × 100
• 95% CI: if crosses zero (for difference) or 1 (for ratio) → not significant
• NNT = 1/ARR (Absolute Risk Reduction)`,
  },
  {
    title: "Study Designs in Epidemiology",
    description: "Observational and experimental study designs, strengths, limitations, and appropriate uses.",
    order: 4, estimatedReadTime: 18,
    storyContent: `<h2>Dr. Ananya's Research Dilemma</h2>
<p>Fresh from her MD, Dr. Ananya wanted to study whether smoking causes lung cancer. Her guide Professor Krishnan smiled: "The right answer depends on which question you're asking, and which study design you choose."</p>
<h2>The Hierarchy of Evidence</h2>
<p>Professor Krishnan drew a pyramid on the whiteboard. At the very top: <strong>Systematic Reviews and Meta-analyses</strong>. Below: <strong>RCTs</strong>, then <strong>Cohort studies</strong>, <strong>Case-control</strong>, <strong>Cross-sectional</strong>, <strong>Case reports</strong>, and at the base, <strong>Expert opinion</strong>.</p>
<div class="highlight-box"><strong>Observational Studies:</strong><br>
• Descriptive: Case report, Case series, Cross-sectional<br>
• Analytical: Case-control (backward), Cohort (forward), Cross-sectional<br><br>
<strong>Experimental Studies:</strong><br>
• RCT (gold standard for therapy), Field trial, Community trial</div>
<h2>Cohort Study</h2>
<p>Dr. Ananya enrolled 10,000 smokers and 10,000 non-smokers and followed them for 20 years. This is a <strong>prospective cohort</strong>. At the end: 200 smokers and 20 non-smokers developed lung cancer.</p>
<p><strong>Relative Risk (RR)</strong> = Incidence in exposed / Incidence in unexposed = (200/10,000) / (20/10,000) = <strong>10</strong> — smokers are 10× more likely to get lung cancer.</p>
<p><strong>Attributable Risk (AR)</strong> = 2% − 0.2% = <strong>1.8%</strong> — the excess risk due to smoking.</p>
<h2>Case-Control Study</h2>
<p>For rare cancers, she couldn't wait 20 years. Instead she selected 100 lung cancer patients (cases) and 100 healthy controls, then looked backward at smoking history. This gives <strong>Odds Ratio (OR)</strong> — an approximation of RR when disease is rare.</p>
<p>OR = (a×d) / (b×c) from the 2×2 table. OR ≈ RR when disease prevalence is &lt;10%.</p>
<h2>The RCT — Gold Standard</h2>
<p>To test a new drug, she randomized patients to treatment vs placebo. The randomization eliminates confounding. Double-blinding prevents observer and subject bias. This is why RCTs sit at the top of the evidence pyramid for therapeutic interventions.</p>
<h2>Cross-Sectional Study</h2>
<p>A quick survey measuring exposure and disease at the same time. Gives <strong>prevalence</strong>. Cannot establish temporal relationship (which came first?). Cheapest and fastest — good for planning health services.</p>`,
    highYieldNotes: `STUDY DESIGNS HIERARCHY (top to bottom):
Meta-analysis / Systematic review > RCT > Cohort > Case-control > Cross-sectional > Case series/report > Expert opinion

COHORT STUDY:
• Exposure → follow forward → Outcome (prospective) or past records (retrospective)
• Calculates: Incidence Rate, RR, AR, AR%, PAR
• Best for: Common diseases, multiple outcomes from one exposure
• Drawback: Expensive, time-consuming, loss to follow-up

CASE-CONTROL:
• Start from cases (outcome) → look backward at exposure
• Calculates: Odds Ratio (OR) ≈ RR when disease rare (<10%)
• Best for: RARE diseases, multiple exposures for one outcome
• Drawback: Recall bias, cannot calculate incidence

RCT:
• Gold standard for evaluating treatment efficacy
• Randomization eliminates confounding
• Double-blind prevents information bias
• Limitation: Expensive, ethical constraints, artificial setting

MEASURES OF ASSOCIATION:
• RR = (a/a+b) / (c/c+d) — from cohort
• OR = (a×d) / (b×c) — from case-control
• AR = Rate exposed – Rate unexposed
• AR% = AR / Rate exposed × 100
• PAR = Rate total – Rate unexposed (public health impact)
• NNT = 1/ARR

BRADFORD HILL CRITERIA (9): Strength, Consistency, Specificity, Temporality (MOST ESSENTIAL), Biological gradient (dose-response), Plausibility, Coherence, Experiment, Analogy`,
  },
  {
    title: "Universal Immunization Programme (UIP)",
    description: "Vaccines, cold chain, schedule, AEFI, and recent additions to India's UIP.",
    order: 5, estimatedReadTime: 20,
    storyContent: `<h2>The Cold Chain Crisis at Block Level</h2>
<p>Health Inspector Ramesh discovered a broken ILR (Ice-Lined Refrigerator) at the PHC storage room. It had been warm for 6 hours. Which vaccines were ruined? Which could still be used? He needed to know UIP inside out.</p>
<h2>The Cold Chain</h2>
<p>Vaccines are biological products — they die if exposed to heat (or in some cases, freezing). The cold chain is the system of people, equipment, and procedures that maintain vaccines at the right temperature from manufacturer to child.</p>
<div class="highlight-box"><strong>Temperature Requirements:</strong><br>
• ILR (Ice-Lined Refrigerator): +2°C to +8°C — stores BCG, DPT, Hepatitis B, Hib, IPV, PCV, Rotavirus, MR<br>
• Deep Freezer: −15°C to −25°C — stores OPV, Varicella, MMR<br>
• Vaccines that must NOT be frozen: DPT, DT, TT, Hepatitis B, IPV (destroyed by freezing)</div>
<h2>Vaccine Vial Monitor (VVM)</h2>
<p>Each OPV vial has a VVM — a small square within a circle on the cap. It darkens irreversibly on heat exposure. If inner square is lighter than outer circle → safe to use. If equally dark or darker → discard.</p>
<h2>UIP Schedule (National Immunization Schedule)</h2>
<p><strong>At birth:</strong> BCG, OPV-0 (within 24 hrs), Hepatitis B-0<br>
<strong>6 weeks:</strong> OPV-1, IPV-1, DPT-1, Hib-1, Hepatitis B-1, PCV-1, Rotavirus-1<br>
<strong>10 weeks:</strong> OPV-2, IPV-2 (fractional), DPT-2, Hib-2, PCV-2, Rotavirus-2<br>
<strong>14 weeks:</strong> OPV-3, IPV-3 (fractional), DPT-3, Hib-3, PCV-3, Rotavirus-3<br>
<strong>9–12 months:</strong> MR-1, JE-1 (in endemic areas), Vitamin A-1<br>
<strong>16–24 months:</strong> DPT-B1, OPV-B1, MR-2, JE-2, Vitamin A-2<br>
<strong>5–6 years:</strong> DPT-B2<br>
<strong>10 years and 16 years:</strong> TT (or Td)</p>
<h2>Recently Added Vaccines</h2>
<p>PCV (Pneumococcal Conjugate Vaccine) for pneumonia prevention. Rotavirus vaccine for diarrheal disease. fIPV (fractional IPV) at 6 and 14 weeks. HPV vaccine for adolescent girls (2023 budget announcement). MR replacing separate measles and MMR campaigns.</p>
<h2>AEFI — Adverse Events Following Immunization</h2>
<p>A child developed high fever and febrile seizure 12 hours after DPT. Ramesh had to classify this as an AEFI and report to the District Immunization Officer within 24 hours.</p>
<p>AEFI Classification: <strong>Vaccine reaction</strong> (program error, inherent property), <strong>Injection reaction</strong>, <strong>Coincidental</strong> (would have happened anyway), <strong>Unknown</strong>.</p>`,
    highYieldNotes: `UIP COLD CHAIN:
• Deep freezer (–15 to –25°C): OPV, Varicella
• ILR (+2 to +8°C): All other vaccines
• DO NOT FREEZE: DPT, DT, TT, Hep B, IPV, PCV (potency destroyed)
• Walk-in cold room (WIC): State/regional level storage
• VVM: inner square lighter than outer circle = safe; equally dark or darker = discard

NATIONAL IMMUNIZATION SCHEDULE KEY POINTS:
• BCG at birth (intradermal, left deltoid)
• OPV-0 at birth (within 24 hrs), then 6/10/14 weeks
• IPV: 6/10/14 weeks (fractional dose 0.1 mL ID at 10 and 14 weeks = fIPV)
• DPT: 6/10/14 weeks + booster at 16–24 months + 5–6 years
• MR: 9 months + 16–24 months
• PCV: 6/10/14 weeks (primary), 9 months (booster)
• Rotavirus: 6/10/14 weeks (only in selected states initially)
• Hepatitis B: Birth + 6/10/14 weeks (4-dose schedule)
• Vitamin A: 9 months (1st dose), then every 6 months till 5 years

AEFI CLASSIFICATION:
1. Vaccine product-related (intrinsic vaccine property)
2. Vaccine quality defect-related (manufacturing error)
3. Immunization error-related (program error)
4. Immunization anxiety-related
5. Coincidental (not causally related)

IMMUNIZATION COVERAGE TARGET: ≥90% national, ≥80% in each district (Mission Indradhanush)
Mission Indradhanush: Targets unvaccinated/partially vaccinated children`,
  },
  {
    title: "National TB Elimination Programme (NTEP)",
    description: "DOTS strategy, drug regimens, case definitions, MDR/XDR-TB, and Nikshay portal.",
    order: 6, estimatedReadTime: 18,
    storyContent: `<h2>The DOTS Dilemma in Ward 7</h2>
<p>Dr. Aisha Khan, a chest physician, admitted Raju — a 35-year-old construction worker with cough for 3 months, night sweats, and 8 kg weight loss. CBNAAT (Xpert MTB/RIF) came positive. Raju was a new case with rifampicin-sensitive TB. What regimen does he get?</p>
<h2>DOTS — The Revolution</h2>
<p>DOTS (Directly Observed Treatment, Short-course) transformed TB control globally. The principle: every dose is observed by a treatment supporter (ASHA, family member, community volunteer). This prevents <strong>drug resistance from emerging</strong> due to irregular treatment.</p>
<h2>Drug Regimen for New DS-TB</h2>
<div class="highlight-box"><strong>New Drug-Sensitive TB (DS-TB):</strong><br>
Intensive phase: 2 months — H R Z E (Isoniazid + Rifampicin + Pyrazinamide + Ethambutol)<br>
Continuation phase: 4 months — H R (Isoniazid + Rifampicin)<br>
Total: <strong>6 months</strong></div>
<p>Previously treated patients now get the same 6-month regimen (2HRZE/4HR) — Category II (2HRZES/1HRZE/5HRE) has been <strong>discontinued</strong>.</p>
<h2>Drug Resistance — The Growing Crisis</h2>
<p>Three months later, Sita arrived — a previously treated patient whose sputum remained positive. CBNAAT showed rifampicin resistance. DST confirmed MDR-TB.</p>
<p><strong>MDR-TB</strong> = Resistant to at least Isoniazid AND Rifampicin (the two most important first-line drugs)<br>
<strong>Pre-XDR-TB</strong> = MDR + resistant to any fluoroquinolone<br>
<strong>XDR-TB</strong> = MDR + resistant to any fluoroquinolone + at least one of bedaquiline/linezolid</p>
<h2>Nikshay & 99-DOTS</h2>
<p>Every TB patient in India must be notified on <strong>Nikshay</strong> (the national TB case management portal) within 24 hours of diagnosis — by both government and private providers. This is mandatory under the law.</p>
<p><strong>Nikshay Poshan Yojana</strong>: ₹500/month nutritional support to all TB patients during treatment.</p>
<p><strong>99-DOTS</strong>: Patient calls a toll-free number after taking each dose — adherence monitored digitally.</p>
<h2>Elimination Target</h2>
<p>India aims to <strong>eliminate TB by 2025</strong> (5 years ahead of the global End TB target of 2030). Target: &lt;1 TB case per 1,00,000 population per year.</p>`,
    highYieldNotes: `NTEP DRUG REGIMENS:
• New DS-TB: 2HRZE / 4HR (6 months total)
• Previously treated DS-TB: Same 2HRZE / 4HR (Cat II discontinued)
• MDR-TB: Longer regimen with bedaquiline, linezolid, clofazimine (BPaL or BPaLC)
• H = Isoniazid, R = Rifampicin, Z = Pyrazinamide, E = Ethambutol, S = Streptomycin

CASE DEFINITIONS:
• New: Never treated or <1 month treatment
• Previously treated: ≥1 month treatment in the past
• Bacteriologically confirmed: Positive smear, culture, or CBNAAT
• Clinically diagnosed: Not bacteriologically confirmed but treated as TB

DRUG RESISTANCE:
• MDR-TB: Resistant to H + R (both)
• Pre-XDR: MDR + any fluoroquinolone
• XDR-TB: MDR + fluoroquinolone + bedaquiline or linezolid
• Rifampicin-resistant (RR-TB): Treated as MDR

NIKSHAY:
• Mandatory notification for all TB cases within 24 hours
• Both private and government providers
• Nikshay Poshan Yojana: ₹500/month to patient
• 99-DOTS: Phone-based adherence monitoring

ELIMINATION TARGET: <1/1,00,000 by 2025 (India), <10/1,00,000 by 2030 (WHO End TB)
DOTS components: Political commitment, case detection, standardized treatment, drug supply, monitoring`,
  },
  {
    title: "Malaria & Vector-Borne Disease Control",
    description: "NVBDCP, malaria surveillance indices, dengue, filariasis, kala-azar, and vector control measures.",
    order: 7, estimatedReadTime: 18,
    storyContent: `<h2>Fever Season in Bastar</h2>
<p>District Malaria Officer Dr. Sanjay reviewed the weekly surveillance data from Bastar district. The slide positivity rate (SPR) had crossed 5% in three blocks. Time to activate the outbreak response protocol.</p>
<h2>Malaria Surveillance Indices</h2>
<div class="highlight-box"><strong>Key Surveillance Indices:</strong><br>
• ABER (Annual Blood Examination Rate) = Blood smears examined / Population × 100<br>
  Target: ≥10% (minimum for adequate surveillance)<br>
• SPR (Slide Positivity Rate) = Positive slides / Total examined × 100<br>
  SPR ≥2% = high transmission zone<br>
• API (Annual Parasite Incidence) = Confirmed malaria cases / Population × 1000<br>
  API ≥2 = high incidence area</div>
<h2>Malaria Control — NVBDCP</h2>
<p>Under NVBDCP (National Vector Borne Disease Control Programme), Dr. Sanjay activated IRS (Indoor Residual Spraying) with DDT (or malathion in resistant areas), distributed LLINs (Long-Lasting Insecticidal Nets) to high-risk households, and set up weekly RDT screening camps at sub-centres.</p>
<p>Importantly, he knew the vectors: <strong>Anopheles culicifacies</strong> — rural malaria; <strong>Anopheles stephensi</strong> — urban malaria (breeds in cisterns, overhead tanks). Treating water storage with Temephos (larvicide) is key for urban malaria control.</p>
<h2>Dengue — The Urban Menace</h2>
<p>Simultaneously, Bengaluru reported dengue cluster cases. Aedes aegypti — a daytime biter that breeds in clean, stagnant water (flower pots, tyres, coolers) — was the vector.</p>
<p>Dengue has 4 serotypes (DENV 1–4). <strong>Secondary infection with a different serotype</strong> → antibody-dependent enhancement → Dengue Hemorrhagic Fever (DHF) or Dengue Shock Syndrome (DSS).</p>
<p><strong>Diagnosis timeline:</strong> Days 1–5: NS1 antigen (highest yield in early febrile phase). Day 5+: IgM ELISA. After 2 weeks: IgG (past exposure).</p>
<h2>Filariasis Elimination</h2>
<p>Annual Mass Drug Administration (MDA) with <strong>DEC + Albendazole</strong> to all eligible population (except pregnant women, children &lt;2 years, severely ill). Target: Mf rate &lt;1% — then stop MDA. Vector: <strong>Culex quinquefasciatus</strong>.</p>
<h2>Kala-azar Elimination</h2>
<p>Visceral Leishmaniasis caused by <em>Leishmania donovani</em>, transmitted by <strong>Phlebotomus argentipes</strong> (sandfly). Elimination target: &lt;1 case per 10,000 at block level. Diagnosis: rK39 rapid test. Treatment: Liposomal amphotericin B (single dose) or miltefosine.</p>`,
    highYieldNotes: `MALARIA SURVEILLANCE INDICES:
• ABER ≥10% = adequate surveillance
• SPR ≥2% = high transmission area
• API ≥2 = high incidence area
• Parasite Index (PI) = malaria positives per 100 population examined

MALARIA VECTORS:
• Anopheles culicifacies — rural malaria (most common)
• Anopheles stephensi — urban malaria
• Anopheles fluviatilis — forest/foothills
• Anopheles minimus — North-East India

DENGUE:
• Vector: Aedes aegypti (daytime biter, domestic breeder)
• 4 serotypes (DENV 1-4); secondary heterologous infection → DHF/DSS
• Diagnosis: NS1 antigen (day 1-5), IgM ELISA (day 5+), IgG (convalescent)
• WHO criteria for DHF: Fever + hemorrhage + thrombocytopenia (<1 lakh) + evidence of plasma leakage

LYMPHATIC FILARIASIS:
• Agent: Wuchereria bancrofti; Vector: Culex quinquefasciatus
• Diagnosis: Night blood smear (microfilariae nocturnal periodicity)
• MDA: DEC + Albendazole annually until Mf rate <1%

KALA-AZAR:
• Agent: Leishmania donovani; Vector: Phlebotomus argentipes
• Elimination: <1/10,000 at block level
• Diagnosis: rK39, DAT, IFAT, splenic aspirate (gold standard)
• Treatment: Liposomal AmB (1st line), miltefosine`,
  },
  {
    title: "Nutrition & Nutritional Disorders",
    description: "PEM, micronutrient deficiencies, ICDS scheme, RDA values, and nutritional programmes.",
    order: 8, estimatedReadTime: 20,
    storyContent: `<h2>Two Children, Two Fates</h2>
<p>Anganwadi worker Sunita noticed two severely malnourished children at the AWC (Anganwadi Centre). Ramu, age 3, had swollen legs, a pot belly, and patchy skin that peeled like flaking paint. Meena, age 2, was a skeletal child — thin as a stick, old-man face, ribs visible, but no swelling.</p>
<h2>Kwashiorkor vs Marasmus</h2>
<div class="highlight-box"><strong>Kwashiorkor (Protein deficiency):</strong><br>
• Oedema (mandatory feature — pitting, starts at feet)<br>
• Fatty liver, hepatomegaly<br>
• "Flaky paint" dermatosis, "Flag sign" in hair<br>
• Weight may be near normal due to oedema<br>
• Hypoalbuminaemia, hypoproteinaemia<br><br>
<strong>Marasmus (Energy + Protein deficiency):</strong><br>
• Severe wasting — "old man" face, "skin and bones"<br>
• No oedema<br>
• Loose hanging skin folds (baggy pants appearance)<br>
• Weight severely low (&lt;60% of expected)<br>
• Preservation of mental alertness</div>
<h2>Vitamin A Deficiency — Staging</h2>
<p>Dr. Lalitha examined a 2-year-old with night blindness. "Which stage of VAD?" she asked her intern.</p>
<p>XN — Night blindness (earliest symptom)<br>
X1A — Conjunctival xerosis<br>
X1B — <strong>Bitot's spots</strong> (triangular, foamy, on temporal conjunctiva — reversible)<br>
X2 — Corneal xerosis<br>
X3A — Corneal ulceration/keratomalacia (&lt;1/3 cornea)<br>
X3B — Corneal ulceration/keratomalacia (≥1/3 cornea — can lead to permanent blindness)<br>
XS — Corneal scar</p>
<h2>ICDS — India's Flagship Nutrition Programme</h2>
<p>ICDS (Integrated Child Development Services) provides 6 services through AWCs: Supplementary nutrition, Immunization, Health check-up, Referral services, Pre-school non-formal education, Nutrition and health education.</p>
<p>Beneficiaries: Children 0–6 years, pregnant and lactating women, adolescent girls (Kishori Shakti Yojana). AWW (Anganwadi Worker) + AWH (helper) at each AWC serving 400–800 population.</p>
<h2>SAM vs MAM</h2>
<p>SAM (Severe Acute Malnutrition): MUAC &lt;11.5 cm, OR W/H Z-score &lt;−3, OR bilateral pitting oedema. Managed at NRC (Nutrition Rehabilitation Centre) or CMAM.<br>
MAM (Moderate Acute Malnutrition): MUAC 11.5–12.5 cm, W/H Z-score −3 to −2.</p>`,
    highYieldNotes: `PEM:
• Kwashiorkor: Protein deficient; oedema (mandatory), flaky paint dermatosis, flag sign, fatty liver
• Marasmus: Energy + protein; severe wasting, no oedema, old man face, baggy pants skin
• Marasmic-kwashiorkor: Both features
• Gomez classification (weight-for-age): Grade I=75-89%, II=60-74%, III=<60%
• IAP grades (weight-for-age): IV (severe) = <60%

VITAMIN A DEFICIENCY (Bitot's most specific clinical sign):
XN (night blindness) → X1A (conjunctival xerosis) → X1B (Bitot's spots) → X2 (corneal xerosis) → X3A (ulcer <1/3) → X3B (ulcer ≥1/3, keratomalacia) → XS (scar)
Treatment: 2 lakh IU orally (1-5 years); 1 lakh IU (6-12 months)

IODINE DEFICIENCY:
Goiter → Cretinism (hypothyroidism in endemic areas)
Iodized salt: 15 ppm at manufacturer, 7.5-15 ppm at consumer level
Goitre rate >30% in community = iodine deficiency problem

SAM CRITERIA (any one):
• MUAC <11.5 cm (6-59 months)
• W/H Z-score <-3 SD
• Bilateral pitting oedema

ICDS (6 services): Supplementary nutrition, Immunization, Health check-up, Referral, Pre-school education, Nutrition & health education
Target: Children 0-6 years, pregnant/lactating mothers, adolescent girls

NUTRITIONAL ANAEMIA: Commonest nutritional deficiency worldwide = Iron deficiency`,
  },
  {
    title: "Environmental Health & Sanitation",
    description: "Water quality, purification, air pollution, sanitation methods, and housing standards.",
    order: 9, estimatedReadTime: 18,
    storyContent: `<h2>The Contaminated Well</h2>
<p>Following heavy rains in Mandya district, 40 villagers developed acute watery diarrhea. The local water supply — an open dug well — was the suspected source. Health Inspector Gopal collected water samples and tested residual chlorine: it was zero.</p>
<h2>Water Quality Standards</h2>
<div class="highlight-box"><strong>WHO/BIS Water Quality Standards:</strong><br>
• Bacteriological: E. coli = 0 per 100 mL in piped water<br>
• Residual chlorine: ≥0.2 mg/L at consumer end (≥0.5 mg/L leaving treatment plant)<br>
• pH: 6.5–8.5<br>
• Turbidity: &lt;1 NTU (piped), &lt;5 NTU acceptable</div>
<h2>Chlorination of Water</h2>
<p>Chlorination is the <strong>most practical and widely used</strong> method of water disinfection. Bleaching powder contains 25–35% available chlorine. The required dose for well disinfection: bleaching powder to achieve 0.5 mg/L residual chlorine after 30 minutes contact time.</p>
<p><strong>Horrock's apparatus</strong>: Field kit to determine the amount of bleaching powder needed for a specific water source. <strong>Chloroscope</strong>: Tests residual chlorine in water. <strong>JEM (Jar Elution Method)</strong>: Another field method.</p>
<h2>Water-Borne vs Water-Washed vs Water-Based Diseases</h2>
<p><strong>Water-borne</strong> (ingestion of contaminated water): Cholera, Typhoid, Hepatitis A/E, polio, dysentery<br>
<strong>Water-washed</strong> (poor hygiene/inadequate water): Scabies, trachoma, diarrhea<br>
<strong>Water-based</strong> (aquatic host essential): Guinea worm (Dracunculus), Schistosomiasis<br>
<strong>Water-related insect vector</strong> (breeding sites): Malaria, dengue, filariasis</p>
<h2>Air Pollution & Health</h2>
<p>PM2.5 (particles &lt;2.5 μm) are the most dangerous — they penetrate deep into alveoli. Sources: vehicles, industries, crop burning. Health effects: COPD, lung cancer, cardiovascular disease, low birth weight.</p>
<p><strong>Indoor air pollution</strong> from biomass fuels (chulhas) — responsible for COPD and pneumonia in women and children in rural India. WHO estimates 4 million deaths/year from household air pollution.</p>
<h2>Sanitation & Open Defecation</h2>
<p>Swachh Bharat Mission (SBM) targets ODF (Open Defecation Free) status. IHHL (Individual Household Latrine) — twin pit pour-flush latrine is most promoted. ODF status declared when all households have and use latrines and no open defecation observed.</p>`,
    highYieldNotes: `WATER QUALITY:
• E. coli: 0/100 mL piped water; <10/100 mL treated untreated
• Residual chlorine: ≥0.2 mg/L at consumer; ≥0.5 mg/L at treatment
• Bleaching powder: 25–35% available chlorine
• Horrock's apparatus: field test for chlorine dose requirement
• Chloroscope: tests residual chlorine

WATER PURIFICATION METHODS:
1. Storage and sedimentation (reduces turbidity)
2. Filtration: slow sand (Schmutzdecke removes bacteria), rapid sand
3. Chlorination: Most practical; kills bacteria not cysts/viruses
4. Boiling: Most reliable household method; 1 min rolling boil at sea level
5. UV irradiation, SODIS (Solar Disinfection)

AIR POLLUTION:
• PM2.5: most dangerous (deep lung penetration), associated with CVD, lung cancer
• PM10: reaches bronchi
• Sources: Vehicle emissions, industry, crop burning (India-specific)
• AQI (Air Quality Index): 0-50 Good; 51-100 Satisfactory; >300 Severe
• Indoor: Biomass fuel → COPD in women (rural India)

NOISE POLLUTION:
• Acceptable: 45 dB day, 35 dB night (residential)
• Noise-induced hearing loss: >85 dB, 8 hours/day; TTS vs PTS
• Boilermaker's disease: occupational noise hearing loss

LATRINE TYPES:
• Aqua privy, Septic tank, Pour flush (most promoted in India), Bore hole
• IHHL under SBM: twin pit pour-flush latrine
• Pucca latrine components: septic tank + soak pit`,
  },
  {
    title: "Occupational Health",
    description: "Pneumoconioses, occupational cancers, Factory Act 1948, ESIC, and occupational disease surveillance.",
    order: 10, estimatedReadTime: 18,
    storyContent: `<h2>The Breathless Miners of Jharkhand</h2>
<p>Dr. Kapoor from the Regional Occupational Health Centre visited a coal mine in Jharkhand. Fifteen miners complained of progressive breathlessness. Chest X-rays showed bilateral upper-lobe opacities. She suspected pneumoconiosis.</p>
<h2>The Pneumoconioses — Dust Diseases of the Lung</h2>
<div class="highlight-box"><strong>Major Pneumoconioses:</strong><br>
• <strong>Silicosis</strong>: Quartz/silica dust; foundry workers, stone masons, miners<br>
  — X-ray: bilateral nodules, UPPER LOBES; <strong>eggshell calcification</strong> of hilar lymph nodes (pathognomonic)<br>
  — Progressive Massive Fibrosis (PMF) in advanced stages<br>
• <strong>Coal Workers' Pneumoconiosis (CWP)</strong>: Coal dust; coal miners<br>
  — Simple CWP → Progressive Massive Fibrosis<br>
• <strong>Asbestosis</strong>: Asbestos; shipbuilders, construction workers, insulation<br>
  — Lower lobe fibrosis, pleural plaques; associated with <strong>mesothelioma</strong> (no safe dose)<br>
• <strong>Byssinosis</strong>: Cotton dust; textile workers<br>
  — <strong>Monday Morning Sickness</strong> — chest tightness worst on first day after weekend off<br>
  — Grade 1/2/3 based on days affected per week</div>
<h2>Occupational Cancers</h2>
<p>Percivall Pott (1775) described the first occupational cancer — <strong>scrotal cancer in chimney sweeps</strong> caused by soot (polycyclic aromatic hydrocarbons). This led to the understanding of chemical carcinogenesis.</p>
<p>Other occupational cancers:<br>
• <strong>Bladder cancer</strong>: Aniline dyes, rubber, benzidine (B-naphthylamine)<br>
• <strong>Lung cancer</strong>: Asbestos, chromium, nickel, arsenic, radon<br>
• <strong>Leukaemia</strong>: Benzene<br>
• <strong>Angiosarcoma of liver</strong>: Vinyl chloride monomer (PVC plants)<br>
• <strong>Nasal cancer</strong>: Nickel refining, hardwood dust</p>
<h2>Factory Act 1948</h2>
<p>Applies to: ≥10 workers with power / ≥20 workers without power. Key provisions: 48-hour work week, 9 hours per day maximum, 1 day rest per week, annual leave with wages (1 day per 20 days worked), medical examination for hazardous industries, prohibition of child labour (&lt;14 years).</p>
<h2>ESI Scheme</h2>
<p><strong>ESIC (Employees' State Insurance Corporation)</strong>: Covers workers with wages ≤₹21,000/month (₹25,000 for disabled workers). Benefits: medical care, sickness benefit (70% wages), maternity benefit, disablement benefit, dependent benefit, funeral expenses.</p>`,
    highYieldNotes: `PNEUMOCONIOSES:
• Silicosis: Quartz/SiO2; foundry workers; upper lobe nodules; eggshell calcification (PATHOGNOMONIC)
• CWP: Coal dust; coal miners; upper lobe
• Asbestosis: Lower lobe fibrosis + pleural plaques; mesothelioma (no safe threshold)
• Byssinosis: Cotton/flax/hemp; Monday morning sickness; reversible initially
• Bagassosis: Sugarcane bagasse (Thermoactinomyces)
• Farmer's lung: Moldy hay (Micropolyspora faeni) — extrinsic allergic alveolitis

OCCUPATIONAL CANCERS:
• First described: Scrotal cancer (Percivall Pott, 1775) — chimney sweeps, PAH
• Bladder: β-naphthylamine, benzidine (rubber, dye industry)
• Lung: Asbestos, Cr, Ni, As, radon, bis-chloromethyl ether
• Mesothelioma: Asbestos (only known cause)
• Leukaemia: Benzene
• Angiosarcoma liver: Vinyl chloride monomer
• Nasal: Nickel, hardwood, leather dust

FACTORY ACT 1948:
• Applies: ≥10 workers (power), ≥20 workers (no power)
• Work hours: 48 hrs/week; 9 hrs/day max
• Prohibited: Child labour (<14 years)
• Rest: 1 day/week; annual leave 1 day per 20 days worked

ESIC:
• Wage limit: ≤₹21,000/month (₹25,000 for disabled)
• Contributions: Employer 3.25% + Employee 0.75% of wages
• Benefits: Medical, sickness (70%), maternity, disablement, funeral`,
  },
  {
    title: "Demography & Vital Statistics",
    description: "Population dynamics, fertility/mortality rates, demographic transition, census, and registration of vital events.",
    order: 11, estimatedReadTime: 17,
    storyContent: `<h2>Reading India's Population Story</h2>
<p>Demography is the statistical study of human populations — their size, structure, and change over time. India is a land of dramatic demographic transitions, and understanding these numbers is crucial not just for exams, but for planning health services.</p>
<h2>Census of India</h2>
<p>India conducts a census every 10 years (decennial census). The 2011 census (the most recent with data) revealed: Population = 1.21 billion; Growth rate = 1.64%/year; Literacy = 74.04% (male 82.14%, female 65.46%); Sex ratio = <strong>940 females per 1000 males</strong> (child sex ratio 0-6 years = 919).</p>
<h2>Fertility Rates</h2>
<div class="highlight-box"><strong>Key Fertility Rates:</strong><br>
• CBR (Crude Birth Rate) = Live births / Midyear population × 1000<br>
• GFR (General Fertility Rate) = Live births / Women aged 15-49 × 1000<br>
• TFR (Total Fertility Rate) = Sum of Age-Specific Fertility Rates × 5<br>
  India TFR ≈ 2.0 (2020) — close to replacement level<br>
• NRR (Net Reproduction Rate): NRR = 1 = replacement fertility; India NRR ≈ 0.97<br>
• GRR (Gross Reproduction Rate): Only female births counted</div>
<h2>Mortality Rates</h2>
<p><strong>CDR</strong> = All deaths / Midyear population × 1000<br>
<strong>IMR</strong> = Deaths under 1 year / Live births × 1000 — <strong>most sensitive indicator of health status</strong> of a community<br>
India IMR ≈ 28 (2020, SRS)<br>
<strong>MMR</strong> = Maternal deaths / 100,000 live births; India MMR ≈ 97 (2018-2020, SRS)<br>
<strong>U5MR</strong> (Under-5 Mortality Rate) = Deaths under 5 / Live births × 1000</p>
<h2>Demographic Transition Theory</h2>
<p>Stage 1: High birth rate + High death rate = Stable, low population (pre-industrial)<br>
Stage 2: High birth rate + Declining death rate = Population explosion (early industrial)<br>
Stage 3: Declining birth rate + Low death rate = Slowing growth (late industrial)<br>
Stage 4: Low birth rate + Low death rate = Stable, aging population (post-industrial)</p>
<p>India is currently transitioning from <strong>Stage 3 to Stage 4</strong>. The <strong>demographic dividend</strong> — a large working-age population relative to dependents — creates an economic opportunity window.</p>
<h2>Age-Sex Pyramid Shapes</h2>
<p><strong>Expanding (triangular)</strong>: Broad base, developing countries, high fertility<br>
<strong>Stationary (bell-shaped)</strong>: Balanced birth and death rates<br>
<strong>Contracting (inverted)</strong>: Narrow base, aging population, low fertility (Japan, Europe)</p>`,
    highYieldNotes: `FERTILITY RATES:
• CBR = Live births/midyear pop × 1000 (India ~18-19)
• GFR = Live births/women 15-49 × 1000
• TFR = Sum of ASFR × 5; India TFR ≈ 2.0 (2020)
• GRR: only female births; NRR: GRR corrected for female mortality
• NRR = 1 = exact replacement; India NRR ≈ 0.97
• Replacement level TFR ≈ 2.1

MORTALITY RATES:
• CDR (Crude Death Rate) = Deaths/pop × 1000
• IMR = Deaths <1 year/live births × 1000 (BEST indicator of community health)
• India IMR ≈ 28/1000 live births (SRS 2020)
• MMR = Maternal deaths/100,000 live births; India ≈ 97 (SRS 2018-2020)
• Perinatal mortality = (Stillbirths + Early neonatal deaths <7 days)/Total births × 1000
• U5MR: India ≈ 32/1000 (2020)

CENSUS 2011:
• Population: 121.09 crore; Decadal growth: 17.7%
• Sex ratio: 940 (2001: 933); Child sex ratio (0-6): 919
• Literacy: 74.04% (M: 82.14%, F: 65.46%)

DEMOGRAPHIC TRANSITION:
Stage 1: High BR + High DR | Stage 2: High BR + ↓DR (explosion) | Stage 3: ↓BR + Low DR | Stage 4: Low BR + Low DR
India: Stage 3→4 transition

IMR COMPONENTS: Early neonatal (0-7 days) + Late neonatal (8-28 days) = NMR; Post-neonatal (1-11 months)`,
  },
  {
    title: "Primary Health Care & Health System in India",
    description: "Alma Ata Declaration, PHC structure, ASHA/ANM roles, NHM, and IPHS norms.",
    order: 12, estimatedReadTime: 17,
    storyContent: `<h2>The Architecture of Indian Healthcare</h2>
<p>Fresh medical graduate Dr. Prerna was posted at a rural PHC in Rajasthan. On her first day, she was overwhelmed — ASHA workers, ANMs, AWWs, sub-centres, CHCs. She needed to understand the entire system.</p>
<h2>Alma Ata Declaration 1978</h2>
<p>The International Conference on PHC at Alma Ata (now Almaty, Kazakhstan) in 1978 declared: <strong>"Health For All by 2000"</strong> through Primary Health Care.</p>
<p>PHC is defined as essential health care based on practical, scientifically sound, and socially acceptable methods — universally accessible through full community participation, at a cost the community and country can afford.</p>
<p>Key principles: Equitable distribution, Community participation, Intersectoral coordination, Appropriate technology, Focus on preventive and promotive care.</p>
<h2>India's Health Infrastructure Pyramid</h2>
<div class="highlight-box"><strong>Population norms (plains / hilly):</strong><br>
• Sub-Centre: 5,000 / 3,000 population → ANM + Male MPW<br>
• PHC: 30,000 / 20,000 population → 1 Medical Officer + 14 paramedical staff<br>
• CHC (Community Health Centre): 1,20,000 / 80,000 population<br>
  → 4 specialists (surgeon, physician, gynecologist, pediatrician)<br>
  → 30 beds (FRU: First Referral Unit)<br>
• Sub-District/Sub-Divisional Hospital, District Hospital</div>
<h2>ASHA — Accredited Social Health Activist</h2>
<p>ASHA is the key link between the community and the health system. One ASHA per 1,000 population (or per village if population &lt;1,000). Minimum qualification: 8th standard pass. Incentive-based (not salaried). Key role: <strong>Demand generation</strong> for health services, especially for institutional deliveries (JSY), immunization, tuberculosis DOTS, and family planning.</p>
<h2>National Health Mission (NHM)</h2>
<p>NHM has two sub-missions: NRHM (National Rural Health Mission, 2005) and NUHM (National Urban Health Mission, 2013). Key components: ASHA, Untied funds to sub-centres/PHCs (Rogi Kalyan Samiti), flexible operational plans, AYUSH mainstreaming, and monitoring through HMIS.</p>
<h2>IPHS Norms</h2>
<p>Indian Public Health Standards define minimum standard inputs (infrastructure, manpower, drugs, equipment) for each level of the health system. A PHC should have: 6 beds (4+2 for delivery), 24×7 availability for deliveries, essential medicines list, basic diagnostics.</p>`,
    highYieldNotes: `ALMA ATA DECLARATION:
• Year: 1978; Place: Alma Ata, USSR (now Almaty, Kazakhstan)
• Goal: Health For All by 2000 (HFA 2000)
• PHC principles: Equitable distribution, Community participation, Intersectoral coordination, Appropriate technology, Preventive + promotive focus

HEALTH INFRASTRUCTURE (Plains / Hilly / Tribal):
• Sub-Centre: 5,000 / 3,000 population; ANM + Male MPW
• PHC: 30,000 / 20,000; 1 MO + 14 parastaff; 6 beds
• CHC: 1,20,000 / 80,000; 4 specialists; 30 beds (FRU)
• Sub-Divisional Hospital: 3-5 lakh population
• District Hospital: Full specialist care

ASHA:
• 1 per 1,000 population (or per village <1000)
• Minimum: 8th standard pass; preferably married woman from same village
• Incentive-based (not salaried)
• Main role: Demand generation, JSY, immunization, TB DOTS, FP

ANM:
• Caretaker of Sub-Centre
• Serves 5,000 (plains), 3,000 (hilly)
• Reports to PHC MO

NHM (2005):
• NRHM (2005) + NUHM (2013)
• ASHA, Untied funds, RKS (Rogi Kalyan Samiti)
• VHSC (Village Health Sanitation and Nutrition Committee) at village level
• AMB (Annual Maintenance Block grant) to sub-centres`,
  },
  {
    title: "Non-Communicable Diseases — Prevention & Control",
    description: "NPCDCS, cancer screening, tobacco control (COTPA/MPOWER), and NCD risk factor surveillance.",
    order: 13, estimatedReadTime: 18,
    storyContent: `<h2>The Silent Epidemic</h2>
<p>In 2023, non-communicable diseases (NCDs) account for 63% of all deaths in India. CVD leads, followed by cancer, diabetes, and COPD. Dr. Meera, district NCD nodal officer, had to implement NPCDCS across 50 health facilities. She started with her biggest weapon: screening.</p>
<h2>NPCDCS — India's NCD Programme</h2>
<p>National Programme for Prevention and Control of Cancer, Diabetes, Cardiovascular Diseases and Stroke (NPCDCS). Key components: Population-level screening (30+ years), health promotion, capacity building, and district NCD clinics at CHC/District Hospital level.</p>
<p>Screening at PHC level: CBG (capillary blood glucose) for diabetes, BP measurement for hypertension, and opportunistic cancer screening using VIA/VILI for cervical cancer.</p>
<h2>Cancer Screening in India</h2>
<div class="highlight-box"><strong>Cancer Screening Protocols:</strong><br>
• <strong>Cervical cancer</strong>: VIA (Visual Inspection with Acetic Acid) — acetowhite lesion at transformation zone within 1 minute = positive. Target: Women 30-65 years, every 5 years<br>
• <strong>Breast cancer</strong>: Clinical Breast Examination (CBE) by trained health worker; mammography (>40 years, every 2 years)<br>
• <strong>Oral cancer</strong>: Direct Visual Examination of oral cavity; most practical for India (high tobacco use)</div>
<h2>Tobacco Control — COTPA & MPOWER</h2>
<p>COTPA (Cigarettes and Other Tobacco Products Act), 2003:<br>
• Section 4: No smoking in public places<br>
• Section 5: No tobacco advertisements<br>
• Section 6: No sale to minors (&lt;18 years); no sale within 100 meters of educational institutions<br>
• Section 7-9: Statutory health warnings on packaging (≥85% of pack surface)</p>
<p>WHO MPOWER Framework:<br>
<strong>M</strong>onitor tobacco use and prevention policies<br>
<strong>P</strong>rotect people from tobacco smoke<br>
<strong>O</strong>ffer help to quit tobacco use<br>
<strong>W</strong>arn about the dangers of tobacco<br>
<strong>E</strong>nforce bans on advertising<br>
<strong>R</strong>aise taxes on tobacco products</p>
<h2>CVD Risk Assessment</h2>
<p>Framingham Risk Score estimates 10-year CVD risk based on: Age, sex, total cholesterol, HDL, smoking status, systolic BP, diabetes. WHO/ISH risk prediction charts used in India for resource-limited settings.</p>
<h2>Metabolic Syndrome</h2>
<p>IDF criteria for South Asians: Central obesity (waist ≥90 cm men, ≥80 cm women) PLUS any 2 of: TG ≥150 mg/dL, HDL &lt;40/50 mg/dL, BP ≥130/85, FBG ≥100 mg/dL.</p>`,
    highYieldNotes: `CANCER EPIDEMIOLOGY IN INDIA:
• Most common cancer in Indian women: Breast cancer (urban), Cervical cancer (rural/overall)
• Most common cancer in Indian men: Oral cavity, Lung
• VIA: Acetowhite lesion within 1 min = positive; sensitivity ~70-80%, specificity ~80-90%
• Pap smear: sensitivity 50-60% (less sensitive than VIA in LMICs)
• Cervical cancer cause: HPV 16 and 18 (70% of cases); HPV vaccine = primary prevention

COTPA 2003:
• Section 4: No smoking in public places (punishable)
• Section 5: No advertisements (electronic, print, internet)
• Section 6(a): No sale to minors <18 years
• Section 6(b): No sale within 100 m of educational institutions
• Section 7-9: Health warnings ≥85% of pack (both sides)

MPOWER (WHO Framework): Monitor, Protect, Offer, Warn, Enforce, Raise taxes
NCD RISK FACTORS (WHO Global): Tobacco, alcohol, unhealthy diet, physical inactivity, air pollution

METABOLIC SYNDROME (IDF for South Asians):
Central obesity (M≥90, F≥80 cm) + any 2:
• TG ≥150; HDL <40(M)/<50(F); BP ≥130/85; FBG ≥100

PRIMORDIAL PREVENTION: Preventing risk factors from arising (e.g., preventing obesity in children) — before even primary prevention
PRIMARY: Preventing disease in at-risk but healthy individuals
SECONDARY: Early detection and treatment (screening)
TERTIARY: Rehabilitation, preventing complications`,
  },
];

// ─── Questions data ────────────────────────────────────────────────────────────

const questionsData: Record<string, {
  question: string; options: string[]; correctAnswer: number;
  explanation: string; examType: string; year: number; difficulty: string;
}[]> = {
  "Epidemiology — Principles & Outbreak Investigation": [
    {
      question: "In an epidemic, all cases occur within one incubation period. This type of epidemic is:",
      options: ["Propagated source epidemic", "Point source epidemic", "Mixed epidemic", "Common vehicle epidemic"],
      correctAnswer: 1,
      explanation: "Point source epidemic: all individuals exposed to the same source at approximately the same time, so all cases occur within one incubation period producing a single-peaked bell-shaped epidemic curve.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "The basic reproduction number (R₀) of measles is approximately:",
      options: ["2–5", "5–7", "12–18", "20–25"],
      correctAnswer: 2,
      explanation: "Measles R₀ = 12–18, one of the highest of any infectious disease. This means one case infects 12–18 susceptibles. Herd immunity threshold = 1 – 1/R₀ ≈ 93–95%.",
      examType: "NEET_PG", year: 2021, difficulty: "medium",
    },
    {
      question: "Secondary attack rate (SAR) is defined as the number of cases among contacts divided by:",
      options: ["Total population", "Susceptible contacts × 100", "All household members", "Total exposed persons"],
      correctAnswer: 1,
      explanation: "SAR = Cases among household contacts / Susceptible household contacts × 100. It measures transmissibility within a defined close-contact group.",
      examType: "INI_CET", year: 2023, difficulty: "medium",
    },
    {
      question: "Iceberg phenomenon in epidemiology refers to:",
      options: [
        "Complete surveillance of all cases",
        "Large number of subclinical cases underlying few clinical cases",
        "Outbreak occurring in winter resembling an iceberg shape",
        "Disease with high mortality but low incidence",
      ],
      correctAnswer: 1,
      explanation: "The iceberg phenomenon (Geoffrey Rose): Clinical cases are the visible tip; subclinical, mild, and undiagnosed cases form the hidden bulk. Polio ratio subclinical:clinical = 200:1.",
      examType: "UPSC_CMO", year: 2020, difficulty: "easy",
    },
    {
      question: "Herd immunity threshold for a disease with R₀ = 4 is:",
      options: ["25%", "50%", "75%", "95%"],
      correctAnswer: 2,
      explanation: "Herd immunity threshold = 1 – (1/R₀) = 1 – (1/4) = 0.75 = 75%. This is the minimum proportion of immune individuals needed to prevent epidemic spread.",
      examType: "NEET_PG", year: 2019, difficulty: "hard",
    },
    {
      question: "Which form is used for clinician-reported (probable) cases in IDSP?",
      options: ["S-form", "P-form", "L-form", "D-form"],
      correctAnswer: 1,
      explanation: "IDSP forms: S-form = Suspected cases (community/field), P-form = Probable/clinician-reported (confirmed clinically), L-form = Lab-confirmed cases. All are reported weekly.",
      examType: "NEET_PG", year: 2023, difficulty: "easy",
    },
  ],
  "Screening — Principles & Test Validity": [
    {
      question: "A screening test with sensitivity 90% and specificity 80%, used in a population with 10% prevalence. The PPV is approximately:",
      options: ["33%", "47%", "68%", "90%"],
      correctAnswer: 0,
      explanation: "In 1000 people: TP=90, FN=10, FP=180, TN=720. PPV = 90/(90+180) = 33.3%. Low prevalence dramatically reduces PPV even with a good test.",
      examType: "NEET_PG", year: 2023, difficulty: "hard",
    },
    {
      question: "Sensitivity of a screening test is best described as:",
      options: [
        "Probability of negative test in disease-free person",
        "Probability of positive test in truly diseased person",
        "Proportion of true positives among all who tested positive",
        "Ability to detect minimal disease",
      ],
      correctAnswer: 1,
      explanation: "Sensitivity = TP/(TP+FN) = P(test positive | disease present). High sensitivity means few false negatives. Mnemonic: SnNout — Sensitive test when Negative rules OUT disease.",
      examType: "NEET_PG", year: 2018, difficulty: "easy",
    },
    {
      question: "If the cutoff level for a screening test is lowered:",
      options: [
        "Sensitivity decreases, specificity increases",
        "Both sensitivity and specificity increase",
        "Sensitivity increases, specificity decreases",
        "Both decrease",
      ],
      correctAnswer: 2,
      explanation: "Lowering cutoff → more people test positive → captures more true cases (↑ sensitivity) but also more healthy people (↓ specificity). This trade-off is displayed on the ROC curve.",
      examType: "INI_CET", year: 2022, difficulty: "medium",
    },
    {
      question: "Lead time bias in cancer screening refers to:",
      options: [
        "Screening detecting slowly progressing cancers preferentially",
        "Apparent increase in survival due to earlier detection without change in natural history",
        "Volunteers being healthier than the general population",
        "Patients incorrectly reporting past exposures",
      ],
      correctAnswer: 1,
      explanation: "Lead time bias: when screening detects cancer earlier, survival calculated from diagnosis appears longer, but the patient dies at the same time as without screening. This creates the illusion of benefit without actual life extension.",
      examType: "UPSC_CMO", year: 2021, difficulty: "hard",
    },
    {
      question: "Wilson-Jungner criteria for screening — which of the following is NOT a criterion?",
      options: [
        "The condition should be an important health problem",
        "The screening test should be 100% sensitive",
        "There should be an agreed policy on whom to treat",
        "The cost should be economically balanced against benefits",
      ],
      correctAnswer: 1,
      explanation: "The Wilson-Jungner criteria (10 criteria) require that a suitable/acceptable test exists, but NOT 100% sensitivity. A perfect test is not required — a practical, acceptable test with reasonable performance is sufficient.",
      examType: "NEET_PG", year: 2020, difficulty: "medium",
    },
  ],
  "Biostatistics — Research Methods & Statistics": [
    {
      question: "In a normally distributed dataset, approximately what percentage falls within ±2 standard deviations?",
      options: ["68%", "95%", "99%", "100%"],
      correctAnswer: 1,
      explanation: "Normal distribution: ±1 SD = 68.2%, ±1.96 SD = 95%, ±2 SD = 95.4%, ±3 SD = 99.7%. Lab reference ranges are typically mean ± 2 SD, encompassing ~95% of healthy population.",
      examType: "NEET_PG", year: 2021, difficulty: "easy",
    },
    {
      question: "Type II error in hypothesis testing means:",
      options: [
        "Rejecting H₀ when it is true",
        "Accepting H₀ when it is false",
        "p-value is less than 0.05",
        "Sample size is too large",
      ],
      correctAnswer: 1,
      explanation: "Type II error (β error) = false negative = failing to reject H₀ when it is actually false. In clinical terms: concluding a drug has no effect when it actually does. Power = 1 – β = probability of detecting a true effect.",
      examType: "NEET_PG", year: 2020, difficulty: "medium",
    },
    {
      question: "Which statistical test is appropriate to compare means of three independent groups with normally distributed data?",
      options: ["Student's t-test", "Chi-square test", "ANOVA", "Mann-Whitney U test"],
      correctAnswer: 2,
      explanation: "ANOVA (Analysis of Variance) compares means of 3+ independent groups when data is normally distributed. Multiple t-tests would inflate Type I error. Post-hoc tests (Tukey, Bonferroni) identify specific differences.",
      examType: "INI_CET", year: 2021, difficulty: "medium",
    },
    {
      question: "A 95% confidence interval for a risk ratio is 0.7 to 1.4. This means:",
      options: [
        "The result is statistically significant",
        "The result is not statistically significant",
        "The drug is harmful",
        "More data is needed",
      ],
      correctAnswer: 1,
      explanation: "For a ratio measure (RR, OR), if the 95% CI includes 1.0 (null value), the result is NOT statistically significant. A CI of 0.7–1.4 crosses 1.0, meaning we cannot exclude the possibility of no effect.",
      examType: "UPSC_CMO", year: 2022, difficulty: "medium",
    },
    {
      question: "Median is preferred over mean when:",
      options: ["Normal distribution", "Large sample size", "Data is skewed or has outliers", "Data is nominal"],
      correctAnswer: 2,
      explanation: "Median is robust to outliers and skewness. In skewed distributions (e.g., income, ICU stay), mean is pulled toward the tail, making median a better representation of the typical value. For nominal data, mode is used.",
      examType: "UPSC_CMO", year: 2019, difficulty: "easy",
    },
  ],
  "Study Designs in Epidemiology": [
    {
      question: "Which study design is the gold standard for evaluating therapeutic efficacy of a new drug?",
      options: ["Cohort study", "Case-control study", "Randomized controlled trial", "Cross-sectional study"],
      correctAnswer: 2,
      explanation: "RCT is the gold standard for evaluating treatment efficacy. Randomization eliminates confounding by known and unknown factors. Double-blinding prevents information bias. RCTs occupy the highest level in the evidence hierarchy for interventional questions.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "Which study design is most suitable for studying a rare disease?",
      options: ["Cohort study", "Case-control study", "RCT", "Cross-sectional survey"],
      correctAnswer: 1,
      explanation: "Case-control study is best for rare diseases. Starting with cases (already have the outcome) requires far fewer subjects than prospective cohort where you'd wait for rare events to occur. Also best for studying multiple risk factors simultaneously.",
      examType: "NEET_PG", year: 2021, difficulty: "medium",
    },
    {
      question: "Relative Risk can be directly calculated from:",
      options: ["Case-control study", "Cross-sectional study", "Cohort study", "Case series"],
      correctAnswer: 2,
      explanation: "Relative Risk = (Incidence in exposed) / (Incidence in unexposed). This requires knowing incidence rates in both groups, which is possible only in cohort studies (where you follow exposed and unexposed people forward in time).",
      examType: "INI_CET", year: 2023, difficulty: "medium",
    },
    {
      question: "The most essential criterion for causality in Bradford Hill's criteria is:",
      options: ["Strength of association", "Temporality", "Biological plausibility", "Dose-response relationship"],
      correctAnswer: 1,
      explanation: "Temporality (the cause must precede the effect) is the ONLY absolutely essential Bradford Hill criterion. Without temporal precedence, a causal relationship cannot be established. All other criteria support causality but are not absolutely required.",
      examType: "UPSC_CMO", year: 2022, difficulty: "hard",
    },
    {
      question: "Berkson's bias is a type of:",
      options: ["Recall bias", "Selection bias", "Interviewer bias", "Confounding"],
      correctAnswer: 1,
      explanation: "Berkson's bias is a selection bias occurring in hospital-based case-control studies. Hospitalized patients (both cases and controls) are not representative of the general population. The combination of exposures that brings patients to hospital differs from the general population, creating spurious associations.",
      examType: "NEET_PG", year: 2020, difficulty: "hard",
    },
  ],
  "Universal Immunization Programme (UIP)": [
    {
      question: "Which vaccine should be stored in the deep freezer (not the ILR)?",
      options: ["Hepatitis B", "DPT", "OPV", "IPV"],
      correctAnswer: 2,
      explanation: "OPV (Oral Polio Vaccine) must be stored in deep freezer at –15°C to –25°C. Most other vaccines (BCG, DPT, Hep B, IPV, PCV) are stored in ILR at +2°C to +8°C. Vaccines that MUST NOT be frozen include DPT, DT, TT, Hep B, IPV.",
      examType: "NEET_PG", year: 2023, difficulty: "medium",
    },
    {
      question: "VVM (Vaccine Vial Monitor) — the vaccine should be discarded when:",
      options: [
        "Inner square is lighter than outer circle",
        "Inner square is same color or darker than outer circle",
        "VVM color is yellow",
        "VVM color is blue",
      ],
      correctAnswer: 1,
      explanation: "VVM works by irreversible color change on heat exposure. Safe to use: inner square LIGHTER than outer circle. Discard: inner square same or darker than outer circle. The VVM doesn't check for freezing damage — a separate shake test is used for that.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "BCG vaccine is given at birth by which route?",
      options: ["Subcutaneous, right arm", "Intradermal, left upper arm", "Intramuscular, left thigh", "Oral"],
      correctAnswer: 1,
      explanation: "BCG is given by intradermal injection at the left upper arm (over the deltoid insertion). A raised bleb of 5–7 mm confirms correct intradermal injection. Dose is 0.05 mL for neonates (<1 month) and 0.1 mL for >1 month.",
      examType: "INI_CET", year: 2022, difficulty: "easy",
    },
    {
      question: "Mission Indradhanush aims to achieve full immunization coverage of at least:",
      options: ["70% nationally", "80% in each district", "90% in each state", "95% in each block"],
      correctAnswer: 1,
      explanation: "Mission Indradhanush (2014) aims to achieve at least 90% full immunization coverage nationally and ≥80% in each district, including vulnerable populations (urban slums, migrant communities, conflict-affected areas) through special catch-up campaigns.",
      examType: "UPSC_CMO", year: 2021, difficulty: "medium",
    },
    {
      question: "Fractional IPV (fIPV) is given by which route?",
      options: ["Oral", "Intramuscular (left thigh)", "Intradermal (right upper arm)", "Subcutaneous"],
      correctAnswer: 2,
      explanation: "fIPV (fractional dose IPV = 0.1 mL, 1/5th of standard dose) is given by intradermal route at the right upper arm. Given at 6 weeks and 14 weeks along with OPV. This conserves IPV supply while providing adequate mucosal and humoral immunity.",
      examType: "NEET_PG", year: 2023, difficulty: "medium",
    },
  ],
  "National TB Elimination Programme (NTEP)": [
    {
      question: "Treatment duration for new smear-positive pulmonary TB under NTEP is:",
      options: ["3 months", "6 months", "9 months", "18 months"],
      correctAnswer: 1,
      explanation: "New DS-TB regimen: 2HRZE (intensive phase, 2 months) + 4HR (continuation phase, 4 months) = 6 months total. The old Category I and Category II regimens with thrice-weekly dosing have been replaced by daily 6-month regimen.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "MDR-TB is defined as TB resistant to:",
      options: [
        "Only isoniazid",
        "Only rifampicin",
        "At least isoniazid AND rifampicin",
        "All first-line drugs",
      ],
      correctAnswer: 2,
      explanation: "MDR-TB = resistance to at least Isoniazid AND Rifampicin (the two most potent first-line anti-TB drugs). XDR-TB = MDR + resistance to any fluoroquinolone + bedaquiline or linezolid.",
      examType: "NEET_PG", year: 2021, difficulty: "medium",
    },
    {
      question: "Under Nikshay Poshan Yojana, TB patients receive a monthly nutritional incentive of:",
      options: ["₹200", "₹500", "₹1,000", "₹2,000"],
      correctAnswer: 1,
      explanation: "Nikshay Poshan Yojana: ₹500/month is provided to all TB patients (both government and private) during the entire treatment duration as direct benefit transfer (DBT) for nutritional support.",
      examType: "INI_CET", year: 2023, difficulty: "easy",
    },
    {
      question: "The India TB elimination target is to achieve <1 case per 1,00,000 population by:",
      options: ["2023", "2025", "2030", "2035"],
      correctAnswer: 1,
      explanation: "India has set an ambitious target to eliminate TB (defined as <1 case per 1,00,000 population per year) by 2025, five years ahead of the WHO End TB Strategy target of 2030. The National Strategic Plan for TB Elimination 2017–2025 outlines this goal.",
      examType: "UPSC_CMO", year: 2022, difficulty: "medium",
    },
    {
      question: "CBNAAT (Xpert MTB/RIF) is the recommended initial diagnostic test for which patients?",
      options: [
        "All presumptive TB patients at PHC level",
        "Previously treated TB patients and HIV-TB co-infected patients",
        "Only children below 5 years",
        "Only smear-negative patients",
      ],
      correctAnswer: 1,
      explanation: "Per NTEP guidelines, CBNAAT is the recommended initial test for: previously treated patients (risk of drug resistance), HIV-TB co-infected, children, EPTB, and contacts of MDR-TB patients. It simultaneously detects TB AND rifampicin resistance in ~2 hours.",
      examType: "NEET_PG", year: 2022, difficulty: "hard",
    },
  ],
  "Malaria & Vector-Borne Disease Control": [
    {
      question: "Annual Blood Examination Rate (ABER) for adequate malaria surveillance should be at least:",
      options: ["2%", "5%", "10%", "20%"],
      correctAnswer: 2,
      explanation: "ABER ≥10% is the minimum standard for adequate malaria surveillance. It means at least 10% of the total population has a blood smear examined for malaria in a year. Lower ABER means many cases are being missed.",
      examType: "NEET_PG", year: 2022, difficulty: "medium",
    },
    {
      question: "Which dengue test is most useful in the early febrile phase (Days 1–5)?",
      options: ["IgM ELISA", "IgG ELISA", "NS1 antigen", "Dengue PCR only"],
      correctAnswer: 2,
      explanation: "NS1 antigen is the most useful test in the early febrile phase (Days 1–5 of illness). NS1 appears in blood immediately after infection. After Day 5, NS1 levels fall and IgM antibodies become detectable. IgG indicates past infection/secondary dengue.",
      examType: "NEET_PG", year: 2023, difficulty: "medium",
    },
    {
      question: "The vector for urban malaria in India is:",
      options: ["Anopheles culicifacies", "Anopheles stephensi", "Anopheles fluviatilis", "Anopheles minimus"],
      correctAnswer: 1,
      explanation: "Anopheles stephensi is the urban malaria vector in India, breeding in cisterns, water tanks, and overhead water storage containers. Anopheles culicifacies is the most common rural malaria vector. Stephensi can be controlled by adding Temephos (larvicide) to water storage containers.",
      examType: "INI_CET", year: 2022, difficulty: "medium",
    },
    {
      question: "Mass Drug Administration (MDA) for lymphatic filariasis uses which drug combination?",
      options: [
        "DEC alone",
        "DEC + Albendazole",
        "Ivermectin + DEC",
        "Albendazole + Ivermectin + DEC",
      ],
      correctAnswer: 1,
      explanation: "In India, annual MDA for LF uses DEC (Diethylcarbamazine) + Albendazole (no ivermectin as India is non-endemic for onchocerciasis). Triple drug therapy (IDA: Ivermectin + DEC + Albendazole) is used in countries co-endemic for onchocerciasis.",
      examType: "UPSC_CMO", year: 2021, difficulty: "medium",
    },
    {
      question: "Kala-azar elimination is defined as incidence below:",
      options: ["1 case per 1,000", "1 case per 10,000 at block level", "1 case per 1,00,000", "Zero cases nationally"],
      correctAnswer: 1,
      explanation: "Kala-azar (visceral leishmaniasis) elimination is defined as <1 case per 10,000 population at sub-district (block/PHC) level. This is the WHO-agreed operational target for elimination as a public health problem.",
      examType: "NEET_PG", year: 2020, difficulty: "medium",
    },
  ],
  "Nutrition & Nutritional Disorders": [
    {
      question: "Flaky paint dermatosis is a feature of which nutritional deficiency?",
      options: ["Marasmus", "Kwashiorkor", "Vitamin A deficiency", "Zinc deficiency"],
      correctAnswer: 1,
      explanation: "Flaky paint dermatosis (hyperpigmented skin patches that peel off) is characteristic of Kwashiorkor (protein deficiency). Other features: pitting oedema, flag sign in hair, fatty liver. In marasmus, there is severe wasting but NO oedema and no dermatosis.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "MUAC (mid-upper arm circumference) cutoff for severe acute malnutrition (SAM) in children 6–59 months is:",
      options: ["<14.5 cm", "<12.5 cm", "<11.5 cm", "<10.5 cm"],
      correctAnswer: 2,
      explanation: "SAM criteria: MUAC <11.5 cm, OR W/H Z-score <–3 SD, OR bilateral pitting oedema. MUAC 11.5–12.5 cm = MAM (Moderate Acute Malnutrition). MUAC >12.5 cm = no acute malnutrition. MUAC is the most practical field tool.",
      examType: "NEET_PG", year: 2021, difficulty: "medium",
    },
    {
      question: "Earliest symptom of Vitamin A deficiency is:",
      options: ["Bitot's spots", "Corneal xerosis", "Night blindness", "Keratomalacia"],
      correctAnswer: 2,
      explanation: "Night blindness (nyctalopia, XN stage) is the earliest symptom of Vitamin A deficiency. It is the most common and most reversible feature. Sequence: XN → X1A (conjunctival xerosis) → X1B (Bitot's spots) → X2 (corneal xerosis) → X3A/B (ulcer/keratomalacia) → XS (scar).",
      examType: "INI_CET", year: 2023, difficulty: "easy",
    },
    {
      question: "ICDS provides how many services at the Anganwadi Centre?",
      options: ["4", "5", "6", "8"],
      correctAnswer: 2,
      explanation: "ICDS provides 6 services: (1) Supplementary nutrition, (2) Immunization, (3) Health check-up, (4) Referral services, (5) Pre-school non-formal education, (6) Nutrition and health education. The first 3 are health-related and delivered through the health system; the last 3 through ICDS workers.",
      examType: "UPSC_CMO", year: 2020, difficulty: "easy",
    },
    {
      question: "The Gomez classification of protein-energy malnutrition is based on:",
      options: ["Height-for-age", "Weight-for-height", "Weight-for-age", "MUAC"],
      correctAnswer: 2,
      explanation: "Gomez classification uses WEIGHT-FOR-AGE as percentage of median: Grade I = 75–90% (mild), Grade II = 60–75% (moderate), Grade III = <60% (severe). IAP classification also uses weight-for-age. Note: W/H is used for acute malnutrition (SAM/MAM); H/A for stunting.",
      examType: "NEET_PG", year: 2019, difficulty: "medium",
    },
  ],
  "Environmental Health & Sanitation": [
    {
      question: "The minimum residual chlorine at the consumer end of a water distribution system should be:",
      options: ["0.1 mg/L", "0.2 mg/L", "0.5 mg/L", "1.0 mg/L"],
      correctAnswer: 1,
      explanation: "WHO and Indian standards require ≥0.2 mg/L residual chlorine at the consumer end (point of delivery). The residual at the treatment plant should be ≥0.5 mg/L. Residual chlorine ensures continued protection against contamination in the distribution network.",
      examType: "NEET_PG", year: 2022, difficulty: "medium",
    },
    {
      question: "Which water-borne disease is caused by an aquatic intermediate host (water snail)?",
      options: ["Cholera", "Typhoid", "Schistosomiasis", "Guinea worm"],
      correctAnswer: 2,
      explanation: "Schistosomiasis is a water-BASED disease (not just water-borne) requiring an aquatic snail (Bulinus, Biomphalaria) as intermediate host. Guinea worm (Dracunculus) also requires a water flea (Cyclops). True water-borne diseases (ingestion only) include cholera, typhoid, hepatitis A/E.",
      examType: "INI_CET", year: 2021, difficulty: "hard",
    },
    {
      question: "Horrock's apparatus is used to determine:",
      options: [
        "Residual chlorine in water",
        "Amount of bleaching powder needed to disinfect a water source",
        "Bacteriological quality of water",
        "Total dissolved solids in water",
      ],
      correctAnswer: 1,
      explanation: "Horrock's apparatus is a field kit used to determine the dose of bleaching powder needed for disinfection of a specific water source (well, tank) to achieve the required residual chlorine. The Chloroscope tests the actual residual chlorine in water after treatment.",
      examType: "NEET_PG", year: 2020, difficulty: "medium",
    },
    {
      question: "PM2.5 is more dangerous than PM10 because:",
      options: [
        "It is heavier",
        "It deposits in upper airways causing sinusitis",
        "It penetrates deep into alveoli and enters bloodstream",
        "It contains more toxic chemicals",
      ],
      correctAnswer: 2,
      explanation: "PM2.5 (particles <2.5 μm diameter) can penetrate deep into the alveoli, reach the bloodstream, and cause systemic inflammation. PM10 (2.5–10 μm) is deposited in bronchi and upper airways. PM2.5 is associated with CVD, lung cancer, premature birth, and premature death.",
      examType: "UPSC_CMO", year: 2022, difficulty: "medium",
    },
  ],
  "Occupational Health": [
    {
      question: "Eggshell calcification of hilar lymph nodes on chest X-ray is pathognomonic of:",
      options: ["Asbestosis", "Coal worker's pneumoconiosis", "Silicosis", "Byssinosis"],
      correctAnswer: 2,
      explanation: "Eggshell calcification of hilar lymph nodes is pathognomonic of SILICOSIS. This pattern (calcification at the rim of enlarged lymph nodes) is caused by silica-induced granulomatous inflammation. Progressive Massive Fibrosis (PMF) occurs in advanced silicosis.",
      examType: "NEET_PG", year: 2023, difficulty: "medium",
    },
    {
      question: "Scrotal cancer in chimney sweeps was first described by:",
      options: ["John Snow", "Percivall Pott", "William Farr", "Bernardino Ramazzini"],
      correctAnswer: 1,
      explanation: "Percivall Pott described scrotal cancer in chimney sweeps in 1775 — the first described occupational cancer, caused by polycyclic aromatic hydrocarbons (PAH) in soot. This was also the first demonstration of chemical carcinogenesis.",
      examType: "NEET_PG", year: 2022, difficulty: "medium",
    },
    {
      question: "Monday morning sickness (chest tightness worst on first day after weekend) is characteristic of:",
      options: ["Silicosis", "Asbestosis", "Byssinosis", "Farmer's lung"],
      correctAnswer: 2,
      explanation: "Byssinosis is caused by cotton, flax, or hemp dust. Monday morning sickness: workers are symptomatic on Monday (first day back) and improve during the week as tolerance develops. Grade 1: symptoms Monday only; Grade 2: Monday + other days; Grade 3: daily.",
      examType: "INI_CET", year: 2022, difficulty: "easy",
    },
    {
      question: "Factory Act 1948 applies to establishments with:",
      options: [
        "≥5 workers with power, ≥10 without",
        "≥10 workers with power, ≥20 without",
        "≥20 workers with power, ≥40 without",
        "≥50 workers with or without power",
      ],
      correctAnswer: 1,
      explanation: "Factory Act 1948 applies to: establishments employing ≥10 workers using power, OR ≥20 workers without using power. Key provisions: 48 hr/week max, 9 hr/day max, 1 rest day/week, prohibit child labour (<14 years), annual leave (1 day per 20 days worked).",
      examType: "UPSC_CMO", year: 2021, difficulty: "medium",
    },
    {
      question: "Mesothelioma is specifically associated with occupational exposure to:",
      options: ["Silica dust", "Coal dust", "Asbestos", "Cotton dust"],
      correctAnswer: 2,
      explanation: "Mesothelioma (malignant tumor of pleura/peritoneum) is almost exclusively caused by asbestos exposure. There is NO safe threshold — even brief exposure can cause mesothelioma with a latency of 20–50 years. Types: crocidolite (blue asbestos) most dangerous.",
      examType: "NEET_PG", year: 2021, difficulty: "medium",
    },
  ],
  "Demography & Vital Statistics": [
    {
      question: "Which is the most sensitive indicator of health status of a community?",
      options: ["Crude death rate", "Life expectancy at birth", "Infant mortality rate", "Maternal mortality ratio"],
      correctAnswer: 2,
      explanation: "IMR is considered the most sensitive indicator of community health status because it reflects the combined effect of nutrition, sanitation, immunization, maternal health, and socioeconomic conditions. It is also more reliable as it is less affected by age structure.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "Sex ratio in India is expressed as:",
      options: [
        "Males per 1000 females",
        "Females per 1000 males",
        "Females per 1000 total population",
        "Births per 1000 married couples",
      ],
      correctAnswer: 1,
      explanation: "In India (and most South Asian countries), sex ratio = number of FEMALES per 1000 MALES. Census 2011: overall sex ratio = 940; child sex ratio (0-6 years) = 919. Western countries express it as males per 100 females.",
      examType: "NEET_PG", year: 2021, difficulty: "easy",
    },
    {
      question: "Replacement level fertility corresponds to a Net Reproduction Rate (NRR) of:",
      options: ["0", "0.5", "1.0", "2.1"],
      correctAnswer: 2,
      explanation: "NRR = 1 means exactly one daughter surviving to reproductive age replaces her mother — population is stable. TFR corresponding to NRR = 1 is approximately 2.1 (allowing for female infant mortality). India's TFR ≈ 2.0, NRR ≈ 0.97.",
      examType: "UPSC_CMO", year: 2022, difficulty: "medium",
    },
    {
      question: "Maternal Mortality Ratio (MMR) is expressed per:",
      options: ["1,000 women of reproductive age", "1,000 live births", "1,00,000 live births", "1,00,000 total population"],
      correctAnswer: 2,
      explanation: "MMR = Maternal deaths / 100,000 live births. India MMR ≈ 97 (SRS 2018-2020), SDG target by 2030 = <70/100,000 live births. Maternal death = death during pregnancy or within 42 days of termination from causes related to or aggravated by pregnancy.",
      examType: "NEET_PG", year: 2020, difficulty: "medium",
    },
    {
      question: "Total Fertility Rate (TFR) is defined as:",
      options: [
        "Number of live births per 1000 women aged 15–49 per year",
        "Average number of children born to a woman during her reproductive period",
        "Number of live births per 1000 total population",
        "Number of female births per woman during her lifetime",
      ],
      correctAnswer: 1,
      explanation: "TFR = average number of children a woman would have if she lived through all her childbearing years (15–49) experiencing the current age-specific fertility rates. TFR = sum of all ASFR × 5. India TFR ≈ 2.0 (SRS 2020), close to replacement level of 2.1.",
      examType: "INI_CET", year: 2023, difficulty: "medium",
    },
  ],
  "Primary Health Care & Health System in India": [
    {
      question: "Alma Ata Declaration (1978) was held in:",
      options: ["Geneva, Switzerland", "New York, USA", "Alma Ata, USSR (Kazakhstan)", "Ottawa, Canada"],
      correctAnswer: 2,
      explanation: "The International Conference on Primary Health Care was held at Alma Ata (now Almaty), Kazakhstan (then USSR) in 1978. It declared 'Health for All by 2000' through Primary Health Care. The Ottawa Charter (1986) was a separate conference for health promotion.",
      examType: "NEET_PG", year: 2022, difficulty: "easy",
    },
    {
      question: "A Primary Health Centre (PHC) in India serves a population of approximately (plains):",
      options: ["5,000", "10,000", "30,000", "1,20,000"],
      correctAnswer: 2,
      explanation: "PHC population coverage: 30,000 (plains/urban) and 20,000 (hilly/tribal/difficult areas). Sub-Centre: 5,000 plains / 3,000 hilly. CHC: 1,20,000 plains / 80,000 hilly. PHC has 1 Medical Officer and 14 paramedical staff.",
      examType: "NEET_PG", year: 2021, difficulty: "easy",
    },
    {
      question: "Minimum educational qualification for ASHA worker is:",
      options: ["5th standard", "8th standard", "10th standard", "12th standard with biology"],
      correctAnswer: 1,
      explanation: "ASHA (Accredited Social Health Activist): minimum qualification = 8th standard pass; preferably married/widowed/divorced woman; should be a resident of the village she serves (1 per 1,000 population). Incentive-based, not salaried.",
      examType: "INI_CET", year: 2022, difficulty: "easy",
    },
    {
      question: "Community Health Centre (CHC) functions as:",
      options: [
        "First point of care",
        "Sub-district referral hospital with 4 specialists",
        "State-level teaching hospital",
        "Specialized cancer treatment centre",
      ],
      correctAnswer: 1,
      explanation: "CHC serves as a First Referral Unit (FRU) with 4 specialist doctors (surgeon, physician, gynecologist/obstetrician, pediatrician) and 30 beds. It covers 1,20,000 population (plains) and provides emergency obstetric care, blood transfusion, and specialist services.",
      examType: "UPSC_CMO", year: 2021, difficulty: "medium",
    },
    {
      question: "National Rural Health Mission (NRHM) was launched in:",
      options: ["2001", "2005", "2010", "2013"],
      correctAnswer: 1,
      explanation: "NRHM was launched on April 5, 2005, with a focus on 18 high-focus states (8 EAG + NE states). In 2013, NUHM (National Urban Health Mission) was added, and both are now under the umbrella of NHM (National Health Mission).",
      examType: "NEET_PG", year: 2020, difficulty: "medium",
    },
  ],
  "Non-Communicable Diseases — Prevention & Control": [
    {
      question: "VIA (Visual Inspection with Acetic Acid) for cervical cancer screening — a positive result is:",
      options: [
        "Any area turning white after acetic acid",
        "Acetowhite lesion at the transformation zone within 1 minute",
        "Complete whitening of the cervix",
        "Yellowish discoloration after Lugol's iodine",
      ],
      correctAnswer: 1,
      explanation: "VIA positive = distinct acetowhite area at or close to the squamocolumnar junction (transformation zone) appearing within 1 minute of applying 3–5% acetic acid. Diffuse whitening or white areas far from the transformation zone are not considered positive.",
      examType: "NEET_PG", year: 2023, difficulty: "medium",
    },
    {
      question: "Section 6 of COTPA 2003 prohibits:",
      options: [
        "Smoking in public places",
        "Tobacco advertisements in media",
        "Sale of tobacco to persons under 18 years and within 100m of educational institutions",
        "Tobacco consumption in workplaces",
      ],
      correctAnswer: 2,
      explanation: "COTPA Section 6: (a) no sale/supply to minors <18 years; (b) no sale within 100 metres of any educational institution. Section 4 = smoking in public places; Section 5 = no advertising; Section 7–9 = health warnings on packs (≥85% surface area).",
      examType: "NEET_PG", year: 2022, difficulty: "medium",
    },
    {
      question: "The 'W' in WHO's MPOWER framework stands for:",
      options: ["Withdraw tobacco subsidies", "Warn about dangers of tobacco", "Widen cessation services", "Watch tobacco use trends"],
      correctAnswer: 1,
      explanation: "MPOWER: Monitor tobacco use and prevention policies, Protect people from tobacco smoke, Offer help to quit tobacco use, Warn about dangers of tobacco (graphic health warnings, mass media campaigns), Enforce bans on advertising/promotion/sponsorship, Raise taxes on tobacco products.",
      examType: "INI_CET", year: 2023, difficulty: "easy",
    },
    {
      question: "Waist circumference cutoff for central obesity in South Asian men (IDF criteria) is:",
      options: ["≥80 cm", "≥85 cm", "≥90 cm", "≥102 cm"],
      correctAnswer: 2,
      explanation: "IDF metabolic syndrome criteria for South/South-East Asians: central obesity = waist ≥90 cm (men) or ≥80 cm (women). Western cut-offs (≥102 cm men, ≥88 cm women — NCEP ATP III) are higher and NOT applicable to South Asians who have metabolic risk at lower waist measurements.",
      examType: "UPSC_CMO", year: 2022, difficulty: "medium",
    },
    {
      question: "Primordial prevention refers to:",
      options: [
        "Early detection and treatment of disease",
        "Rehabilitation after disease",
        "Preventing disease in high-risk individuals",
        "Preventing risk factors from arising in the first place",
      ],
      correctAnswer: 3,
      explanation: "Primordial prevention = preventing the emergence and establishment of risk factors in the population (e.g., preventing obesity and smoking uptake in children). Primary prevention = preventing disease in people with risk factors. This distinction is frequently tested in NEET PG.",
      examType: "NEET_PG", year: 2021, difficulty: "medium",
    },
  ],
};

// ─── High-yield topics ────────────────────────────────────────────────────────

const highYieldTopicsData: Record<string, {
  title: string; description: string; keyPoints: string[]; order: number;
}[]> = {
  "Epidemiology — Principles & Outbreak Investigation": [
    {
      title: "Epidemiological Triad & Web of Causation",
      description: "The classical model of disease causation: Agent, Host, and Environment must be in balance. Disruption leads to disease.",
      keyPoints: [
        "Agent: biological, physical, chemical, nutritional; Host: age, sex, genetics, immunity; Environment: physical, biological, social",
        "Web of causation (MacMahon): multiple interacting factors — more realistic than simple triad",
        "Wheel model (Mausner): genetic core surrounded by biological, social, physical environment layers",
        "Necessary vs. sufficient causes: TB bacillus is necessary but not sufficient for TB disease",
        "Multiple causation: removing any one cause can break the chain and prevent disease",
      ],
      order: 1,
    },
    {
      title: "Epidemic Curves & Types",
      description: "Epidemic curve shape tells you the type of epidemic and the likely incubation period.",
      keyPoints: [
        "Point source: single peak; all cases within one maximum incubation period; classic bell curve",
        "Propagated: multiple peaks, each separated by approximately one incubation period",
        "Common vehicle continuous: sustained exposure; cases continue until source removed",
        "Mixed epidemic: initial point source + subsequent person-to-person propagation",
        "Epidemic curve construction: x-axis = time of onset; y-axis = number of cases",
      ],
      order: 2,
    },
  ],
  "Study Designs in Epidemiology": [
    {
      title: "Hierarchy of Evidence & Study Design Selection",
      description: "Choosing the right study design for each research question is a core exam skill.",
      keyPoints: [
        "Meta-analysis > Systematic review > RCT > Cohort > Case-control > Cross-sectional > Case series > Expert opinion",
        "RCT: best for treatment efficacy; Cohort: best for incidence and RR; Case-control: best for rare diseases/OR",
        "Cross-sectional: best for prevalence and health planning; fastest and cheapest",
        "RCT limitations: expensive, ethical constraints, cannot randomize risk factors, results may not apply to real patients",
        "Nested case-control: cases and controls drawn from within an existing cohort — efficient, less recall bias",
      ],
      order: 1,
    },
    {
      title: "Measures of Association — RR, OR, AR, NNT",
      description: "Calculating and interpreting relative risk, odds ratio, attributable risk, and NNT.",
      keyPoints: [
        "RR = (a/[a+b]) ÷ (c/[c+d]); from cohort studies; RR>1 = positive association, <1 = protective, =1 = no association",
        "OR = (a×d)/(b×c); from case-control; OR ≈ RR when disease prevalence <10%",
        "AR (Attributable Risk) = Rate exposed – Rate unexposed; absolute excess risk due to exposure",
        "AR% = AR/Rate exposed × 100; proportion of disease in exposed attributable to the exposure",
        "PAR (Population Attributable Risk) = Rate total – Rate unexposed; public health impact of exposure",
        "NNT = 1/ARR; number of patients to treat to prevent one outcome; ideal NNT = 1",
      ],
      order: 2,
    },
  ],
  "Universal Immunization Programme (UIP)": [
    {
      title: "Cold Chain & Vaccine Storage — Complete Reference",
      description: "Temperature requirements, equipment, and handling for all vaccines in UIP.",
      keyPoints: [
        "Deep freezer (–15 to –25°C): OPV, Varicella, MMR — these contain live attenuated organisms needing very low temperatures",
        "ILR (+2 to +8°C): BCG, DPT, Hep B, Hib, IPV, PCV, Rotavirus, MR — most vaccines",
        "DO NOT FREEZE: DPT, DT, TT, Hep B, IPV — freezing destroys potency + increases reactogenicity",
        "VVM (Vaccine Vial Monitor): inner square lighter = safe; equal/darker = discard",
        "Shake test: to detect freezing damage — if sedimentation appears in 30 min, vaccine is not damaged; if stays uniform = damage likely",
        "ILR plug must NEVER be switched off; electric cut-off alarm mandatory",
      ],
      order: 1,
    },
    {
      title: "UIP Schedule & New Vaccine Additions",
      description: "Complete National Immunization Schedule including all recently added vaccines.",
      keyPoints: [
        "Birth: BCG (left deltoid, ID), OPV-0, Hep B-0",
        "6/10/14 weeks: OPV, fIPV (ID at 10 & 14 weeks), DPT, Hib, Hep B, PCV, Rotavirus",
        "9–12 months: MR-1, JE-1 (endemic areas), Vit A-1, Hep B-3 (if 3-dose schedule)",
        "16–24 months: DPT-B1, OPV-B1, MR-2, JE-2, Vit A-2",
        "5–6 years: DPT-B2 (school entry); 10 years: TT; 16 years: TT",
        "Recent additions: PCV (2017), Rotavirus (2016), fIPV (2016), HPV (adolescent girls, 2023 budget)",
      ],
      order: 2,
    },
  ],
  "Nutrition & Nutritional Disorders": [
    {
      title: "Vitamin A Deficiency — Staging & Management",
      description: "WHO classification of VAD and management with Vitamin A supplementation.",
      keyPoints: [
        "XN = Night blindness (earliest, most reversible); X1A = Conjunctival xerosis; X1B = Bitot's spots (temporal, triangular, foamy)",
        "X2 = Corneal xerosis; X3A = Corneal ulcer <1/3; X3B = Corneal ulcer ≥1/3 (keratomalacia) — risk of perforation",
        "Treatment dose: 2,00,000 IU orally for children 1–5 years; 1,00,000 IU for 6–12 months; 50,000 IU for <6 months",
        "UIP schedule: 9 months (1 lakh IU) then every 6 months till 5 years",
        "VAD control: vitamin A supplementation + dietary diversification + fortification",
        "Xerophthalmia = all the eye signs of VAD; bitot's spots alone are not diagnostic in older children (may be non-nutritional)",
      ],
      order: 1,
    },
  ],
  "Non-Communicable Diseases — Prevention & Control": [
    {
      title: "Levels of Prevention",
      description: "Primordial, primary, secondary, and tertiary prevention — definitions and examples.",
      keyPoints: [
        "Primordial: Prevent risk factors from emerging (population-level); e.g., anti-tobacco education in schools before children start",
        "Primary: Prevent disease in at-risk but healthy individuals; e.g., statins in high-CVD-risk adults, sunscreen use",
        "Secondary: Early detection and treatment (screening); e.g., mammography, BP screening, VIA for cervical cancer",
        "Tertiary: Reduce disability and complications; e.g., cardiac rehabilitation after MI, diabetes foot care",
        "High-risk vs population strategy (Geoffrey Rose): high-risk = target intervention at high-risk individuals; population = shift entire distribution of risk factors",
        "NNT in prevention: higher NNT = less efficient intervention (need to treat many to prevent one outcome)",
      ],
      order: 1,
    },
  ],
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  await Subject.deleteMany({});
  await Chapter.deleteMany({});
  await Question.deleteMany({});
  await HighYieldTopic.deleteMany({});
  console.log("🗑️  Cleared existing data");

  // Create subjects
  const [commMed] = await Subject.insertMany([
    {
      name: "Community Medicine",
      description: "Preventive & Social Medicine — the highest-yield subject in NEET PG covering epidemiology, biostatistics, national health programs, nutrition, environmental health, and more.",
      icon: "Stethoscope", color: "green", order: 1,
    },
  ]);
  console.log("📚 Subjects created: 1");

  // Create all chapters
  const chapterDocs = await Chapter.insertMany(
    chapters.map((ch) => ({ ...ch, subjectId: commMed._id }))
  );
  console.log(`📖 Chapters created: ${chapterDocs.length}`);

  // Map chapter title → _id
  const chapterMap: Record<string, typeof chapterDocs[0]> = {};
  for (const ch of chapterDocs) {
    chapterMap[(ch as unknown as { title: string }).title] = ch;
  }

  // Create questions
  let totalQuestions = 0;
  for (const [chapterTitle, qs] of Object.entries(questionsData)) {
    const chapter = chapterMap[chapterTitle];
    if (!chapter) { console.warn(`⚠️  Chapter not found: ${chapterTitle}`); continue; }
    await Question.insertMany(qs.map((q) => ({ ...q, chapterId: chapter._id })));
    totalQuestions += qs.length;
  }
  console.log(`❓ Questions created: ${totalQuestions}`);

  // Create high-yield topics
  let totalTopics = 0;
  for (const [chapterTitle, topics] of Object.entries(highYieldTopicsData)) {
    const chapter = chapterMap[chapterTitle];
    if (!chapter) continue;
    await HighYieldTopic.insertMany(topics.map((t) => ({ ...t, chapterId: chapter._id })));
    totalTopics += topics.length;
  }
  console.log(`⭐ High-yield topics created: ${totalTopics}`);

  console.log("\n✅ Seed complete! Summary:");
  console.log(`   Subjects: 1 (Community Medicine)`);
  console.log(`   Chapters: ${chapterDocs.length}`);
  console.log(`   Questions: ${totalQuestions}`);
  console.log(`   High-yield topics: ${totalTopics}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
