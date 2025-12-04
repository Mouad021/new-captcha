export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Samurai Worker Online", {
        status: 200
      });
    }

    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Invalid JSON"
      }), { status: 400 });
    }

    // تأكد من target والصور
    if (!body.target || !Array.isArray(body.images)) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Missing target or images"
      }), { status: 400 });
    }

    // رابط السرفر المحلي عبر Tunnel
    const LOCAL_SERVER = env.SAMURAI_LOCAL_SERVER; 
    // مثال:
    // https://abc123.ngrok-free.app/solve
    // أو
    // https://your-tunnel-url.trycloudflare.com/solve

    try {
      const res = await fetch(LOCAL_SERVER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({
        ok: false,
        error: "Invalid JSON returned from python"
      }));

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });

    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Worker → Local server failed",
        details: err.toString()
      }), { status: 500 });
    }
  }
};
