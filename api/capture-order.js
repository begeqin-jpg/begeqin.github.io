async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const r = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`token_error: ${t}`);
  }

  const d = await r.json();
  return d.access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).send("Missing orderId");

    const accessToken = await getAccessToken();

    const r = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const d = await r.json();
    if (!r.ok) {
      return res.status(500).send(d?.message || JSON.stringify(d));
    }

    const captureId =
      d?.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    return res.status(200).json({ captureId });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
}
