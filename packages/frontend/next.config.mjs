/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  // Enable "use cache" directive support
  cacheComponents: true,
  // Configure cache lifetime for "use cache" directive
  cacheLife: {
    // Default cache profile (applied to all "use cache" directives)
    default: {
      stale: 60, // Mark cache as stale after 60 seconds
      revalidate: 60, // Trigger revalidation after 60 seconds
      expire: 3600, // Hard expiration after 1 hour
    },
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  async rewrites() {
    return [
      {
        source: "/ph/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ph/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
