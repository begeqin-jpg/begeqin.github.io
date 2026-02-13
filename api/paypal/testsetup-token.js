const { getBaseUrl, getAccessToken } = require("./_lib");

module.exports = async (req, res) => {
  try {
    // Разрешаем GET, чтобы можно было открыть в браузере
    if (req.method !== "GET") {
      res.status(405).json({ message: "Method not allowed" });
      return;
    }

    const accessToken = await getAccessToken();

    const payload = {
      payment_source: {
        paypal: {
          experience_context: {
            return_url: "https://example.com/return",
            cancel_url: "https://example.com/cancel",
            brand_name: process.env.PAYPAL_BRAND_NAME || "Support",
            shipping_preference: "NO_SHIPPING",
            user_action: "CONTINUE"
          }
        }
      },
      description: "Test setup token"
    };

    const r = await fetch(`${getBaseUrl()}/v3/vault/setup-tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json().catch(() => ({}));

    // Важно: вернём ВСЁ как есть (там будет debug_id/details если ошибка)
    res.status(200).json({
      ok: r.ok,
      paypalStatus: r.status,
      paypal: data
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};
