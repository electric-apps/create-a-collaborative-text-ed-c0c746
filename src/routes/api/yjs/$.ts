import { createFileRoute } from "@tanstack/react-router"

const HOP_BY_HOP = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"host",
	"content-encoding",
	"content-length",
])

async function proxyYjs({ request, params }: { request: Request; params: { _splat: string } }) {
	const yjsServiceId = process.env.ELECTRIC_YJS_SERVICE_ID
	const yjsSecret = process.env.ELECTRIC_YJS_SECRET
	const electricUrl = process.env.ELECTRIC_URL || "http://localhost:4438"

	if (!yjsServiceId || !yjsSecret) {
		return new Response("Yjs service not configured", { status: 500 })
	}

	const subPath = params._splat || ""
	const upstream = new URL(`${electricUrl}/v1/yjs/${yjsServiceId}/${subPath}`)

	// Preserve query string
	const requestUrl = new URL(request.url)
	for (const [k, v] of requestUrl.searchParams) {
		upstream.searchParams.set(k, v)
	}

	const headers = new Headers(request.headers)
	headers.set("Authorization", `Bearer ${yjsSecret}`)
	headers.delete("host")

	const init: RequestInit = {
		method: request.method,
		headers,
	}

	if (request.method !== "GET" && request.method !== "HEAD") {
		init.body = request.body
		// @ts-expect-error duplex needed for streaming body
		init.duplex = "half"
	}

	const res = await fetch(upstream.toString(), init)

	const forwardedHeaders = new Headers()
	for (const [key, value] of res.headers) {
		if (HOP_BY_HOP.has(key.toLowerCase())) continue
		forwardedHeaders.set(key, value)
	}
	if (!forwardedHeaders.has("cache-control")) {
		forwardedHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: forwardedHeaders,
	})
}

export const Route = createFileRoute("/api/yjs/$")({
	// @ts-expect-error — server.handlers types lag behind runtime support
	server: {
		handlers: {
			GET: proxyYjs,
			POST: proxyYjs,
			PUT: proxyYjs,
			PATCH: proxyYjs,
			DELETE: proxyYjs,
			OPTIONS: proxyYjs,
		},
	},
})
