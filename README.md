# Shuddho Clinical Functional Nutrition Practice Management System
### বিশুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন প্র্যাকটিস ম্যানেজমেন্ট

> **100% DETERMINISTIC & ZERO-AI Clinical Systems Architecture**  
> Engineered for Functional Nutrition Practice in Bangladesh. Built strictly with TypeScript rules engines, pure mathematical bioenergetics models, and structured local databases without any paid AI APIs, LLMs, or external paid services.

---

## 🌟 Key Architecture & Highlights

### 1. Zero-AI, 100% Deterministic Clinical Safety
Every recommendation, diet chart scaling, drug-nutrient depletion, meal spacing gap, and food conflict intersection is calculated using pure, deterministic algorithms in TypeScript. No hallucinations, no API costs, and zero latency.

### 2. Free-Tier Hosting & Persistence
- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide Icons.
- **Persistence:** Local-first zero-config reactive storage (LocalStorage / IndexedDB) with full schema export/import, plus ready adapters for Firebase Auth/Firestore or Supabase.
- **Deployment:** 100% Free tier ready on Vercel or Cloudflare Pages.
- **Print & PDF:** Client-ready A4 portrait report generator with crisp Bengali typography (`Hind Siliguri` / `Noto Sans Bengali`) and an instant 1-click **বাংলা / English** toggle for the entire UI and consultation report.

---

## 🧬 Integrated Databases

### 1. Bangladesh Food Composition Database (381 Foods)
Directly mapped and enriched from the official Bangladesh Food Composition Table (`bangladesh-food-composition-blogger`):
- **Full Macronutrients per 100g:** `kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`.
- **Micronutrients:** Calcium, Iron, Magnesium, Potassium, Sodium, Zinc, Vitamin C, Folate, Vitamin A.
- **Raw-to-Cooked Ratios:** e.g., Uncooked Red Rice `2.8`, Atta `1.4`, Lentils `2.5`, Fish `0.78`, Chicken `0.75`, Leafy Greens `0.60`.
- **Glycemic Load:** Categorized as `low`, `medium`, or `high`.
- **PRAL Score:** Potential Renal Acid Load calculated via the Remer & Manz formula ($0.49 \times \text{protein} + 0.037 \times \text{P} - 0.021 \times \text{K} - 0.026 \times \text{Mg} - 0.013 \times \text{Ca}$).
- **Clinical Tags:** `low_fodmap`, `high_fodmap`, `high_oxalate`, `high_purine`, `medium_purine`, `goitrogen_raw`, `goitrogen_cooked_safe`, `high_histamine`, `high_fructose`, `gluten_free`, `contains_gluten`, `phytate_soak_needed`, `gut_healing`, `anti_inflammatory`, `insulin_sensitizing`, `liver_detox`, `choline_rich`, `nitrate_rich`, `high_sodium_processed`, `high_potassium`.
- **Preparation Notes (BN & EN):** Precise soaking, sprouting, and cooking rules (e.g., "৮-১২ ঘণ্টা ভিজিয়ে রেখে পানি ফেলে রান্না করুন" / "কাঁচা খাওয়া নিষেধ, সেদ্ধ করে গ্রহণ করুন").

### 2. Bangladesh Medicine & Verified Supplement Corpus (`MediNutrition`)
Integrated generic medications (Metformin, Omeprazole/Esomeprazole/Pantoprazole, Statins like Atorvastatin/Rosuvastatin, Levothyroxine, Diuretics like Furosemide/Spironolactone, Corticosteroids like Prednisolone) mapped to:
- **Biochemical Nutrient Depletions:**
  - `Metformin` $\to$ Sublingual Methylcobalamin B12 + CoQ10
  - `PPIs` $\to$ Magnesium Glycinate/Glycerophosphate + B12 + Iron Bisglycinate
  - `Statins` $\to$ Active Ubiquinol CoQ10 (100-200 mg) + Vitamin D3/K2
  - `Steroids` $\to$ Calcium Citrate Malate + Vitamin D3/K2
- **Verified Local Bangladeshi Brands:**
  - Magnesium: **Gefomag** (Navana Pharmaceuticals PLC)
  - Probiotics: **Bolardi** & **Probio R** (Square Pharmaceuticals PLC)
  - Vitamin D3: **D-Rise** (Incepta Pharmaceuticals Ltd)
  - Active B12: **Methylcobal** (Square Pharmaceuticals PLC)
  - CoQ10: **Q-10** (Square Pharmaceuticals PLC)

---

## ⚙️ Core Clinical Engine Modules

### Module A: Intake, Anthropometrics & Functional Lab Analyzer
- **Mifflin-St Jeor BMR & TDEE:** Computes exact basal metabolic rate with activity factors ($1.2\times$ to $1.725\times$).
- **BMR-Safe Calorie Floor:** Strict clinical rule to prevent metabolic slowdown or thyroid down-regulation; prescribed target calories are clamped at or above BMR.
- **Ideal Body Weight (IBW) & Adjusted Body Weight:** Devine formula with Adjusted BW ($IBW + 0.4 \times (Actual - IBW)$) for $BMI \ge 25$ to prevent protein overfeeding while sparing lean mass.
- **Waist-to-Height Ratio (WHtR):** Visceral fat and cardiometabolic risk cutoff ($<0.50$ optimal, $0.50-0.59$ elevated risk, $\ge 0.60$ high visceral fat).
- **HOMA-IR:** Auto-calculated from Fasting Glucose $\times$ Fasting Insulin $\div 405$ ($<1.4$ optimal, $1.4-1.9$ early IR, $\ge 2.0$ significant IR).
- **TG / HDL Ratio:** Atherogenic small dense LDL surrogate marker ($<1.5$ optimal, $\ge 3.0$ high atherogenic risk).
- **Functional Lab Ranges:** Evaluates HbA1c, Glucose, Insulin, TSH, FT3, FT4, Vitamin D3, B12, Ferritin, Uric Acid, ALT against functional medicine optimal targets.
- **Gut & Ayurvedic Agni Profile:** Bloating, acid reflux / hypoacidity, interactive **Bristol Stool Scale (1 to 7)** visual selector, energy score (1-10), sleep score (1-10), and Agni type (Mandagni, Tikshnagni, Vishamagni, Samagni).

### Module B: Multi-Disease Conflict Resolver (`RED > YELLOW > GREEN`)
Select multiple concurrent conditions:
1. Type 2 Diabetes / Insulin Resistance (`t2d_ir`)
2. Hypothyroidism / Hashimoto's Autoimmune (`hypothyroid`)
3. Fatty Liver MASLD / NAFLD (`fatty_liver`)
4. PCOS / Hormonal Imbalance (`pcos`)
5. Gut Dysbiosis / IBS / Hypoacidity (`gut_dysbiosis`)
6. High Uric Acid / Gout (`uric_acid_gout`)
7. Hypertension / Early CKD Caution (`hypertension_ckd`)

**Strictest-Wins Intersection Logic:**
- If ANY selected condition flags a food as `RED` $\to$ Final Status is `RED`!
- If NO condition flags it as `RED`, but AT LEAST ONE flags it as `YELLOW` $\to$ Final Status is `YELLOW`!
- If ALL conditions allow or encourage it $\to$ Final Status is `GREEN`!
- Full audit log displaying the exact clinical reason for each condition in Bengali and English.

### Module C: Drug-Nutrient Interaction (DNI) & Daily Timing Engine
- Critical Spacing Warnings: e.g., Levothyroxine taken immediately upon rising on an empty stomach with a **strict 4-hour separation** from Calcium, Iron, Magnesium, or Coffee.
- Pre-Meal Cephalic Acid Stimulation: Fresh ginger slivers with Himalayan pink salt 20 minutes before meals for hypoacidity/PPI users.
- Chronological 24-Hour Visual Gantt Schedule (06:00 AM Waking $\to$ 08:00 AM Breakfast $\to$ 10:30 AM Mid-morning $\to$ 01:30 PM Lunch + Fat-soluble D3/CoQ10 $\to$ 05:00 PM Tea $\to$ 08:00 PM Dinner $\to$ 09:30 PM Bedtime Magnesium Glycinate).

### Module D: Automated Diet Chart, Traffic Light & Exchange Generator (Editable)
- Structured 5-meal schedule (Morning Protocol, Breakfast, Lunch, Evening Snack, Dinner, Night Protocol) matching exact target calories and macronutrients.
- **Raw vs Cooked / Family-Pot Converter:** Shows raw weight (gm) and family-pot kitchen measures (katori, cup, bati, pieces, teaspoons) side-by-side.
- **Dynamic Food Exchange Table:** 1-click alternative food swaps within the same exchange group scaled to exact calorie/protein equivalence.
- **Meal Scorer:** Per-meal Glycemic Load (GL) and PRAL acid/alkaline score.
- **Incompatible Combinations:** Auto-flags incompatible food pairs (e.g. Fish + Milk, Raw fruit immediately with heavy protein).
- Full live manual editing of gram weights and items with instant macro recalculation!

### Module E: Longitudinal Follow-Up & Phase Progression (Phases 1 to 4)
- 4 Structured Care Phases:
  - **Phase 1:** Gut Reset & Elimination (Weeks 1-4)
  - **Phase 2:** Metabolic & Microbiome Rebuild (Weeks 5-8)
  - **Phase 3:** Targeted Optimization & Reintroduction (Weeks 9-12)
  - **Phase 4:** Long-Term Maintenance (Sustainable Ancestral Lifestyle)
- Longitudinal delta tracking: Weight change (-kg and -%), WHtR delta, Bristol Stool scale improvement, symptom relief %, and lab deltas.
- **1-Click Next-Phase Transition Generator:** Automatically advances phase, retains full clinical history, and logs consultation visits.

### Module F: Printable A4 Client Report
- Print-perfect CSS (`@media print`) designed specifically for A4 portrait paper and PDF generation.
- Clinic letterhead, patient ID, phase indicator, anthropometrics, functional lab evaluation, personalized traffic light food guide, 24-hour pill/supplement schedule, and complete meal chart with preparation instructions.
- Instant 1-click toggle between **বাংলা** and **English**!

---

## 🚀 Getting Started

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run deterministic unit test suite
npx tsx test_engine.ts

# 3. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

### Free-Tier Deployment (Vercel / Cloudflare Pages)
- **Vercel:** Push repository to GitHub $\to$ Import to Vercel $\to$ Framework Preset: `Next.js` $\to$ Deploy. Zero environment variables required for basic offline/local-first practice management.
- **Cloudflare Pages:** Connect repository $\to$ Build command: `npx @cloudflare/next-on-pages` or standard static export.

---

## 📄 License & Intellectual Property
Designed and engineered for clinical functional nutrition practice in Bangladesh. Deterministic clinical rules compliant with evidence-based functional medicine protocols.

