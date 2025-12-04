export default {
  async fetch(request, env) {
    // health check
    if (request.method !== "POST") {
      return new Response("Samurai Worker Online", { status: 200 });
    }

    // 1) قراءة الـ JSON من الإضافة
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Bad JSON from extension",
          details: String(err),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const backend = env.SAMURAI_LOCAL_SERVER;
    if (!backend) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "SAMURAI_LOCAL_SERVER not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      // 2) إرسال نفس البودي لسيرفر بايثون
      const res = await fetch(backend, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });

      const text = await res.text();

      // 3) محاولة تحويل الرد لـ JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Invalid JSON from local server",
            raw: text.slice(0, 400),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // 4) إعادة نفس JSON للإضافة
      return new Response(JSON.stringify(data), {
        status: res.status || 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Worker → local server failed",
          details: String(err),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
