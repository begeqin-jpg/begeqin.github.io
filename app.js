paypal.Buttons({
  style: { shape: "pill", layout: "vertical", color: "gold", label: "paypal" },

  // ✅ Правильно для intent=tokenize + vault=true:
  // создаём VAULT SETUP TOKEN на сервере и возвращаем его ID
  createVaultSetupToken: async () => {
    resultMessage("");

    const r = await fetch("/api/setup-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        return_url: window.location.href,
        cancel_url: window.location.href
      })
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || data?.message || JSON.stringify(data));

    // PayPal ожидает строку setup_token_id
    return data.id;
  },

  onApprove: async (data) => {
    // ✅ В этом флоу приходит vaultSetupToken
    console.log("onApprove data:", data);

    const setupToken = data.vaultSetupToken;
    if (!setupToken) {
      throw new Error("No vaultSetupToken returned. Check console data.");
    }

    console.log("vaultSetupToken:", setupToken);

    // (опционально) Получить детали setup token:
    const r1 = await fetch("/api/setup-token/" + encodeURIComponent(setupToken));
    const info = await r1.json().catch(() => ({}));
    if (!r1.ok) throw new Error(info?.error || info?.message || JSON.stringify(info));
    console.log("setup token info:", info);

    // (рекомендуется) обменять setup token → payment token (долгоживущий)
    const r2 = await fetch("/api/payment-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaultSetupToken: setupToken })
    });

    const out = await r2.json().catch(() => ({}));
    if (!r2.ok) throw new Error(out?.error || out?.message || JSON.stringify(out));

    console.log("payment token:", out);

    resultMessage("✅ Готово! Способ оплаты сохранён. PaymentToken: " + out.id);
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
