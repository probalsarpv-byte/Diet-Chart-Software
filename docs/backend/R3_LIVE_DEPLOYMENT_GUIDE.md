# SHUDDHO Clinical Nutrition Platform
## R3 Live Deployment & Production Operations Guide

**Platform Version:** R2 + R3 Unified Release  
**Primary Host:** Cloudflare Workers (Root Domain `/`)  
**Secondary Host:** GitHub Pages (`/Diet-Chart-Software/`)  
**Database:** Supabase PostgreSQL (`shuddho-clinical`)

---

### 1. Dual Deployment Architecture

SHUDDHO is configured for zero-code drift dual deployment:

```
                  ┌──────────────────────┐
                  │    GitHub main       │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Cloudflare Workers ]            [ GitHub Actions ]
    - Base Path: /                    - Base Path: /Diet-Chart-Software/
    - Env: CF_PAGES=1                 - Automated CI & deploy pages
    - Build: npm run build            - Build: npm run build
    - Output: out                     - Output: out
```

Next.js automatically switches between root `/` and `/Diet-Chart-Software/` basePath based on the build-time environment variable `CF_PAGES`.

---

### 2. Environment Variables

Configure the following variables in the Cloudflare Pages / Workers settings:

| Variable Name | Required | Example / Format |
| :--- | :--- | :--- |
| `CF_PAGES` | YES | `1` |
| `NEXT_PUBLIC_SUPABASE_URL` | YES | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | YES | `sbp_...` or anon key |

---

### 3. Database Migration Steps (Supabase SQL Editor)

For live database synchronization in the Supabase Dashboard:

1. Open **Supabase SQL Editor**.
2. Open `supabase/migrations/20261123000001_r3_schema_and_security.sql`.
3. Click **Run** to execute the idempotent migration:
   - Sets up `SHUDDHO_STANDARD_INTAKE_V1` questionnaire template.
   - Synchronizes column naming conventions (`invitation_token`, `responses_json`).
   - Installs atomic plan approval stored procedure `public.approve_nutrition_plan_atomic`.
   - Installs public intake security-definer RPCs `verify_public_intake_token` and `submit_public_intake_assessment`.

---

### 4. Optional Supabase Edge Function Deployment

An Edge Function implementation is available in `supabase/functions/public-intake/index.ts`. To deploy:
```bash
supabase functions deploy public-intake --no-verify-jwt
```
The application defaults to direct PostgREST RPC (`this.client.rpc`), which executes with zero additional operational dependencies.
