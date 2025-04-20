export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Check if the request is for the /status endpoint
		if (url.pathname === "/status") {
			return new Response("We are up", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type"
				}
			});
		}
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "https://www.nikhilbadyal.com",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		if (request.method === "POST") {
			let data;
			try {
				data = await request.json();
			} catch (err) {
				return new Response("Invalid JSON", { status: 400 });
			}

			const { fullname, email, message } = data;

			const text = `
					📬 *New Contact Form Message*
					*Name:* ${fullname}
					*Email:* ${email}
					*Message:*
					${message}
						  `.trim();

			const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: env.TELEGRAM_CHAT_ID,
					text: text,
					parse_mode: "Markdown",
				}),
			});

			if (res.ok) {
				return new Response("Sent", {
					headers: { "Access-Control-Allow-Origin": "https://www.nikhilbadyal.com", },
				});
			} else {
				const err = await res.text();
				return new Response(`Failed to send message: ` + err, {
					status: 500,
					headers: { "Access-Control-Allow-Origin": "https://www.nikhilbadyal.com", },
				});
			}
		}

		return new Response("Not found", { status: 404 });
	},
};
