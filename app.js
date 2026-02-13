paypal.Buttons({
  style: { shape: "pill", layout: "vertical", color: "gold", label: "paypal" },

  createBillingAgreement: async () => {
    // Просим сервер создать Setup Token
    const r = await fetch("/api/setup-token", { method: "POST" });
    const data = await r.json();
    return data.id; // setup_token
  },

  onApprove: async (data) => {
    // data.billingToken = setup_token
    // Тут ты сохраняешь billingToken у себя и привязываешь к пользователю
    console.log("billingToken:", data.billingToken);

    // (опционально) подтверждаем/получаем детали на сервере
    const r = await fetch("/api/setup-token/" + data.billingToken, { method: "GET" });
    const info = await r.json();
    console.log("token info:", info);

    alert("Готово! Способ оплаты сохранён.");
  },
}).render("#paypal-button-container");
