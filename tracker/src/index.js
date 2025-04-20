export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Check if the request is for the /status endpoint
		if (url.pathname === '/status') {
			return new Response('We are up', {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		// Handle CORS for OPTIONS request
		if (request.method === 'OPTIONS') {
			const origin = request.headers.get('Origin');
			if (origin === 'https://www.nikhilbadyal.com' || origin === 'https://nikhilbadyal.pages.dev') {
				return new Response(null, {
					status: 204,
					headers: {
						'Access-Control-Allow-Origin': origin, // Allow only valid origins
						'Access-Control-Allow-Methods': 'POST, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					},
				});
			}
			return new Response('Forbidden', { status: 403 });
		}

		// Handle POST request
		if (request.method !== 'POST') {
			return new Response('Not allowed', { status: 405 });
		}

		// Check if the request's origin is allowed
		const origin = request.headers.get('Origin');
		if (origin !== 'https://www.nikhilbadyal.com' && origin !== 'https://nikhilbadyal.pages.dev') {
			return new Response('Forbidden', { status: 403 });
		}

		const clientIP = request.headers.get('cf-connecting-ip');
		const country = request.cf?.country || 'Unknown';
		const ua = request.headers.get('user-agent');
		const now = Date.now();

		let data;
		try {
			data = await request.json();
		} catch {
			return new Response('Invalid JSON', { status: 400 });
		}

		const entry = {
			timestamp: new Date(now).toISOString(),
			ip: clientIP,
			country,
			ua,
			...data,
		};

		// Store tracking data in KV
		await env.TRACKING_KV.put(`visit:${now}`, JSON.stringify(entry));

		// Respond with success
		return new Response('Tracked', {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': origin, // Return dynamic origin header
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	},
};
