export default {
  async fetch(request, env, ctx) {
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

    // Save the entry in Workers KV
    await env.TRACKING_KV.put(`visit:${now}`, JSON.stringify(entry));

    // Retrieve and verify the stored entry
    const storedEntry = await env.TRACKING_KV.get(`visit:${now}`);
    if (storedEntry) {
      console.log("Successfully saved entry:", storedEntry);
    } else {
      console.error("Failed to retrieve entry.");
    }

    return new Response(`Tracked ${now}`, { status: 200 });
  }
};
