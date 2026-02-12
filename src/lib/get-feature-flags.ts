"use server";
import PostHogClient from "./posthog-server";

export async function getFeatureFlags(distinctId: string = "") {
  const posthog = PostHogClient();
  if (!posthog) return {};
  const flags = await posthog.getAllFlags(distinctId);
  await posthog.shutdown();
  return flags;
}

export async function getFeatureFlag(flagKey: string, distinctId: string = "") {
  const posthog = PostHogClient();
  if (!posthog) return false;
  const flagValue = await posthog.getFeatureFlag(flagKey, distinctId);
  await posthog.shutdown();
  return flagValue;
}
