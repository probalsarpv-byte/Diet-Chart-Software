/**
 * SHUDDHO FUNCTIONAL NUTRITION SOFTWARE
 * Masanumasika Garbhini Paricharya Framework (Phase P1 Addendum)
 * 
 * Traceable month-wise pregnancy dietary principles based on classical
 * Ayurvedic treatises (Charaka Samhita Sharira Sthana 8, Sushruta Samhita),
 * operationalized exclusively with safe Bangladeshi whole foods.
 * 
 * STRICT CLINICAL CONSTRAINT:
 * Zero medicinal herbs, zero bhasmas, zero Panchakarma procedures.
 * Strictly non-pharmacological, culturally familiar whole-food nourishment.
 */

import { MasanumasikaMonthFramework } from '../types/assessment';

export const MASANUMASIKA_MONTH_FRAMEWORKS: Record<number, MasanumasikaMonthFramework> = {
  1: {
    month: 1,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'First month: Zygote implantation, blastocyst formation, and initial embryonic tissue differentiation.',
    developmental_focus_bn: 'প্রথম মাস: জাইগোট ইমপ্লান্টেশন, ব্লাস্টোসিস্ট গঠন এবং ভ্রূণের কোষীয় বিভাজন পর্ব।',
    maternal_focus_en: 'Prevention of dehydration, alleviating early morning nausea, stabilizing digestive agni, avoiding uterine spasms.',
    maternal_focus_bn: 'পানিশূন্যতা রোধ, সকালের বমি বমি ভাব উপশম, হজম অগ্নি স্থিতিশীল রাখা এবং জরায়ুর সংকোচন এড়ানো।',
    dietary_principles_en: 'Madhura (naturally sweet), Sheeta (cooling), liquid, and easily digestible foods. Non-medicated pure cow milk.',
    dietary_principles_bn: 'মধুর রসযুক্ত, শীতলবীর্য, তরল ও সহজে পরিপাকযোগ্য খাদ্য। খাঁটি ফুটানো সাধারণ গরুর দুধ।',
    recommended_traditional_foods_en: [
      'Boiled fresh cow milk (lukewarm or room temperature)',
      'Light rice water or thin rice gruel (Manda/Peya)',
      'Tender coconut water for natural hydration',
      'Sweet pomegranate and sweet seasonal fruits'
    ],
    recommended_traditional_foods_bn: [
      'ফুটানো হালকা কুসুম গরম বা স্বাভাবিক তাপমাত্রার খাঁটি দুধ',
      'হালকা ভাতের মাড় বা পাতলা জাউ ভাত',
      'প্রাকৃতিক কচি ডাবের পানি (পানিশূন্যতা প্রতিরোধে)',
      'মিষ্টি ডালিম এবং সহজপাচ্য মৌসুমি মিষ্টি ফল'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Roasted puffed rice (muri) soaked in milk',
      'Sago (shabudana) light pudding without excess sugar',
      'Thin soup of green bottle gourd (lao)',
      'Ripe sweet banana (shobri kola)'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'দুধে ভেজানো হালকা মুড়ি',
      'অল্প মিষ্টিতে তৈরি নরম সাগু দানার পায়েস',
      'কচি মিষ্টি লাউয়ের পাতলা ঝোল',
      'সহজে হজমযোগ্য মিষ্টি শবরি কলা'
    ],
    restricted_or_unsafe_items_en: [
      'Unpasteurized raw milk',
      'Raw papaya, green pineapple',
      'Excessively hot, pungent chilies and mustard oil',
      'Medicinal herbs and herbal concoctions'
    ],
    restricted_or_unsafe_items_bn: [
      'না ফোটানো কাঁচা দুধ',
      'কাঁচা বা আধা-পাকা পেঁপে এবং আনারস',
      'অতিরিক্ত ঝাল, পোড়া তেল ও কড়া মশলাদার খাবার',
      'কোনো প্রকার ভেষজ ওষুধ বা পাঁচন'
    ],
    hydration_and_fluids_en: 'Frequent small sips of boiled cooled water, tender coconut water, and diluted fresh sweet lime juice.',
    hydration_and_fluids_bn: 'ফুটানো ঠান্ডা পানি বারবার অল্প অল্প করে পান, ডাবের পানি ও হালকা মিষ্টি লেবুর শরবত।'
  },
  2: {
    month: 2,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Second month: Formation of the gestational sac, embryonic heart begins rhythmic pulsations, initial limb buds.',
    developmental_focus_bn: 'দ্বিতীয় মাস: গর্ভস্থ ভ্রূণের হার্টবিট শুরু, হাত-পায়ের কুঁড়ি গঠন এবং স্নায়ুতন্ত্রের সূচনা।',
    maternal_focus_en: 'Maternal fatigue, persistent nausea, breast tenderness, metabolic stabilization.',
    maternal_focus_bn: 'শারীরিক ক্লান্তি, বমি ভাব, স্তনের স্পর্শকাতরতা এবং পুষ্টি ক্ষয় রোধ।',
    dietary_principles_en: 'Milk cooked with natural sweet grains (Madhura Dravya). Soft, unctuous (Snigdha), cooling nourishment.',
    dietary_principles_bn: 'প্রাকৃতিক পুষ্টিকর শস্য সহ সিদ্ধ দুধ। নরম, স্নিগ্ধ এবং পুষ্টিকর সহজপাচ্য খাদ্য।',
    recommended_traditional_foods_en: [
      'Milk cooked with sago or oats',
      'Fresh homemade sweet curd (mishti doi in moderation)',
      'Rice gruel prepared with milk (Kshira-peya)',
      'Sweet seedless raisins soaked overnight in water'
    ],
    recommended_traditional_foods_bn: [
      'সাগু বা ওটস দিয়ে সিদ্ধ দুধ',
      'ঘরে পাতা হালকা মিষ্টি দই (পরিমিত পরিমাণে)',
      'দুধ দিয়ে তৈরি নরম ক্ষীর বা জাউ ভাত',
      'রাতে পানিতে ভিজিয়ে রাখা মিষ্টি কিশমিশ'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Chira (flattened rice) soaked in milk with ripe banana',
      'Barley water with a hint of rock sugar (misri)',
      'Soft cooked rice with stewed pointed gourd (potol) and ridge gourd (jhinge)',
      'Mung dal light water soup'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'দুধে ভেজানো নরম চিড়া ও পাকা মিষ্টি কলা',
      'মিছরি মেশানো বার্লি বা যবের হালকা পানি',
      'নরম সেদ্ধ চালের ভাতের সাথে পটল ও ঝিঙের পাতলা তরকারি',
      'মুগ ডালের পাতলা সুপ'
    ],
    restricted_or_unsafe_items_en: [
      'Heavy oily fried snacks (singara, puri)',
      'Processed bakery items and stale leftovers',
      'Caffeine exceeding 1 cup daily',
      'Unverified prenatal herbal tonics'
    ],
    restricted_or_unsafe_items_bn: [
      'তেলে ভাজা ভারী নাস্তা (সিঙ্গাড়া, সমুচা, পুরি)',
      'বাসি খাবার ও অতিরিক্ত প্রক্রিয়াজাত বিস্কুট',
      'দিনে এক কাপের বেশি চা/কফি',
      'অনিবন্ধিত ভেষজ বা কবিরাজি বড়ি'
    ],
    hydration_and_fluids_en: 'Minimum 2.0 to 2.5 L daily fluid intake including plain water, barley water, and light thin dal soup.',
    hydration_and_fluids_bn: 'দৈনিক অন্তত ২.০ থেকে ২.৫ লিটার তরল গ্রহণ (ফুটানো পানি, বার্লি পানি এবং পাতলা মুগ ডালের পানি সহ)।'
  },
  3: {
    month: 3,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Third month: Fetal fingers, toes, and facial structure delineate; organogenesis active.',
    developmental_focus_bn: 'তৃতীয় মাস: আঙ্গুল, চোখ, নাক এবং মুখের আকৃতি স্পষ্ট হতে শুরু করে; অঙ্গপ্রত্যঙ্গ গঠন পর্ব।',
    maternal_focus_en: 'Transition from morning sickness; appetite begins to stabilize; placental hormone peak.',
    maternal_focus_bn: 'বমি ভাব ধীরে ধীরে কমে আসা; ক্ষুধাবোধ স্বাভাবিক হওয়া শুরু; প্ল্যাসেন্টা বা গর্ভফুল সম্পূর্ণ সক্রিয় হওয়া।',
    dietary_principles_en: 'Milk with small amount of homemade pure desi ghee; sweet cooling fruits; easily digestible carbohydrate-protein pairs.',
    dietary_principles_bn: 'অল্প খাঁটি ঘিয়ের সাথে হালকা দুধ; মিষ্টি সুস্বাদু ফল; সহজপাচ্য কার্বোহাইড্রেট ও উদ্ভিজ্জ প্রোটিন।',
    recommended_traditional_foods_en: [
      'Fresh lukewarm milk with half teaspoon of pure homemade desi ghee',
      'Cooked red rice with soft yellow mung dal',
      'Sweet ripe melon, apple puree, and pomegranate',
      'Soft steamed vegetable mash with a drop of ghee'
    ],
    recommended_traditional_foods_bn: [
      'হালকা গরম দুধের সাথে আধা চা চামচ খাঁটি দেশি ঘি',
      'নরম লাল চালের ভাত ও সেদ্ধ হলুদ মুগ ডাল',
      'মিষ্টি বাঙ্গি, সেদ্ধ আপেল পিউরি এবং ডালিমের রস',
      'ঘি দিয়ে নরম সেদ্ধ সবজির ভর্তা (লাউ, আলু, পেঁপে)'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Soft mung dal khichuri with ghee and bottle gourd',
      'Poached egg or thoroughly boiled country chicken egg (if tolerated)',
      'Mola/Dhela small fish light stew (rich in natural calcium and phosphorus)',
      'Sweet ripe papaya (only fully tree-ripened, never raw/semi-ripe)'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'ঘি ও লাউ দিয়ে রান্না নরম মুগ ডালের পাতলা খিচুড়ি',
      'ভালোভাবে সেদ্ধ করা দেশি মুরগির ডিম (হজম সহ্য হলে)',
      'মলা বা ঢেলা ছোট মাছের পাতলা ঝোল (প্রাকৃতিক ক্যালসিয়াম ও ফসফরাস)',
      'সম্পূর্ণ পাকা মিষ্টি পেঁপে (কাঁচা বা আধপাকা পেঁপে সম্পূর্ণ নিষিদ্ধ)'
    ],
    restricted_or_unsafe_items_en: [
      'Half-boiled or runny eggs (salmonella risk)',
      'Large predatory marine fish with high mercury (shark, swordfish, king mackerel)',
      'Excessive artificial sweeteners and aspartame',
      'Heavy meat curries cooked with commercial dalda/shortening'
    ],
    restricted_or_unsafe_items_bn: [
      'কাঁচা বা আধা-সেদ্ধ ডিম (সালমোনেলা জীবাণু ঝুঁকি)',
      'পারদযুক্ত বড় সামুদ্রিক শিকারী মাছ',
      'কৃত্রিম সুইটনার ও ক্ষতিকর রাসায়নিক দ্রব্যাদি',
      'ডালডা বা পাম তেলের অতিরিক্ত মশলাদার মাংসের তরকারি'
    ],
    hydration_and_fluids_en: 'Adequate hydration with tender coconut water, cumin water (jeera pani) for gentle digestion, and clean water.',
    hydration_and_fluids_bn: 'কচি ডাবের পানি, হজমের জন্য হালকা জিরা পানি এবং পর্যাপ্ত ফুটানো নিরাপদ পানি।'
  },
  4: {
    month: 4,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Fourth month: Fetal heart beats vigorously; Dauhrida stage (fetal desires reflected through maternal appetite); muscular growth.',
    developmental_focus_bn: 'চতুর্থ মাস: গর্ভের ভ্রূণের হৃদস্পন্দন সুদৃঢ়; দ্বৌহৃদ অবস্থা (মায়ের তীব্র রুচি ও আকাক্সক্ষা প্রকাশ); পেশির বৃদ্ধি।',
    maternal_focus_en: 'Fulfilling wholesome maternal nutritional desires, preventing anemia, establishing second-trimester vitality.',
    maternal_focus_bn: 'মায়ের স্বাস্থ্যকর খাদ্যাভ্যাস রক্ষা, রক্তস্বল্পতা প্রতিরোধ এবং দ্বিতীয় ট্রাইমেস্টারে দৈহিক শক্তি বৃদ্ধি।',
    dietary_principles_en: 'Navanita (freshly churned unsalted butter) with milk or rice. High bioavailable protein and mineral-dense nutrition.',
    dietary_principles_bn: 'টাটকা মাখন বা নন-লবণাক্ত নবনীত এবং ভাত। উচ্চ জৈব প্রোটিন এবং খনিজ সমৃদ্ধ পুষ্টি।',
    recommended_traditional_foods_en: [
      'White rice with freshly churned unsalted butter (makhan)',
      'Cooked red amaranth leaves (lal shak) or spinach for plant iron',
      'Boiled milk with cardamom and soaked crushed almonds',
      'Tender well-cooked country chicken soup'
    ],
    recommended_traditional_foods_bn: [
      'এক চা চামচ টাটকা লবণহীন সাদা মাখন দিয়ে ভাত',
      'আয়রন সমৃদ্ধ লাল শাক বা পালং শাকের নরম ভাজি',
      'এলাচ দেওয়া ফুটানো দুধের সাথে রাতে ভেজানো বাদাম বাটা',
      'দেশি মুরগির পাতলা পরিষ্কার সুপ'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Rice with fresh Rui/Katla fish cooked in mustard oil with cumin and coriander',
      'Lal shak cooked with a squeeze of fresh lemon juice (vitamin C boosts iron absorption)',
      'Curd (tok doi) paired with sweet banana and roasted cumin',
      'Whole wheat handmade thin ruti with boiled lentils'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'জিরা-ধনিয়া দিয়ে রান্না করা তাজা রুই বা কাতলা মাছের পাতলা ঝোল',
      'লেবুর রস মেশানো লাল শাক (ভিটামিন সি নন-হিম আয়রন শোষণ দ্বিগুণ করে)',
      'মিষ্টি কলার সাথে হালকা টক দই ও ভাজা জিরা গুঁড়া',
      'হাতে তৈরি পাতলা লাল আটার রুটি ও পাতলা ডাল'
    ],
    restricted_or_unsafe_items_en: [
      'Commercial salted yellow butter with trans fats',
      'Overnight soaked sour fermented foods (pantabhaat) if prepared unhygienically',
      'Street foods and raw salads outside home',
      'Unscreened liver or organ meat in excessive quantity (vitamin A toxicity risk)'
    ],
    restricted_or_unsafe_items_bn: [
      'অতিরিক্ত লবণযুক্ত প্যাকেটজাত মাখন ও ট্রান্স ফ্যাট',
      'অস্বাস্থ্যকরভাবে রাখা বাসি বা বাসি পান্তা ভাত',
      'রাস্তার খোলা কাঁচা সালাদ বা ফুচকা',
      'অতিরিক্ত কলিজা খাওয়া (ভিটামিন এ বিষক্রিয়ার ঝুঁকি)'
    ],
    hydration_and_fluids_en: 'Fresh lemon water with a pinch of rock salt and raw jaggery (gur) for electrolyte balance.',
    hydration_and_fluids_bn: 'লেবুর শরবত ও সামান্য গুড় মিশ্রিত পানীয় (ইলেক্ট্রোলাইট ভারসাম্যের জন্য)।'
  },
  5: {
    month: 5,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Fifth month: Awakening of fetal mind (Manas); muscle and blood (Rakta/Mamsa) rapid growth; fetal movements felt.',
    developmental_focus_bn: 'পঞ্চম মাস: ভ্রূণের মন বা মানসিক শক্তির জাগরণ; মাংসপেশি ও রক্তের দ্রুত বৃদ্ধি; নড়াচড়া স্পষ্ট হওয়া।',
    maternal_focus_en: 'Adequate calories and protein for maternal and fetal tissue expansion; preventing leg swelling and iron deficiency.',
    maternal_focus_bn: 'মায়ের ও গর্ভস্থ শিশুর মাংসপেশির বৃদ্ধির জন্য পর্যাপ্ত প্রোটিন; পায়ে পানি আসা ও আয়রনের অভাব প্রতিরোধ।',
    dietary_principles_en: 'Kshira-Sarpi (ghee prepared from milk), wholesome rice, nourishing legumes, balanced sweet-nourishing diet.',
    dietary_principles_bn: 'ক্ষীর-সর্পি (দুধের ঘিয়ে রান্না খাবার), পুষ্টিকর চালের ভাত ও ডাল; সুষম মধুর ও ধাতু বর্ধক খাদ্য।',
    recommended_traditional_foods_en: [
      'Red rice cooked with desi ghee and soft lentils',
      'Boiled milk with a teaspoon of pure ghee at bedtime',
      'Fresh curd (doi) during daytime to nourish gut microbiome',
      'Sweet pomegranate, seasonal guava (peyara) rich in vitamin C'
    ],
    recommended_traditional_foods_bn: [
      'ঘি ও পাতলা মসুর/মুগ ডাল দিয়ে লাল চালের গরম ভাত',
      'রাতে ঘুমানোর আগে এক কাপ দুধে এক চা চামচ খাঁটি দেশি ঘি',
      'দিনের বেলা ঘরে পাতা তাজা দই (গাট মাইক্রোবায়োমের পুষ্টিতে)',
      'ভিটামিন সি সমৃদ্ধ পাকা পেয়ারা ও তাজা ডালিম'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Khichuri made with Govindobhog or Atash rice, green papaya, and moong dal with desi ghee',
      'Small fresh fish (kachki, batashi, mola) cooked with tomato and green chili',
      'Steamed pumpkin (misti kumra) mash with a hint of roasted kalijira',
      'Fresh coconut water in the late morning'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'মুগ ডাল, কাঁচা পেঁপে ও ঘি সহযোগে সুগন্ধি চালের নরম খিচুড়ি',
      'টমেটো দিয়ে কাচকি বা বাতাসি মাছের হালকা চচ্চড়ি',
      'হালকা কালোজিরা ফোড়ন দিয়ে মিষ্টি কুমড়ার নরম তরকারি',
      'সকাল ১১টায় এক গ্লাস তাজা ডাবের পানি'
    ],
    restricted_or_unsafe_items_en: [
      'Fasting or meal skipping (strictly contraindicated in pregnancy)',
      'High-sugar sweets (mishti, roshogolla) that elevate gestational diabetes risk',
      'Excess table salt that exacerbates edema and gestational hypertension',
      'Unpasteurized soft cheeses'
    ],
    restricted_or_unsafe_items_bn: [
      'উপবাস বা দীর্ঘ সময় না খেয়ে থাকা (গর্ভাবস্থায় সম্পূর্ণ নিষিদ্ধ)',
      'অতিরিক্ত মিষ্টি বা মিষ্টি জাতীয় খাবার (জেস্টেশনাল ডায়াবেটিসের ঝুঁকি)',
      'খাবারে বাড়তি কাঁচা লবণ (উচ্চ রক্তচাপ ও পায়ে পানি আসার ঝুঁকি)',
      'খোলা বা অনিরাপদ পনির'
    ],
    hydration_and_fluids_en: '2.5 to 3.0 L daily fluid intake. Encourage water between meals rather than large gulps during heavy meals.',
    hydration_and_fluids_bn: 'দৈনিক ২.৫ থেকে ৩.০ লিটার তরল। খাওয়ার মাঝে একবারে বেশি পানি না খেয়ে সারা দিনে নিয়মিত পান করা।'
  },
  6: {
    month: 6,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Sixth month: Development of fetal intellect (Buddhi), hair, nails, skin pigmentation, and pulmonary surfactant initiation.',
    developmental_focus_bn: 'ষষ্ঠ মাস: বুদ্ধিবৃত্তির বিকাশ, চুল, নখ ও ত্বকের গঠন এবং ফুসফুসের কার্যকারিতার প্রস্তুতি।',
    maternal_focus_en: 'Preventing lower back ache, maternal fatigue, gestational glycemic stability, sustained nutrient density.',
    maternal_focus_bn: 'কোমরের ব্যথা উপশম, ক্লান্তি দূরীকরণ, রক্তের সুগার নিয়ন্ত্রণ এবং পুষ্টির ধারাবাহিকতা।',
    dietary_principles_en: 'Ghee with sweet restorative foods; rice gruel (Yavagu) with milk and ghee; calcium and essential fatty acids.',
    dietary_principles_bn: 'বলবর্ধক ও মিষ্টি স্বাদের সহজপাচ্য খাদ্য; ক্ষীর-যবাগূ (দুধ-চালের নরম সুপ) ও ঘি; ক্যালসিয়াম ও ওমেগা ফ্যাটি অ্যাসিড।',
    recommended_traditional_foods_en: [
      'Rice gruel (Yavagu) prepared with milk and half teaspoon of pure ghee',
      'Soaked almonds and walnuts (rich in plant DHA/ALA for fetal brain development)',
      'Cooked green leafy vegetables (Palong shak, Pui shak) with pumpkin seeds',
      'Fresh cottage cheese (chhena/paneer) prepared from boiled cow milk'
    ],
    recommended_traditional_foods_bn: [
      'দুধ ও আধা চা চামচ ঘি দিয়ে তৈরি চালের নরম জাউ',
      'রাতে ভেজানো কাঠবাদাম ও আখরোট (ভ্রূণের মস্তিষ্কের বিকাশে ওমেগা ফ্যাটি অ্যাসিড)',
      'মিষ্টি কুমড়ার বীজ সহ রান্না করা পালং শাক বা পুঁই শাক',
      'ফুটানো গরুর দুধের ঘরে তৈরি টাটকা ছানা (নরম প্রোটিন)'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Handmade whole-wheat ruti with fresh chhena or egg bhurji with minimal oil',
      'Fresh Hilsa (Ilish) or Pangas in moderate small portions (natural source of marine omega-3, cooked thoroughly)',
      'Stewed green banana (kachakola) curry for gentle prebiotic digestion',
      'Seasonal ripe wood apple (bel) juice or ripe papaya'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'হাতে তৈরি লাল আটার রুটি ও নরম টাটকা ছানা বা ডিম ভুনা',
      'পরিমিত ইলিশ মাছের পাতলা ঝোল (উচ্চমানের প্রাকৃতিক ওমেগা-৩ ফ্যাটি অ্যাসিড)',
      'হজমের সুবিধার জন্য কাঁচকলার হালকা পাতলা তরকারি',
      'ঘরে তৈরি বেলের শরবত বা পাকা মিষ্টি ফল'
    ],
    restricted_or_unsafe_items_en: [
      'Reheated commercial cooking oils',
      'Excessive gaseous legumes (uncooked rajma, chana) that trigger severe abdominal distension',
      'Carbonated sodas and energy drinks',
      'Synthetic unprescribed body building protein powders'
    ],
    restricted_or_unsafe_items_bn: [
      'বারবার গরম করা পোড়া সয়াবিন বা পাম তেল',
      'অতিরিক্ত গ্যাস সৃষ্টিকারী ডাল (যেমন শক্ত রাজমা, ছোলা)',
      'সব ধরনের কোমল পানীয় (কোক, স্প্রাইট) ও এনার্জি ড্রিংকস',
      'বাজারের কৃত্রিম কেমিক্যাল প্রোটিন পাউডার'
    ],
    hydration_and_fluids_en: 'Warm milk with a pinch of nutmeg (jaiphal) or cardamom at night to support restful sleep.',
    hydration_and_fluids_bn: 'রাতে ঘুমের সহায়ক হিসেবে এক কাপ হালকা গরম দুধে সামান্য এলাচ গুঁড়া।'
  },
  7: {
    month: 7,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Seventh month: All bodily organs fully formed; rapid subcutaneous fat accumulation; fetal viability established.',
    developmental_focus_bn: 'সপ্তম মাস: সকল অঙ্গপ্রত্যঙ্গ সম্পূর্ণভাবে গঠিত; ত্বকের নিচে চর্বির স্তর সঞ্চয়; ভ্রূণের পূর্ণাঙ্গ রূপ।',
    maternal_focus_en: 'Relieving abdominal tightness and itchiness (Kikka/stretch marks), acid reflux from stomach compression, preventing constipation.',
    maternal_focus_bn: 'পেটের টানটান ভাব ও চুলকানি উপশম, পেটের ওপর চাপের কারণে এসিড রিফ্লাক্স ও কোষ্ঠকাঠিন্য প্রতিরোধ।',
    dietary_principles_en: 'Sarpi (ghee) with nourishing light foods; frequent smaller meals; avoidance of heavy bloating foods.',
    dietary_principles_bn: 'স্বল্প পরিমাণে ঘিয়ে রান্না হালকা আহার; একবারে বেশি না খেয়ে অল্প অল্প করে বারবার খাওয়া; বায়ুনাশক খাদ্য।',
    recommended_traditional_foods_en: [
      'Small frequent meals: 5 to 6 small light meals daily instead of 2-3 large feasts',
      'Rice cooked with light ghee and easily digestible moong dal',
      'Soaked prunes or sweet raisins to ensure smooth natural bowel movements',
      'Fresh soft curd with roasted cumin to counter heartburn'
    ],
    recommended_traditional_foods_bn: [
      'একবারে পেট ভরে না খেয়ে দিনে ৫-৬ বার অল্প অল্প পুষ্টিকর আহার',
      'অল্প ঘি ও নরম মুগ ডাল দিয়ে হালকা চালের ভাত',
      'প্রাকৃতিক মল ত্যাগের জন্য রাতে ভেজানো মিষ্টি কিশমিশ',
      'বুকজ্বালা উপশমে জিরা গুঁড়া মেশানো নরম মিষ্টি দই'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Thin soup of bottle gourd (lao) and sweet pumpkin with tender country chicken',
      'Soft steamed rice with Telapia/Pabda light fish stew with cumin and ginger',
      'Ripe papaya and sweet seasonal oranges (komola) for natural fiber and hydration',
      'Rice flake porridge (chira jaau) with lukewarm milk'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'লাউ ও মিষ্টি কুমড়া দিয়ে মুরগির পাতলা পুষ্টিকর সুপ',
      'আদা-জিরা দিয়ে পাবদা বা শিং মাছের হালকা ঝোল ও নরম ভাত',
      'কোষ্ঠকাঠিন্য এড়াতে পাকা পেঁপে ও মিষ্টি কমলা',
      'দুধ দিয়ে চিড়ার নরম জাউ ভাত'
    ],
    restricted_or_unsafe_items_en: [
      'Lying down immediately after eating (triggers severe acid regurgitation)',
      'Very salty pickles (achar) and dried fish (shutki) with excessive salt',
      'Constipating dry bakery biscuits and white flour items',
      'Excessive fluids during meal times that distend stomach'
    ],
    restricted_or_unsafe_items_bn: [
      'খাওয়ার পরপরই শুয়ে পড়া (তীব্র বুকজ্বালা ও এসিড রিফ্লাক্সের কারণ)',
      'অতিরিক্ত লবণযুক্ত আচার ও লবণাক্ত শুঁটকি মাছ',
      'কোষ্ঠকাঠিন্য বাড়ায় এমন শুকনো বিস্কুট ও ময়দার খাবার',
      'খাওয়ার সময় অতিরিক্ত পানি পান করে পেট ফুলিয়ে ফেলা'
    ],
    hydration_and_fluids_en: 'Fluids taken 30-45 minutes before or after meals. Warm water or fennel seed water (mouri pani) for bloating.',
    hydration_and_fluids_bn: 'খাওয়ার ৩০ মিনিট আগে বা পরে পানি পান। পেট ফাঁপা উপশমে মৌরি ভেজানো হালকা গরম পানি।'
  },
  8: {
    month: 8,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Eighth month: Ojas (vital immunity essence) remains unstable, moving rhythmically between mother and fetus; rapid brain myelination.',
    developmental_focus_bn: 'অষ্টম মাস: ওজঃ বা জীবনীশক্তি মা ও সন্তানের মধ্যে আবর্তিত হয়; স্নায়ুর মায়েলিনেশন ও ওজন বৃদ্ধি।',
    maternal_focus_en: 'Preventing maternal exhaustion, supporting ojas and immunity, preparing pelvic floor tone, ensuring regular daily elimination.',
    maternal_focus_bn: 'মায়ের মানসিক ও শারীরিক ক্লান্তি দূরীকরণ, জীবনীশক্তি রক্ষা, পেলভিক পেশির নমনীয়তা এবং কোষ্ঠ পরিষ্কার রাখা।',
    dietary_principles_en: 'Kshira-yavagu (milky rice porridge) with ghee; Asthapan/nourishing bowel regulation; dense, grounding, warm meals.',
    dietary_principles_bn: 'ক্ষীর-যবাগূ (দুধ-চালের নরম পুষ্টিকর পায়েস) ও ঘি; কোষ্ঠ পরিষ্কারক এবং উষ্ণ, বলবর্ধক খাদ্য।',
    recommended_traditional_foods_en: [
      'Milk rice porridge (Kshira-yavagu) prepared with aromatic rice and a spoon of pure ghee',
      'Warm cow milk with a teaspoon of pure desi ghee taken at bedtime',
      'Steamed seasonal vegetables with generous hydration',
      'Easily digested soft proteins (egg, soft fish, fresh paneer)'
    ],
    recommended_traditional_foods_bn: [
      'এক চামচ খাঁটি ঘি সহ সুগন্ধি চাল ও দুধের নরম ক্ষীর-যবাগূ',
      'রাতে ঘুমানোর আগে এক কাপ কুসুম গরম দুধে এক চা চামচ দেশি ঘি',
      'পর্যাপ্ত পানিসহ সেদ্ধ নরম সবজির তরকারি',
      'সহজে হজমযোগ্য প্রোটিন (সেদ্ধ ডিম, নরম মাছ, টাটকা ছানা)'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Firni/Payesh prepared with milk, chinigura rice, and cardamom with minimal sweetener',
      'Country chicken soup with carrots, green papaya, and black pepper',
      'Soft whole wheat ruti soaked in warm dal or milk',
      'Soaked dates (khejur) and raisins in moderate quantity (1-2 dates/day)'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'চিনিগুঁড়া চাল ও দুধের অল্প মিষ্টির নরম পায়েস',
      'গাজর, কাঁচা পেঁপে ও গোলমরিচ দিয়ে দেশি মুরগির স্যুপ',
      'গরম ডাল বা দুধে ভেজানো নরম লাল আটার রুটি',
      'পানিতে ভেজানো নরম খেজুর (দিনে ১-২টি) ও কিশমিশ'
    ],
    restricted_or_unsafe_items_en: [
      'Cold, dry, stale, or refrigerated unheated foods (aggravates Vata and causes constipation)',
      'Excessive strenuous activity or standing for long hours',
      'Laxatives without explicit clinician prescription',
      'Heavy red meats (beef, mutton) that require excessive digestive fire'
    ],
    restricted_or_unsafe_items_bn: [
      'ফ্রিজের ঠান্ডা, বাসি বা শুকনো খাবার (বাত দোষ ও কোষ্ঠকাঠিন্য বাড়ায়)',
      'অতিরিক্ত কায়িক পরিশ্রম বা একটানা দাঁড়িয়ে থাকা',
      'ডাক্তারের পরামর্শ ছাড়া কড়া জোলাপ বা মল পরিষ্কারক ওষুধ',
      'ভারী খাসি বা গরুর মাংস যা হজমে অতিরিক্ত চাপ ফেলে'
    ],
    hydration_and_fluids_en: 'Warm fluids throughout the day. Warm milk at bedtime for restful sleep and natural bowel softness.',
    hydration_and_fluids_bn: 'সারাদিন হালকা কুসুম গরম পানি ও রাতে ঘুমানোর আগে কুসুম গরম দুধ।'
  },
  9: {
    month: 9,
    classical_source: 'Charaka_Samhita',
    developmental_focus_en: 'Ninth month: Full fetal maturation, descent of fetal head into maternal pelvis, preparation for natural parturition.',
    developmental_focus_bn: 'নবম মাস: গর্ভস্থ শিশুর পূর্ণাঙ্গ পরিপক্বতা, পেলভিসে শিশুর আগমন এবং স্বাভাবিক প্রসবের সার্বিক প্রস্তুতি।',
    maternal_focus_en: 'Downward movement of Apana Vayu for smooth natural labor, lubricating internal tissues (Snigdha), calming maternal anxiety.',
    maternal_focus_bn: 'অপান বায়ুর নিম্নগমন স্বাভাবিক রাখা, পেলভিক পেশির তৈলাক্ততা ও নমনীয়তা বৃদ্ধি এবং মায়ের মানসিক প্রশান্তি।',
    dietary_principles_en: 'Snigdha (unctuous, lubricated with ghee), Madhura (comforting sweet), easily digestible light warm foods.',
    dietary_principles_bn: 'স্নিগ্ধ (ঘিয়ে তৈলাক্ত), মধুর রসযুক্ত, সহজে হজমযোগ্য হালকা গরম খাবার এবং নরম শস্য।',
    recommended_traditional_foods_en: [
      'Warm milk with a teaspoon of pure desi ghee every night',
      'Soft moist khichuri with ghee and easy vegetables (gourd, pumpkin)',
      'Fresh sweet fruit juice or soft ripe fruits (sweet banana, pomegranate)',
      'Easily passed soft warm meals that leave zero intestinal residue or hard stool'
    ],
    recommended_traditional_foods_bn: [
      'প্রতি রাতে এক গ্লাস কুসুম গরম দুধের সাথে এক চামচ খাঁটি দেশি ঘি',
      'লাউ ও মিষ্টি কুমড়া দিয়ে ঘি মাখানো নরম পাতলা খিচুড়ি',
      'তাজা মিষ্টি ডালিম বা নরম পাকা ফল',
      'হালকা উষ্ণ খাবার যা অন্ত্রে কোনো প্রকার শক্ত মল তৈরি করে না'
    ],
    bangladeshi_cultural_substitutes_en: [
      'Govindobhog rice with warm mung dal and one teaspoon of homemade cow ghee',
      'Magur or Shing fish light stew with raw papaya and ginger',
      'Soaked soft dates and almonds',
      'Warm barley water with pure honey (added only when water is lukewarm, never boiling)'
    ],
    bangladeshi_cultural_substitutes_bn: [
      'গোবিন্দভোগ বা আতপ চালের নরম ভাত, মুগ ডাল ও এক চামচ দেশি গরুর ঘি',
      'কাঁচা পেঁপে ও আদা দিয়ে শিং বা মাগুর মাছের পাতলা ঝোল',
      'পানিতে ভেজানো নরম খেজুর ও খোসা ছাড়ানো কাঠবাদাম',
      'হালকা কুসুম গরম বার্লি পানি'
    ],
    restricted_or_unsafe_items_en: [
      'Dry foods (muri, chanachur, dry biscuits) that dry out pelvic secretions and cause hard stool',
      'Astringent and unboiled foods that aggravate Vata and trigger spasmodic pelvic tension',
      'Heavy fried street foods',
      'Non-prescribed herbal labor-induction concoctions'
    ],
    restricted_or_unsafe_items_bn: [
      'শুকনো খাবার (শুকনো মুড়ি, চানাচুর, বিস্কুট) যা শরীর শুষ্ক করে কোষ্ঠকাঠিন্য ঘটায়',
      'কষা বা কটু স্বাদের খাবার যা বায়ুর বাধা তৈরি করে',
      'তেলে ভাজা যেকোনো রাস্তার খাবার',
      'ডাক্তারি নির্দেশ ছাড়া কোনো প্রকার কবিরাজি প্রসব বেদনাকারী ওষুধ'
    ],
    hydration_and_fluids_en: 'Regular warm water and warm milk. Adequate hydration ensures optimal amniotic fluid and maternal stamina.',
    hydration_and_fluids_bn: 'নিয়মিত কুসুম গরম পানি ও দুধ। পর্যাপ্ত পানিশূন্যতাহীনতা গর্ভের অ্যামনিওটিক ফ্লুইড ও প্রসবের শক্তি যোগায়।'
  }
};

/**
 * Calculates pregnancy month (1 to 9) from gestational age in completed weeks and days.
 */
export function calculatePregnancyMonth(weeks: number, days: number = 0): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  const totalDays = weeks * 7 + days;
  if (totalDays <= 30) return 1;
  if (totalDays <= 60) return 2;
  if (totalDays <= 90) return 3;
  if (totalDays <= 120) return 4;
  if (totalDays <= 150) return 5;
  if (totalDays <= 180) return 6;
  if (totalDays <= 210) return 7;
  if (totalDays <= 240) return 8;
  return 9;
}

/**
 * Derives trimester (1, 2, or 3) from gestational weeks.
 */
export function getTrimesterFromWeeks(weeks: number): 1 | 2 | 3 {
  if (weeks < 13) return 1;
  if (weeks < 27) return 2;
  return 3;
}
