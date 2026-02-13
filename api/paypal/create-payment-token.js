const { getBaseUrl, getAccessToken } = require("./_lib");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ message: "Method not allowed" });
      return;
    }

    const { vaultSetupToken } = req.body || {};
    if (!vaultSetupToken) {
      res.status(400).json({ message: "Missing vaultSetupToken" });
      return;
    }

    const accessToken = await getAccessToken();

    // Обмен Setup Token -> Payment Token (vault)
    const payload = {
      payment_source: {
        token: {
          id: vaultSetupToken,
          type: "SETUP_TOKEN"
        }
      }
    };

    const r = await fetch(`${getBaseUrl()}/v3/vault/payment-tokens`, {
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
        message: "PayPal create payment token failed",
        details: data
      });
      return;
    }

    // data.id = payment_token_id
    res.status(200).json({ id: data.id, raw: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};
