export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !secret) {
      return res.status(500).json({ error: "Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET" });
    }

    // 1) Получаем access_token
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const tokenResp = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      return res.status(tokenResp.status).json(tokenData);
    }

    // 2) Создаём Setup Token (Vault)
    // NB: endpoint может отличаться по аккаунту/доступу, но обычно v3/vault/setup-tokens
    const setupResp = await fetch("https://api-m.paypal.com/v3/vault/setup-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "begeqin",
              shipping_preference: "NO_SHIPPING",
              return_url: "https://begeqin-github-io-vota.vercel.app",
              cancel_url: "https://begeqin-github-io-vota.vercel.app",
            },
          },
        },
      }),
    });

    const setupData = await setupResp.json();
    if (!setupResp.ok) {
      return res.status(setupResp.status).json(setupData);
    }

    // отдаём setup_token id
    return res.status(200).json({ id: setupData.id, raw: setupData });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
