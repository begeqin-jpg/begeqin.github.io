const paypalButtons = window.paypal.Buttons({
  style: {
    shape: "pill",
    layout: "horizontal",
    color: "white",
    label: "paypal",
  },

  async createOrder() {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item: {
          name: "Доступ к архиву (разово)",
          description: "Разовая покупка доступа к архиву",
          price: "5.00",
          currency: "USD",
          quantity: "1",
        },
      }),
    });

    const orderData = await response.json();
    if (orderData.id) return orderData.id;

    throw new Error(JSON.stringify(orderData));
  },

  async onApprove(data, actions) {
    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const orderData = await response.json();

    const errorDetail = orderData?.details?.[0];
    if (errorDetail?.issue === "INSTRUMENT_DECLINED") return actions.restart();
    if (errorDetail) throw new Error(`${errorDetail.description} (${orderData.debug_id})`);

    const capture = orderData?.purchase_units?.[0]?.payments?.captures?.[0];
    resultMessage(`✅ Оплачено: ${capture.status}<br>Transaction ID: <b>${capture.id}</b>`);
  },

  onError(err) {
    console.error(err);
    resultMessage(`❌ Ошибка: ${String(err)}`);
  },
});

paypalButtons.render("#paypal-button-container");

function resultMessage(message) {
  document.querySelector("#result-message").innerHTML = message;
}
