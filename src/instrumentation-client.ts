import posthog from "posthog-js";

const featureFlagsElement =
  typeof window === "undefined"
    ? null
    : document.getElementById("posthog-feature-flags");

const featureFlags = featureFlagsElement?.textContent
  ? JSON.parse(featureFlagsElement.textContent)
  : {};

console.log(
  `Initializing Frontend PostHog client, bootstrapping with ${JSON.stringify(featureFlags)} `,
);

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ph",
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  bootstrap: {
    featureFlags,
  },
});
