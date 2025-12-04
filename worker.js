export default {
  async fetch(request, env, ctx) {
    // ====== CORS ======
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apiKey",
    };

    // ----- Preflight -----
    if (request.method === "OPTIONS") {
      return new Response("OK", {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Only POST is allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    try {
      // نقرأ البودي من الإضافة (لا نلمس المحتوى)
      const bodyText = await request.text();
      let bodyJson = null;
      try {
        bodyJson = JSON.parse(bodyText);
      } catch (e) {
        // إذا ماشي JSON صالح، نرجعو خطأ
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // ====== عنوان السرفر الحقيقي ======
      // كيتحدد من env.SAMURAI_LOCAL_SERVER فـ wrangler.toml
      let target = env.SAMURAI_LOCAL_SERVER;
      if (!target) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "SAMURAI_LOCAL_SERVER not configured in env",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // ما كنضفوش /collect هنا، نفترض القيمة فـ env كاملة (بما فيها /collect)
      // مثلاً: http://127.0.0.1:5000/collect

      // نبعث نفس الـ JSON للسرفر
      const upstream = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyJson),
      });

      const respText = await upstream.text();
      const contentType =
        upstream.headers.get("Content-Type") || "application/json";

      // نرجّع الرد كما هو (جسر فقط) + CORS
      return new Response(respText, {
        status: upstream.status,
        headers: {
          "Content-Type": contentType,
          ...corsHeaders,
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Worker → Local server failed",
          detail: String(e),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};
