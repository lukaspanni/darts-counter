import { NextResponse } from "next/server";

const INGEST_HOST =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://us.i.posthog.com";
const UI_HOST = process.env.POSTHOG_UI_HOST || INGEST_HOST;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,origin,user-agent",
} as const;

function resolvePath(rawPath: string): string {
  if (rawPath === "e") {
    return "i/v0/e/";
  }
  if (rawPath === "s") {
    return "i/v0/s/";
  }
  if (rawPath === "batch") {
    return "batch/";
  }
  if (rawPath === "flags") {
    return "decide/";
  }
  return rawPath;
}

function buildTargetUrl(request: Request, segments: string[]): URL {
  const incomingUrl = new URL(request.url);
  const trimmedSegments = segments.map((segment) =>
    decodeURIComponent(segment).replace(/^\//, ""),
  );
  const rawPath = trimmedSegments.join("/");
  const normalizedPath = resolvePath(rawPath);
  const host = normalizedPath.startsWith("array/") ? UI_HOST : INGEST_HOST;
  const targetUrl = new URL(`/${normalizedPath}`, host);
  targetUrl.search = incomingUrl.search;
  return targetUrl;
}

export async function OPTIONS(): Promise<Response> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(request, path ?? []);
  const body = await request.arrayBuffer();
  const contentEncoding = request.headers.get("content-encoding");
  const upstreamResponse = await fetch(targetUrl.toString(), {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") || "application/json",
      ...(contentEncoding ? { "content-encoding": contentEncoding } : {}),
      "user-agent": request.headers.get("user-agent") || "",
    },
    body,
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      "content-type":
        upstreamResponse.headers.get("content-type") || "application/json",
      ...corsHeaders,
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(request, path ?? []);
  const upstreamResponse = await fetch(targetUrl.toString(), {
    method: "GET",
    headers: {
      "user-agent": request.headers.get("user-agent") || "",
    },
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      "content-type":
        upstreamResponse.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
      ...corsHeaders,
    },
  });
}
