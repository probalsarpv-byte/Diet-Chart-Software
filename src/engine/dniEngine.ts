import { 
  MedicineItem, 
  NutrientDepletion, 
  SupplementItem, 
  CandidateSupplement,
  SupplementOverlapWarning,
  DailyTimelineItem, 
  PatientProfile,
  ActivityLevel,
  ClinicalConditionId,
  GutAndAyurvedicProfile,
  FunctionalLabs
} from '../types';
import medicinesData from '../data/medicines.json';
import supplementsData from '../data/supplements.json';

export interface DNIEngineResult {
  depletions: {
    medicineName: string;
    depletion: NutrientDepletion;
  }[];
  candidateSupplements: CandidateSupplement[];
  overlapWarnings: SupplementOverlapWarning[];
  timeline: DailyTimelineItem[];
  criticalWarnings: {
    warning_bn: string;
    warning_en: string;
  }[];
}

/**
 * Screen candidate and prescribed supplements for cumulative nutrient dosage exceeding Tolerable Upper Intake Levels (UL).
 */
export function checkSupplementOverlaps(supplements: CandidateSupplement[]): SupplementOverlapWarning[] {
  const warnings: SupplementOverlapWarning[] = [];
  const approvedOrCandidate = supplements.filter(s => s.approval_status !== 'rejected');

  // 1. Magnesium screening (UL for supplemental magnesium is 350 mg elemental)
  const magSupps = approvedOrCandidate.filter(s => 
    s.id.includes('magnesium') || s.name_en.toLowerCase().includes('magnesium')
  );
  if (magSupps.length > 1) {
    warnings.push({
      nutrient: "Magnesium (Elemental)",
      total_amount_estimated: `${magSupps.length} concurrent magnesium sources`,
      tolerable_upper_limit: "350 mg/day (supplemental elemental magnesium)",
      sources: magSupps.map(s => s.name_en),
      severity: 'high',
      warning_bn: `সতর্কতা: একাধিক ম্যাগনেসিয়াম সাপ্লিমেন্ট চিহ্নিত হয়েছে (${magSupps.map(s => s.name_bn).join(' + ')})। সম্পূরক ম্যাগনেসিয়ামের নিরাপদ দৈনিক ঊর্ধ্বসীমা (UL) ৩৫০ মিগ্রা। অতিরিক্ত ডোজে ডায়রিয়া ও পেটে মোচড় হতে পারে।`,
      warning_en: `Upper Limit Alert: Multiple concurrent magnesium formulations selected (${magSupps.map(s => s.name_en).join(', ')}). Supplemental elemental magnesium UL is 350 mg/day. Excessive dosage can precipitate osmotic diarrhea.`
    });
  }

  // 2. Vitamin D3 screening (UL is 4,000 IU/day for long-term maintenance unless correcting deficiency under supervision)
  const d3Supps = approvedOrCandidate.filter(s => 
    s.id.includes('d3') || s.name_en.toLowerCase().includes('vitamin d') || s.recommended_dose.toLowerCase().includes('d3')
  );
  if (d3Supps.length > 1) {
    warnings.push({
      nutrient: "Vitamin D3 (Cholecalciferol)",
      total_amount_estimated: `${d3Supps.length} concurrent Vitamin D sources`,
      tolerable_upper_limit: "4,000 IU/day (routine maintenance UL)",
      sources: d3Supps.map(s => s.name_en),
      severity: 'medium',
      warning_bn: `সতর্কতা: একাধিক ভিটামিন ডি৩ উৎস উপস্থিত। রুটিন রক্ষণাবেক্ষণে দৈনিক ৪০০০ আইইউ এর অধিক দীর্ঘমেয়াদে গ্রহণ করলে ক্যালসিয়াম জমে হাইপারক্যালসেমিয়ার ঝুঁকি থাকে; সিরাম মাত্রা পর্যবেক্ষণ করুন।`,
      warning_en: `Cumulative Vitamin D Exposure: Multiple formulations contain Vitamin D. Long-term unsupervised intake above 4,000 IU/day requires serum 25(OH)D monitoring to prevent hypercalcemia.`
    });
  }

  // 3. Zinc screening (UL is 40 mg/day to prevent copper deficiency)
  const zincSupps = approvedOrCandidate.filter(s => 
    s.id.includes('zinc') || s.name_en.toLowerCase().includes('zinc')
  );
  if (zincSupps.length > 1) {
    warnings.push({
      nutrient: "Zinc",
      total_amount_estimated: `${zincSupps.length} concurrent Zinc sources`,
      tolerable_upper_limit: "40 mg/day",
      sources: zincSupps.map(s => s.name_en),
      severity: 'medium',
      warning_bn: `সতর্কতা: একাধিক জিংক সাপ্লিমেন্ট নির্বাচিত। দৈনিক ৪০ মিগ্রার বেশি জিংক গ্রহণ করলে তামা (Copper) শোষণ কমে রক্তাল্পতা দেখা দিতে পারে।`,
      warning_en: `Zinc Accumulation: Chronic zinc ingestion above 40 mg/day competitively inhibits intestinal copper absorption, potentially leading to microcytic anemia or neutropenia.`
    });
  }

  // 4. Folate screening (UL is 1,000 mcg/day for supplemental folate)
  const folateSupps = approvedOrCandidate.filter(s => 
    s.id.includes('folate') || s.name_en.toLowerCase().includes('folate') || s.id.includes('b9')
  );
  if (folateSupps.length > 1) {
    warnings.push({
      nutrient: "Folate (Vitamin B9)",
      total_amount_estimated: `${folateSupps.length} concurrent Folate sources`,
      tolerable_upper_limit: "1,000 mcg/day (dietary supplemental UL)",
      sources: folateSupps.map(s => s.name_en),
      severity: 'medium',
      warning_bn: `সতর্কতা: একাধিক ফোলেট (ভিটামিন বি৯) উৎস উপস্থিত। দৈনিক ১০০০ মাইক্রোগ্রামের বেশি ফোলেট দীর্ঘমেয়াদে গ্রহণ করলে ভিটামিন বি১২ ঘাটতিজনিত নিউরোপ্যাথির লক্ষণ চাপা পড়ে যেতে পারে।`,
      warning_en: `Cumulative Folate Exposure: Multiple formulations supply supplemental folate. Supplemental intake exceeding 1,000 mcg/day may mask hematological manifestations of occult Vitamin B12 deficiency.`
    });
  }

  return warnings;
}

/**
 * Deterministic Drug-Nutrient Interaction (DNI) & Daily Timeline Engine
 * 
 * Clinical Features:
 * - Deduplication of active medications
 * - Identification of evidence-based nutrient depletions
 * - Candidate supplement generation requiring explicit clinician review
 * - Cumulative nutrient overlap screening against established Tolerable Upper Intake Levels (UL)
 * - Chronological 24-hour lifestyle and drug-nutrient administration schedule
 */
export function evaluateDNIAndTimeline(
  patient: PatientProfile,
  allMedicines: MedicineItem[],
  allSupplements: SupplementItem[]
): DNIEngineResult {
  const depletions: { medicineName: string; depletion: NutrientDepletion }[] = [];
  const candidateSupplementsMap = new Map<string, CandidateSupplement>();
  const criticalWarnings: { warning_bn: string; warning_en: string }[] = [];

  // 1. Deduplicate active medications
  const normalizedMedsInput = Array.from(new Set(
    (patient.active_medications || []).map(m => (m || '').trim().toLowerCase()).filter(Boolean)
  ));

  const activeMeds: MedicineItem[] = [];
  const seenGenericNames = new Set<string>();

  for (const userMed of normalizedMedsInput) {
    const matched = allMedicines.find(m => 
      userMed === m.id.toLowerCase() || 
      userMed === m.generic_name.toLowerCase() ||
      userMed.includes(m.generic_name.toLowerCase()) ||
      m.brand_names_bd.some(b => userMed === b.toLowerCase() || userMed.includes(b.toLowerCase()))
    );

    if (matched && !seenGenericNames.has(matched.generic_name.toLowerCase())) {
      seenGenericNames.add(matched.generic_name.toLowerCase());
      activeMeds.push(matched);
    }
  }

  // 2. Gather depletions and recommend candidate supplements
  for (const med of activeMeds) {
    for (const dep of med.depletions) {
      depletions.push({
        medicineName: med.generic_name,
        depletion: dep
      });

      // Match targeted candidate supplement
      let matchedSupp: SupplementItem | undefined;
      let indicationTrigger = `${med.generic_name} nutrient depletion: ${dep.nutrient}`;

      if (dep.nutrient.toLowerCase().includes('magnesium')) {
        matchedSupp = allSupplements.find(s => s.id === 'supp_magnesium_glycinate');
      } else if (dep.nutrient.toLowerCase().includes('b12') || dep.nutrient.toLowerCase().includes('cobalamin')) {
        matchedSupp = allSupplements.find(s => s.id === 'supp_methyl_b12');
      } else if (dep.nutrient.toLowerCase().includes('coenzyme q10') || dep.nutrient.toLowerCase().includes('coq10')) {
        matchedSupp = allSupplements.find(s => s.id === 'supp_coq10');
      } else if (dep.nutrient.toLowerCase().includes('vitamin d3') || dep.nutrient.toLowerCase().includes('calcium')) {
        matchedSupp = allSupplements.find(s => s.id === 'supp_d3_k2');
      }

      if (matchedSupp && !candidateSupplementsMap.has(matchedSupp.id)) {
        candidateSupplementsMap.set(matchedSupp.id, {
          ...matchedSupp,
          approval_status: 'candidate_review',
          indication_trigger: indicationTrigger
        });
      }
    }
  }

  // 3. Condition-based candidate functional supplements
  if (patient.selected_conditions.includes('gut_dysbiosis') || patient.gut_profile.acid_reflux_hypoacidity) {
    const probio = allSupplements.find(s => s.id === 'supp_probiotic_boulardii');
    if (probio && !candidateSupplementsMap.has(probio.id)) {
      candidateSupplementsMap.set(probio.id, {
        ...probio,
        approval_status: 'candidate_review',
        indication_trigger: "Gut dysbiosis / mucosal microflora support"
      });
    }
  }

  if (patient.selected_conditions.includes('fatty_liver') || (patient.labs.tg_hdl_ratio && patient.labs.tg_hdl_ratio > 1.5)) {
    const omega = allSupplements.find(s => s.id === 'supp_omega3');
    if (omega && !candidateSupplementsMap.has(omega.id)) {
      candidateSupplementsMap.set(omega.id, {
        ...omega,
        approval_status: 'candidate_review',
        indication_trigger: "Hepatic lipid metabolism & triglyceride regulation"
      });
    }
  }

  if (patient.selected_conditions.includes('t2d_ir') || patient.selected_conditions.includes('pcos')) {
    const berb = allSupplements.find(s => s.id === 'supp_berberine_inversion');
    if (berb && !candidateSupplementsMap.has(berb.id)) {
      candidateSupplementsMap.set(berb.id, {
        ...berb,
        approval_status: 'candidate_review',
        indication_trigger: "Cellular insulin sensitivity & glucose disposal support"
      });
    }
  }

  const candidateSupplements = Array.from(candidateSupplementsMap.values());
  const overlapWarnings = checkSupplementOverlaps(candidateSupplements);

  // 4. Critical Medication Administration & Spacing Warnings
  const hasLevothyroxine = activeMeds.some(m => m.id === 'med_levothyroxine' || m.generic_name.toLowerCase().includes('levothyroxine'));
  const hasPPI = activeMeds.some(m => m.id === 'med_ppi' || m.generic_name.toLowerCase().includes('omeprazole') || m.generic_name.toLowerCase().includes('esomeprazole'));
  const hasMetformin = activeMeds.some(m => m.id === 'med_metformin' || m.generic_name.toLowerCase().includes('metformin'));
  const hasStatin = activeMeds.some(m => m.id === 'med_statin' || m.generic_name.toLowerCase().includes('statin'));
  const hasSteroids = activeMeds.some(m => m.id === 'med_steroids' || m.generic_name.toLowerCase().includes('prednisolone'));
  const hasNSAID = activeMeds.some(m => m.id === 'med_nsaid' || m.generic_name.toLowerCase().includes('naproxen') || m.generic_name.toLowerCase().includes('ibuprofen') || m.generic_name.toLowerCase().includes('diclofenac'));
  const hasSGLT2 = activeMeds.some(m => m.id === 'med_sglt2i' || m.generic_name.toLowerCase().includes('empagliflozin') || m.generic_name.toLowerCase().includes('dapagliflozin'));
  const hasSulfonylurea = activeMeds.some(m => m.id === 'med_sulfonylurea' || m.generic_name.toLowerCase().includes('gliclazide') || m.generic_name.toLowerCase().includes('glimepiride'));
  const hasARB = activeMeds.some(m => m.id === 'med_arb_acei' || m.generic_name.toLowerCase().includes('losartan') || m.generic_name.toLowerCase().includes('telmisartan') || m.generic_name.toLowerCase().includes('ramipril'));

  if (hasLevothyroxine) {
    criticalWarnings.push({
      warning_bn: "সতর্কতা: লেভোথাইরক্সিন ওষুধ সম্পূর্ণ খালি পেটে সকালবেলা সবার প্রথমে নিতে হবে। ক্যালসিয়াম, আয়রন, ম্যাগনেসিয়াম বা কফির অন্তত ৪ ঘণ্টা পূর্বে গ্রহণ আবশ্যক।",
      warning_en: "CRITICAL PRECAUTION: Levothyroxine absorption requires an acidic gastric environment and is chelated by polyvalent cations. Ingest upon waking with water only; maintain a strict 4-hour window before any Calcium, Iron, Magnesium, or Coffee."
    });
  }

  if (hasPPI && patient.gut_profile.acid_reflux_hypoacidity) {
    criticalWarnings.push({
      warning_bn: "পিপিআই (PPI) জাতীয় ওষুধের দীর্ঘমেয়াদি ব্যবহার পাকস্থলীর স্বাভাবিক এসিড কমিয়ে পুষ্টি শোষণ (ম্যাগনেসিয়াম, ভিটামিন বি১২, আয়রন) মারাত্মকভাবে ব্যাহত করে। খাবারের পূর্বে আদা ও সৈন্ধব লবণ দিয়ে পাচক রস উদ্দীপন ফলপ্রসূ হতে পারে।",
      warning_en: "Proton Pump Inhibitor (PPI) pharmacotherapy induces prolonged hypochlorhydria, significantly impeding fractional absorption of Magnesium, Vitamin B12, and non-heme Iron. Pre-meal digestive stimulation recommended."
    });
  }

  if (hasNSAID) {
    criticalWarnings.push({
      warning_bn: "সতর্কতা: এনএসএআইডি (NSAID - ন্যাপ্রোক্সেন/আইবুপ্রোফেন/ডাইক্লোফেনাক) চলাকালীন বিটাইন এইচসিএল (পাকস্থলীর অ্যাসিড সাপ্লিমেন্ট) গ্রহণ কঠোরভাবে নিষিদ্ধ; এটি মিউকোসা ক্ষয় ও রক্তক্ষরণের ঝুঁকি সৃষ্টি করে।",
      warning_en: "CRITICAL SAFETY ALERT: Betaine HCl is strictly contraindicated with concurrent NSAID therapy (Naproxen/Ibuprofen/Diclofenac) due to severe risk of gastric mucosal ulceration and hemorrhage."
    });
    // Suppress Betaine HCl from candidate supplements
    candidateSupplementsMap.delete('supp_betaine_hcl_pepsin');
  }

  if (hasSGLT2) {
    criticalWarnings.push({
      warning_bn: "সতর্কতা: এসজিএলটি২ ইনহিবিটর (SGLT2i) গ্রহণকারী রোগীদের জন্য অতি-স্বল্প শর্করা (<৬০ গ্রাম) বা ১৬ ঘণ্টার বেশি দীর্ঘ উপবাস ইউজ্লাইসেমিক কিটোঅ্যাসিডোসিসের (euDKA) ঝুঁকি তৈরি করে। পর্যাপ্ত তরল ও ইলেক্ট্রোলাইট বজায় রাখুন।",
      warning_en: "SGLT2 INHIBITOR PRECAUTION: Strict carbohydrate restriction (<60g) or fasting >16h poses a severe risk of Euglycemic Diabetic Ketoacidosis (euDKA). Ensure daily fluid intake >=2.5L and maintain minimum 60g complex carbohydrates."
    });
  }

  if (hasSulfonylurea) {
    criticalWarnings.push({
      warning_bn: "সতর্কতা: সালফোনাইলইউরিয়া (গ্লিক্লাজাইড/গ্লিমেপিরাইড) ওষুধের সাথে দীর্ঘ উপবাস বা খাবার বাদ দিলে মারাত্মক হাইপোগ্লাইসেমিয়া হতে পারে। খাবার গ্রহণের সাথে সমন্বয় আবশ্যক।",
      warning_en: "SULFONYLUREA HYPOGLYCEMIA ALERT: Skipping meals or prolonged fasting on secretagogues triggers severe acute hypoglycemia. Ensure synchronized meal intake."
    });
  }

  if (hasARB) {
    criticalWarnings.push({
      warning_bn: "সতর্কতা: এআরবি/এসিই ইনহিবিটর কিডনি দিয়ে পটাসিয়াম নির্গমন কমায়; অতিরিক্ত ডাবের পানি বা পটাসিয়াম সাপ্লিমেন্ট গ্রহণ পরিহার করুন।",
      warning_en: "POTASSIUM-SPARING PRECAUTION: ARB/ACE inhibitors impair renal potassium excretion. Avoid excessive potassium-rich supplements or coconut water."
    });
  }

  // 5. Generate Chronological 24-Hour Timeline
  const timeline: DailyTimelineItem[] = [];

  // 06:00 AM - Fasting / Waking
  if (hasLevothyroxine) {
    timeline.push({
      time: "06:00 AM",
      category: "medication",
      title_bn: "ঘুম থেকে উঠে: থাইরয়েড ওষুধ (প্রেসক্রিপশন)",
      title_en: "Upon Waking: Thyroid Hormone (Prescription)",
      instructions_bn: "১ গ্লাস সাধারণ পানি দিয়ে লেভোথাইরক্সিন গ্রহণ করুন। পরবর্তী ৬০ মিনিট কোনো খাবার, চা বা কফি খাবেন না।",
      instructions_en: "Ingest Levothyroxine with 1 glass of plain water. Allow at least 60 minutes before breakfast, tea, or coffee.",
      warning_bn: "দুধ বা চা দিয়ে খাবেন না; ক্যালসিয়াম ও আয়রনের সাথে অন্তত ৪ ঘণ্টার ব্যবধান বজায় রাখুন।",
      warning_en: "Do not co-administer with dairy, calcium, or iron. Maintain strict 4-hour mineral separation.",
      is_prescription_medication: true
    });
  } else if (hasPPI) {
    timeline.push({
      time: "06:30 AM",
      category: "medication",
      title_bn: "খালি পেটে: গ্যাস্ট্রিক ওষুধ (PPI - প্রেসক্রিপশন)",
      title_en: "Empty Stomach: Gastric PPI (Prescription)",
      instructions_bn: "১ গ্লাস কুসুম গরম পানি দিয়ে পিপিআই গ্রহণ করুন (নাশতার ৩০-৪৫ মিনিট আগে)।",
      instructions_en: "Take PPI with room-temperature water 30-45 minutes prior to breakfast as prescribed.",
      is_prescription_medication: true
    });
  } else {
    timeline.push({
      time: "06:30 AM",
      category: "protocol",
      title_bn: "সকালের হাইড্রেশন ও মেটাবলিক রিবুট",
      title_en: "Morning Hydration & Metabolic Reboot",
      instructions_bn: "১ গ্লাস কুসুম গরম পানিতে ১ চা চামচ তাজা লেবুর রস এবং এক চিমটি সৈন্ধব লবণ মিশিয়ে ধীরে ধীরে পান করুন।",
      instructions_en: "Drink 1 glass of room-temperature water with 1 tsp fresh lemon juice and a pinch of pink salt."
    });
  }

  // 07:40 AM - Pre-meal Digestive Primer
  if (patient.gut_profile.acid_reflux_hypoacidity || hasPPI || patient.gut_profile.digestive_fire_agni === 'mandagni') {
    timeline.push({
      time: "07:40 AM",
      category: "protocol",
      title_bn: "খাবারের ২০ মিনিট আগে: পাচক রস উদ্দীপক",
      title_en: "20 Mins Pre-Meal: Cephalic Acid Primer",
      instructions_bn: "পাতলা করে কাটা আদা কুচি সৈন্ধব লবণ দিয়ে ভালো করে চিবিয়ে খেয়ে নিন। এটি পাকস্থলীতে এনজাইম নিঃসরণ নিশ্চিত করে।",
      instructions_en: "Chew fresh ginger slivers with pink salt to stimulate gastric cephalic phase digestive enzymes."
    });
  }

  // 08:00 AM - Breakfast & Mealtime Items
  const breakfastMeds: string[] = [];
  if (hasMetformin) breakfastMeds.push("Metformin (প্রেসক্রিপশন - খাবারের ঠিক সাথে)");
  if (hasSteroids) breakfastMeds.push("Corticosteroid (প্রেসক্রিপশন - ভারী খাবারের সাথে)");
  if (candidateSupplementsMap.has('supp_methyl_b12')) breakfastMeds.push("Candidate: Sublingual Methyl-B12 (জিহ্বার নিচে)");

  timeline.push({
    time: "08:00 AM",
    category: "meal",
    title_bn: "সকালের পুষ্টিকর নাশতা (Breakfast)",
    title_en: "Nutrient-Dense Breakfast",
    instructions_bn: "প্রোটিন ও স্বাস্থ্যকর চর্বি সমৃদ্ধ খাবার ধীরে ধীরে চিবিয়ে খান। কোনো চিনি বা পরিশোধিত ময়দা নয়।",
    instructions_en: "Consume balanced protein and complex fiber. Chew thoroughly. Avoid simple sugars.",
    verified_products: breakfastMeds.length > 0 ? breakfastMeds : undefined,
    is_prescription_medication: hasMetformin || hasSteroids
  });

  // 10:30 AM - Mid-Morning Hydration / Probiotic
  if (candidateSupplementsMap.has('supp_probiotic_boulardii')) {
    timeline.push({
      time: "10:30 AM",
      category: "supplement",
      title_bn: "মধ্য-সকাল: মাইক্রোবায়োম সাপোর্ট (Candidate)",
      title_en: "Mid-Morning: Microbiome Support (Candidate)",
      instructions_bn: "খাবারের মধ্যবর্তী বিরতিতে সাধারণ পানিতে ১টি ক্যাপসুল গ্রহণ করুন।",
      instructions_en: "Take 1 capsule with room-temperature water between meals away from hot drinks.",
      verified_products: ["Bolardi 250mg (Square) / Probio R"]
    });
  } else {
    timeline.push({
      time: "10:30 AM",
      category: "lifestyle",
      title_bn: "মধ্য-সকাল হাইড্রেশন",
      title_en: "Mid-Morning Hydration",
      instructions_bn: "১-২ গ্লাস সাধারণ পানি পান করুন। লেভোথাইরক্সিনের ৪ ঘণ্টার ব্যবধান অতিক্রান্ত হওয়ায় তরল নিরাপদ।",
      instructions_en: "Hydrate with 1-2 glasses of water. Post-thyroxine mineral clearance achieved."
    });
  }

  // 01:10 PM - Pre-Lunch Blood Sugar Support
  if (candidateSupplementsMap.has('supp_berberine_inversion')) {
    timeline.push({
      time: "01:10 PM",
      category: "supplement",
      title_bn: "দুপুরের ১৫ মিনিট আগে: ইনসুলিন সেন্সিটাইজার (Candidate)",
      title_en: "15 Mins Pre-Lunch: Glycemic Regulator (Candidate)",
      instructions_bn: "১ গ্লাস পানিতে গ্রহণ করুন। এটি খাবারের পর রক্তে গ্লুকোজের আকস্মিক বৃদ্ধি নিয়ন্ত্রণে সাহায্য করে।",
      instructions_en: "Take 15 minutes before lunch with water to support postprandial glucose stability.",
      verified_products: ["Berberine / Ceylon Cinnamon"]
    });
  }

  // 01:30 PM - Lunch & Micronutrients
  const lunchSupps: string[] = [];
  if (candidateSupplementsMap.has('supp_d3_k2')) lunchSupps.push("Candidate: Vitamin D3 + K2 (D-Rise / Ostocal-D)");
  if (candidateSupplementsMap.has('supp_coq10')) lunchSupps.push("Candidate: CoQ10 100mg (Q-10 Square)");
  if (candidateSupplementsMap.has('supp_omega3')) lunchSupps.push("Candidate: Omega-3 EPA/DHA (Omega-3 Incepta)");

  timeline.push({
    time: "01:30 PM",
    category: "meal",
    title_bn: "দুপুরের প্রধান আহার (Lunch)",
    title_en: "Therapeutic Lunch",
    instructions_bn: "সবুজ শাকসবজি, দেশি মাছ বা মুরগি এবং পরিমিত লাল চাল। চর্বিতে দ্রবণীয় সম্পূরক এই খাবারের সাথেই গ্রহণীয়।",
    instructions_en: "Plate with colorful vegetables, clean protein, and measured unpolished grain. Co-administer fat-soluble nutrients with this meal.",
    verified_products: lunchSupps.length > 0 ? lunchSupps : undefined
  });

  // 05:00 PM - Evening Protocol
  if (patient.selected_conditions.includes('pcos')) {
    timeline.push({
      time: "05:00 PM",
      category: "protocol",
      title_bn: "বিকেল: স্পিয়ারমিন্ট ভেষজ চা ও মিষ্টিকুমড়ার বীজ",
      title_en: "Evening: Spearmint Herbal Infusion & Pumpkin Seeds",
      instructions_bn: "১ কাপ গরম স্পিয়ারমিন্ট চা এর সাথে ১ টেবিল চামচ কাঁচা মিষ্টিকুমড়ার বীজ গ্রহণ করুন।",
      instructions_en: "Enjoy 1 cup warm spearmint herbal infusion paired with 1 tbsp raw unsalted pumpkin seeds."
    });
  } else {
    timeline.push({
      time: "05:00 PM",
      category: "lifestyle",
      title_bn: "বিকেলের ভেষজ চা ও হাঁটা",
      title_en: "Evening Herbal Infusion & Walk",
      instructions_bn: "গ্রিন টি বা তুলসী চা পান করুন। ১৫-২০ মিনিট খোলা বাতাসে হালকা হাঁটাহাঁটি করুন।",
      instructions_en: "Sip green tea or tulsi infusion. Enjoy a 15-20 min brisk outdoor stroll."
    });
  }

  // 08:00 PM - Dinner
  const dinnerMeds: string[] = [];
  if (hasMetformin) dinnerMeds.push("Metformin (প্রেসক্রিপশন - দ্বিতীয় ডোজ, খাবারের সাথে)");

  timeline.push({
    time: "08:00 PM",
    category: "meal",
    title_bn: "রাতের সহজপাচ্য নৈশভোজ (Dinner)",
    title_en: "Light Anti-Inflammatory Dinner",
    instructions_bn: "লাউ, পেঁপে বা ঝিঙে দিয়ে হালকা মাছের ঝোল বা সবজি স্যুপ। শোবার অন্তত ২-৩ ঘণ্টা পূর্বে আহার শেষ করুন।",
    instructions_en: "Light protein with high-water gourd vegetables. Complete intake at least 2.5 hours prior to sleep.",
    verified_products: dinnerMeds.length > 0 ? dinnerMeds : undefined,
    is_prescription_medication: hasMetformin
  });

  // 09:30 PM - Bedtime
  const nightMeds: string[] = [];
  if (hasStatin) {
    nightMeds.push("Statin (প্রেসক্রিপশন - যকৃতে কোলেস্টেরল সংশ্লেষণ নিয়ন্ত্রণে চিকিৎসকের পরামর্শ অনুযায়ী রাতে গ্রহণীয়)");
  }
  if (candidateSupplementsMap.has('supp_magnesium_glycinate')) {
    nightMeds.push("Candidate: Magnesium Glycinate / Gefomag (Navana Pharma)");
  }

  timeline.push({
    time: "09:30 PM",
    category: "supplement",
    title_bn: "ঘুমানোর পূর্বে: বিশ্রাম ও স্নায়বিক পুনরুদ্ধার",
    title_en: "Bedtime: Neuromuscular Recovery",
    instructions_bn: "ম্যাগনেসিয়াম গ্লাইসিনেট পেশির শিথিলতা আনে ও গভীর ঘুমে সহায়তা করে।",
    instructions_en: "Take Magnesium Glycinate 30-45 mins before sleep to support neuromuscular relaxation.",
    verified_products: nightMeds.length > 0 ? nightMeds : undefined,
    is_prescription_medication: hasStatin
  });

  return {
    depletions,
    candidateSupplements,
    overlapWarnings,
    timeline,
    criticalWarnings
  };
}

export function runDNIEngine(
  patient: {
    age: number;
    gender: 'male' | 'female';
    height_cm: number;
    weight_kg: number;
    activity_level: ActivityLevel;
    selected_conditions: ClinicalConditionId[];
    active_medications?: string[];
    gut_profile?: Partial<GutAndAyurvedicProfile>;
    labs?: Partial<FunctionalLabs>;
  },
  medicines: MedicineItem[] = medicinesData as MedicineItem[],
  supplements: SupplementItem[] = supplementsData as SupplementItem[]
): DNIEngineResult {
  const fullPatient: PatientProfile = {
    schema_version: 2,
    id: 'temp_pt',
    name: 'Anonymous',
    age: patient.age,
    gender: patient.gender,
    phone: '01700000000',
    visit_date: new Date().toISOString().split('T')[0],
    current_phase: 1,
    height_cm: patient.height_cm,
    weight_kg: patient.weight_kg,
    waist_cm: 80,
    activity_level: patient.activity_level,
    sleep_hours: 7,
    shift_worker: false,
    population_group: 'adult_standard',
    bmr_floor_strategy: 'clamped_to_bmr',
    confirmed_allergies: [],
    clinician_disallowed_foods: [],
    clinician_disallowed_tags: [],
    selected_conditions: patient.selected_conditions,
    active_medications: patient.active_medications || [],
    gut_profile: {
      bloating: 'none',
      acid_reflux_hypoacidity: patient.gut_profile?.acid_reflux_hypoacidity || false,
      bristol_stool_score: 4,
      energy_score: 7,
      sleep_quality_score: 7,
      digestive_fire_agni: 'samagni',
      ...patient.gut_profile
    },
    labs: {
      lab_flags: [],
      ...patient.labs
    },
    calculated: {
      bmi: 24,
      bmi_category_en: 'Normal',
      bmi_category_bn: 'স্বাভাবিক',
      ibw_kg: 65,
      adjusted_bw_kg: 65,
      whtr: 0.47,
      whtr_risk_en: 'Low',
      whtr_risk_bn: 'কম',
      bmr: 1500,
      tdee: 1800,
      bmr_safe_calorie_floor: 1500,
      target_calories: 1800,
      target_protein_g: 80,
      target_carbs_g: 200,
      target_fat_g: 60,
      protein_ratio_used: 'Standard',
      population_group: 'adult_standard',
      bmr_floor_strategy: 'clamped_to_bmr',
      is_estimated: true,
      energy_calculation_method: 'Mifflin-St Jeor'
    }
  };
  return evaluateDNIAndTimeline(fullPatient, medicines, supplements);
}
