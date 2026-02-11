export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { orderID } = req.query;
    const token = await getAccessToken();

    const paypalRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await paypalRes.json();
    return res.status(paypalRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");

  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));
  return tokenData.access_token;
}
