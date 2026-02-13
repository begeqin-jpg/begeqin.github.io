export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id } = req.query;

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !secret) {
      return res.status(500).json({ error: "Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET" });
    }

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
    if (!tokenResp.ok) return res.status(tokenResp.status).json(tokenData);

    const detailsResp = await fetch(`https://api-m.paypal.com/v3/vault/setup-tokens/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const details = await detailsResp.json();
    if (!detailsResp.ok) return res.status(detailsResp.status).json(details);

    return res.status(200).json(details);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
