import { fileURLToPath } from "url";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: process.env.NODE_ENV === "production",
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

// Wrap with Sentry. The runtime SDK (instrumentation files) is always active;
// source-map upload only runs when SENTRY_AUTH_TOKEN is set (CI/prod), so local
// and Turbopack builds never fail for lack of an upload token.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Quiet during normal local builds; verbose only in CI.
  silent: !process.env.CI,
  // Only produce + upload source maps when we have a token to upload them with.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
