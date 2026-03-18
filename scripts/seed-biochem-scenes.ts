/**
 * Seed 3D scenes for all Biochemistry chapters.
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed-biochem-scenes.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;

// ── Reuse the AnatomyScene schema inline (avoids Next.js import issues) ──────
const AnatomyPartSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    position: [Number],
    rotation: [Number],
    geometry: String,
    size: [Number],
    color: String,
    emissiveColor: String,
    info: String,
    pulse: Boolean,
  },
  { _id: false }
);

const AnatomySceneSchema = new mongoose.Schema(
  {
    chapterKey: { type: String, required: true, unique: true },
    title: String,
    description: String,
    bgColor: String,
    cameraPosition: [Number],
    autoRotate: Boolean,
    highlights: [String],
    parts: [AnatomyPartSchema],
  },
  { timestamps: true }
);

const AnatomyScene =
  mongoose.models.AnatomyScene ||
  mongoose.model("AnatomyScene", AnatomySceneSchema);

// ── Scene data ────────────────────────────────────────────────────────────────
const scenes = [
  // ── 1. Carbohydrate Metabolism ──────────────────────────────────────────────
  {
    chapterKey: "carbohydrate-metabolism",
    title: "Carbohydrate Metabolism",
    description: "Glycolysis, TCA cycle, gluconeogenesis, glycogen metabolism",
    bgColor: "#0a1200",
    cameraPosition: [0, 0, 12],
    autoRotate: false,
    highlights: [
      "Rate-limiting step of glycolysis: Phosphofructokinase-1 (PFK-1)",
      "Net glycolysis yield: 2 ATP, 2 NADH, 2 pyruvate",
      "Gluconeogenesis bypass enzymes: PC, PEPCK, F-1,6-BPase, G-6-Pase",
      "Glycogen synthesis: UDP-glucose + glycogenin → glycogen (glycogen synthase)",
      "Cori cycle: lactate from muscle → glucose in liver",
    ],
    parts: [
      {
        id: "glucose",
        label: "Glucose",
        position: [0, 3.5, 0],
        geometry: "sphere",
        size: [0.7, 0.7, 0.7, 16],
        color: "#ffdd44",
        emissiveColor: "#cc9900",
        pulse: true,
        info: "6-carbon aldose sugar. Entry point of glycolysis. Phosphorylated by hexokinase (all tissues) or glucokinase (liver/pancreas) → G-6-P. Cannot leave the cell once phosphorylated.",
      },
      {
        id: "pfk1",
        label: "PFK-1 (Rate-limiting)",
        position: [0, 2.0, 0],
        geometry: "sphere",
        size: [0.65, 0.65, 0.65, 16],
        color: "#ff6644",
        emissiveColor: "#cc2200",
        pulse: true,
        info: "Phosphofructokinase-1: commits fructose-6-P → fructose-1,6-bisP. Rate-limiting enzyme of glycolysis. Activated by AMP, F-2,6-BP; inhibited by ATP, citrate. Key regulatory point.",
      },
      {
        id: "pyruvate",
        label: "Pyruvate",
        position: [1.8, 2.0, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#88ff88",
        info: "3-carbon end-product of glycolysis. Fate: aerobic → acetyl-CoA (PDH); anaerobic → lactate; gluconeogenesis precursor; alanine (transamination). PDH complex requires B1, B2, B3, B5, lipoic acid.",
      },
      {
        id: "mitochondria",
        label: "Mitochondria (TCA)",
        position: [0, 0.5, 0],
        geometry: "capsule",
        size: [0.7, 1.6, 4, 12],
        color: "#aa44ff",
        emissiveColor: "#6600cc",
        info: "Site of TCA cycle and oxidative phosphorylation. Acetyl-CoA enters TCA → 3 NADH, 1 FADH2, 1 GTP per turn. One glucose → 2 acetyl-CoA → 38 ATP total (theoretical). Inner membrane: ETC and ATP synthase.",
      },
      {
        id: "atp",
        label: "ATP",
        position: [-1.8, 0.5, 0],
        geometry: "sphere",
        size: [0.45, 0.45, 0.45, 14],
        color: "#ffaa00",
        emissiveColor: "#cc7700",
        pulse: true,
        info: "Adenosine triphosphate: universal energy currency. Glycolysis: 2 ATP net. TCA: 2 GTP. Oxidative phosphorylation: ~34 ATP. NADH → 2.5 ATP; FADH2 → 1.5 ATP. Substrate-level vs oxidative phosphorylation.",
      },
      {
        id: "glycogen",
        label: "Glycogen Granule",
        position: [3, 1.5, 0],
        geometry: "sphere",
        size: [0.9, 0.9, 0.9, 16],
        color: "#ffcc88",
        info: "Storage form of glucose. Liver: 100g (blood glucose regulation); Muscle: 400g (local fuel). Synthesis: glycogen synthase (rate-limiting). Breakdown: glycogen phosphorylase. Branching enzyme: α1→6 links every 8-10 residues.",
      },
      {
        id: "nadh",
        label: "NADH / FADH₂",
        position: [-3, 1.5, 0],
        geometry: "cylinder",
        size: [0.35, 0.35, 1.0, 10],
        color: "#44ffcc",
        info: "Electron carriers. NADH (3 ATP eq.) → Complex I of ETC. FADH2 (2 ATP eq.) → Complex II. Both donate electrons to ubiquinone (CoQ10). Generated by: glycolysis, PDH, TCA cycle.",
      },
      {
        id: "gluconeogenesis",
        label: "Gluconeogenesis",
        position: [0, -1.5, 0],
        geometry: "box",
        size: [1.8, 0.5, 0.5],
        color: "#4488ff",
        info: "Synthesis of glucose from non-carb precursors: lactate, pyruvate, glycerol, glucogenic amino acids. Occurs in liver/kidney. Bypass enzymes: PC (pyruvate → OAA), PEPCK, F-1,6-BPase, G-6-Pase. Stimulated by glucagon/cortisol.",
      },
    ],
  },

  // ── 2. Lipid Metabolism ──────────────────────────────────────────────────────
  {
    chapterKey: "lipid-metabolism",
    title: "Lipid Metabolism",
    description: "Fatty acid synthesis, β-oxidation, ketogenesis, cholesterol, lipoproteins",
    bgColor: "#120a00",
    cameraPosition: [0, 0, 13],
    autoRotate: false,
    highlights: [
      "Rate-limiting step of FA synthesis: Acetyl-CoA carboxylase (ACC)",
      "Rate-limiting step of cholesterol synthesis: HMG-CoA reductase (statin target)",
      "β-oxidation of 16C palmitate → 7 cycles → 106 ATP net",
      "Ketone bodies: acetoacetate, β-hydroxybutyrate, acetone (liver → brain in starvation)",
      "LDL = bad cholesterol; HDL = good; IDL → LDL by hepatic lipase",
    ],
    parts: [
      {
        id: "cell-membrane",
        label: "Lipid Bilayer",
        position: [0, 3.0, 0],
        geometry: "box",
        size: [3.5, 0.28, 1.0],
        color: "#ffaa55",
        emissiveColor: "#cc6600",
        info: "Phospholipid bilayer: amphipathic molecules. Hydrophilic heads face aqueous; hydrophobic tails face inward. Cholesterol increases rigidity. Fluid mosaic model. Saturated FA → rigid; unsaturated → fluid. Asymmetric: PS on inner leaflet.",
      },
      {
        id: "fatty-acid",
        label: "Palmitate (C16)",
        position: [-2.5, 1.5, 0],
        geometry: "capsule",
        size: [0.18, 2.2, 4, 8],
        color: "#ffdd88",
        info: "Most common saturated fatty acid. Synthesized from acetyl-CoA (ACC + FAS). Each cycle adds 2C. 7 NADPH per 2C addition. Elongation and desaturation in ER. Key NEET fact: FA synthesis in cytoplasm using NADPH; β-oxidation in mitochondria using NAD+/FAD.",
      },
      {
        id: "beta-oxidation",
        label: "β-Oxidation",
        position: [0, 1.5, 0],
        geometry: "sphere",
        size: [0.7, 0.7, 0.7, 16],
        color: "#ff6666",
        pulse: true,
        info: "Breakdown of fatty acids in mitochondria. Each cycle: 1 FADH2 + 1 NADH + 1 acetyl-CoA. Carnitine shuttle required for LCFA entry. Odd-chain FA → propionyl-CoA → methylmalonyl-CoA → succinyl-CoA (requires B12). Deficiency: methylmalonic acidemia.",
      },
      {
        id: "hmg-coa-reductase",
        label: "HMG-CoA Reductase",
        position: [2.5, 1.5, 0],
        geometry: "sphere",
        size: [0.6, 0.6, 0.6, 14],
        color: "#ff4488",
        emissiveColor: "#aa0044",
        info: "Rate-limiting enzyme of cholesterol synthesis. HMG-CoA → mevalonate. Inhibited by statins (competitive). Activated by insulin; inhibited by glucagon. Located in ER. Feedback inhibited by cholesterol. Sterol regulatory element-binding protein (SREBP) upregulates it.",
      },
      {
        id: "ketone-bodies",
        label: "Ketone Bodies",
        position: [-2.5, -0.5, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#aaffaa",
        pulse: true,
        info: "Acetoacetate, β-hydroxybutyrate, acetone. Produced in liver from excess acetyl-CoA (starvation, DKA). Used by brain, heart, muscle. NOT by RBCs (no mitochondria) or liver (lacks thiophorase). DKA: fruity breath (acetone), high anion gap acidosis.",
      },
      {
        id: "ldl",
        label: "LDL Particle",
        position: [2.5, -0.5, 0],
        geometry: "sphere",
        size: [0.65, 0.65, 0.65, 16],
        color: "#ffaa00",
        info: "Low-density lipoprotein. Delivers cholesterol to tissues. ApoB-100: ligand for LDL receptor. Oxidized LDL → foam cells → atherosclerosis. Familial hypercholesterolemia: LDL receptor mutation → very high LDL. Statins upregulate LDL receptors.",
      },
      {
        id: "vldl",
        label: "VLDL → IDL → LDL",
        position: [0, -0.5, 0],
        geometry: "capsule",
        size: [0.4, 1.6, 4, 8],
        color: "#ddaa44",
        info: "VLDL: secreted by liver, carries TG. Lipoprotein lipase (LPL) strips TG → IDL. Hepatic lipase → LDL (cholesterol-rich). ApoC-II activates LPL. ApoE: liver uptake. Familial hypertriglyceridemia: deficient LPL or ApoC-II.",
      },
      {
        id: "hdl",
        label: "HDL (Reverse Transport)",
        position: [0, -2.0, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#44ffff",
        info: "High-density lipoprotein: scavenges cholesterol from periphery → liver. ApoA-I activates LCAT (esterifies cholesterol). CETP transfers cholesterol esters to VLDL/LDL. High HDL is protective. Niacin best agent to raise HDL.",
      },
    ],
  },

  // ── 3. Protein & Amino Acid Metabolism ──────────────────────────────────────
  {
    chapterKey: "protein-amino-acid-metabolism",
    title: "Protein & Amino Acid Metabolism",
    description: "Amino acid catabolism, urea cycle, protein synthesis, disorders",
    bgColor: "#0a000f",
    cameraPosition: [0, 0, 12],
    autoRotate: false,
    highlights: [
      "Essential amino acids: PVT TIM HaLL (Phe, Val, Thr, Trp, Ile, Met, His, Arg, Leu, Lys)",
      "Rate-limiting step of urea cycle: Carbamoyl phosphate synthetase I (CPS-I)",
      "PKU: Phe hydroxylase deficiency → musty odor, fair skin, intellectual disability",
      "Maple syrup urine disease: BCAA (Leu, Ile, Val) dehydrogenase deficiency (B1-dependent)",
      "Negative nitrogen balance: catabolism > anabolism (starvation, burns, surgery)",
    ],
    parts: [
      {
        id: "ribosome",
        label: "Ribosome (80S)",
        position: [0, 3.0, 0],
        geometry: "sphere",
        size: [0.75, 0.75, 0.75, 16],
        color: "#cc88ff",
        emissiveColor: "#8800cc",
        info: "Site of protein synthesis. 80S eukaryotic (60S + 40S subunits). Prokaryote: 70S (50S + 30S). mRNA 5'→3' direction. Codons read by tRNA anticodon. Start codon AUG → Met. Stop codons: UAA, UAG, UGA. Aminoacyl-tRNA synthetase charges tRNA (uses ATP).",
      },
      {
        id: "urea-cycle",
        label: "Urea Cycle",
        position: [-2.5, 1.5, 0],
        geometry: "torus",
        size: [1.0, 0.18, 12, 20],
        color: "#ff8844",
        emissiveColor: "#cc4400",
        info: "Disposes of NH3 as urea. Starts in mitochondria (CPS-I → carbamoyl phosphate), continues in cytoplasm. Steps: CPS-I → ornithine transcarbamylase → argininosuccinate synthetase → lyase → arginase. Urea excreted by kidney. Deficiency → hyperammonemia.",
      },
      {
        id: "transamination",
        label: "Transamination (ALT/AST)",
        position: [2.5, 1.5, 0],
        geometry: "sphere",
        size: [0.6, 0.6, 0.6, 14],
        color: "#88ff88",
        info: "Transfer of amino group from amino acid to α-keto acid. ALT: alanine + α-KG → pyruvate + glutamate (liver-specific). AST: aspartate + α-KG → OAA + glutamate. Both require PLP (B6). ALT > AST in viral hepatitis; AST:ALT > 2 in alcoholic hepatitis.",
      },
      {
        id: "amino-acid-chain",
        label: "Polypeptide Chain",
        position: [0, 1.5, 0],
        geometry: "capsule",
        size: [0.3, 2.5, 4, 8],
        color: "#ff88cc",
        info: "Amino acids linked by peptide bonds (-CO-NH-). Primary structure: sequence. Secondary: α-helix (H-bonds to every 4th AA), β-sheet. Tertiary: 3D folding (hydrophobic core). Quaternary: multiple subunits. Denaturation: breaks non-covalent bonds; irreversible = disulfide bonds broken.",
      },
      {
        id: "pku",
        label: "PKU (Phe pathway)",
        position: [-2.5, -0.5, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#ffdd44",
        info: "Phenylketonuria: Phe hydroxylase (BH4 cofactor) deficiency → Phe accumulates → inhibits Tyr synthesis. Features: musty/mousy odor, fair skin, eczema, intellectual disability. Diet: low Phe. Maternal PKU: teratogenic to fetus if untreated. Guthrie test at birth.",
      },
      {
        id: "homocysteine",
        label: "Homocysteine Pathway",
        position: [2.5, -0.5, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ff6666",
        info: "Homocystinuria: cystathionine β-synthase deficiency (B6). Features: tall, lens dislocation (downward), intellectual disability, thromboembolism, Marfan-like. TX: B6 (if responsive), B12, folate, methionine restriction. Elevated homocysteine → atherosclerosis risk.",
      },
      {
        id: "urea",
        label: "Urea (Product)",
        position: [0, -1.5, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ddddff",
        info: "End-product of protein catabolism. 2 NH3 + CO2 → urea (BUN). BUN:creatinine ratio >20 = prerenal azotemia. Hyperammonemia: urea cycle defect, liver failure → tremor, asterixis, encephalopathy. TX: lactulose (traps NH3 in gut), rifaximin.",
      },
    ],
  },

  // ── 4. Enzymology ────────────────────────────────────────────────────────────
  {
    chapterKey: "enzymology",
    title: "Enzymology",
    description: "Enzyme kinetics, inhibition, coenzymes, regulation",
    bgColor: "#000a12",
    cameraPosition: [0, 0, 12],
    autoRotate: false,
    highlights: [
      "Km = [S] at ½Vmax; low Km = high affinity for substrate",
      "Competitive inhibition: ↑Km, same Vmax (overcome by excess substrate)",
      "Non-competitive inhibition: same Km, ↓Vmax (cannot overcome)",
      "Irreversible inhibitors: covalently bind active site (e.g., aspirin → COX)",
      "Allosteric enzymes: sigmoidal kinetics (Hill coefficient >1)",
    ],
    parts: [
      {
        id: "enzyme",
        label: "Enzyme",
        position: [0, 2.5, 0],
        geometry: "sphere",
        size: [1.2, 1.2, 1.2, 20],
        color: "#4488ff",
        emissiveColor: "#0044cc",
        info: "Biological catalyst. Protein (apoenzyme) + cofactor = holoenzyme. Lowers activation energy (Ea) without being consumed. Lock-and-key vs induced-fit model. Highly specific. Zymogen (proenzyme): inactive precursor activated by cleavage (trypsinogen → trypsin).",
      },
      {
        id: "active-site",
        label: "Active Site",
        position: [0, 2.5, 1.0],
        geometry: "sphere",
        size: [0.35, 0.35, 0.35, 12],
        color: "#ffff44",
        emissiveColor: "#cccc00",
        pulse: true,
        info: "Specific region where substrate binds. Amino acid residues form binding pocket. Catalytic residues directly participate in reaction. Substrate binding induces conformational change (induced fit). Highly conserved across species. Target of competitive inhibitors.",
      },
      {
        id: "substrate",
        label: "Substrate (S)",
        position: [1.5, 3.5, 0],
        geometry: "sphere",
        size: [0.45, 0.45, 0.45, 14],
        color: "#ff8844",
        pulse: true,
        info: "Molecule that binds to enzyme active site. Km (Michaelis constant) = [S] at ½Vmax. Indicator of enzyme-substrate affinity. High [S] → Vmax plateau. Lineweaver-Burk plot (double reciprocal): 1/V vs 1/[S]. x-intercept = -1/Km; y-intercept = 1/Vmax.",
      },
      {
        id: "competitive-inhibitor",
        label: "Competitive Inhibitor",
        position: [-1.8, 2.5, 0],
        geometry: "sphere",
        size: [0.45, 0.45, 0.45, 12],
        color: "#ff4444",
        info: "Structurally similar to substrate; competes for active site. Effect: ↑Km (apparent), Vmax unchanged. Can be overcome by ↑[substrate]. Examples: methotrexate (DHFR), statins (HMG-CoA reductase), sulfonamides (PABA). On LB plot: same y-intercept, different x-intercept.",
      },
      {
        id: "allosteric-site",
        label: "Allosteric Site",
        position: [0, 1.2, 0.9],
        geometry: "sphere",
        size: [0.3, 0.3, 0.3, 12],
        color: "#44ff88",
        emissiveColor: "#00aa44",
        info: "Regulatory site distinct from active site. Allosteric activators: stabilize active (R) state. Allosteric inhibitors: stabilize inactive (T) state. Results in sigmoidal V vs [S] curve. Examples: PFK-1 (activated by AMP, F-2,6-BP; inhibited by ATP, citrate), hemoglobin (cooperative binding).",
      },
      {
        id: "coenzyme",
        label: "Coenzyme (NAD⁺/FAD)",
        position: [2.5, 1.5, 0],
        geometry: "cylinder",
        size: [0.3, 0.3, 0.9, 10],
        color: "#44ccff",
        info: "Non-protein organic cofactor. NAD+ (B3-niacin): accepts 2e⁻ → NADH (oxidation reactions). FAD (B2-riboflavin): accepts 2e⁻ → FADH2. Coenzyme A (B5): carries acyl groups. PLP (B6): transamination. TPP (B1): oxidative decarboxylation. Biotin (B7): carboxylation.",
      },
      {
        id: "michaelis-menten",
        label: "Km / Vmax",
        position: [-2.5, 0.5, 0],
        geometry: "box",
        size: [1.0, 0.6, 0.3],
        color: "#cc88ff",
        info: "Michaelis-Menten kinetics: V = Vmax[S]/(Km+[S]). Vmax: maximum velocity (all enzymes saturated). Km: substrate concentration at ½Vmax; lower Km = higher affinity. Catalytic efficiency (kcat/Km). Turnover number (kcat): reactions per enzyme per second. Hexokinase: low Km; glucokinase: high Km (liver glucose sensor).",
      },
    ],
  },

  // ── 5. Vitamins & Minerals ───────────────────────────────────────────────────
  {
    chapterKey: "vitamins-minerals",
    title: "Vitamins & Minerals",
    description: "Fat-soluble and water-soluble vitamins, mineral metabolism",
    bgColor: "#0a0800",
    cameraPosition: [0, 0, 13],
    autoRotate: false,
    highlights: [
      "Fat-soluble vitamins: A, D, E, K — stored in fat, toxic in excess",
      "Vitamin B1 (thiamine): deficiency → Wernicke-Korsakoff, beriberi, Leigh disease",
      "Vitamin B12 deficiency: megaloblastic anemia + subacute combined degeneration of cord",
      "Vitamin D: 7-dehydrocholesterol → D3 (skin) → 25-OH (liver) → 1,25-OH (kidney, active)",
      "Vitamin K: γ-carboxylation of factors II, VII, IX, X, protein C, S",
    ],
    parts: [
      {
        id: "vit-a",
        label: "Vitamin A (Retinol)",
        position: [-3.0, 3.0, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#ffaa00",
        emissiveColor: "#cc6600",
        info: "Fat-soluble. Functions: vision (rhodopsin), epithelial differentiation, immune function. Deficiency: night blindness (1st sign), Bitot's spots, xerophthalmia, keratomalacia. Toxicity: teratogen (cleft palate), pseudotumor cerebri, hepatotoxicity. Source: liver, dairy, carotenoids.",
      },
      {
        id: "vit-d",
        label: "Vitamin D (Calcitriol)",
        position: [0, 3.0, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#ffff44",
        emissiveColor: "#cccc00",
        info: "Fat-soluble. Activates VDR → ↑Ca/P absorption from gut. Active form: 1,25-(OH)₂D3 (calcitriol, kidney 1α-hydroxylase). Deficiency: rickets (children), osteomalacia (adults), hypocalcemia, tetany. Toxicity: hypercalcemia, hypercalciuria, renal stones. CKD: activated D deficiency → renal osteodystrophy.",
      },
      {
        id: "vit-k",
        label: "Vitamin K",
        position: [3.0, 3.0, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#44ff44",
        info: "Fat-soluble. γ-carboxylates glutamate residues of clotting factors II, VII, IX, X, protein C, S. Warfarin: blocks vitamin K epoxide reductase (VKOR). Deficiency: newborns (no gut flora), fat malabsorption → prolonged PT. Prophylaxis: IM at birth.",
      },
      {
        id: "vit-b1",
        label: "B1 Thiamine",
        position: [-3.0, 1.0, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ff88aa",
        info: "Water-soluble. TPP cofactor for: PDH (pyruvate → acetyl-CoA), α-KG dehydrogenase (TCA), transketolase (PPP), BCAA dehydrogenase. Deficiency: Wernicke (confusion, ataxia, nystagmus), Korsakoff (confabulation), wet beriberi (high-output heart failure), dry beriberi (peripheral neuropathy). TX: IV thiamine before glucose!",
      },
      {
        id: "vit-b12",
        label: "B12 Cobalamin",
        position: [0, 1.0, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ff44ff",
        emissiveColor: "#cc00cc",
        info: "Water-soluble. Absorbed with intrinsic factor (IF, parietal cells). Deficiency: megaloblastic anemia + subacute combined degeneration (dorsal/lateral columns), glossitis. Causes: pernicious anemia (anti-IF Ab), vegans, terminal ileum disease. B12 required for myelin synthesis (methylcobalamin). Give B12 before folate (masks neuro sx).",
      },
      {
        id: "vit-c",
        label: "Vitamin C (Ascorbate)",
        position: [3.0, 1.0, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ff6644",
        info: "Water-soluble antioxidant. Hydroxylates proline/lysine in collagen synthesis (Pro-X-Gly). Required for collagen cross-linking. Deficiency (scurvy): perifollicular hemorrhage, corkscrew hairs, bleeding gums, poor wound healing, 'woody leg'. Also enhances non-heme iron absorption. Excess → oxalate kidney stones.",
      },
      {
        id: "calcium",
        label: "Calcium / Phosphorus",
        position: [-1.5, -1.0, 0],
        geometry: "sphere",
        size: [0.6, 0.6, 0.6, 14],
        color: "#dddddd",
        info: "Ca2+: bone (99%), ECF signaling, muscle contraction, neurotransmission. PTH: ↑Ca, ↓P (kidney). Vitamin D: ↑Ca, ↑P (gut). Calcitonin: ↓Ca (thyroid C-cells). Hypercalcemia: stones, bones, groans, psychic moans. DiGeorge: hypoparathyroidism → hypocalcemia → tetany.",
      },
      {
        id: "iron",
        label: "Iron Metabolism",
        position: [1.5, -1.0, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#ff8800",
        emissiveColor: "#aa4400",
        info: "Fe2+ (ferrous) absorbed in duodenum via DMT-1. Ferroportin: exports from enterocyte. Hepcidin (liver): degrades ferroportin → ↓absorption. Transferrin: transport. Ferritin: storage (acute phase reactant). Deficiency: microcytic hypochromic anemia, koilonychia, Plummer-Vinson. Labs: ↓Fe, ↑TIBC, ↓ferritin.",
      },
    ],
  },

  // ── 6. Nucleic Acids & Molecular Biology ────────────────────────────────────
  {
    chapterKey: "nucleic-acids-molecular-biology",
    title: "Nucleic Acids & Molecular Biology",
    description: "DNA structure, replication, transcription, translation, mutations",
    bgColor: "#000a14",
    cameraPosition: [0, 0, 12],
    autoRotate: true,
    highlights: [
      "DNA replication: semi-conservative, 5'→3' synthesis, primase for RNA primers",
      "Purines: Adenine, Guanine (2 rings). Pyrimidines: Cytosine, Thymine, Uracil (1 ring)",
      "A=T (2 H-bonds), G≡C (3 H-bonds) — more GC = higher Tm",
      "Lac operon: negative control (repressor + inducer) + positive (CAP + cAMP)",
      "Point mutations: transition (purine↔purine) vs transversion (purine↔pyrimidine)",
    ],
    parts: [
      {
        id: "dna-helix",
        label: "DNA Double Helix",
        position: [0, 2.5, 0],
        geometry: "capsule",
        size: [0.5, 3.5, 4, 16],
        color: "#4488ff",
        emissiveColor: "#0044cc",
        info: "B-form DNA: right-handed double helix, 10.5 bp/turn, 3.4 Å/bp. Sugar-phosphate backbone (antiparallel: 5'→3'). Base pairs in center via H-bonds. A=T (2), G≡C (3). Major groove: protein binding. Minor groove: netropsin. Higher GC content → higher Tm (melting temperature).",
      },
      {
        id: "nucleotide",
        label: "Nucleotide",
        position: [-2.5, 3.5, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ffaa44",
        info: "Building block of DNA/RNA. = phosphate + pentose sugar + nitrogenous base. Purines (2 rings): A, G. Pyrimidines (1 ring): C, T (DNA), U (RNA). RNA: ribose + A, G, C, U. DNA: deoxyribose + A, G, C, T. NTPs are substrate for replication/transcription. Nucleoside = base + sugar (no phosphate).",
      },
      {
        id: "replication-fork",
        label: "Replication Fork",
        position: [2.5, 3.5, 0],
        geometry: "sphere",
        size: [0.6, 0.6, 0.6, 14],
        color: "#44ffcc",
        emissiveColor: "#00aa88",
        pulse: true,
        info: "Bidirectional replication from origin. Helicase unwinds DNA (uses ATP). SSBPs stabilize. Topoisomerase I/II: relieves torsional strain (target of quinolones). Primase: RNA primer (no proofreading). DNA Pol III: leading strand (continuous), lagging strand (Okazaki fragments). DNA Pol I: removes primers. Ligase: joins fragments.",
      },
      {
        id: "transcription",
        label: "RNA Polymerase",
        position: [0, 0.5, 0],
        geometry: "sphere",
        size: [0.7, 0.7, 0.7, 16],
        color: "#ff88ff",
        emissiveColor: "#cc00cc",
        info: "Transcribes DNA → mRNA (5'→3'). No primer needed. RNA Pol I: rRNA. RNA Pol II: mRNA (α-amanitin sensitive). RNA Pol III: tRNA, 5S rRNA. Promoter: TATA box (-25), CAAT box (-75). Eukaryotic: 5' cap (7-methylguanosine), poly-A tail, splicing (snRNPs). Spliceosomes remove introns.",
      },
      {
        id: "translation-ribosome",
        label: "Translation",
        position: [-2.5, 0.5, 0],
        geometry: "sphere",
        size: [0.65, 0.65, 0.65, 16],
        color: "#88aaff",
        info: "mRNA → protein. Ribosome A site: aminoacyl-tRNA. P site: peptidyl-tRNA. E site: exiting tRNA. Initiation: AUG (Met). Elongation: peptidyl transferase (23S rRNA ribozyme). GTP used. Termination: UAA, UAG, UGA (release factors). Antibiotics targeting 30S: aminoglycosides, tetracyclines. 50S: macrolides, chloramphenicol, linezolid.",
      },
      {
        id: "mutation-types",
        label: "Mutations",
        position: [2.5, 0.5, 0],
        geometry: "box",
        size: [0.8, 0.5, 0.4],
        color: "#ff6666",
        info: "Silent: same AA (synonymous). Missense: different AA (sickle cell: Glu→Val in HbS). Nonsense: stop codon → truncated protein. Frameshift: insertion/deletion (not multiple of 3) → altered downstream. Splice site: retained intron. Transition: purine↔purine or pyrimidine↔pyrimidine. Transversion: purine↔pyrimidine.",
      },
      {
        id: "pcr",
        label: "PCR / DNA Technology",
        position: [0, -1.5, 0],
        geometry: "cylinder",
        size: [0.4, 0.4, 1.2, 10],
        color: "#aaffaa",
        info: "Polymerase Chain Reaction: amplify specific DNA. Steps: denaturation (94°C), annealing (50-65°C), extension (72°C, Taq polymerase). Southern blot: DNA. Northern blot: RNA. Western blot: protein. ELISA: antigen/antibody. FISH: chromosomal location. Gel electrophoresis: size separation.",
      },
    ],
  },

  // ── 7. Hormones & Cell Signaling ─────────────────────────────────────────────
  {
    chapterKey: "hormones-cell-signaling",
    title: "Hormones & Cell Signaling",
    description: "Receptor types, second messengers, insulin, glucagon, steroid hormones",
    bgColor: "#080012",
    cameraPosition: [0, 0, 12],
    autoRotate: false,
    highlights: [
      "cAMP pathway (Gs): glucagon, epinephrine, TSH, ACTH, FSH, LH, PTH, calcitonin",
      "IP3/DAG pathway (Gq): α1, H1, V1, M1/M3, GnRH, oxytocin, TRH",
      "Receptor tyrosine kinase: insulin, IGF-1, PDGF, EGF (→ RAS pathway)",
      "Steroid hormones: nuclear receptors, alter gene transcription (slow, long-lasting)",
      "NO (nitric oxide): cGMP → smooth muscle relaxation; synthesized by NOS from arginine",
    ],
    parts: [
      {
        id: "cell",
        label: "Target Cell",
        position: [0, 1.5, 0],
        geometry: "sphere",
        size: [2.2, 2.2, 2.2, 24],
        color: "#334466",
        info: "Cell responds to hormone signals. Hydrophilic hormones (peptides, catecholamines): bind surface receptors → second messengers. Hydrophobic hormones (steroids, thyroid hormones): cross membrane → nuclear/cytoplasmic receptors → directly alter gene expression.",
      },
      {
        id: "receptor",
        label: "GPCR Receptor",
        position: [0, 1.5, 2.1],
        geometry: "cylinder",
        size: [0.3, 0.3, 0.8, 8],
        color: "#ff8844",
        emissiveColor: "#cc4400",
        info: "G-protein coupled receptor: 7 transmembrane domains. Gs: ↑adenylyl cyclase → ↑cAMP → PKA. Gi: ↓adenylyl cyclase → ↓cAMP (M2, α2, D2 receptors). Gq: ↑PLC → IP3 + DAG → Ca2+/PKC. Cholera toxin: locks Gs on. Pertussis toxin: locks Gi off.",
      },
      {
        id: "insulin-receptor",
        label: "Insulin Receptor (RTK)",
        position: [-2.0, 1.5, 1.2],
        geometry: "cylinder",
        size: [0.28, 0.28, 1.0, 8],
        color: "#44ff88",
        emissiveColor: "#00aa44",
        info: "Receptor tyrosine kinase (RTK). Insulin binding → autophosphorylation → IRS-1 → PI3K → Akt. Effects: ↑GLUT4 (muscle/fat), glycogen synthesis, lipogenesis, protein synthesis, ↓gluconeogenesis. Glucose enters insulin-independent cells (brain, RBC, liver, kidney, cornea) via GLUT1/2/3.",
      },
      {
        id: "camp",
        label: "cAMP (2nd Messenger)",
        position: [1.8, 1.5, 0],
        geometry: "sphere",
        size: [0.4, 0.4, 0.4, 14],
        color: "#ffff44",
        emissiveColor: "#cccc00",
        pulse: true,
        info: "Cyclic AMP: second messenger for Gs-coupled receptors. Adenylyl cyclase: ATP → cAMP. cAMP → PKA → phosphorylates target proteins. Phosphodiesterase: degrades cAMP. Caffeine: inhibits phosphodiesterase. Examples: glucagon activates hepatic glycogenolysis via cAMP → PKA → phosphorylase kinase → glycogen phosphorylase.",
      },
      {
        id: "steroid-pathway",
        label: "Steroid Hormone",
        position: [-2.0, -0.5, 0],
        geometry: "sphere",
        size: [0.5, 0.5, 0.5, 14],
        color: "#ffaaff",
        emissiveColor: "#cc44cc",
        info: "Lipophilic → cross cell membrane freely. Bind intracellular/nuclear receptors. Hormone-receptor complex → transcription factor → alters gene expression. Examples: cortisol, aldosterone, testosterone, estrogen, progesterone. Effects: slow onset, long-lasting. Thyroid hormones also use nuclear receptors (despite being water-soluble).",
      },
      {
        id: "calcium-signaling",
        label: "Ca²⁺ / IP3",
        position: [1.8, -0.5, 0],
        geometry: "sphere",
        size: [0.45, 0.45, 0.45, 14],
        color: "#44aaff",
        pulse: true,
        info: "Gq → PLC → PIP2 cleaved → IP3 + DAG. IP3: releases Ca2+ from ER. Ca2+ + calmodulin → CaM kinase. DAG + Ca2+ → PKC. Examples: oxytocin, ADH (V1), α1-adrenergic, H1, M1/M3. MLCK (smooth muscle contraction). Troponin C in skeletal/cardiac muscle.",
      },
      {
        id: "glucagon",
        label: "Glucagon vs Insulin",
        position: [0, -1.5, 0],
        geometry: "box",
        size: [1.8, 0.5, 0.4],
        color: "#ff6644",
        info: "Glucagon (α-cells): ↑blood glucose. Activates hepatic glycogenolysis and gluconeogenesis. cAMP pathway. Secreted by fasting/hypoglycemia. Insulin (β-cells): ↓blood glucose. Storage hormone: ↑glycogen, ↑lipogenesis, ↑protein synthesis, ↑K+ uptake. C-peptide: marker of endogenous insulin. Type 1 DM: no insulin. Type 2 DM: insulin resistance.",
      },
    ],
  },

  // ── 8. Clinical Biochemistry ─────────────────────────────────────────────────
  {
    chapterKey: "clinical-biochemistry",
    title: "Clinical Biochemistry",
    description: "Inborn errors, laboratory markers, organ-specific enzymes, acid-base",
    bgColor: "#0a0a0a",
    cameraPosition: [0, 0, 13],
    autoRotate: false,
    highlights: [
      "Troponin I/T: most sensitive/specific for myocardial infarction",
      "AST:ALT >2:1 suggests alcoholic hepatitis; ALT>AST suggests viral hepatitis",
      "Anion gap = Na⁺ − (Cl⁻ + HCO₃⁻); normal 8-12. High AG: MUDPILES",
      "HbA1c reflects average blood glucose over past 2-3 months",
      "LDH isoenzymes: LDH1 (heart/RBC), LDH5 (liver/muscle)",
    ],
    parts: [
      {
        id: "heart-markers",
        label: "Cardiac Biomarkers",
        position: [-2.5, 3.0, 0],
        geometry: "sphere",
        size: [0.7, 0.7, 0.7, 16],
        color: "#ff4444",
        emissiveColor: "#cc0000",
        pulse: true,
        info: "Troponin I/T: rise 4-6h, peak 24h, persist 7-10d (most specific for MI). CK-MB: rise 4-6h, normalize 2-3d (useful for re-infarction). Myoglobin: rise 1-3h (most sensitive early but not specific). BNP: heart failure marker. LDH1: cardiac. Treatment: PCI within 90 min (STEMI) or thrombolytics.",
      },
      {
        id: "liver-markers",
        label: "Liver Enzymes",
        position: [2.5, 3.0, 0],
        geometry: "sphere",
        size: [0.65, 0.65, 0.65, 14],
        color: "#ffaa00",
        info: "ALT (GPT): liver-specific. AST (GOT): liver + heart + muscle. ALP: bile ducts + bone (bone ALP rises in Paget's, growing children). GGT: alcohol use marker, bile ducts. Bilirubin: direct (conjugated, water-soluble) vs indirect (unconjugated, lipid-soluble). Albumin: synthetic function (half-life 20d), PT/INR: synthesis.",
      },
      {
        id: "hba1c",
        label: "HbA1c",
        position: [0, 3.0, 0],
        geometry: "sphere",
        size: [0.6, 0.6, 0.6, 14],
        color: "#ff88aa",
        info: "Glycated hemoglobin: non-enzymatic glycation of Hb β-chain N-terminus. Reflects mean blood glucose over 2-3 months (RBC lifespan). Normal <5.7%. Pre-diabetes: 5.7-6.4%. Diabetes: ≥6.5%. Falsely low: hemolytic anemia (↑RBC turnover). Falsely high: iron deficiency, asplenia. Each 1% ≈ 30 mg/dL glucose.",
      },
      {
        id: "acid-base",
        label: "Acid-Base",
        position: [-2.5, 1.0, 0],
        geometry: "box",
        size: [0.9, 0.6, 0.4],
        color: "#4488ff",
        info: "Henderson-Hasselbalch: pH = 6.1 + log([HCO3-]/0.03×PaCO2). MUDPILES (high AG metabolic acidosis): Methanol, Uremia, DKA, Propylene glycol, INH/Iron, Lactic acidosis, Ethylene glycol, Salicylates. Non-AG: HARDASS (Hyperalimentation, Addison's, RTA, Diarrhea, Acetazolamide, Spironolactone, Saline).",
      },
      {
        id: "ldh",
        label: "LDH Isoenzymes",
        position: [2.5, 1.0, 0],
        geometry: "cylinder",
        size: [0.4, 0.4, 0.9, 10],
        color: "#aaaaff",
        info: "LDH 5 isoenzymes (H4 → M4). LDH1 (H4): heart, RBC — ↑MI, hemolysis. LDH2 (H3M1): RBC. LDH5 (M4): liver, skeletal muscle — ↑liver disease. 'Flipped ratio' (LDH1>LDH2): pathognomonic of MI. LDH also elevated in: lymphoma, hemolysis, megaloblastic anemia. Lactate dehydrogenase: pyruvate ⇌ lactate.",
      },
      {
        id: "inborn-errors",
        label: "Lysosomal Storage",
        position: [0, 1.0, 0],
        geometry: "sphere",
        size: [0.6, 0.6, 0.6, 14],
        color: "#ffccaa",
        info: "Gaucher (glucocerebrosidase): crinkled paper macrophages, Erlenmeyer flask femur, no neuro (type 1). Niemann-Pick (sphingomyelinase): cherry red spot, foamy cells, neuro. Tay-Sachs (hexosaminidase A): cherry red spot, no hepatosplenomegaly, severe neuro. Fabry (α-galactosidase A): X-linked, peripheral neuropathy, renal failure, angiokeratomas. All AR except Fabry.",
      },
      {
        id: "electrolytes",
        label: "Electrolytes / Osmolality",
        position: [0, -0.5, 0],
        geometry: "box",
        size: [1.6, 0.45, 0.4],
        color: "#88ffcc",
        info: "Serum osmolality = 2[Na+] + glucose/18 + BUN/2.8. Osmolar gap = measured - calculated >10 mEq: methanol, ethanol, ethylene glycol. Hyponatremia: SIADH (↑ADH, dilutional), cerebral salt wasting. Hypernatremia: DI (central/nephrogenic). K+: ECG changes. Hyper K+: peaked T waves, wide QRS. Hypo K+: U waves, ↑digoxin toxicity.",
      },
      {
        id: "tumor-markers",
        label: "Tumor Markers",
        position: [0, -2.0, 0],
        geometry: "sphere",
        size: [0.55, 0.55, 0.55, 14],
        color: "#ff66ff",
        info: "AFP (α-fetoprotein): HCC, yolk sac tumor (↑in neural tube defects, ↓in Down syndrome). CEA: colorectal/pancreatic CA (not diagnostic). CA-125: ovarian CA. CA 19-9: pancreatic CA. PSA: prostate. β-hCG: choriocarcinoma, hydatidiform mole. LDH: lymphoma, germ cell. S-100: melanoma, schwannoma.",
      },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let inserted = 0;
  let updated = 0;

  for (const scene of scenes) {
    const result = await AnatomyScene.findOneAndUpdate(
      { chapterKey: scene.chapterKey },
      { $set: scene },
      { upsert: true, new: true }
    );
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      inserted++;
      console.log(`  ✓ Inserted: ${scene.title}`);
    } else {
      updated++;
      console.log(`  ↺ Updated:  ${scene.title}`);
    }
  }

  console.log(`\nDone. ${inserted} inserted, ${updated} updated.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
