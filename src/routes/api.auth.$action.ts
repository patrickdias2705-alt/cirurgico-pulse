import { createFileRoute } from "@tanstack/react-router";

import { serverEnv } from "@/server/env";

const allowed = new Set(["profiles", "login", "me", "logout"]);

async function proxy(request: Request, action: string): Promise<Response> {
  if (!allowed.has(action)) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const env = serverEnv();
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const csrf = request.headers.get("X-WF-CSRF-Token");
  if (cookie) headers.set("cookie", cookie);
  if (csrf) headers.set("X-WF-CSRF-Token", csrf);
  if (request.method !== "GET") {
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");
    headers.set("origin", env.wfAuthBaseUrl);
  }
  const upstream = await fetch(`${env.wfAuthBaseUrl}/api/auth/${action}`, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });
  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  const setCookie = upstream.headers.get("set-cookie");
  if (contentType) responseHeaders.set("content-type", contentType);
  if (setCookie) responseHeaders.set("set-cookie", setCookie);
  return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const Route = createFileRoute("/api/auth/$action")({
  server: {
    handlers: {
      GET: ({ request, params }) => proxy(request, params.action),
      POST: ({ request, params }) => proxy(request, params.action),
    },
  },
});
