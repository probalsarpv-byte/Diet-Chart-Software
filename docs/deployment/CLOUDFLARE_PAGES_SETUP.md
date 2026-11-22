# SHUDDHO CLINICAL FUNCTIONAL & PRECISION NUTRITION PLATFORM
## Cloudflare Pages Dual-Deployment Architecture & Configuration Guide

**Document Code:** SHUDDHO-OPS-CF-001  
**Target Environments:**  
1. **GitHub Pages (Subpath):** `https://probalsarpv-byte.github.io/Diet-Chart-Software/`  
2. **Cloudflare Pages (Root Domain):** `https://<project>.pages.dev/` or Custom Domain (`https://shuddho.org`)  
**Build Command:** `npm run build`  
**Output Directory:** `out`  
**Production Branch:** `main`  

---

## 1. Dual-Deployment Architecture Overview

SHUDDHO supports continuous, zero-drift dual deployment to both **GitHub Pages** and **Cloudflare Pages** from the exact same `main` branch codebase without manual reconfiguration or code changes.

```
                     ┌──────────────────────────────────────────────┐
                     │           Repository: main branch            │
                     └──────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
         [GitHub Actions CI/Deploy]                      [Cloudflare Pages Build]
         • Default runner environment                    • CF_PAGES=1 automatically injected
         • CF_PAGES is undefined                         • CF_PAGES detected by next.config.js
         • basePath = '/Diet-Chart-Software'             • basePath = '' (domain root)
         • assetPrefix = '/Diet-Chart-Software/'         • assetPrefix = '' (domain root)
                    │                                               │
                    ▼                                               ▼
     https://probalsarpv-byte.github.io/             https://<project>.pages.dev/
            Diet-Chart-Software/                            (or custom apex domain)
```

### 1.1 Dynamic Configuration in `next.config.js`
The Next.js configuration detects the `CF_PAGES` environment variable injected by Cloudflare's build runners:

```javascript
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// Cloudflare Pages automatically injects CF_PAGES=1 during build.
// When CF_PAGES is present, deploy to domain root (/).
// Otherwise (default / GitHub Actions), deploy to GitHub Pages subpath (/Diet-Chart-Software).
const isCloudflare = Boolean(
  process.env.CF_PAGES &&
  process.env.CF_PAGES !== '0' &&
  process.env.CF_PAGES !== 'false'
);

const basePath = isCloudflare ? '' : (isProd ? '/Diet-Chart-Software' : '');
const assetPrefix = isCloudflare ? '' : (isProd ? '/Diet-Chart-Software/' : '');

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: basePath || undefined,
  assetPrefix: assetPrefix || undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_DEPLOY_TARGET: isCloudflare ? 'cloudflare' : (isProd ? 'github-pages' : 'development'),
  },
};

module.exports = nextConfig;
```

---

## 2. Cloudflare Pages Project Setup Instructions

To connect SHUDDHO to Cloudflare Pages:

1. **Log in to Cloudflare Dashboard:** Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. **Select Repository:** Choose `probalsarpv-byte/Diet-Chart-Software`.
3. **Configure Build Settings:**
   - **Project Name:** `shuddho` (or your preferred project name, producing `https://shuddho.pages.dev`).
   - **Production Branch:** `main`.
   - **Framework Preset:** `None` (or `Next.js (Static HTML Export)`).
   - **Build Command:** `npm run build`.
   - **Build Output Directory:** `out`.
   - **Root Directory:** `/` (leave empty for repo root).
4. **Environment Variables:**
   Under **Settings** > **Environment variables** in Cloudflare Pages:
   - `NODE_VERSION`: `20` (or `20.18.0`) — Ensures Node.js 20 LTS is used for building.
   *(Note: `CF_PAGES=1` is automatically injected by Cloudflare Pages runtime).*
5. **Click Save and Deploy:** Cloudflare will execute `npm run build`, export static HTML to `out/`, and deploy globally on Cloudflare's CDN edge.

---

## 3. Caching & Security Headers (`public/_headers`)

Cloudflare Pages automatically reads the `_headers` file in `out/` (copied from `public/_headers` during export):

```
# Cloudflare Pages HTTP Response Headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin

# Long-term immutable caching for static Next.js hashed assets
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

- **Security Headers:** Protects the clinical atelier from clickjacking, MIME-sniffing, and cross-origin referrer leaks.
- **Asset Caching:** Fingerprinted Next.js static chunks in `_next/static/` receive 1-year immutable caching on Cloudflare's global edge network.

---

## 4. Future Supabase (Phase R2) Environment Variables & Auth Configuration

When Phase R2 integrates Supabase for centralized PostgreSQL persistence and clinician authentication, both hosting targets must be accommodated:

### 4.1 Cloudflare Pages Environment Variables (Production & Preview)
Add the following in Cloudflare Pages Dashboard (**Settings** > **Environment variables**):

| Variable Name | Environment | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | e.g., `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | Supabase public anonymous API key (JWT signed) |

### 4.2 Supabase Dashboard URL Configuration
In the **Supabase Dashboard** > **Authentication** > **URL Configuration**:

1. **Site URL:**
   - Set to your primary Cloudflare Pages domain:  
     `https://shuddho.pages.dev` (or custom domain `https://shuddho.org`)
2. **Redirect URLs (Allow List):**
   Add all active deployment domains to the allow list:
   ```
   https://shuddho.pages.dev/**
   https://shuddho.pages.dev/auth/callback
   https://probalsarpv-byte.github.io/Diet-Chart-Software/**
   https://probalsarpv-byte.github.io/Diet-Chart-Software/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

### 4.3 Client-Side Dynamic Auth Callback Construction
In client-side authentication calls, derive the redirect URL dynamically using `NEXT_PUBLIC_BASE_PATH`:

```typescript
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const redirectTo = `${origin}${basePath}/auth/callback`;

await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo,
  },
});
```
This guarantees authentication callbacks route seamlessly whether the user is on GitHub Pages (`/Diet-Chart-Software/auth/callback`) or Cloudflare Pages (`/auth/callback`).

---

## 5. Local Verification Commands

To verify both build targets locally:

```bash
# 1. Verify GitHub Pages target (subpath /Diet-Chart-Software):
npm run build
# Inspect out/index.html — asset links start with /Diet-Chart-Software/_next/static/

# 2. Verify Cloudflare Pages target (domain root /):
# On Windows cmd:
set CF_PAGES=1 && npm run build
# On Linux/macOS bash:
CF_PAGES=1 npm run build
# Inspect out/index.html — asset links start with /_next/static/
```

---

## 6. Live Status Notice

> [!NOTE]
> Cloudflare Pages configuration is fully implemented in the codebase. As per clinical release protocol, Cloudflare is documented as **ready for connection**. The live Cloudflare Pages URL will be confirmed once a Cloudflare project has been linked to this repository by the project owner. GitHub Pages deployment at `https://probalsarpv-byte.github.io/Diet-Chart-Software/` remains live and verified.
