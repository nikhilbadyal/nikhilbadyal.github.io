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
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "https://www.nikhilbadyal.com",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return new Response("Not allowed", { status: 405 });
    }

    const clientIP = request.headers.get("cf-connecting-ip");
    const country = request.cf?.country || "Unknown";
    const ua = request.headers.get("user-agent");
    const now = Date.now();

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const entry = {
      timestamp: new Date(now).toISOString(),
      ip: clientIP,
      country,
      ua,
      ...data,
    };

    await env.TRACKING_KV.put(`visit:${now}`, JSON.stringify(entry));

    return new Response("Tracked", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://www.nikhilbadyal.com",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
};
