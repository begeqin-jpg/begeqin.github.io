const resultMessage = document.getElementById("result-message");

// ВСТАВЬ свой LIVE Plan ID (P-XXXXXXXXXXXX)
const PLAN_ID = "P-9AH50584TF252271ENGFYVPI";

paypal.Buttons({
  style: {
    shape: "rect",
    layout: "vertical",
    label: "subscribe",
  },

  // Создаём подписку
  createSubscription: function (data, actions) {
    return actions.subscription.create({
      plan_id: PLAN_ID,
    });
  },

  // Успех
  onApprove: function (data) {
    resultMessage.textContent = "Подписка оформлена ✅ Subscription ID: " + data.subscriptionID;
  },

  // Ошибка
  onError: function (err) {
    console.error(err);
    resultMessage.textContent = "Ошибка оплаты ❌ Проверь Client ID / Plan ID / HTTPS.";
  },
}).render("#paypal-button-container");
