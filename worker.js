// worker.js — Samurai Cloud Trainer Proxy

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // فقط POST على /collect هي اللي غادي نتعامل معها
    if (request.method !== "POST" || url.pathname !== "/collect") {
      return new Response("Samurai Worker Online", { status: 200 });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON from client" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // هنا كنسمح بالـ payload ديال التدريب:
    // images + labels (target اختياري)
    if (!Array.isArray(body.images) || !Array.isArray(body.labels)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing images or labels array"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ⬅️ السرفر ديال بايثون (Render / VPS / ..) كيستقبل نفس JSON
    const PY_BACKEND = env.SAMURAI_LOCAL_SERVER;

    try {
      const backendRes = await fetch(PY_BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const text = await backendRes.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          ok: false,
          error: "Invalid JSON from python backend",
          raw: text
        };
      }

      return new Response(JSON.stringify(data), {
        status: backendRes.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Worker → backend failed",
          details: String(err)
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
