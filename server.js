import express from "express";

const app = express();
app.use(express.json());
app.use(express.static(".")); // чтобы отдавать donate.html и app.js

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;      // LIVE client id
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET; // LIVE secret
const PAYPAL_BASE = "https://api-m.paypal.com"; // LIVE (для sandbox было бы api-m.sandbox.paypal.com)

async function paypalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.access_token;
}

app.post("/api/orders", async (req, res) => {
  try {
    const token = await paypalAccessToken();
    const item = req.body?.item;

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: item?.description || "Оплата",
            amount: {
              currency_code: item?.currency || "USD",
              value: item?.price || "5.00",
            },
          },
        ],
      }),
    });

    const orderData = await orderRes.json();
    res.status(orderRes.status).json(orderData);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const token = await paypalAccessToken();
    const { orderID } = req.params;

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await captureRes.json();
    res.status(captureRes.status).json(captureData);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(3000, () => console.log("Server: http://localhost:3000/donate.html"));
