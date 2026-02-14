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

console.debug(
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
