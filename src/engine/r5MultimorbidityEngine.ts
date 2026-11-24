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
  is_on_dialysis?: boolean;
  ckd_stage?: number;
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
  const irreversibleMAOIs = ['tranylcypromine', 'phenelzine', 'isocarboxazid', 'selegiline'];
  const hasIrreversibleMAOI = medGenerics.some(g => irreversibleMAOIs.some(p => g.includes(p)));
  const hasRIMA = medGenerics.some(g => g.includes('moclobemide'));
  const hasLithium = medGenerics.some(g => g.includes('lithium'));
  const hasWarfarin = medGenerics.some(g => g.includes('warfarin'));
  const hasPotassiumSparing = medGenerics.some(g => g.includes('spironolactone') || g.includes('eplerenone') || g.includes('amiloride') || g.includes('triamterene'));
  const hasACEi_ARB = medGenerics.some(g => g.endsWith('pril') || g.endsWith('sartan'));

  // 1. Conflict: MAOI vs Fermented Probiotic Foods
  if (hasIrreversibleMAOI) {
    conflicts.push({
      conflict_id: 'CONFLICT_MAOI_TYRAMINE',
      parameter: 'tyramine',
      competing_conditions: ['Mental Health / Irreversible MAOI Therapy', 'Gastrointestinal Gut Health'],
      competing_recommendations: [
        {
          source_condition: 'Gastrointestinal Microbiome',
          nutrient_parameter: 'fermented_foods',
          priority_weight: 40,
          recommendation_en: 'Consume fermented foods (kombucha, kimchi, aged cheeses, soy sauce) for gut microbiome replenishment',
          recommendation_bn: 'অন্ত্রের সুস্থতার জন্য গাঁজানো খাবার (কিমচি, পুরোনো পনির, সয়া সস, দই) সেবন করুন'
        },
        {
          source_condition: 'Irreversible MAOI Safety',
          nutrient_parameter: 'tyramine_restriction',
          priority_weight: 100,
          recommendation_en: 'Strict tyramine avoidance to prevent life-threatening hypertensive crisis',
          recommendation_bn: 'মারাত্মক উচ্চ রক্তচাপের সংকট এড়াতে টাইরামিনযুক্ত খাবার সম্পূর্ণ পরিহার করুন'
        }
      ],
      resolved_priority_recommendation_en: 'MANDATORY TYRAMINE RESTRICTION: Completely avoid aged cheese, cured meats, soy sauce, Marmite/Vegemite, draft beer, and fermented foods. Life-threatening hyperadrenergic crisis overrides any GI probiotic recommendation.',
      resolved_priority_recommendation_bn: 'টাইরামিন সম্পূর্ণ বর্জন বাধ্যতামূলক: পুরোনো পনির, গাঁজানো খাবার, সয়া সস এবং প্রক্রিয়াজাত মাংস সম্পূর্ণ পরিহার করুন। জীবনঘাতী রক্তচাপের ঝুঁকি পরিপাকতন্ত্রের যে কোনো সাধারণ পরামর্শের চেয়ে অগ্রাধিকার পাবে।',
      clinical_decision_rationale_en: 'Irreversible MAO inhibition permits dietary tyramine to enter systemic circulation intact, releasing massive norepinephrine stores causing acute malignant hypertensive crisis and intracranial hemorrhage.',
      clinical_decision_rationale_bn: 'ইররিভার্সিবল এমএওআই ওষুধ টাইরামিন হজমে বাধা দেয়, যার ফলে রক্তে টাইরামিন বেড়ে রক্তনালী মারাত্মকভাবে সংকুচিত হয়ে মস্তিষ্কে রক্তক্ষরণ ও জীবনহানির ঝুঁকি তৈরি করে।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Zero tolerance for aged/fermented foods during irreversible MAOI treatment and 14 days after cessation.',
      hard_safety_boundary_bn: 'এমএওআই সেবনকালীন ও বন্ধ করার পরবর্তী ১৪ দিন পর্যন্ত গাঁজানো/পুরোনো খাবার গ্রহণ সম্পূর্ণরূপে নিষিদ্ধ।'
    });
  } else if (hasRIMA) {
    conflicts.push({
      conflict_id: 'CONFLICT_RIMA_MOCLOBEMIDE',
      parameter: 'tyramine',
      competing_conditions: ['Mental Health / Reversible MAO-A (Moclobemide)', 'Gastrointestinal Gut Health'],
      competing_recommendations: [
        {
          source_condition: 'Gastrointestinal Microbiome',
          nutrient_parameter: 'fermented_foods',
          priority_weight: 50,
          recommendation_en: 'Fresh fermented foods acceptable in moderate portions',
          recommendation_bn: 'পরিমিত পরিমাণে টাটকা গাঁজানো খাবার গ্রহণ করা যেতে পারে'
        },
        {
          source_condition: 'RIMA Reversible Inhibition',
          nutrient_parameter: 'tyramine_moderation',
          priority_weight: 70,
          recommendation_en: 'Avoid massive ingestion of spoiled, decayed, or intensely aged tyramine-rich products',
          recommendation_bn: 'অতিরিক্ত পুরোনো বা পচা খাবার পরিহার করুন'
        }
      ],
      resolved_priority_recommendation_en: 'REVERSIBLE MAO-A (RIMA) MILD TYRAMINE CAUTION: Moclobemide is a reversible inhibitor. Normal dietary tyramine does not precipitate hypertensive crisis; avoid only spoiled or excessively aged fermented products. Universal fermented food restriction is not required.',
      resolved_priority_recommendation_bn: 'মোক্লোবেমাইড একটি রিভার্সিবল ওষুধ। পরিমিত মাত্রার টাইরামিনে রক্তচাপ সংকট হয় না; শুধু অতিরিক্ত পুরোনো বা পচা খাবার পরিহার করলেই চলে। গাঁজানো খাবার সম্পূর্ণ বর্জনের প্রয়োজন নেই।',
      clinical_decision_rationale_en: 'High intestinal tyramine competitively displaces moclobemide from MAO-A, allowing physiological protective metabolic clearance of tyramine ("cheese effect" attenuated).',
      clinical_decision_rationale_bn: 'অন্ত্রে টাইরামিন বৃদ্ধি পেলে তা মোক্লোবেমাইডকে সরিয়ে দিয়ে স্বাভাবিকভাবে হজম হতে পারে, ফলে জীবনঘাতী রক্তচাপের ঝুঁকি থাকে না।',
      requires_clinician_verification: false
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
      resolved_priority_recommendation_en: 'MAINTAIN STEADY SODIUM INTAKE: Maintain steady habitual sodium intake without sudden or unmonitored low-sodium diets (< 2000 mg). Maintain consistent daily sodium intake aligned with patient baseline and adequate hydration (2-2.5L unless cardiorenal fluid restricted). Therapeutic lithium drug monitoring required prior to dietary modification.',
      resolved_priority_recommendation_bn: 'সোডিয়ামের সুষম মাত্রা বজায় রাখুন: হঠাৎ করে লবণ খাওয়া মারাত্মকভাবে কমাবেন না। সোডিয়ামের পরিমাণ হঠাৎ কমলে লিথিয়াম রক্তে বেড়ে বিষক্রিয়া সৃষ্টি করতে পারে। লবণ কমানোর আগে অবশ্যই লিথিয়াম মাত্রা পরীক্ষা করাতে হবে।',
      clinical_decision_rationale_en: 'Renal proximal tubule reabsorbs lithium identically to sodium. Hyponatremia or acute sodium depletion triggers compensatory proximal sodium reabsorption, inadvertently reabsorbing toxic amounts of lithium, causing severe neurotoxicity.',
      clinical_decision_rationale_bn: 'কিডনি সোডিয়াম ও লিথিয়ামকে একইভাবে ধরে রাখে। খাদ্যে লবণ হঠাৎ কমে গেলে কিডনি শরীর থেকে লিথিয়াম বের না করে পুনরায় শোষণ করে, ফলে স্নায়বিক বিষক্রিয়া দেখা দেয়।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Never introduce severe sodium restriction (< 2000 mg) without prior serum lithium measurement.',
      hard_safety_boundary_bn: 'রক্তে লিথিয়ামের মাত্রা পরীক্ষা না করে কোনোভাবেই সোডিয়াম নিয়ন্ত্রণ (< ২০০০ মিগ্রা) শুরু করবেন না।'
    });
  }

  // 3. Conflict: Renal (CKD) vs Cardiovascular DASH (Priority: Fatal Cardiac Arrhythmia from Hyperkalemia)
  if (hasRenal && hasCVD) {
    const hasKRetention = hasPotassiumSparing || hasACEi_ARB;
    const serumK = input.lab_markers?.potassium;

    let resEn = '';
    let resBn = '';

    if (serumK !== undefined && serumK !== null) {
      if (serumK > 5.0 || hasKRetention) {
        resEn = `STRICT POTASSIUM RESTRICTION (< 2000 mg/day): Documented serum K+ (${serumK} mEq/L) ${hasKRetention ? 'with K-retaining pharmacotherapy' : ''} indicates severe hyperkalemic vulnerability. Lethal cardiac arrhythmia overrides DASH potassium liberalization. Avoid potassium chloride salt substitutes.`;
        resBn = `কঠোর পটাশিয়াম নিয়ন্ত্রণ (< ২০০০ মিলিগ্রাম/দিন): রক্তে উচ্চ পটাশিয়াম (${serumK} mEq/L) এবং কিডনির কারণে হৃদযন্ত্রের ছন্দপতনের মারাত্মক ঝুঁকি বিদ্যমান। বিকল্প ডায়েট লবণ বর্জন করুন।`;
      } else if (serumK < 3.5) {
        resEn = `HYPOKALEMIA RISK DETECTED (${serumK} mEq/L): Serum potassium is subnormal. Strict potassium restriction is CONTRAINDICATED. Maintain potassium intake and recheck electrolytes.`;
        resBn = `লো পটাশিয়াম ঝুঁকি (${serumK} mEq/L): রক্তে পটাশিয়াম স্বাভাবিকের নিচে। পটাশিয়াম সীমাবদ্ধ করা নিষিদ্ধ।`;
      } else {
        resEn = `MONITORED POTASSIUM BALANCE: Serum potassium (${serumK} mEq/L) is currently normal. Avoid severe restriction; monitor serum potassium regularly while maintaining cardiovascular-healthy foods.`;
        resBn = `নিয়ন্ত্রিত সুষম পটাশিয়াম: রক্তে পটাশিয়াম স্বাভাবিক রয়েছে। অতিরিক্ত নিয়ন্ত্রণ না করে নিয়মিত পরীক্ষা করুন।`;
      }
    } else if (hasKRetention) {
      resEn = 'STRICT POTASSIUM RESTRICTION ADVISORY (< 2000-2400 mg/day): Patient is on potassium-retaining pharmacotherapy in renal impairment context. Lethal hyperkalemic arrhythmia risk overrides DASH potassium liberalization. Monitor serum potassium.';
      resBn = 'পটাশিয়াম নিয়ন্ত্রণ পরামর্শ: পটাশিয়াম ধরে রাখা ওষুধ সেবনের কারণে পটাশিয়াম পরীক্ষা না করা পর্যন্ত উচ্চ পটাশিয়ামযুক্ত খাবার সতর্কতার সাথে গ্রহণ করুন।';
    } else {
      resEn = 'INDIVIDUALIZED POTASSIUM TARGET REQUIRES CLINICIAN REVIEW: Serum potassium and renal function unmeasured. Avoid autonomous severe potassium restriction (< 2000 mg/day) without laboratory confirmation of hyperkalemia. Screen electrolytes prior to establishing numeric intake ceilings.';
      resBn = 'ব্যক্তিগত পটাশিয়াম লক্ষ্যমাত্রা চিকিৎসকের পর্যালোচনা প্রয়োজন: সিরাম পটাশিয়াম এবং কিডনি কার্যকারিতা পরীক্ষিত নয়। রক্ত পরীক্ষার আগে স্বয়ংক্রিয়ভাবে পটাশিয়াম অতিরিক্ত নিয়ন্ত্রণ করবেন না।';
    }

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
          recommendation_en: 'Restrict dietary potassium if renal excretion is impaired or hyperkalemia present',
          recommendation_bn: 'কিডনি পটাশিয়াম বের করতে অক্ষম হলে বা রক্তে পটাশিয়াম বাড়লে পটাশিয়াম সীমিত রাখুন'
        }
      ],
      resolved_priority_recommendation_en: resEn,
      resolved_priority_recommendation_bn: resBn,
      clinical_decision_rationale_en: 'Electrophysiological vulnerability of myocardium: Hyperkalemia alters cardiac resting membrane potential, leading to peaked T waves, conduction block, and fatal ventricular fibrillation. Excretory renal threshold strictly overrides vascular benefits.',
      clinical_decision_rationale_bn: 'রক্তে অতিরিক্ত পটাশিয়াম হৃদযন্ত্রের স্পন্দনের স্বাভাবিক বৈদ্যুতিক তরঙ্গ বিঘ্নিত করে এবং হঠাৎ হার্ট অ্যাটাকের ঝুঁকি তৈরি করে। তাই কিডনির সুরক্ষায় পটাশিয়াম সীমিত রাখা বাধ্যতামূলক।',
      requires_clinician_verification: true,
      hard_safety_boundary_en: 'Potassium chloride salt substitutes are strictly contraindicated in renal impairment.',
      hard_safety_boundary_bn: 'পটাশিয়াম ক্লোরাইডযুক্ত ডায়েট লবণ বা বিকল্প লবণ ব্যবহার সম্পূর্ণ নিষিদ্ধ।'
    });
  }

  // 4. Conflict: Renal vs Sarcopenia / Malnutrition (Protein Balance)
  if (hasRenal && hasSarcopenia) {
    const isDialysis = input.is_on_dialysis;
    let resEn = '';
    let resBn = '';

    if (isDialysis === true) {
      resEn = 'ELEVATED PROTEIN FOR DIALYSIS (1.2-1.4 g/kg/day target): Patient is on maintenance renal replacement therapy. High biological value protein is required to replace dialysate amino acid clearance and combat PEW.';
      resBn = 'ডায়ালাইসিস রোগীর জন্য উচ্চ প্রোটিন (১.২-১.৪ গ্রাম/কেজি/দিন): ডায়ালাইসিসে প্রোটিন ক্ষয় পূরণে উন্নত মানের প্রোটিন গ্রহণ আবশ্যক।';
    } else if (isDialysis === false || input.ckd_stage) {
      resEn = 'HIGH BIOLOGICAL VALUE PROTEIN BALANCE (0.6-0.8 g/kg/day target): Non-dialysis CKD stage management to preserve residual eGFR while preventing skeletal muscle wasting.';
      resBn = 'উচ্চমানের সুষম প্রোটিন ভারসাম্য (০.৬-০.৮ গ্রাম/কেজি/দিন): নন-ডায়ালাইসিস কিডনি সুরক্ষায় পরিমিত উন্নত প্রোটিন।';
    } else {
      resEn = 'INDIVIDUALIZED PROTEIN TARGET REQUIRES CLINICIAN REVIEW: Patient dialysis status and renal stage are required to determine protein targets. Maintenance hemodialysis requires 1.2-1.4 g/kg/day to compensate for dialysate amino acid loss, whereas non-dialysis CKD stage 3-5 balances at 0.6-0.8 g/kg/day. A universal 0.8 g/kg/day target must not be autonomously prescribed without dialysis status.';
      resBn = 'ব্যক্তিগত প্রোটিন লক্ষ্যমাত্রা চিকিৎসকের পর্যালোচনা প্রয়োজন: ডায়ালাইসিস ও কিডনির স্টেজ অনুযায়ী প্রোটিনের মাত্রা নির্ধারণ আবশ্যক। ডায়ালাইসিস রোগীদের ১.২-১.৪ গ্রাম/কেজি এবং নন-ডায়ালাইসিস রোগীদের ০.৬-০.৮ গ্রাম/কেজি প্রয়োজন।';
    }

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
          recommendation_en: 'Protein restriction (0.6-0.8 g/kg/day in non-dialysis CKD) to reduce intraglomerular pressure and slow eGFR decline',
          recommendation_bn: 'নন-ডায়ালাইসিস কিডনির ওপর চাপ কমাতে এবং কার্যকারিতা ধরে রাখতে প্রোটিন ০.৬-০.৮ গ্রাম/কেজি/দিনে সীমিত রাখুন'
        }
      ],
      resolved_priority_recommendation_en: resEn,
      resolved_priority_recommendation_bn: resBn,
      clinical_decision_rationale_en: 'Severe protein restriction in elderly sarcopenic patients elevates all-cause mortality through frailty and falls faster than eGFR progression. Conversely, dialysis patients require higher protein to replace dialysate losses.',
      clinical_decision_rationale_bn: 'অতিরিক্ত প্রোটিন কমালে বয়স্ক রোগীর পেশী দ্রুত ক্ষয় হয়ে মৃত্যুঝুঁকি বেড়ে যায়। আবার ডায়ালাইসিস হলে প্রোটিন বেশি লাগে।',
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
