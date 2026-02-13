const { getBaseUrl, getAccessToken } = require("./_lib");

module.exports = async (req, res) => {
  try {
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
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json().catch(() => ({}));

    // ВАЖНО: вернём PayPal debug_id / details как есть
    res.status(r.status).json({ ok: r.ok, status: r.status, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};
