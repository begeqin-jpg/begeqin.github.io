function getBaseUrl() {
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error_description || "Failed to get PayPal access token");
  }

  return data.access_token;
}

module.exports = { getBaseUrl, getAccessToken };
