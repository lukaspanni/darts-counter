import posthog from "posthog-js";

console.log(`Initializing Frontend PostHog client, bootstapping with ...`);

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ph",
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  bootstrap: {
    featureFlags: {
      // TODO
    },
  },
});
