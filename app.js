paypal.Buttons({
  style: { shape: "pill", layout: "vertical", color: "gold", label: "paypal" },

  // KO-FI LIKE: создаём setup token (billing setup)
  createBillingAgreement: async () => {
    resultMessage("");
    const r = await fetch("/api/setup-token", { method: "POST" });
    const data = await r.json();

    if (!r.ok) throw new Error(data?.error || JSON.stringify(data));
    return data.id; // setup_token id
  },

  onApprove: async (data) => {
    // data.billingToken = setup_token
    console.log("billingToken:", data.billingToken);

    // можно просто сохранить billingToken и всё
    // но для проверки дернем детали:
    const r = await fetch("/api/setup-token/" + data.billingToken);
    const info = await r.json();

    if (!r.ok) throw new Error(info?.error || JSON.stringify(info));

    console.log("setup token info:", info);
    resultMessage("✅ Готово! Способ оплаты сохранён. BillingToken: " + data.billingToken);
  },

  onError: (err) => {
    console.error(err);
    resultMessage("❌ Ошибка: " + (err?.message || err));
  },
}).render("#paypal-button-container");

function resultMessage(message) {
  const el = document.querySelector("#result-message");
  if (el) el.innerHTML = message;
}
