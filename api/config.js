export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const id = process.env.PAYPAL_CLIENT_ID;
  if (!id) {
    return res.status(500).send("PAYPAL_CLIENT_ID is missing");
  }

  res.status(200).json({ paypalClientId: id });
}
