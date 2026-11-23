/**
 * SHUDDHO Phase R5 — Multimorbidity Conflict Resolution Engine
 * 
 * Deterministic Hierarchical Conflict Priority Layer.
 * 
 * Safety Principles:
 * 1. LIFE-SAFETY OVER PREVENTATIVE GUIDELINES: Fatal arrhythmia or acute hypertensive crisis
 *    prevention (e.g., hyperkalemia in CKD, tyramine with MAOIs, fluid overload in decompensated HF)
 *    strictly overrides chronic preventative guidelines (e.g., DASH high potassium, probiotic fermented foods).
 * 2. EXPLICIT CLINICAL PROVENANCE: Every conflict shows competing conditions, parameter,
 *    resolved recommendation, clinical rationale in English & Bengali, and hard safety boundaries.
 * 3. NO ARBITRARY COMPROMISE: If two guidelines directly contradict, the resolution follows
 *    established evidence-based hierarchy rather than splitting the difference.
 */

import {
  ExpandedClinicalPathwayId,
  MultimorbidityConflictResolution,
  R5MedicationRecord
} from '../types/r5Systems';

export interface MultimorbidityInput {
  pathway_ids: ExpandedClinicalPathwayId[];
  medications: R5MedicationRecord[];
  lab_markers?: Record<string, number>;
  has_fluid_restriction?: boolean;
}

/**
 * Evaluates and resolves clinical conflicts among multiple coexisting pathways and medications
 */
export function resolveMultimorbidityConflicts(input: MultimorbidityInput): MultimorbidityConflictResolution[] {
  const conflicts: MultimorbidityConflictResolution[] = [];
  const pathways = input.pathway_ids || [];
  const meds = input.medications || [];

  const hasRenal = pathways.includes('renal_electrolyte');
  const hasCVD = pathways.includes('cardiovascular');
  const hasSarcopenia = pathways.includes('underweight_malnutrition') || pathways.includes('musculoskeletal_bone');
  const hasGI = pathways.includes('gastrointestinal_hepatobiliary');
  const hasDiabetes = pathways.includes('metabolic_endocrine');
  const hasNeuro = pathways.includes('mental_health_neuropsychiatric') || pathways.includes('neurological_neurodevelopmental');

  const medGenerics = meds.map(m => (m.generic_name || '').toLowerCase());
  const hasMAOI = medGenerics.some(g => g.includes('selegiline') || g.includes('phenelzine') || g.includes('tranylcypromine') || g.includes('moclobemide'));
  const hasLithium = medGenerics.some(g => g.includes('lithium'));
  const hasWarfarin = medGenerics.some(g => g.includes('warfarin'));
  const hasPotassiumSparing = medGenerics.some(g => g.includes('spironolactone') || g.includes('eplerenone') || g.includes('amiloride') || g.includes('triamterene'));
  const hasACEi_ARB = medGenerics.some(g => g.endsWith('pril') || g.endsWith('sartan'));

  // 1. Conflict: MAOI vs Fermented Probiotic Foods (Priority: Fatal Hypertensive Crisis)
  if (hasMAOI) {
    conflicts.push({
      conflict_id: 'CONFLICT_MAOI_TYRAMINE',
      parameter: 'tyramine',
      competing_conditions: ['Mental Health / MAOI Antidepressants', 'Gastrointestinal Gut Health'],
      competing_recommendations: [
        {
          source_condition: 'Gastrointestinal Microbiome',
          nutrient_parameter: 'fermented_foods',
          priority_weight: 40,
          recommendation_en: 'Consume fermented foods (kombucha, kimchi, aged cheeses, soy sauce) for gut microbiome replenishment',
          recommendation_bn: 'অন্ত্রের সুস্থতার জন্য গাঁজানো খাবার (কিমচি, পুরোনো পনির, সয়া সস, দই) সেবন করুন'
        },
        {
          source_condition: 'MAOI Therapy Safety',
          nutrient_parameter: 'tyramine_restriction',
          priority_weight: 100,
          recommendation_en: 'Strict tyramine avoidance to prevent life-threatening hypertensive crisis',
          recommendation_bn: 'মারাত্মক উচ্চ রক্তচাপের সংকট এড়াতে টাইরামিনযুক্ত খাবার সম্পূর্ণ পরিহার করুন'
        }
      ],
      resolved_priority_recommendation_en: 'MANDATORY TYRAMINE RESTRICTION: Completely avoid aged cheese, cured meats, soy sauce, Marmite/Vegemite, draft beer, and fermented foods. Life-threatening hyperadrenergic crisis overrides any GI probiotic recommendation.',
      resolved_priority_recommendation_bn: 'টাইরামিন সম্পূর্ণ বর্জন বাধ্যতামূলক: পুরোনো পনির, গাঁজানো খাবার, সয়া সস এবং প্রক্রিয়াজাত মাংস সম্পূর্ণ পরিহার করুন। জীবনঘাতী রক্তচাপের ঝুঁকি পরিপাকতন্ত্রের যে কোনো সাধারণ পরামর্শের চেয়ে অগ্রাধিকার পাবে।',
      clinical_decision_rationale_en: 'MAO inhibition prevents enzymatic deamination of dietary tyramine in the gut. Circulating tyramine displaces norepinephrine into synaptic clefts, causing acute malignant hypertensive crisis and intracranial hemorrhage.',
      clinical_decision_rationale_bn: 'এমএওআই ওষুধ টাইরামিন হজমে বাধা দেয়, যার ফলে রক্তে টাইরামিন বেড়ে রক্তনালী মারাত্মকভাবে সংকুচিত হয়ে মস্তিষ্কে রক্তক্ষরণ ও জীবনহানির ঝুঁকি তৈরি করে।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Zero tolerance for aged/fermented foods during MAOI treatment and 14 days after cessation.',
      hard_safety_boundary_bn: 'এমএওআই সেবনকালীন ও বন্ধ করার পরবর্তী ১৪ দিন পর্যন্ত গাঁজানো/পুরোনো খাবার গ্রহণ সম্পূর্ণরূপে নিষিদ্ধ।'
    });
  }

  // 2. Conflict: Lithium vs Low Sodium Diet (Priority: Severe Lithium Toxicity)
  if (hasLithium && hasCVD) {
    conflicts.push({
      conflict_id: 'CONFLICT_LITHIUM_SODIUM',
      parameter: 'sodium',
      competing_conditions: ['Cardiovascular Hypertension', 'Bipolar Disorder / Lithium Therapy'],
      competing_recommendations: [
        {
          source_condition: 'Cardiovascular Hypertension',
          nutrient_parameter: 'sodium_restriction',
          priority_weight: 60,
          recommendation_en: 'Restrict sodium intake to < 2000 mg/day for arterial blood pressure control',
          recommendation_bn: 'রক্তচাপ নিয়ন্ত্রণের জন্য সোডিয়াম প্রতিদিন ২০০০ মিলিগ্রামের নিচে সীমাবদ্ধ রাখুন'
        },
        {
          source_condition: 'Lithium Pharmacotherapy',
          nutrient_parameter: 'sodium_consistency',
          priority_weight: 95,
          recommendation_en: 'Maintain steady, consistent dietary sodium to prevent lithium retention and neurotoxicity',
          recommendation_bn: 'লিথিয়াম বিষক্রিয়া প্রতিরোধে খাদ্যে সোডিয়ামের পরিমাণ স্থির ও সুষম রাখুন'
        }
      ],
      resolved_priority_recommendation_en: 'MAINTAIN STEADY SODIUM INTAKE: Do not implement sudden or aggressive low-sodium diets. Maintain consistent daily sodium (approx. 2000-2400 mg) and hydration. Any sodium reduction requires lithium therapeutic drug monitoring.',
      resolved_priority_recommendation_bn: 'সোডিয়ামের সুষম মাত্রা বজায় রাখুন: হঠাৎ করে লবণ খাওয়া মারাত্মকভাবে কমাবেন না। সোডিয়ামের পরিমাণ হঠাৎ কমলে লিথিয়াম রক্তে বেড়ে বিষক্রিয়া সৃষ্টি করতে পারে। লবণ কমানোর আগে অবশ্যই লিথিয়াম মাত্রা পরীক্ষা করাতে হবে।',
      clinical_decision_rationale_en: 'Renal proximal tubule reabsorbs lithium identically to sodium. Hyponatremia or acute sodium depletion triggers compensatory proximal sodium reabsorption, inadvertently reabsorbing toxic amounts of lithium, causing severe neurotoxicity.',
      clinical_decision_rationale_bn: 'কিডনি সোডিয়াম ও লিথিয়ামকে একইভাবে ধরে রাখে। খাদ্যে লবণ হঠাৎ কমে গেলে কিডনি শরীর থেকে লিথিয়াম বের না করে পুনরায় শোষণ করে, ফলে স্নায়বিক বিষক্রিয়া দেখা দেয়।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Never introduce sodium restriction (< 2000 mg) without prior serum lithium measurement.',
      hard_safety_boundary_bn: 'রক্তে লিথিয়ামের মাত্রা পরীক্ষা না করে কোনোভাবেই সোডিয়াম নিয়ন্ত্রণ (< ২০০০ মিগ্রা) শুরু করবেন না।'
    });
  }

  // 3. Conflict: Renal (CKD) vs Cardiovascular DASH (Priority: Fatal Cardiac Arrhythmia from Hyperkalemia)
  if (hasRenal && hasCVD) {
    const hasKRetention = hasPotassiumSparing || hasACEi_ARB;
    conflicts.push({
      conflict_id: 'CONFLICT_RENAL_CVD_POTASSIUM',
      parameter: 'potassium',
      competing_conditions: ['Cardiovascular Disease', 'Chronic Kidney Disease'],
      competing_recommendations: [
        {
          source_condition: 'Cardiovascular DASH Diet',
          nutrient_parameter: 'potassium_liberalization',
          priority_weight: 70,
          recommendation_en: 'Liberalize dietary potassium (DASH diet: 4700 mg/day) to lower vascular resistance and stroke risk',
          recommendation_bn: 'রক্তনালী শিথিল করতে এবং স্ট্রোকের ঝুঁকি কমাতে পটাশিয়াম সমৃদ্ধ খাবার (ড্যাশ ডায়েট: ৪৭০০ মিলিগ্রাম/দিন) গ্রহণ করুন'
        },
        {
          source_condition: 'Renal Excretion Impairment',
          nutrient_parameter: 'potassium_restriction',
          priority_weight: 90,
          recommendation_en: 'Restrict dietary potassium to < 2000-2400 mg/day due to impaired renal excretion',
          recommendation_bn: 'কিডনি পটাশিয়াম বের করতে অক্ষম হওয়ায় পটাশিয়াম ২০০০-২৪০০ মিলিগ্রাম/দিনে সীমিত রাখুন'
        }
      ],
      resolved_priority_recommendation_en: hasKRetention
        ? 'STRICT POTASSIUM RESTRICTION (< 2000 mg/day): Patient is on potassium-retaining pharmacotherapy with renal impairment. Lethal hyperkalemic cardiac arrest overrides DASH potassium liberalization. Avoid potassium chloride salt substitutes.'
        : 'INDIVIDUALIZED POTASSIUM TARGET (2000-2500 mg/day): Monitor serum potassium closely. Restrict high-potassium foods (bananas, coconut water, dried fruits) while maintaining cardioprotective healthy fats.',
      resolved_priority_recommendation_bn: hasKRetention
        ? 'কঠোর পটাশিয়াম নিয়ন্ত্রণ (< ২০০০ মিলিগ্রাম/দিন): কিডনির সমস্যা এবং পটাশিয়াম ধরে রাখা ওষুধের কারণে রক্তে পটাশিয়াম বৃদ্ধি পেয়ে মারাত্মক হৃদযন্ত্রের ছন্দপতন ঘটতে পারে। ড্যাশ ডায়েটের উচ্চ পটাশিয়াম বাতিল করা হলো।'
        : 'ব্যক্তিগত পটাশিয়াম নিয়ন্ত্রণ (২০০০-২৫০০ মিলিগ্রাম/দিন): রক্তে পটাশিয়াম নিয়মিত পরীক্ষা করুন। ডাবের পানি, কলা, শুকনো ফল ইত্যাদি পরিহার করুন এবং স্বাস্থ্যকর চর্বি গ্রহণ করুন।',
      clinical_decision_rationale_en: 'Electrophysiological vulnerability of myocardium: Hyperkalemia alters cardiac resting membrane potential, leading to peaked T waves, conduction block, and fatal ventricular fibrillation. Excretory renal threshold strictly overrides vascular benefits.',
      clinical_decision_rationale_bn: 'রক্তে অতিরিক্ত পটাশিয়াম হৃদযন্ত্রের স্পন্দনের স্বাভাবিক বৈদ্যুতিক তরঙ্গ বিঘ্নিত করে এবং হঠাৎ হার্ট অ্যাটাকের ঝুঁকি তৈরি করে। তাই কিডনির সুরক্ষায় পটাশিয়াম সীমিত রাখা বাধ্যতামূলক।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Potassium chloride salt substitutes are strictly contraindicated.',
      hard_safety_boundary_bn: 'পটাশিয়াম ক্লোরাইডযুক্ত ডায়েট লবণ বা বিকল্প লবণ ব্যবহার সম্পূর্ণ নিষিদ্ধ।'
    });
  }

  // 4. Conflict: Renal vs Sarcopenia / Malnutrition (Protein Balance)
  if (hasRenal && hasSarcopenia) {
    conflicts.push({
      conflict_id: 'CONFLICT_RENAL_SARCOPENIA_PROTEIN',
      parameter: 'protein',
      competing_conditions: ['Sarcopenia / Protein-Energy Wasting', 'Chronic Kidney Disease'],
      competing_recommendations: [
        {
          source_condition: 'Sarcopenia & Frailty',
          nutrient_parameter: 'protein_loading',
          priority_weight: 75,
          recommendation_en: 'High-protein diet (1.2-1.5 g/kg/day) with leucine pulses to overcome anabolic resistance and prevent frailty',
          recommendation_bn: 'পেশী ক্ষয় রোধে ও দুর্বলতা কাটাতে উচ্চ প্রোটিনযুক্ত খাবার (১.২-১.৫ গ্রাম/কেজি/দিন) গ্রহণ করুন'
        },
        {
          source_condition: 'Renal Hyperfiltration Protection',
          nutrient_parameter: 'protein_restriction',
          priority_weight: 80,
          recommendation_en: 'Protein restriction (0.6-0.8 g/kg/day) to reduce intraglomerular pressure and slow eGFR decline',
          recommendation_bn: 'কিডনির ওপর চাপ কমাতে এবং কার্যকারিতা ধরে রাখতে প্রোটিন ০.৬-০.৮ গ্রাম/কেজি/দিনে সীমিত রাখুন'
        }
      ],
      resolved_priority_recommendation_en: 'HIGH BIOLOGICAL VALUE PROTEIN BALANCE (0.8 g/kg/day target): Prevent protein-energy wasting (PEW) while sparing renal workload. Prioritize essential amino acid / egg white / whey isolate protein sources. Avoid severe restriction (< 0.6 g/kg) and avoid excessive loading (> 1.0 g/kg).',
      resolved_priority_recommendation_bn: 'উচ্চমানের সুষম প্রোটিন ভারসাম্য (০.৮ গ্রাম/কেজি/দিন): গুরুতর পেশী ক্ষয় রোধ এবং কিডনিকে সুরক্ষিত রাখতে প্রোটিনের পরিমাণ ০.৮ গ্রাম/কেজিতে স্থির রাখুন। ডিমের সাদা অংশ ও উন্নত মানের প্রোটিন গ্রহণ করুন। অতিরিক্ত প্রোটিন গ্রহণ করবেন না।',
      clinical_decision_rationale_en: 'Severe protein restriction in elderly sarcopenic patients elevates all-cause mortality through frailty and falls faster than eGFR progression. A moderate high-biological-value floor (0.8 g/kg) minimizes nitrogenous waste while preserving skeletal muscle mass.',
      clinical_decision_rationale_bn: 'অতিরিক্ত প্রোটিন কমালে বয়স্ক রোগীর পেশী দ্রুত ক্ষয় হয়ে মৃত্যুঝুঁকি বেড়ে যায়। তাই ০.৮ গ্রাম/কেজি পরিমিত উন্নত প্রোটিন গ্রহণ কিডনি ও পেশী উভয়ের জন্য ভারসাম্যপূর্ণ।',
      requires_clinician_verification: true
    });
  }

  // 5. Conflict: Warfarin vs High Vitamin K Greens
  if (hasWarfarin && (hasCVD || hasDiabetes)) {
    conflicts.push({
      conflict_id: 'CONFLICT_WARFARIN_VITAMIN_K',
      parameter: 'vitamin_k',
      competing_conditions: ['Cardiovascular Cardioprotective Diet', 'Warfarin Anticoagulation'],
      competing_recommendations: [
        {
          source_condition: 'Cardiovascular Polyphenol Diet',
          nutrient_parameter: 'green_leafy_vegetables',
          priority_weight: 65,
          recommendation_en: 'High-intake dark leafy greens (spinach, kale, moringa) for polyphenol and nitrate vascular protection',
          recommendation_bn: 'হৃদরোগীদের রক্তনালীর সুরক্ষায় প্রচুর সবুজ শাক (পালং, সজনে, বাঁধাকপি) খেতে উৎসাহিত করা হয়'
        },
        {
          source_condition: 'Warfarin Anticoagulation',
          nutrient_parameter: 'vitamin_k_consistency',
          priority_weight: 90,
          recommendation_en: 'Strict vitamin K consistency to prevent INR volatility, thrombosis, or hemorrhagic stroke',
          recommendation_bn: 'ওয়ারফারিন ওষুধ চলাকালীন রক্তের আইএনআর ঠিক রাখতে ভিটামিন কে-এর মাত্রা স্থির রাখা জরুরি'
        }
      ],
      resolved_priority_recommendation_en: 'CONSISTENT DAILY VITAMIN K INTAKE: Do not eliminate green vegetables, but consume a strictly consistent portion each day (e.g. 1/2 cup cooked daily). Avoid sudden green smoothies, large dietary spikes, or erratic fasting.',
      resolved_priority_recommendation_bn: 'প্রতিদিন নির্দিষ্ট পরিমাপে সবুজ শাকসবজি খান: শাক পুরোপুরি বাদ দেওয়ার প্রয়োজন নেই, তবে প্রতিদিন একই মাপে (যেমন আধা কাপ) খান। হঠাৎ করে বেশি পরিমাণে শাকসবজি খাওয়া বা বন্ধ করা বিপজ্জনক।',
      clinical_decision_rationale_en: 'Warfarin inhibits Vitamin K Epoxide Reductase. Large fluctuations in dietary phylloquinone lead to erratic prothrombin time / INR, risking thromboembolic ischemic stroke if low or fatal hemorrhage if high.',
      clinical_decision_rationale_bn: 'খাবারে ভিটামিন কে ওঠানামা করলে রক্ত বেশি পাতলা হয়ে রক্তক্ষরণ হতে পারে অথবা রক্ত জমাট বেঁধে স্ট্রোকের ঝুঁকি তৈরি হয়। তাই প্রতিদিন একই পরিমাণ শাকসবজি খাওয়া নিরাপদ।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Avoid large intermittent boluses of Vitamin K (e.g., green juice cleanses).',
      hard_safety_boundary_bn: 'হঠাৎ করে প্রচুর শাকসবজির জুস বা ডিটক্স ড্রিংকস পান করা সম্পূর্ণ নিষেধ।'
    });
  }

  return conflicts;
}
