/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Share one mongoose instance across API-route bundles in dev (avoids
  // model-recompile errors on HMR).
  serverExternalPackages: ["mongoose", "mongodb"],
};

module.exports = nextConfig;
