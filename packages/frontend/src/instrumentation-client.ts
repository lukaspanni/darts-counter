import posthog from "posthog-js";

const featureFlagsElement =
  typeof window === "undefined"
    ? null
    : document.getElementById("posthog-feature-flags");

const parseFeatureFlags = (
  rawValue: string | null,
): Record<string, string | boolean> => {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      ([, value]) => typeof value === "string" || typeof value === "boolean",
    );

    return Object.fromEntries(entries) as Record<string, string | boolean>;
  } catch {
    return {};
  }
};

const featureFlags = parseFeatureFlags(
  featureFlagsElement?.textContent ?? null,
);

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  try {
    console.debug(
      `Initializing Frontend PostHog client, bootstrapping with ${JSON.stringify(featureFlags)} `,
    );

    posthog.init(posthogKey, {
      api_host: "/ph",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2025-11-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
      bootstrap: {
        featureFlags,
      },
    });
  } catch (error) {
    console.warn("PostHog initialization failed:", error);
  }
} else {
  console.debug("PostHog key not configured, skipping initialization");
}
