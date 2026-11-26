# SHUDDHO Phase R8 — Deferred Backlog & Future Enhancements (Out of R8 Scope)

The following items are intentionally deferred beyond Phase R8 engineering closure and belong to R9+ or future clinical-content expansions:

1. **R9 Cost / BDT Market Optimization & Family Kitchen Aggregation:**
   - BDT market price optimization, seasonal price tables, and multi-member Family Kitchen / grocery shopping list aggregation belong strictly to **Phase R9**.
2. **R9 What-If Simulator:**
   - Interactive longitudinal what-if scenario modeling belongs to **Phase R9**.
3. **Expanded Quantitative Phytochemical Assays:**
   - Adding quantitative mg/100g flavonoid, polyphenol, or glucosinolate measurements requires validated Bangladeshi laboratory assays (currently preserved honestly as `documented_qualitative` with `quantity: null`).
4. **Production Cloud Recipe Persistence (Supabase DDL):**
   - Local clinician-editable recipe drafts, versioning, and patient/visit isolation are implemented in R8 (`shuddho_r8_recipes_<patientId>_<visitId>`); production Supabase `nutrition_recipes` DDL remains deferred until post-R15 database deployment.
5. **External Clinical Authorization:**
   - Independent clinical nutritionist & medical safety sign-off of Bangladesh-specific culinary retention guidance and bioactive claims remains separate from R8 engineering closure.
