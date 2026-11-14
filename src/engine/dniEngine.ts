import { 
  MedicineItem, 
  NutrientDepletion, 
  SupplementItem, 
  DailyTimelineItem, 
  PatientProfile 
} from '../types';

export interface DNIEngineResult {
  depletions: {
    medicineName: string;
    depletion: NutrientDepletion;
  }[];
  recommendedSupplements: SupplementItem[];
  timeline: DailyTimelineItem[];
  criticalWarnings: {
    warning_bn: string;
    warning_en: string;
  }[];
}

export function evaluateDNIAndTimeline(
  patient: PatientProfile,
  allMedicines: MedicineItem[],
  allSupplements: SupplementItem[]
): DNIEngineResult {
  const depletions: { medicineName: string; depletion: NutrientDepletion }[] = [];
  const recommendedSupplementsMap = new Map<string, SupplementItem>();
  const criticalWarnings: { warning_bn: string; warning_en: string }[] = [];

  const activeMeds = allMedicines.filter(m => 
    patient.active_medications.some(userMed => 
      userMed === m.id || 
      userMed.toLowerCase().includes(m.generic_name.toLowerCase()) ||
      m.brand_names_bd.some(b => userMed.toLowerCase().includes(b.toLowerCase()))
    )
  );

  // 1. Gather all depletions
  for (const med of activeMeds) {
    for (const dep of med.depletions) {
      depletions.push({
        medicineName: med.generic_name,
        depletion: dep
      });

      // Match supplement
      if (dep.nutrient.toLowerCase().includes('magnesium')) {
        const supp = allSupplements.find(s => s.id === 'supp_magnesium_glycinate');
        if (supp) recommendedSupplementsMap.set(supp.id, supp);
      }
      if (dep.nutrient.toLowerCase().includes('b12') || dep.nutrient.toLowerCase().includes('cobalamin')) {
        const supp = allSupplements.find(s => s.id === 'supp_methyl_b12');
        if (supp) recommendedSupplementsMap.set(supp.id, supp);
      }
      if (dep.nutrient.toLowerCase().includes('coenzyme q10') || dep.nutrient.toLowerCase().includes('coq10')) {
        const supp = allSupplements.find(s => s.id === 'supp_coq10');
        if (supp) recommendedSupplementsMap.set(supp.id, supp);
      }
      if (dep.nutrient.toLowerCase().includes('vitamin d3') || dep.nutrient.toLowerCase().includes('calcium')) {
        const supp = allSupplements.find(s => s.id === 'supp_d3_k2');
        if (supp) recommendedSupplementsMap.set(supp.id, supp);
      }
    }
  }

  // Add condition-based functional supplements
  if (patient.selected_conditions.includes('gut_dysbiosis') || patient.gut_profile.acid_reflux_hypoacidity) {
    const probio = allSupplements.find(s => s.id === 'supp_probiotic_boulardii');
    if (probio) recommendedSupplementsMap.set(probio.id, probio);
  }
  if (patient.selected_conditions.includes('fatty_liver') || patient.labs.tg_hdl_ratio && patient.labs.tg_hdl_ratio > 1.5) {
    const omega = allSupplements.find(s => s.id === 'supp_omega3');
    if (omega) recommendedSupplementsMap.set(omega.id, omega);
  }
  if (patient.selected_conditions.includes('t2d_ir') || patient.selected_conditions.includes('pcos')) {
    const berb = allSupplements.find(s => s.id === 'supp_berberine_inversion');
    if (berb) recommendedSupplementsMap.set(berb.id, berb);
  }

  // 2. Critical Spacing Warnings
  const hasLevothyroxine = activeMeds.some(m => m.id === 'med_levothyroxine' || m.generic_name.toLowerCase().includes('levothyroxine'));
  const hasPPI = activeMeds.some(m => m.id === 'med_ppi');
  const hasMetformin = activeMeds.some(m => m.id === 'med_metformin');
  const hasStatin = activeMeds.some(m => m.id === 'med_statin');
  const hasSteroids = activeMeds.some(m => m.id === 'med_steroids');

  if (hasLevothyroxine) {
    criticalWarnings.push({
      warning_bn: "সতর্কতা: লেভোথাইরক্সিন ওষুধ সম্পূর্ণ খালি পেটে সকালবেলা সবার প্রথমে নিতে হবে। ক্যালসিয়াম, আয়রন বা মাল্টিভিটামিন এর অন্তত ৪ ঘণ্টা পর গ্রহণ করতে হবে।",
      warning_en: "CRITICAL: Take Levothyroxine strictly on an empty stomach immediately upon rising. Maintain a strict 4-hour gap before any Calcium, Iron, Magnesium, or Coffee."
    });
  }

  if (hasPPI && patient.gut_profile.acid_reflux_hypoacidity) {
    criticalWarnings.push({
      warning_bn: "পিপিআই গ্যাস্ট্রিক ওষুধের দীর্ঘমেয়াদি ব্যবহার পাকস্থলীর স্বাভাবিক এসিড কমিয়ে পুষ্টি শোষণ (ম্যাগনেসিয়াম, B12, আয়রন) মারাত্মকভাবে ব্যাহত করে। খাবারের পূর্বে আদা কুচি ও লবণ গ্রহণ জরুরি।",
      warning_en: "Long-term PPI use induces hypochlorhydria, impairing Magnesium, B12, and Iron uptake. Implement pre-meal cephalic acid stimulation."
    });
  }

  // 3. Generate Chronological 24-Hour Timeline
  const timeline: DailyTimelineItem[] = [];

  // 06:00 AM - Fasting / Waking
  if (hasLevothyroxine) {
    timeline.push({
      time: "06:00 AM",
      category: "medication",
      title_bn: "ঘুম থেকে উঠে: থাইরয়েড ওষুধ",
      title_en: "Upon Waking: Thyroid Hormone",
      instructions_bn: "১ গ্লাস সাধারণ পানি দিয়ে লেভোথাইরক্সিন গ্রহণ করুন। পরবর্তী ৬০ মিনিট কোনো খাবার, চা বা কফি খাবেন না।",
      instructions_en: "Take Levothyroxine with 1 full glass of plain water. Wait at least 60 minutes before breakfast, tea or coffee.",
      warning_bn: "দুধ বা চা দিয়ে খাবেন না; ক্যালসিয়াম ও আয়রন এর ৪ ঘণ্টার মধ্যে নিষেধ।",
      warning_en: "Do not take with dairy or tea. Strict 4h separation from minerals."
    });
  } else if (hasPPI) {
    timeline.push({
      time: "06:30 AM",
      category: "medication",
      title_bn: "খালি পেটে: গ্যাস্ট্রিক ওষুধ (PPI)",
      title_en: "Empty Stomach: Gastric PPI",
      instructions_bn: "১ গ্লাস কুসুম গরম পানি দিয়ে পিপিআই গ্রহণ করুন (খাবারের ৩০-৪৫ মিনিট আগে)।",
      instructions_en: "Take PPI with room temperature water 30-45 minutes before breakfast."
    });
  } else {
    timeline.push({
      time: "06:30 AM",
      category: "protocol",
      title_bn: "সকালের হাইড্রেশন ও মেটাবলিক রিবুট",
      title_en: "Morning Hydration & Metabolic Reboot",
      instructions_bn: "১ গ্লাস কুসুম গরম পানিতে ১ চা চামচ তাজা লেবুর রস এবং এক চিমটি সৈন্ধব লবণ মিশিয়ে ধীরে ধীরে পান করুন।",
      instructions_en: "Drink 1 glass of warm water infused with 1 tsp fresh lemon juice and a pinch of pink Himalayan salt."
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
      instructions_en: "Chew fresh ginger slivers with Himalayan pink salt to prime gastric acid and digestive enzymes."
    });
  }

  // 08:00 AM - Breakfast & Mealtime Supplements
  const breakfastMeds: string[] = [];
  if (hasMetformin) breakfastMeds.push("Metformin (খাবারের ঠিক সাথে)");
  if (hasSteroids) breakfastMeds.push("Corticosteroid (ভারী খাবারের সাথে)");
  if (recommendedSupplementsMap.has('supp_methyl_b12')) breakfastMeds.push("Sublingual Methyl-B12 (জিহ্বার নিচে)");

  timeline.push({
    time: "08:00 AM",
    category: "meal",
    title_bn: "সকালের প্রথম খাবার (Breakfast)",
    title_en: "Morning Meal (Breakfast)",
    instructions_bn: "প্রোটিন ও স্বাস্থ্যকর চর্বি সমৃদ্ধ খাবার ধীরে ধীরে চিবিয়ে খান। কোনো মিষ্টি বা রিফাইন্ড কার্ব নয়।",
    instructions_en: "Consume balanced protein and healthy fiber. Chew slowly. Avoid simple sugars.",
    verified_products: breakfastMeds.length > 0 ? breakfastMeds : undefined
  });

  // 10:30 AM - Mid-Morning Hydration / Probiotic
  if (recommendedSupplementsMap.has('supp_probiotic_boulardii')) {
    timeline.push({
      time: "10:30 AM",
      category: "supplement",
      title_bn: "মধ্য-সকাল: প্রোবায়োটিক সাপোর্ট",
      title_en: "Mid-Morning: Microbiome Support",
      instructions_bn: "খাবারের মধ্যবর্তী বিরতিতে সাধারণ পানিতে ১টি ক্যাপসুল গ্রহণ করুন (অন্ত্রের ভালো ব্যাকটেরিয়া বাড়ায়)।",
      instructions_en: "Take 1 capsule with plain room-temperature water away from hot beverages.",
      verified_products: ["Bolardi 250mg (Square) / Probio R"]
    });
  } else {
    timeline.push({
      time: "10:30 AM",
      category: "lifestyle",
      title_bn: "মধ্য-সকাল হাইড্রেশন",
      title_en: "Mid-Morning Cellular Hydration",
      instructions_bn: "১-২ গ্লাস সাধারণ পানি পান করুন। লেভোথাইরক্সিনের ৪ ঘণ্টা অতিক্রান্ত হওয়ায় এখন খনিজ সমৃদ্ধ তরল নিরাপদ।",
      instructions_en: "Hydrate with 1-2 glasses of plain water. Mineral clearance window active."
    });
  }

  // 01:10 PM - Pre-Lunch Digestive Bitter / Berberine
  if (recommendedSupplementsMap.has('supp_berberine_inversion')) {
    timeline.push({
      time: "01:10 PM",
      category: "supplement",
      title_bn: "দুপুরের ১৫ মিনিট আগে: ইনসুলিন সেন্সিটাইজার",
      title_en: "15 Mins Pre-Lunch: Insulin Sensitizer",
      instructions_bn: "১ গ্লাস পানিতে গ্রহণ করুন। এটি খাবারের পর রক্তের গ্লুকোজ স্পাইক রোধ করে।",
      instructions_en: "Take 15 minutes before lunch to blunt postprandial glucose excursions via GLUT4.",
      verified_products: ["Berberine / Ceylon Cinnamon"]
    });
  }

  // 01:30 PM - Lunch & Fat-Soluble Orthomolecular Micronutrients
  const lunchSupps: string[] = [];
  if (recommendedSupplementsMap.has('supp_d3_k2')) lunchSupps.push("Vitamin D3 + K2 (D-Rise / Ostocal-D)");
  if (recommendedSupplementsMap.has('supp_coq10')) lunchSupps.push("CoQ10 Ubiquinol 100mg (Q-10 Square)");
  if (recommendedSupplementsMap.has('supp_omega3')) lunchSupps.push("Omega-3 EPA/DHA (Omega-3 Incepta)");

  timeline.push({
    time: "01:30 PM",
    category: "meal",
    title_bn: "দুপুরের মূল খাবার (Lunch)",
    title_en: "Main Meal (Lunch)",
    instructions_bn: "সবুজ শাকসবজি, দেশি মাছ বা দেশি মুরগি এবং পরিমিত লাল চাল। চর্বিতে দ্রবণীয় ভিটামিনগুলো এই খাবারের সাথেই গ্রহণ করুন।",
    instructions_en: "Plate with colorful vegetables, clean animal protein, and measured complex grain. Ingest fat-soluble vitamins now.",
    verified_products: lunchSupps.length > 0 ? lunchSupps : undefined
  });

  // 05:00 PM - Evening Herbal Protocol
  if (patient.selected_conditions.includes('pcos')) {
    timeline.push({
      time: "05:00 PM",
      category: "protocol",
      title_bn: "বিকেল: স্পিয়ারমিন্ট চা ও সিড প্রোটোকল",
      title_en: "Evening: Spearmint Tea & Seed Cycling",
      instructions_bn: "১ কাপ গরম স্পিয়ারমিন্ট চা (পুরুষ হরমোন হ্রাস করে) সাথে ১ টেবিল চামচ মিষ্টিকুমড়ার বীজ।",
      instructions_en: "1 cup hot spearmint infusion (anti-androgenic) paired with 1 tbsp raw pumpkin seeds."
    });
  } else {
    timeline.push({
      time: "05:00 PM",
      category: "lifestyle",
      title_bn: "বিকেলের ভেষজ চা ও বিশ্রাম",
      title_en: "Evening Herbal Infusion & Gentle Walk",
      instructions_bn: "গ্রিন টি অথবা তুলসী-ধনেপাতার চা পান করুন। ১৫-২০ মিনিট খোলা বাতাসে হালকা হাঁটাহাঁটি করুন।",
      instructions_en: "Sip green tea or tulsi infusion. Enjoy a 15-20 min brisk outdoor stroll."
    });
  }

  // 08:00 PM - Dinner (Light & Early)
  const dinnerMeds: string[] = [];
  if (hasMetformin) dinnerMeds.push("Metformin (দ্বিতীয় ডোজ - খাবারের সাথে)");

  timeline.push({
    time: "08:00 PM",
    category: "meal",
    title_bn: "রাতের সহজপাচ্য খাবার (Dinner)",
    title_en: "Early Digestible Dinner",
    instructions_bn: "লাউ, পেঁপে বা ঝিঙে দিয়ে মাছের হালকা ঝোল বা সবজি স্যুপ। শোবার অন্তত ২-৩ ঘণ্টা পূর্বে খাওয়া শেষ করুন।",
    instructions_en: "Light protein with high-water gourd vegetables. Conclude meal at least 2.5-3 hours before sleep.",
    verified_products: dinnerMeds.length > 0 ? dinnerMeds : undefined
  });

  // 09:30 PM - Bedtime Neuro-Muscular & Gut Restoration
  const nightMeds: string[] = [];
  if (hasStatin) nightMeds.push("Statin (যকৃতে কোলেস্টেরল তৈরিতে নিয়ন্ত্রণ রাখতে রাতে গ্রহণীয়)");
  if (recommendedSupplementsMap.has('supp_magnesium_glycinate')) nightMeds.push("Magnesium Glycinate / Gefomag (Navana Pharma)");

  timeline.push({
    time: "09:30 PM",
    category: "supplement",
    title_bn: "ঘুমানোর পূর্বে: স্নায়ু ও গাট রিস্টোরেশন",
    title_en: "Bedtime: Neuromuscular & Mucosal Recovery",
    instructions_bn: "ম্যাগনেসিয়াম গ্লাইসিনেট গ্রহণ করুন। এটি পেশির খিঁচুনি দূর করে, গভীর ঘুম নিশ্চিত করে এবং কোষ্ঠকাঠিন্য প্রতিরোধ করে।",
    instructions_en: "Take Magnesium Glycinate / Gefomag 30-45 mins before lights out. Calms nervous system and activates parasympathetic repair.",
    verified_products: nightMeds.length > 0 ? nightMeds : undefined
  });

  return {
    depletions,
    recommendedSupplements: Array.from(recommendedSupplementsMap.values()),
    timeline,
    criticalWarnings
  };
}

