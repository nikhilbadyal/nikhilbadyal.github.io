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
					},
				});
			}
			return new Response("Forbidden", { status: 403 });
		}

		// Handle POST request
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: {
					Allow: "POST, OPTIONS",
				},
			});
		}

		// --- Origin Check for POST ---
		if (!origin || !allowedOrigins.includes(origin)) {
			return new Response("Forbidden", { status: 403 });
		}

		const clientIP = request.headers.get("cf-connecting-ip");
		const country = request.cf?.country || "Unknown";
		const ua = request.headers.get("user-agent");
		const now = Date.now();

		// Rate Limiting: Prevent excessive tracking from a single IP
		const rateLimitKey = `rateLimit:${clientIP}`;
		const rateLimitData = await env.RATE_LIMIT_KV.get(rateLimitKey, {
			type: "json",
		});
		const rateLimitWindow = 60 * 1000; // 1-minute window
		const maxRequestsPerMinute = 100; // Limit requests to 10 per minute

		if (rateLimitData && rateLimitData.count >= maxRequestsPerMinute) {
			return new Response("Too many requests", { status: 429 });
		}

		// Update rate limit counter
		await env.RATE_LIMIT_KV.put(
			rateLimitKey,
			JSON.stringify({
				count: (rateLimitData?.count || 0) + 1,
				timestamp: now,
			}),
			{
				expirationTtl: rateLimitWindow / 1000,
			}
		);

		let data;
		try {
			data = await request.json();
			// --- Data Validation (Example) ---
			if (!data || typeof data !== "object") {
				return new Response("Invalid JSON data format", { status: 400 });
			}
			// You could add more specific checks for expected fields here
		} catch {
			return new Response("Invalid JSON", { status: 400 });
		}

		// Sanitize and validate incoming data (basic example)
		if (typeof data.sessionId !== "string" || data.sessionId.length > 255) {
			return new Response("Invalid data", { status: 400 });
		}

		const entry = {
			timestamp: new Date(now).toISOString(),
			ip: clientIP,
			country,
			ua,
			...data,
		};

		// --- Store Tracking Data in KV ---
		try {
			await env.TRACKING_KV.put(`visit:${now}`, JSON.stringify(entry), {
				expirationTtl: 60 * 60 * 24 * 30, // 30 days in seconds
			});
		} catch (error) {
			console.error("Error storing tracking data:", error);
			return new Response("Error storing data", { status: 500 });
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
			},
		});
	},
};
