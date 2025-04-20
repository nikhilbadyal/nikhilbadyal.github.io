const allowedOrigins = [
	"https://www.nikhilbadyal.com",
	"https://nikhilbadyal.pages.dev",
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
				return new Response("Invalid JSON", {
					status: 400,
					headers: corsHeaders,
				});
			}

			const { fullname, email, message } = data;

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
