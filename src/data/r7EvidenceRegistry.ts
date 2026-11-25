/**
 * SHUDDHO Phase R7 — Traceable Clinical Evidence Governance Registry
 *
 * Every active R7 clinical decision threshold, drug-nutrient rule, derived calculation,
 * and UL safety ceiling traces back to verified, versioned reference metadata.
 */

import { R7EvidenceReference } from '@/types/r7Laboratory';

export const R7_EVIDENCE_REGISTRY: Record<string, R7EvidenceReference> = {
  EVID_ADA_2026_GLYCEMIC: {
    rule_id: 'EVID_ADA_2026_GLYCEMIC',
    clinical_claim: 'Diagnostic and risk thresholds for Fasting Plasma Glucose (>=126 mg/dL diabetes; 100-125 mg/dL IFG), 2h PG (>=200 mg/dL OGTT), and HbA1c (>=6.5% diabetes; 5.7-6.4% prediabetes).',
    source_title: '2. Diagnosis and Classification of Diabetes: Standards of Care in Diabetes—2026',
    organization_or_authors: 'American Diabetes Association (ADA)',
    publication_date_or_version: 'Diabetes Care 2026;49(Suppl. 1)',
    source_url_or_doi: 'https://doi.org/10.2337/dc26-s002',
    applicable_population: 'Non-pregnant adults (pregnancy GDM requires trimester-specific OGTT criteria)',
    threshold_or_recommendation: 'HbA1c >=6.5%, FPG >=126 mg/dL (7.0 mmol/L), 2h-PG >=200 mg/dL (11.1 mmol/L); diagnostic confirmation generally requires repeat testing without unequivocal hyperglycemia.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'HbA1c can be falsely low or high in hemoglobinopathies, altered RBC turnover, iron-deficiency anemia, CKD, and pregnancy.',
    verified_date: '2026-11-25'
  },
  EVID_KDIGO_2024_CKD: {
    rule_id: 'EVID_KDIGO_2024_CKD',
    clinical_claim: 'CKD staging, UACR categories (<30, 30-300, >300 mg/g), eGFR interpretation (>3 months chronicity required), and hyperkalemia/mineral review.',
    source_title: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease (Executive Summary)',
    organization_or_authors: 'Kidney Disease: Improving Global Outcomes (KDIGO)',
    publication_date_or_version: 'Kidney International 2024',
    source_url_or_doi: 'https://doi.org/10.1016/j.kint.2023.10.016',
    applicable_population: 'Adults (pediatric eGFR requires bedside Schwartz or validated pediatric equations)',
    threshold_or_recommendation: 'Single abnormal eGFR <60 mL/min/1.73m2 or UACR >=30 mg/g warrants repeat testing over >=3 months before diagnosing chronicity; K >=6.0 mmol/L warrants urgent medical evaluation.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'Serum creatinine-based eGFR is influenced by muscle mass, high dietary cooked meat intake, amputation, acute kidney injury, and pregnancy.',
    verified_date: '2026-11-25'
  },
  EVID_ENDOCRINE_2024_VITD: {
    rule_id: 'EVID_ENDOCRINE_2024_VITD',
    clinical_claim: '25(OH)D assessment and Vitamin D empiric supplementation limitations in healthy vs clinical-risk populations.',
    source_title: 'Vitamin D for the Prevention of Disease: An Endocrine Society Clinical Practice Guideline',
    organization_or_authors: 'Endocrine Society (Demay MB et al.)',
    publication_date_or_version: 'JCEM 2024;109(8)',
    source_url_or_doi: 'https://doi.org/10.1210/clinem/dgae290',
    applicable_population: 'Children 1-18y, adults, pregnancy, prediabetes, older adults >=75y',
    threshold_or_recommendation: 'Deficiency/insufficiency thresholds vary by clinical context; hypervitaminosis risk rises above 100-150 ng/mL with hypercalcemia monitoring. Universal 50-80 ng/mL target is not guideline-mandated.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'Guideline does not endorse routine 25(OH)D screening or uniform optimal targets across healthy adults.',
    verified_date: '2026-11-25'
  },
  EVID_WHO_2020_FERRITIN: {
    rule_id: 'EVID_WHO_2020_FERRITIN',
    clinical_claim: 'Serum ferritin cutoffs for iron deficiency (<15 ug/L in non-inflamed adults >=5y; <12 ug/L under 5y) and acute-phase confounding during infection/inflammation.',
    source_title: 'WHO Guideline on Use of Ferritin Concentrations to Assess Iron Status in Individuals and Populations',
    organization_or_authors: 'World Health Organization (WHO)',
    publication_date_or_version: '2020',
    source_url_or_doi: 'https://www.who.int/publications/i/item/9789240000124',
    applicable_population: 'Infants, children, non-pregnant adults, pregnant populations (inflammation-adjusted)',
    threshold_or_recommendation: 'Ferritin <15 ng/mL (ug/L) indicates depleted iron stores in healthy adults; in elevated CRP/inflammation (CRP >5 mg/L), interpret alongside TSAT/TIBC as ferritin acts as an acute-phase reactant.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'Elevated ferritin with high CRP/ALT/GGT may reflect inflammation or hepatocellular injury rather than iron overload alone.',
    verified_date: '2026-11-25'
  },
  EVID_NIH_ODS_MICRONUTRIENTS: {
    rule_id: 'EVID_NIH_ODS_MICRONUTRIENTS',
    clinical_claim: 'Established Tolerable Upper Intake Levels (UL) for Magnesium (supplemental 350 mg/day adult), Zinc (40 mg/day adult), Vitamin D (4,000 IU / 100 mcg/day), Folate (1,000 mcg folic acid equivalent), Iron (45 mg/day adult), and Calcium (2,000-2,500 mg/day).',
    source_title: 'NIH Office of Dietary Supplements — Health Professional Fact Sheets',
    organization_or_authors: 'National Institutes of Health (NIH ODS) / National Academies (IOM/NASEM)',
    publication_date_or_version: 'Continuous Updates (2024–2026)',
    source_url_or_doi: 'https://ods.od.nih.gov/factsheets/list-all/',
    applicable_population: 'Age-, sex-, and pregnancy/lactation-stratified IOM/NASEM groups',
    threshold_or_recommendation: 'Pediatric ULs must follow IOM age-band values rather than arbitrary percentages; Mg 350 mg UL applies strictly to supplemental/pharmacologic Mg, not intrinsic food magnesium.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'No validated UL exists for Vitamin B12 or CoQ10; absence of UL does not indicate safety at extreme doses or with drug interactions.',
    verified_date: '2026-11-25'
  },
  EVID_MHRA_2022_METFORMIN_B12: {
    rule_id: 'EVID_MHRA_2022_METFORMIN_B12',
    clinical_claim: 'Reduced Vitamin B12 levels are a common adverse effect of metformin, risk increasing with higher dose and longer treatment duration.',
    source_title: 'Metformin and reduced vitamin B12 levels: new advice for monitoring patients at risk',
    organization_or_authors: 'UK Medicines and Healthcare products Regulatory Agency (MHRA)',
    publication_date_or_version: 'Drug Safety Update June 2022',
    source_url_or_doi: 'https://www.gov.uk/drug-safety-update/metformin-and-reduced-vitamin-b12-levels-new-advice-for-monitoring-patients-at-risk',
    applicable_population: 'Patients on active metformin therapy (especially >=1000 mg/day or long duration or neuropathy/anemia risk)',
    threshold_or_recommendation: 'Check Vitamin B12 periodically in patients with risk factors or symptoms of neuropathy/anemia; metformin exposure is a risk/monitoring indication, not an automatic diagnosis or blanket Rx.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'Serum B12 borderline levels (200-350 pg/mL) may require MMA or holotranscobalamin confirmation.',
    verified_date: '2026-11-25'
  },
  EVID_DAILYMED_PRESCRIBING: {
    rule_id: 'EVID_DAILYMED_PRESCRIBING',
    clinical_claim: 'FDA approved prescribing information for polyvalent cation chelation (Levothyroxine, Fluoroquinolones, Tetracyclines), Potassium-Sparing Diuretics, Methotrexate, Isoniazid, Bisphosphonates, and Warfarin.',
    source_title: 'DailyMed Official Prescribing Information Repository',
    organization_or_authors: 'U.S. National Library of Medicine (NLM) / FDA',
    publication_date_or_version: 'Live Official Labeling Reference',
    source_url_or_doi: 'https://dailymed.nlm.nih.gov/',
    applicable_population: 'Patients taking oral, IV, or sublingual pharmacotherapies',
    threshold_or_recommendation: 'Levothyroxine requires 4-hour separation from calcium/iron; Fluoroquinolones/Tetracyclines require formulation-specific spacing (2h before / 4-6h after); Oral bisphosphonates exclude IV zoledronate.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'Individual salt formulations and extended-release matrices may carry distinct absorption windows.',
    verified_date: '2026-11-25'
  },
  EVID_MATTHEWS_1985_HOMAIR: {
    rule_id: 'EVID_MATTHEWS_1985_HOMAIR',
    clinical_claim: 'HOMA-IR = [Fasting Glucose (mg/dL) * Fasting Insulin (uIU/mL)] / 405.',
    source_title: 'Homeostasis model assessment: insulin resistance and beta-cell function from fasting plasma glucose and insulin concentrations in man',
    organization_or_authors: 'Matthews DR et al., Diabetologia 1985',
    publication_date_or_version: 'Diabetologia 1985;28(7):412-419',
    source_url_or_doi: 'https://doi.org/10.1007/BF00280883',
    applicable_population: 'Fasting individuals not on exogenous insulin',
    threshold_or_recommendation: 'Requires same-date compatible fasting glucose and fasting insulin; invalid if exogenous insulin injected prior to draw or non-fasting; no universal diagnostic cutoff across ethnicities.',
    evidence_category: 'tier2_clinical_study',
    known_limitations: 'Unreliable in exogenous insulin users, non-fasting samples, and severe beta-cell failure.',
    verified_date: '2026-11-25'
  },
  EVID_STERLING_2006_FIB4: {
    rule_id: 'EVID_STERLING_2006_FIB4',
    clinical_claim: 'FIB-4 Index = (Age [y] * AST [U/L]) / (Platelets [10^9/L] * sqrt(ALT [U/L])).',
    source_title: 'Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection (and AASLD MASLD guidance)',
    organization_or_authors: 'Sterling RK et al. / AASLD MASLD Practice Guidance 2023',
    publication_date_or_version: 'Hepatology 2006;43(6) / AASLD 2023',
    source_url_or_doi: 'https://doi.org/10.1002/hep.21178',
    applicable_population: 'Adults >=18y (standard cutoff <1.3 low risk age <65; age >=65 requires adjusted lower cutoff <2.0; poorly validated age <35 or >65)',
    threshold_or_recommendation: 'Do not calculate or apply standard adult cutoffs in pediatric (<18y) patients; require same-day/compatible AST, ALT, and Platelets >0.',
    evidence_category: 'tier2_clinical_study',
    known_limitations: 'Reduced specificity in age >=65y, acute hepatitis flare, or thrombocytopenia of non-hepatic origin.',
    verified_date: '2026-11-25'
  },
  EVID_AHA_ACC_LIPIDS: {
    rule_id: 'EVID_AHA_ACC_LIPIDS',
    clinical_claim: 'Atherogenic lipid evaluation (Non-HDL = TC - HDL; ApoB; Lp(a); TG >=500 mg/dL pancreatitis review).',
    source_title: 'AHA/ACC Guideline on the Management of Blood Cholesterol',
    organization_or_authors: 'American Heart Association / American College of Cardiology',
    publication_date_or_version: 'Circulation 2019;139(25)',
    source_url_or_doi: 'https://doi.org/10.1161/CIR.0000000000000625',
    applicable_population: 'Adults (pediatric lipid thresholds differ)',
    threshold_or_recommendation: 'Lp(a) mass (mg/dL) and molar (nmol/L) concentrations cannot be converted accurately via a universal factor due to apo(a) kringle IV repeat isoform size heterogeneity.',
    evidence_category: 'tier1_guideline',
    known_limitations: 'TG/HDL ratio is not a standalone direct measure of LDL particle diameter.',
    verified_date: '2026-11-25'
  }
};
