const allowedOrigins = [
	"https://www.nikhilbadyal.com",
	"https://nikhilbadyal.pages.dev",
	"https://nikhilbadyal.vercel.app",
	"https://nikhilbadyal.netlify.app",
	"https://nikhilbadyal.surge.sh",
];

// --- Only you know what these mean! ---
const ERROR_CODES = {
	INVALID_JSON: "J5N-ERR9",
	MISSING_TOKEN: "TK9-MSSN",
	CAPTCHA_FAILED: "CAP-403D",
	TELEGRAM_FAIL: "TEL-519C",
	ORIGIN_NOT_ALLOWED: "ORI-003F",
	NOT_FOUND: "NF-404Q",
	INVALID_EMAIL: "EML-22X",
};

// Utility: Truncate to prevent DoS, oversized spam, or accidental abuse
function truncate(str, maxLen = 1024) {
	return typeof str === "string" ? str.slice(0, maxLen) : "";
}

// Utility: Escape Markdown for Telegram
function escapeMarkdown(text) {
	return typeof text === "string"
		? text.replace(/([_*[\]()~`>#+=|{}.!-])/g, "\\$1")
		: "";
}

// Utility: Basic email format validation (optional)
function isValidEmail(email) {
	return typeof email === "string" &&
		/^[^@]+@[^@]+\.[^@]+$/.test(email);
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const origin = request.headers.get("Origin") || "";
		const isAllowed = allowedOrigins.includes(origin);

		const corsHeaders = {
			"Access-Control-Allow-Origin": isAllowed ? origin : "",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Public /status route
		if (url.pathname === "/status") {
			return new Response("We are up", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		// Handle preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		// If origin is not allowed, forbidden forever
		if (!isAllowed) {
			return new Response(
				JSON.stringify({
					error: "Forbidden",
					code: ERROR_CODES.ORIGIN_NOT_ALLOWED
				}),
				{
					status: 403,
					headers: { ...corsHeaders, "Content-Type": "application/json" }
				}
			);
		}

		// Handle form POST
		if (request.method === "POST") {
			let data;
			try {
				data = await request.json();
			} catch (err) {
				console.error("Failed to parse JSON:", err); // Log the actual error for debugging
				return new Response(
					JSON.stringify({
						error: "Forbidden",
						code: ERROR_CODES.INVALID_JSON
					}),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					}
				);
			}

			// Defensive extraction and truncation
			const name = truncate(data.name, 128);
			const email = truncate(data.email, 256);
			const message = truncate(data.message, 2048);
			const token = data.token;

			// Optional: Email validation (remove if not needed)
			if (!isValidEmail(email)) {
				return new Response(
					JSON.stringify({
						error: "Forbidden",
						code: ERROR_CODES.INVALID_EMAIL
					}),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					}
				);
			}

			if (!token) {
				return new Response(
					JSON.stringify({
						error: "Forbidden",
						code: ERROR_CODES.MISSING_TOKEN
					}),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					}
				);
			}

			// Turnstile CAPTCHA verification
			const verificationRes = await fetch(
				"https://challenges.cloudflare.com/turnstile/v0/siteverify",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${token}`,
				}
			);

			const verificationData = await verificationRes.json();

			if (!verificationData.success) {
				console.log("Turnstile verification failed", verificationData);
				return new Response(
					JSON.stringify({
						error: "Forbidden",
						code: ERROR_CODES.CAPTCHA_FAILED
					}),
					{
						status: 403,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					}
				);
			}

			// Telegram notification (escape all fields)
			const text = `
📬 *New Contact Form Message*
*Name:* ${escapeMarkdown(name)}
*Email:* ${escapeMarkdown(email)}
*Message:*
${escapeMarkdown(message)}
			`.trim();

			const res = await fetch(
				`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chat_id: env.TELEGRAM_CHAT_ID,
						text: text,
						parse_mode: "Markdown",
						message_thread_id: env.TELEGRAM_THREAD_ID,
					}),
				}
			);

			if (res.ok) {
				return new Response("Sent", { headers: corsHeaders });
			} else {
				const errText = await res.text();
				return new Response(
					JSON.stringify({
						error: "Forbidden",
						code: ERROR_CODES.TELEGRAM_FAIL,
						telegram: errText
					}),
					{
						status: 500,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					}
				);
			}
		}

		// Fallback 404
		return new Response(
			JSON.stringify({
				error: "Not found",
				code: ERROR_CODES.NOT_FOUND
			}),
			{
				status: 404,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			}
		);
	},
};
