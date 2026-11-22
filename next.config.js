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
