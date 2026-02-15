export const runtime = "nodejs";

async function getAccessToken() {
  const base = process.env.PAYPAL_BASE;
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Token error: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

export async function POST(req) {
  const { orderID } = await req.json();
  if (!orderID) return Response.json({ error: "Missing orderID" }, { status: 400 });

  const token = await getAccessToken();
  const base = process.env.PAYPAL_BASE;

  const capRes = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await capRes.json();
  if (!capRes.ok) return Response.json(data, { status: capRes.status });

  return Response.json(data);
}
