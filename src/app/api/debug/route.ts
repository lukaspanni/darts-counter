import { getFeatureFlag } from "@/lib/get-feature-flags";

export async function GET() {
  const debug = await getFeatureFlag("enableDebugLogs");
  return Response.json({ debug });
}
