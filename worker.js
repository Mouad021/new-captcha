export default {
  async fetch(request, env) {
    // ====== CORS HEADERS ======
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // ====== Preflight ======
    if (request.method === "OPTIONS") {
      return new Response("OK", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ====== Only POST allowed ======
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const images = payload?.images || [];
    const labels = payload?.labels || [];

    if (!Array.isArray(images) || !Array.isArray(labels)) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Invalid images/labels"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ===== Relay إلى السرفر المحلي =====
    try {
      const r = await fetch(env.SAMURAI_LOCAL_SERVER + "/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, labels }),
      });

      const data = await r.json();

      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Worker → Local server failed",
        detail: String(e),
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }
};
