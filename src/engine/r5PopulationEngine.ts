/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Phase R5: Life-Stage First Population Engine
 * 
 * Rules & Safeties:
 * - Life stage is primary biological classification: Infant, Child, Adolescent, Adult, Older Adult.
 * - Age 0 is a valid infant age; unentered age is strictly null/undefined (NEVER silently assumed 0!).
 * - Missing age never assumes adult_standard; missing sex never assumes female.
 * - Physiological modifiers (Pregnancy with trimesters, Lactation with stages) and Clinical Contexts
 *   (Oncology, Renal, Malnutrition, Frailty) augment without overwriting primary life stage.
 * - Bidirectional mapping preserves backwards compatibility with legacy PopulationGroup.
 */

import { PatientProfile, PopulationGroup } from '@/types';
import { 
  LifeStage, 
  R5PopulationProfile, 
  ClinicalContextFlag,
  PregnancyModifier,
  LactationModifier 
} from '@/types/r5Systems';

/**
 * Derives life stage from age in years.
 * Returns 'not_yet_assessed' if age is undefined or null.
 */
export function determineLifeStage(age: number | null | undefined): LifeStage {
  if (age === null || age === undefined || isNaN(age)) {
    return 'not_yet_assessed';
  }
  if (age >= 0 && age < 1) return 'infant';
  if (age >= 1 && age < 12) return 'child';
  if (age >= 12 && age < 18) return 'adolescent';
  if (age >= 18 && age < 65) return 'adult';
  if (age >= 65) return 'older_adult';
  return 'not_yet_assessed';
}

/**
 * Builds an authoritative R5PopulationProfile from PatientProfile.
 * Strictly avoids silent defaulting.
 */
export function buildR5PopulationProfile(patient: Partial<PatientProfile>): R5PopulationProfile {
  const rawAge = patient.age;
  const isAgeUnentered = rawAge === undefined || rawAge === null || isNaN(rawAge);
  const lifeStage = determineLifeStage(rawAge);

  const rawGender = patient.gender;
  let sex: 'male' | 'female' | 'other' | 'unentered' = 'unentered';
  if (rawGender === 'male' || rawGender === 'female' || rawGender === 'other') {
    sex = rawGender;
  }

  // Detect Pregnancy Modifier
  let pregnancy: PregnancyModifier | undefined = undefined;
  const isPregnancyGroup = patient.population_group === 'pregnancy' || 
                           patient.selected_conditions?.includes('pregnancy_first_trimester' as any) ||
                           patient.selected_conditions?.includes('pregnancy_second_trimester' as any) ||
                           patient.selected_conditions?.includes('pregnancy_third_trimester' as any);
  
  if (isPregnancyGroup || (patient.clinical_safety as any)?.pregnancy_active) {
    let trimester: 1 | 2 | 3 = (patient as any).trimester || 1;
    if (patient.selected_conditions?.includes('pregnancy_second_trimester' as any)) {
      trimester = 2;
    } else if (patient.selected_conditions?.includes('pregnancy_third_trimester' as any)) {
      trimester = 3;
    }
    pregnancy = {
      active: true,
      trimester,
      is_high_risk: Boolean((patient.clinical_safety as any)?.pregnancy_high_risk)
    };
  }

  // Detect Lactation Modifier
  let lactation: LactationModifier | undefined = undefined;
  const isLactationGroup = patient.population_group === 'lactation' ||
                           patient.selected_conditions?.includes('lactation_0_6m' as any) ||
                           patient.selected_conditions?.includes('lactation_7_12m' as any);
  
  if (isLactationGroup || (patient.clinical_safety as any)?.lactation_active) {
    const isOver6m = patient.selected_conditions?.includes('lactation_7_12m' as any);
    lactation = {
      active: true,
      stage: isOver6m ? '>6m' : '<6m',
      exclusive_breastfeeding: !isOver6m
    };
  }

  // Detect Clinical Context Flags
  const clinicalContexts: ClinicalContextFlag[] = [];
  const confirmed = (patient.confirmed_conditions || []).map(c => c.toLowerCase());
  const selected = (patient.selected_conditions || []).map(c => c.toLowerCase());
  const allConds = [...confirmed, ...selected];

  if (allConds.some(c => c.includes('cancer') || c.includes('tumor') || c.includes('chemo') || c.includes('oncology'))) {
    clinicalContexts.push('oncology');
  }
  if (allConds.some(c => c.includes('ckd') || c.includes('renal') || c.includes('dialysis') || c.includes('nephrotic')) || (patient.labs?.egfr && patient.labs.egfr < 60)) {
    clinicalContexts.push('renal_disease');
  }
  const calculatedBmi = (patient.weight_kg && patient.height_cm)
    ? patient.weight_kg / Math.pow(patient.height_cm / 100, 2)
    : undefined;
  if (calculatedBmi && calculatedBmi < 18.5) {
    clinicalContexts.push('malnutrition_risk');
  }
  if (patient.feeding_status && patient.feeding_status.route !== 'oral_standard') {
    clinicalContexts.push('specialized_feeding');
  }
  if (lifeStage === 'older_adult' && (patient.weight_kg && patient.weight_kg < 48 || (patient.clinical_safety as any)?.frailty)) {
    clinicalContexts.push('frailty');
  }

  return {
    life_stage: lifeStage,
    age: isAgeUnentered ? undefined : rawAge,
    is_age_unentered: isAgeUnentered,
    sex,
    pregnancy,
    lactation,
    clinical_contexts: clinicalContexts,
    historical_population_group: patient.population_group
  };
}

/**
 * Maps an R5PopulationProfile back to legacy PopulationGroup for backwards compatibility.
 */
export function mapR5ToLegacyPopulationGroup(profile: R5PopulationProfile): PopulationGroup {
  if (profile.pregnancy?.active) {
    return 'pregnancy';
  }
  if (profile.lactation?.active) {
    return 'lactation';
  }
  if (profile.life_stage === 'infant' || profile.life_stage === 'child') {
    return 'pediatric';
  }
  if (profile.life_stage === 'adolescent') {
    return 'adolescent';
  }
  if (profile.life_stage === 'older_adult') {
    return 'geriatric';
  }
  if (profile.life_stage === 'adult') {
    return 'adult_standard';
  }
  return profile.historical_population_group || 'adult_standard';
}

export const deriveR5PopulationProfile = buildR5PopulationProfile;

