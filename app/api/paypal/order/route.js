// Next.js App Router (Node runtime)
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
  // ВАЖНО: не принимай итоговую сумму “как есть” из браузера.
  // Прими cart (товар+кол-во) и рассчитай цену на сервере по своему прайсу.
  const { items } = await req.json();

  // Пример серверного прайса (в реальности — БД/файл/админка)
  const PRICE = { sku1: 9.99, sku2: 14.5 };

  let total = 0;
  for (const it of items ?? []) {
    const unit = PRICE[it.sku];
    if (!unit || it.qty < 1) return Response.json({ error: "Bad cart" }, { status: 400 });
    total += unit * it.qty;
  }
  total = Math.round(total * 100) / 100;

  const token = await getAccessToken();
  const base = process.env.PAYPAL_BASE;

  const orderRes = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
          },
        },
      ],
    }),
  });

  const order = await orderRes.json();
  if (!orderRes.ok) return Response.json(order, { status: orderRes.status });

  return Response.json({ id: order.id });
}
