# Supabase Production Setup & Deployment Guide

**Target Project:** `shuddho-clinical`  
**Database:** PostgreSQL 15+ with Extensions (`uuid-ossp`, `pgcrypto`)  
**Deployment Tooling:** Cloudflare Pages + Supabase  

---

## 1. Quick One-Click Database Initialization

To initialize all 23 R0 master entities, support tables, and Row Level Security policies:

1. Open your **Supabase Dashboard** for project `shuddho-clinical`.
2. Go to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of [`supabase/r2_complete_bundle.sql`](../../supabase/r2_complete_bundle.sql).
5. Paste it into the editor and click **Run** (or `Cmd/Ctrl + Enter`).
6. Verify output confirms:
   - `Success. No rows returned.`
   - 23 master tables created under `public`.
   - RLS enabled on all tables.
   - Initial migration versions `20261122000001_r2_master_schema` and `20261122000002_r2_rls_policies` recorded in `schema_migrations`.

---

## 2. Supabase Storage Buckets Configuration

SHUDDHO utilizes two private storage buckets for clinical file attachments and legal archives:

| Bucket Name | Access Level | Permitted File Types | Max File Size | Purpose |
|---|---|---|---|---|
| `clinical-dossiers` | **Private** | `application/pdf`, `image/png`, `image/jpeg` | 50 MB | Clinician full dossier PDF archives & raw lab attachments |
| `patient-files` | **Private** | `application/pdf`, `application/json` | 25 MB | Released patient-safe diet prescriptions |

### How to Create the Buckets in Supabase Dashboard:
1. Navigate to **Storage** -> **New Bucket**.
2. Name: `clinical-dossiers`.
3. Toggle **Public bucket** to **OFF** (Keep Private).
4. Repeat for `patient-files` (Keep Private).

---

## 3. Environment Variables Configuration

In your **Cloudflare Pages / Workers Dashboard** (or `.env.local` for local development):

```bash
# Cloudflare Deployment Identifier (Supplied automatically by Cloudflare Pages)
CF_PAGES=1

# Supabase Project Connection Details
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
```

> [!CAUTION]
> **Zero Service Role Key Exposure:** NEVER configure `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare build variables or frontend source code. The frontend operates strictly within the security boundaries of authenticated user tokens via PostgreSQL RLS.

---

## 4. Supabase Authentication Settings

1. In Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to:
   `https://shuddho-nutrition.probalofficial007.workers.dev`
3. Add the following to **Redirect URLs**:
   - `https://shuddho-nutrition.probalofficial007.workers.dev/*`
   - `https://probalsarpv-byte.github.io/Diet-Chart-Software/*`
   - `http://localhost:3000/*`
4. Under **Authentication** -> **Providers** -> **Email**:
   - Enable Email Provider.
   - Enable Password authentication.
