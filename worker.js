export default {
  async fetch(request, env) {
    try {
      // =============================
      //  إعداد CORS
      // =============================
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apiKey",
      };

      // --- preflight ---
      if (request.method === "OPTIONS") {
        return new Response("", { status: 200, headers: corsHeaders });
      }

      // =============================
      //  نقرأ JSON من الإضافة
      // =============================
      const reqBody = await request.json().catch(() => null);
      if (!reqBody) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid JSON request" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // =============================
      //  عنوان السرفر البايثون
      // =============================
      const PY_SERVER = env.PYTHON_SERVER || "http://127.0.0.1:5000/collect";

      // =============================
      //  نرسل الطلب إلى السرفر
      // =============================
      const pythonResp = await fetch(PY_SERVER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      const pythonText = await pythonResp.text();
      let pythonJson = null;

      try {
        pythonJson = JSON.parse(pythonText);
      } catch (e) {
        pythonJson = {
          ok: false,
          error: "Python server returned non-JSON",
          raw: pythonText,
        };
      }

      // =============================
      //  إرجاع الرد للإضافة
      // =============================
      return new Response(JSON.stringify(pythonJson), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: String(err) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
