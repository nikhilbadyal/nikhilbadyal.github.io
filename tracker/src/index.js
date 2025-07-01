// --- CRYPTIC ERROR CODES (only you know what these mean) ---
const ERROR_CODES = {
	ORIGIN_MISSING: "XJ4Q8A12",
	ORIGIN_DENIED: "FOB-002",
	METHOD_NOT_ALLOWED: "M7DL-403",
	RATE_LIMITED: "RAT-LMT9",
	INVALID_JSON: "J5N-ERR9",
	INVALID_DATA: "DTX-22B3",
	STORAGE_ERROR: "STR-505E",
	IP_MISSING: "IP-403"
};

// ---- DATA SANITIZATION: Only allow whitelisted fields (deep), truncate strings ----
function truncate(str, maxLen = 512) {
	return typeof str === "string" ? str.slice(0, maxLen) : str;
}

function sanitizeData(data) {
	const clean = {};
	if (typeof data !== "object" || !data) return clean;

	// 'connection' object
	if ("connection" in data && typeof data.connection === "object" && data.connection) {
		clean.connection = {
			downlink: typeof data.connection.downlink === "number" ? data.connection.downlink : null,
			effectiveType: truncate(data.connection.effectiveType, 32),
			rtt: typeof data.connection.rtt === "number" ? data.connection.rtt : null
		};
	}

	// 'screen' object
	if ("screen" in data && typeof data.screen === "object" && data.screen) {
		clean.screen = {
			height: typeof data.screen.height === "number" ? data.screen.height : null,
			orientation: truncate(data.screen.orientation, 32),
			pixelRatio: typeof data.screen.pixelRatio === "number" ? data.screen.pixelRatio : null,
			width: typeof data.screen.width === "number" ? data.screen.width : null
		};
	}

	// Allowed flat keys
	for (const key of [
		"cpuCores", "deviceMemory", "doNotTrack", "hash", "isBot", "language", "pathname", "referrer", "search",
		"sessionId", "timeZone", "timestamp", "title", "url", "userAgent", "visibility"
	]) {
		if (key in data) {
			let value = data[key];
			if (typeof value === "string") value = truncate(value, 512);
			clean[key] = value;
		}
	}

	return clean;
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Check if the request is for the /status endpoint
		if (url.pathname === "/status") {
			return new Response("We are up", {
				status: 200,
				headers: {
					"Content-Type": "text/plain",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
					"Strict-Transport-Security": "max-age=31536000; includeSubDomains", // Enable HSTS
				},
			});
		}

		const allowedOrigins = [
			"https://www.nikhilbadyal.com",
			"https://nikhilbadyal.pages.dev",
			"https://nikhilbadyal.vercel.app",
			"https://nikhilbadyal.netlify.app",
			"https://nikhilbadyal.surge.sh",
		];
		const origin = request.headers.get("Origin");

		// --- CORS Preflight Request ---
		if (request.method === "OPTIONS") {
			if (origin && allowedOrigins.includes(origin)) {
				return new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": origin, // Allow only valid origins
						"Access-Control-Allow-Methods": "POST, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type",
						"Access-Control-Allow-Credentials": "true",
						"X-Content-Type-Options": "nosniff", // Prevent MIME type sniffing
						"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
					},
				});
			}
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.ORIGIN_DENIED }),
				{ status: 403, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}

		// --- Only allow POST ---
		if (request.method !== "POST") {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.METHOD_NOT_ALLOWED }),
				{
					status: 405,
					headers: {
						Allow: "POST, OPTIONS",
						"Content-Type": "application/json",
						"Strict-Transport-Security": "max-age=31536000; includeSubDomains"
					},
				}
			);
		}

		// --- Origin Check for POST ---
		if (!origin) {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.ORIGIN_MISSING }),
				{ status: 403, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}
		if (!allowedOrigins.includes(origin)) {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.ORIGIN_DENIED }),
				{ status: 403, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}

		const clientIP = request.headers.get("cf-connecting-ip");
		if (!clientIP) {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.IP_MISSING }),
				{ status: 403, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}
		const country = request.cf?.country || "Unknown";
		const ua = request.headers.get("user-agent");
		const now = Date.now();

		// Rate Limiting: Prevent excessive tracking from a single IP
		const rateLimitKey = `rateLimit:${clientIP}`;
		const rateLimitData = await env.RATE_LIMIT_KV.get(rateLimitKey, { type: "json" });
		const rateLimitWindow = 60 * 1000; // 1 minute
		const maxRequestsPerMinute = 100;  // Set your limit

		if (rateLimitData && rateLimitData.count >= maxRequestsPerMinute) {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.RATE_LIMITED }),
				{ status: 429, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}

		// Update rate limit counter
		await env.RATE_LIMIT_KV.put(
			rateLimitKey,
			JSON.stringify({
				count: (rateLimitData?.count || 0) + 1,
				timestamp: now,
			}),
			{ expirationTtl: rateLimitWindow / 1000 }
		);

		// --- Parse JSON ---
		let data;
		try {
			data = await request.json();
			if (!data || typeof data !== "object") {
				return new Response(
					JSON.stringify({ error: "Forbidden", code: ERROR_CODES.INVALID_JSON }),
					{ status: 400, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
				);
			}
		} catch {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.INVALID_JSON }),
				{ status: 400, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}

		// --- Data Validation ---
		if (typeof data.sessionId !== "string" || data.sessionId.length > 255) {
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.INVALID_DATA }),
				{ status: 400, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}

		// --- SANITIZE THE DATA ---
		const sanitizedData = sanitizeData(data);

		// --- Compose Entry (never spread raw ...data!) ---
		const entry = {
			...sanitizedData,
			timestamp: new Date(now).toISOString(), // Use server timestamp
			ip: clientIP,
			country,
			ua,
		};

		// --- Unique KV Key (avoid collisions) ---
		let uniqueId;
		try {
			uniqueId = crypto.randomUUID();
		} catch {
			// Polyfill if not supported
			uniqueId = Math.random().toString(36).slice(2) + Date.now();
		}
		const visitKey = `visit:${now}:${uniqueId}`;

		// --- Store Tracking Data in KV ---
		try {
			const entryStr = JSON.stringify(entry);
			if (entryStr.length > 24 * 1024 * 1024) { // ~24MiB
				return new Response(
					JSON.stringify({ error: "Forbidden", code: ERROR_CODES.INVALID_DATA }),
					{ status: 400, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
				);
			}

			await env.TRACKING_KV.put(
				visitKey,
				entryStr,
				{ expirationTtl: 60 * 60 * 24 * 30 }
			);
		} catch (error) {
			console.error("Error storing tracking data:", error);
			return new Response(
				JSON.stringify({ error: "Forbidden", code: ERROR_CODES.STORAGE_ERROR }),
				{ status: 500, headers: { "Content-Type": "application/json", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } }
			);
		}

		// Respond with success
		return new Response("Tracked", {
			status: 200,
			headers: {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": origin, // Return dynamic origin header
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Credentials": "true",
				"X-Content-Type-Options": "nosniff", // Prevent MIME type sniffing
				"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
			},
		});
	},
};
