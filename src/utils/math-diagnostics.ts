/**
 * ZeePrep Academic Diagnostic Engine (Multi-Subject: Math, Physics, Chemistry, Biology, CS)
 * Pinpoints specific problem types, chapters, topics, formulas/equations,
 * student misconceptions, and targeted remedial steps for any assessed question.
 */

export interface MathDiagnosisResult {
  problemType: string;
  chapter: string;
  topic: string;
  formulaStruggledWith: string;
  conceptStruggledWith: string;
  exactRemedy: string;
  severity: "high" | "medium" | "low";
}

export type AcademicDiagnosisResult = MathDiagnosisResult;

interface AcademicPattern {
  keywords: string[];
  subjects?: string[];
  problemType: string;
  chapter: string;
  topic: string;
  formula: string;
  concept: string;
  remedy: string;
}

const ACADEMIC_PATTERNS: AcademicPattern[] = [
  // =========================================================================
  // 1. MATHEMATICS
  // =========================================================================
  {
    keywords: ["power set", "subset", "2^n", "cardinality", "p(a)"],
    subjects: ["mathematics"],
    problemType: "Power Set & Subset Cardinality Calculation",
    chapter: "Sets",
    topic: "Power Sets & Subsets",
    formula: "n(P(A)) = 2^n(A)",
    concept: "Counting total subsets including empty set ∅ and the set itself.",
    remedy: "Remember that a set with n elements has exactly 2ⁿ subsets and 2ⁿ - 1 proper non-empty subsets.",
  },
  {
    keywords: ["symmetric difference", "a △ b", "(a - b) ∪ (b - a)", "union", "intersection"],
    subjects: ["mathematics"],
    problemType: "Set Operations & Symmetric Difference",
    chapter: "Sets",
    topic: "Venn Diagrams & Set Operations",
    formula: "A △ B = (A ∪ B) - (A ∩ B) = (A - B) ∪ (B - A)",
    concept: "Elements that belong to either A or B, but NOT both simultaneously.",
    remedy: "Draw a 2-circle Venn diagram and shade the regions belonging to A only and B only.",
  },
  {
    keywords: ["domain", "range", "relation", "equivalence relation", "reflexive", "symmetric", "transitive"],
    subjects: ["mathematics"],
    problemType: "Relation Properties & Domain/Range Evaluation",
    chapter: "Relations & Functions",
    topic: "Equivalence Relations & Domain Analysis",
    formula: "Reflexive: (a,a)∈R; Symmetric: (a,b)∈R ⇒ (b,a)∈R; Transitive: (a,b),(b,c)∈R ⇒ (a,c)∈R",
    concept: "Testing all 3 criteria (reflexive, symmetric, transitive) across universal set elements.",
    remedy: "Check counterexamples for transitivity whenever (a,b) and (b,c) exist but (a,c) is absent.",
  },
  {
    keywords: ["f(x)", "modulus", "|x|", "square root", "domain of function", "√(x² - a²)"],
    subjects: ["mathematics"],
    problemType: "Real Function Domain & Constraint Finding",
    chapter: "Relations & Functions",
    topic: "Domain of Radical & Modulus Functions",
    formula: "For f(x) = √(g(x)), condition: g(x) ≥ 0; For 1/g(x), condition: g(x) ≠ 0",
    concept: "Ensuring radicand is non-negative and denominator is strictly non-zero.",
    remedy: "Solve the inequality g(x) ≥ 0 using the wavy curve (sign scheme) method.",
  },
  {
    keywords: ["quadratic", "discriminant", "roots of", "b² - 4ac", "nature of roots", "alpha + beta", "alpha * beta"],
    subjects: ["mathematics"],
    problemType: "Quadratic Equation Discriminant & Root Relations",
    chapter: "Quadratic Equations",
    topic: "Discriminant & Vieta's Formulas",
    formula: "D = b² - 4ac;  x = (-b ± √D) / 2a;  α + β = -b/a,  αβ = c/a",
    concept: "Classifying roots (D > 0 distinct real, D = 0 equal real, D < 0 complex) and forming equations.",
    remedy: "Calculate D = b² - 4ac first before attempting factorization or quadratic formula substitution.",
  },
  {
    keywords: ["i^", "imaginary", "iota", "i²", "complex number", "real part", "imaginary part"],
    subjects: ["mathematics"],
    problemType: "Powers of Iota & Complex Arithmetic",
    chapter: "Complex Numbers",
    topic: "Integral Powers of Iota (i)",
    formula: "i = √(-1), i² = -1, i³ = -i, i⁴ = 1  ⇒  i^(4k+r) = i^r",
    concept: "Reducing high powers of i by dividing the exponent by 4 and evaluating the remainder.",
    remedy: "Divide the power of i by 4; if remainder is 0 → 1, 1 → i, 2 → -1, 3 → -i.",
  },
  {
    keywords: ["modulus of complex", "|z|", "argument", "arg(z)", "polar form", "conjugate"],
    subjects: ["mathematics"],
    problemType: "Modulus & Principal Argument Calculation",
    chapter: "Complex Numbers",
    topic: "Modulus and Argument of Complex Numbers",
    formula: "|z| = √(x² + y²),  θ = arg(z) = tan⁻¹(|y/x|) with Quadrant Sign Adjustment",
    concept: "Determining the principal argument in the interval (-π, π] based on Argand plane quadrant.",
    remedy: "Identify quadrant of z: Q1: θ=α, Q2: θ=π-α, Q3: θ=-(π-α), Q4: θ=-α where α = tan⁻¹(|y/x|).",
  },
  {
    keywords: ["inequality", "|x| < a", "|x| > a", "solution set", "interval"],
    subjects: ["mathematics"],
    problemType: "Absolute Value Linear Inequality Solving",
    chapter: "Linear Inequalities",
    topic: "Modulus Inequalities on Real Line",
    formula: "|x - c| ≤ r  ⟺  c - r ≤ x ≤ c + r;  |x - c| ≥ r  ⟺  x ≤ c - r or x ≥ c + r",
    concept: "Splitting modulus into dual bounded or unbounded intervals on the real number line.",
    remedy: "Remember that |x| < a means x lies within distance a of 0: (-a, a).",
  },
  {
    keywords: ["permutation", "combination", "npr", "ncr", "arranged", "selected", "factorial"],
    subjects: ["mathematics"],
    problemType: "Combinatorial Selection & Arrangement",
    chapter: "Permutations & Combinations",
    topic: "Counting Principles, NPR & NCR",
    formula: "ⁿPᵣ = n! / (n - r)!,  ⁿCᵣ = n! / (r!(n - r)!),  ⁿCᵣ = ⁿCₙ₋ᵣ",
    concept: "Distinguishing when order matters (Permutations) vs when order does not matter (Combinations).",
    remedy: "If forming teams/committees → use ⁿCᵣ. If seating in a row or assigning specific roles → use ⁿPᵣ.",
  },
  {
    keywords: ["sin(x + y)", "cos(x - y)", "tan(a + b)", "compound angle", "sin 75°", "cos 15°"],
    subjects: ["mathematics"],
    problemType: "Trigonometric Compound Angle Identity",
    chapter: "Trigonometric Functions",
    topic: "Compound Angle Addition & Subtraction",
    formula: "sin(A ± B) = sin A cos B ± cos A sin B;  cos(A ± B) = cos A cos B ∓ sin A sin B",
    concept: "Expanding composite angles into product terms with proper algebraic signs.",
    remedy: "For cos(A + B), remember the sign is NEGATIVE between products: cos A cos B - sin A sin B.",
  },
  {
    keywords: ["cos 2x", "sin 2x", "tan 2x", "double angle", "half angle", "1 - cos 2x", "1 + cos 2x"],
    subjects: ["mathematics"],
    problemType: "Double Angle & Sub-Multiple Angle Identity",
    chapter: "Trigonometric Functions",
    topic: "Multiple and Sub-Multiple Angles",
    formula: "cos 2θ = cos²θ - sin²θ = 2cos²θ - 1 = 1 - 2sin²θ;  1 - cos 2θ = 2sin²θ",
    concept: "Replacing double angle terms to simplify rational trigonometric fractions.",
    remedy: "Use 1 - cos 2θ = 2sin²θ and 1 + cos 2θ = 2cos²θ for immediate simplification in calculus & trig.",
  },
  {
    keywords: ["arithmetic progression", "a.p.", "common difference", "sum of n terms", "a + (n-1)d"],
    subjects: ["mathematics"],
    problemType: "Arithmetic Progression General Term & Summation",
    chapter: "Sequences & Series",
    topic: "Arithmetic Progression (AP)",
    formula: "aₙ = a + (n - 1)d,  Sₙ = (n / 2)[2a + (n - 1)d] = (n / 2)[a + l]",
    concept: "Finding unknown common difference d or term count n from given system of linear equations.",
    remedy: "Express given conditions as equations in first term a and common difference d, then solve simultaneously.",
  },
  {
    keywords: ["geometric progression", "g.p.", "common ratio", "infinite gp", "sum to infinity"],
    subjects: ["mathematics"],
    problemType: "Geometric Progression & Infinite Sum Evaluation",
    chapter: "Sequences & Series",
    topic: "Geometric Progression (GP) & Infinite Series",
    formula: "aₙ = a·rⁿ⁻¹,  Sₙ = a(1 - rⁿ)/(1 - r) for r ≠ 1,  S_∞ = a / (1 - r) for |r| < 1",
    concept: "Summing convergent infinite geometric sequences when common ratio magnitude is less than 1.",
    remedy: "Check that |r| < 1 before using S_∞ = a / (1 - r); common ratio r = a₂ / a₁.",
  },
  {
    keywords: ["straight line", "slope", "perpendicular", "parallel lines", "y = mx + c", "distance of point"],
    subjects: ["mathematics"],
    problemType: "Line Equations, Slopes & Perpendicular Distance",
    chapter: "Straight Lines",
    topic: "Slope Condition & Normal Distance to Line",
    formula: "Perpendicular: m₁·m₂ = -1;  Distance d = |Ax₁ + By₁ + C| / √(A² + B²)",
    concept: "Perpendicular lines have negative reciprocal slopes; distance formula requires standard form Ax + By + C = 0.",
    remedy: "Write the line in standard form Ax + By + C = 0 before substituting (x₁, y₁) into the numerator.",
  },
  {
    keywords: ["limit", "lim", "x->0", "x→0", "sin x / x", "(e^x - 1)/x", "0/0 indeterminate"],
    subjects: ["mathematics"],
    problemType: "Indeterminate Limit Evaluation via Standard Limits",
    chapter: "Limits & Derivatives",
    topic: "Standard Trigonometric & Algebraic Limits",
    formula: "lim(x→0) (sin x / x) = 1,  lim(x→0) (tan x / x) = 1,  lim(x→a) (xⁿ - aⁿ)/(x - a) = n·aⁿ⁻¹",
    concept: "Transforming 0/0 indeterminate forms by algebraic factoring or standard limit substitution.",
    remedy: "Match the argument inside sin(kx) by multiplying and dividing by k in the denominator.",
  },
  {
    keywords: ["derivative", "d/dx", "differentiation", "quotient rule", "product rule", "chain rule"],
    subjects: ["mathematics"],
    problemType: "Calculus Product & Quotient Rule Differentiation",
    chapter: "Limits & Derivatives",
    topic: "Rules of Differentiation (Product & Quotient)",
    formula: "Product: (u·v)' = u'v + uv';  Quotient: (u/v)' = (v·u' - u·v') / v²",
    concept: "Applying systematic differentiation rules while keeping denominator squared in quotient rule.",
    remedy: "Write down u and v separately, calculate u' and v', then assemble (v u' - u v') / v².",
  },
  {
    keywords: ["probability", "p(a ∪ b)", "mutually exclusive", "independent events", "p(a ∩ b)", "conditional probability"],
    subjects: ["mathematics"],
    problemType: "Axiomatic Probability & Compound Events",
    chapter: "Probability",
    topic: "Addition & Multiplication Theorems",
    formula: "P(A ∪ B) = P(A) + P(B) - P(A ∩ B);  P(A|B) = P(A ∩ B) / P(B)",
    concept: "Subtracting intersection probability to avoid double counting overlapping sample points.",
    remedy: "Check if events are mutually exclusive (P(A ∩ B) = 0) or independent (P(A ∩ B) = P(A)P(B)).",
  },

  // =========================================================================
  // 2. PHYSICS
  // =========================================================================
  {
    keywords: ["kinematics", "velocity", "acceleration", "displacement", "v = u + at", "s = ut", "v² = u²"],
    subjects: ["physics", "science"],
    problemType: "Equations of Motion & Kinematic Variables",
    chapter: "Motion & Kinematics",
    topic: "Uniformly Accelerated Motion",
    formula: "v = u + at,  s = ut + (1/2)at²,  v² = u² + 2as",
    concept: "Solving for unknown kinematic variable under constant linear acceleration.",
    remedy: "List known variables (u, v, a, s, t), select the equation missing the unneeded variable, and mind direction signs (+/-).",
  },
  {
    keywords: ["newton", "force", "f = ma", "momentum", "inertia", "impulse"],
    subjects: ["physics", "science"],
    problemType: "Newton's Laws of Motion & Force Dynamics",
    chapter: "Laws of Motion",
    topic: "Newton's Second Law & Momentum",
    formula: "F_net = m·a,  p = m·v,  Impulse J = F·Δt = Δp = m(v - u)",
    concept: "Net unbalanced force causes acceleration proportional to mass; rate of change of momentum equals applied force.",
    remedy: "Draw a Free Body Diagram (FBD) to sum all forces along motion axis before writing ΣF = ma.",
  },
  {
    keywords: ["work", "kinetic energy", "potential energy", "power", "ke = 1/2", "mgh", "work-energy"],
    subjects: ["physics", "science"],
    problemType: "Work-Energy Theorem & Conservation of Energy",
    chapter: "Work, Energy & Power",
    topic: "Kinetic & Potential Energy Transformations",
    formula: "W = F·d·cos θ,  KE = (1/2)m·v²,  PE = m·g·h,  W_net = ΔKE = (1/2)m(v² - u²)",
    concept: "Work done by conservative forces transforms into kinetic energy without energy loss.",
    remedy: "Equate initial total mechanical energy to final total mechanical energy: (KE + PE)_initial = (KE + PE)_final.",
  },
  {
    keywords: ["current", "voltage", "resistance", "ohm's law", "v = ir", "resistor", "series", "parallel"],
    subjects: ["physics", "science"],
    problemType: "Ohm's Law & Resistor Network Analysis",
    chapter: "Current Electricity",
    topic: "Series & Parallel Circuit Networks",
    formula: "V = I·R;  Series: R_s = R₁ + R₂;  Parallel: 1/R_p = 1/R₁ + 1/R₂ ⇒ R_p = (R₁R₂)/(R₁+R₂)",
    concept: "Current is constant across series components; voltage is constant across parallel branches.",
    remedy: "For two parallel resistors, use the shortcut R_parallel = (Product) / (Sum).",
  },
  {
    keywords: ["electric power", "joule heating", "p = vi", "i²r", "kwh", "commercial unit"],
    subjects: ["physics", "science"],
    problemType: "Joule's Law of Heating & Electrical Power",
    chapter: "Current Electricity",
    topic: "Electrical Energy & Power Calculations",
    formula: "P = V·I = I²·R = V²/R;  Heat H = I²·R·t (Joules);  1 kWh = 3.6 × 10⁶ J",
    concept: "Electrical power dissipated as heat in a resistor over time t.",
    remedy: "Use P = V²/R when voltage is constant (parallel/household) and P = I²R when current is constant (series).",
  },
  {
    keywords: ["mirror formula", "lens formula", "focal length", "magnification", "1/f = 1/v", "concave", "convex"],
    subjects: ["physics", "science"],
    problemType: "Optics Geometric Ray Tracing & Image Formation",
    chapter: "Light & Optics",
    topic: "Spherical Mirrors & Lenses",
    formula: "Mirror: 1/f = 1/v + 1/u, m = -v/u;  Lens: 1/f = 1/v - 1/u, m = v/u;  Power P = 1/f(m)",
    concept: "Applying Cartesian sign convention: object distance u is always negative; focal length f is negative for concave and positive for convex.",
    remedy: "Write down standard signs first: u is ALWAYS -ve. Concave mirror/lens f is -ve. Convex mirror/lens f is +ve.",
  },
  {
    keywords: ["snell's law", "refraction", "refractive index", "sin i / sin r", "speed of light", "critical angle"],
    subjects: ["physics", "science"],
    problemType: "Refraction of Light & Snell's Law Evaluation",
    chapter: "Light & Optics",
    topic: "Refraction & Refractive Index",
    formula: "n = c / v = sin i / sin r;  n₁ sin θ₁ = n₂ sin θ₂;  Critical Angle sin C = 1/n",
    concept: "Bending of light across media boundaries due to change in wave phase velocity.",
    remedy: "Remember that light bends TOWARDS the normal when entering a denser medium (n₂ > n₁ ⇒ r < i).",
  },
  {
    keywords: ["gravitation", "gravity", "universal law", "g = gm/r²", "weight", "free fall"],
    subjects: ["physics", "science"],
    problemType: "Universal Gravitation & Gravitational Acceleration",
    chapter: "Gravitation",
    topic: "Newton's Law of Gravitation & Acceleration due to Gravity",
    formula: "F = G(m₁m₂)/r²;  g = (G·M)/R²;  Weight W = m·g",
    concept: "Gravitational attraction follows the inverse-square law with distance between centres of mass.",
    remedy: "If distance doubles (2r), gravitational force decreases by a factor of 4 (inverse square).",
  },
  {
    keywords: ["sound", "wave", "frequency", "wavelength", "v = fλ", "echo", "time period"],
    subjects: ["physics", "science"],
    problemType: "Acoustic Wave Propagation & Echo Distance",
    chapter: "Sound",
    topic: "Wave Characteristics & Echo Timing",
    formula: "v = f·λ = λ / T;  Echo Distance d = (v·t) / 2;  f = 1 / T",
    concept: "Sound waves travel to obstacle and reflect back, covering double the physical distance in time t.",
    remedy: "Divide total echo return time by 2 to find one-way distance to the reflecting surface.",
  },

  // =========================================================================
  // 3. CHEMISTRY
  // =========================================================================
  {
    keywords: ["mole", "molar mass", "avogadro", "6.022", "stoichiometry", "number of moles"],
    subjects: ["chemistry", "science"],
    problemType: "Mole Concept & Stoichiometric Conversions",
    chapter: "Basic Concepts of Chemistry",
    topic: "Mole Conversions & Avogadro's Number",
    formula: "n = Mass (m) / Molar Mass (M) = Number of Particles (N) / N_A = Volume (L) / 22.4",
    concept: "Relating microscopic particle counts to macroscopic grams using Avogadro's constant N_A = 6.022 × 10²³.",
    remedy: "Calculate molar mass M by summing atomic masses of all atoms in chemical formula, then use n = m / M.",
  },
  {
    keywords: ["ph", "acid", "base", "poh", "hydrogen ion", "hydronium", "[h+]", "10^-ph"],
    subjects: ["chemistry", "science"],
    problemType: "Acid-Base pH & Hydronium Concentration",
    chapter: "Acids, Bases & Salts",
    topic: "pH Scale & Concentration Calculations",
    formula: "pH = -log₁₀[H⁺],  [H⁺] = 10^(-pH),  pH + pOH = 14 (at 25°C)",
    concept: "Logarithmic measure of acidity: each unit change on the pH scale represents a 10-fold change in H⁺ concentration.",
    remedy: "If given a base with [OH⁻] = 10⁻⁴ M, find pOH = 4 first, then calculate pH = 14 - 4 = 10.",
  },
  {
    keywords: ["redox", "oxidation", "reduction", "oxidizing agent", "reducing agent", "oxidation state"],
    subjects: ["chemistry", "science"],
    problemType: "Redox Reactions & Oxidation State Assignment",
    chapter: "Chemical Reactions & Equations",
    topic: "Oxidation-Reduction & Electron Transfer",
    formula: "OIL RIG: Oxidation Is Loss of electrons, Reduction Is Gain of electrons",
    concept: "The substance oxidized acts as the reducing agent; the substance reduced acts as the oxidizing agent.",
    remedy: "Assign oxidation numbers to each atom before and after reaction: increase in number = oxidation; decrease = reduction.",
  },
  {
    keywords: ["balancing", "chemical equation", "reactants", "products", "coefficients", "conservation of mass"],
    subjects: ["chemistry", "science"],
    problemType: "Chemical Equation Stoichiometric Balancing",
    chapter: "Chemical Reactions & Equations",
    topic: "Balancing Chemical Equations",
    formula: "Law of Conservation of Mass: Σ Atoms_reactants = Σ Atoms_products",
    concept: "Equalizing the count of each element on both sides of reaction without changing subscript chemical formulas.",
    remedy: "Balance metals first, then non-metals, then hydrogen, and balance oxygen last.",
  },
  {
    keywords: ["alkane", "alkene", "alkyne", "iupac", "functional group", "hydrocarbon", "isomer"],
    subjects: ["chemistry", "science"],
    problemType: "Organic Chemistry Nomenclature & Isomerism",
    chapter: "Carbon & Its Compounds",
    topic: "IUPAC Naming & Homologous Series",
    formula: "Alkane: C_n H_(2n+2);  Alkene: C_n H_(2n);  Alkyne: C_n H_(2n-2)",
    concept: "Identifying longest continuous carbon chain and assigning lowest possible locant numbers to functional groups.",
    remedy: "Find the longest carbon chain containing the principal functional group before numbering from the priority end.",
  },

  // =========================================================================
  // 4. BIOLOGY
  // =========================================================================
  {
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "dark reaction", "glucose", "stomata"],
    subjects: ["biology", "science"],
    problemType: "Photosynthesis Mechanism & Light-Dark Reactions",
    chapter: "Life Processes",
    topic: "Plant Nutrition & Chloroplast Function",
    formula: "6CO₂ + 6H₂O + Sunlight ⟶ C₆H₁₂O₆ + 6O₂",
    concept: "Conversion of radiant solar energy into chemical energy stored in glucose via chlorophyll pigments.",
    remedy: "Remember that light reactions photolyze H₂O to release O₂, while Calvin cycle dark reactions fix CO₂ into glucose.",
  },
  {
    keywords: ["mendel", "genetics", "monohybrid", "dihybrid", "dominant", "recessive", "punnett"],
    subjects: ["biology", "science"],
    problemType: "Mendelian Inheritance & Punnett Cross Ratios",
    chapter: "Heredity & Evolution",
    topic: "Monohybrid & Dihybrid Crosses",
    formula: "Monohybrid F2: 3:1 (Phenotypic), 1:2:1 (Genotypic);  Dihybrid F2: 9:3:3:1 (Phenotypic)",
    concept: "Segregation and independent assortment of dominant and recessive alleles during gametogenesis.",
    remedy: "Construct a 2×2 or 4×4 Punnett square with gamete genotypes along top and side margins to count offspring ratios accurately.",
  },
  {
    keywords: ["nephron", "kidney", "excretion", "ultrafiltration", "reabsorption", "urine"],
    subjects: ["biology", "science"],
    problemType: "Human Excretory Mechanism & Nephron Filtration",
    chapter: "Life Processes",
    topic: "Nephron Physiology & Excretion",
    formula: "Glomerular Filtration ⟶ Tubular Reabsorption (Glucose/Amino Acids/Water) ⟶ Tubular Secretion",
    concept: "Bowman's capsule filters blood under pressure; essential solutes and water are reabsorbed along PCT and Loop of Henle.",
    remedy: "Differentiate between ultrafiltration in the glomerulus and selective reabsorption of glucose in the convoluted tubule.",
  },
  {
    keywords: ["neuron", "reflex arc", "synapse", "brain", "action potential", "neurotransmitter"],
    subjects: ["biology", "science"],
    problemType: "Nervous Coordination & Reflex Arc Pathway",
    chapter: "Control & Coordination",
    topic: "Neural Impulse Transmission & Reflex Arcs",
    formula: "Receptor ⟶ Sensory Neuron ⟶ Relay Neuron (Spinal Cord) ⟶ Motor Neuron ⟶ Effector Muscle",
    concept: "Involuntary rapid protective reflex actions bypass the brain and complete their pathway through the spinal cord.",
    remedy: "Follow the 5-step sequence: Receptor ⟶ Sensory ⟶ Relay ⟶ Motor ⟶ Effector.",
  },

  // =========================================================================
  // 5. COMPUTER SCIENCE
  // =========================================================================
  {
    keywords: ["logic gate", "truth table", "and gate", "or gate", "nand", "nor", "xor", "boolean"],
    subjects: ["computer science"],
    problemType: "Boolean Algebra & Logic Gate Circuit Evaluation",
    chapter: "Boolean Logic",
    topic: "Logic Gates & Truth Tables",
    formula: "AND: A·B;  OR: A+B;  NAND: (A·B)';  NOR: (A+B)';  XOR: A'B + AB'",
    concept: "Evaluating binary logic expressions across input truth combinations (0s and 1s).",
    remedy: "NAND produces 0 ONLY when all inputs are 1; NOR produces 1 ONLY when all inputs are 0.",
  },
];

/**
 * Universal academic diagnosis helper that analyzes any question across Math,
 * Physics, Chemistry, Biology, CS, or General Science and derives specific problem
 * types, formulas struggled with, root misconceptions, and practical remedies.
 */
export function deriveAcademicProblemDiagnosis(
  question: {
    questionId?: string;
    questionNumber?: number;
    questionText?: string;
    text?: string;
    chapter?: string;
    topic?: string;
    explanation?: string;
    subject?: string;
    marks?: number;
  },
  studentAnswer: string | number | undefined,
  isCorrect: boolean,
  isUnanswered: boolean,
  subjectOverride?: string
): AcademicDiagnosisResult {
  const qText = String(question.questionText || question.text || "").toLowerCase();
  const qChapter = String(question.chapter || "").trim();
  const qTopic = String(question.topic || "").trim();
  const qExpl = String(question.explanation || "").toLowerCase();
  const rawSub = String(subjectOverride || question.subject || "").toLowerCase();
  const combinedHaystack = `${qText} ${qChapter.toLowerCase()} ${qTopic.toLowerCase()} ${qExpl} ${rawSub}`;

  let bestMatch: AcademicPattern | null = null;
  let bestScore = 0;

  for (const pattern of ACADEMIC_PATTERNS) {
    let score = 0;

    // Subject alignment boost
    if (pattern.subjects && pattern.subjects.some((s) => rawSub.includes(s))) {
      score += 2;
    }

    for (const kw of pattern.keywords) {
      if (combinedHaystack.includes(kw.toLowerCase())) {
        score += 3;
      }
    }

    if (qChapter && qChapter.toLowerCase().includes(pattern.chapter.toLowerCase())) {
      score += 4;
    }
    if (qTopic && qTopic.toLowerCase().includes(pattern.topic.toLowerCase())) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  if (bestMatch && bestScore >= 3) {
    return {
      problemType: bestMatch.problemType,
      chapter: qChapter || bestMatch.chapter,
      topic: qTopic || bestMatch.topic,
      formulaStruggledWith: bestMatch.formula,
      conceptStruggledWith: bestMatch.concept,
      exactRemedy: isUnanswered
        ? `Skipped question. ${bestMatch.remedy}`
        : `Calculation or concept misapplication. ${bestMatch.remedy}`,
      severity: isUnanswered ? "medium" : "high",
    };
  }

  // Fallback for general problem solving
  const fallbackChapter = qChapter || (rawSub ? `${rawSub.charAt(0).toUpperCase() + rawSub.slice(1)} Core` : "Core Curriculum");
  const fallbackTopic = qTopic || "Analytical Problem Solving";

  return {
    problemType: `${fallbackTopic} Standard Application`,
    chapter: fallbackChapter,
    topic: fallbackTopic,
    formulaStruggledWith: "Direct Fundamental Equation & Concept Definition",
    conceptStruggledWith: `Applying multi-step deductive methods in ${fallbackTopic}.`,
    exactRemedy: isUnanswered
      ? "Ensure you allocate sufficient time during the exam to attempt this problem type."
      : "Carefully verify conceptual definitions, numerical substitutions, and units before final selection.",
    severity: isUnanswered ? "medium" : "high",
  };
}

/**
 * Backward compatibility alias for deriveMathProblemDiagnosis.
 */
export function deriveMathProblemDiagnosis(
  question: {
    questionText?: string;
    text?: string;
    chapter?: string;
    topic?: string;
    explanation?: string;
    marks?: number;
  },
  studentAnswer: string | number | undefined,
  isCorrect: boolean,
  isUnanswered: boolean
): MathDiagnosisResult {
  return deriveAcademicProblemDiagnosis(question, studentAnswer, isCorrect, isUnanswered, "mathematics");
}
