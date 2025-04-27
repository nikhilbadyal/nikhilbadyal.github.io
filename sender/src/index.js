const allowedOrigins = [
	"https://www.nikhilbadyal.com",
	"https://nikhilbadyal.pages.dev",
	"https://nikhilbadyal.vercel.app",
	"https://nikhilbadyal.netlify.app",
	"https://nikhilbadyal.surge.sh",
];

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

		// Handle form POST
		if (request.method === "POST") {
			let data;
			try {
				data = await request.json();
			} catch (err) {
				console.error("Failed to parse JSON:", err); // Log the actual error for debugging
				return new Response("Invalid JSON", {
					status: 400,
					headers: corsHeaders,
				});
			}

			const { fullname, email, message, token } = data;

			if (!token) {
				return new Response("Missing Turnstile token", {
					status: 400,
					headers: corsHeaders,
				});
			}

			const verificationRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${token}`,
			});

			const verificationData = await verificationRes.json();

			if (!verificationData.success) {
				console.log("Turnstile verification failed", verificationData);
				return new Response("CAPTCHA failed", {
					status: 403,
					headers: corsHeaders,
				});
			}


			const text = `
					📬 *New Contact Form Message*
					*Name:* ${fullname}
					*Email:* ${email}
					*Message:*
					${message}
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
				return new Response(`Failed to send message: ${errText}`, {
					status: 500,
					headers: corsHeaders,
				});
			}
		}

		return new Response("Not found", {
			status: 404,
			headers: corsHeaders,
		});
	},
};
