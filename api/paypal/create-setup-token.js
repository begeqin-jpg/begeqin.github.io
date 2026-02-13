const { getBaseUrl, getAccessToken } = require("./_lib");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ message: "Method not allowed" });
      return;
    }

    const { description, return_url, cancel_url } = req.body || {};
    const accessToken = await getAccessToken();

    // Создаём Setup Token для PayPal payment_source
    const payload = {
      payment_source: {
        paypal: {
          experience_context: {
            return_url: return_url || "https://example.com",
            cancel_url: cancel_url || "https://example.com",
            // brand_name можно поставить свой
            brand_name: process.env.PAYPAL_BRAND_NAME || "Support",
            shipping_preference: "NO_SHIPPING",
            user_action: "CONTINUE"
          }
        }
      },
      // description — опционально, иногда отображается
      description: description || "Support"
    };

    const r = await fetch(`${getBaseUrl()}/v3/vault/setup-tokens`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({
        message: "PayPal create setup token failed",
        details: data
      });
      return;
    }

    // data.id = setup_token_id
    res.status(200).json({ id: data.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};
