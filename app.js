if (!window.paypal) {
  throw new Error("PayPal SDK не загрузился. Проверь <script src=...> в donate.html");
}

function resultMessage(message) {
  document.querySelector("#result-message").innerHTML = message;
}

// ---- PayPal Buttons ----
paypal.Buttons({
  createOrder: createOrderCallback,
  onApprove: onApproveCallback,
  onError: (error) => {
    console.error(error);
    resultMessage(`❌ Ошибка PayPal Buttons: <br><br>${String(error)}`);
  },
  style: {
    shape: "rect",
    layout: "vertical",
    color: "white",
    label: "paypal",
  },
}).render("#paypal-button-container");

// ---- Card Fields (Expanded Checkout) ----
if (!window.paypal.CardFields) {
  console.warn("CardFields недоступен (аккаунт/страна/параметры SDK).");
  const form = document.getElementById("card-form");
  if (form) form.style.display = "none";
} else {
  const cardField = window.paypal.CardFields({
    createOrder: createOrderCallback,
    onApprove: onApproveCallback,
    onError: (error) => {
      console.error(error);
      resultMessage(`❌ Ошибка Card Fields: <br><br>${String(error)}`);
    },
    style: {
      input: {
        "font-size": "14px",
        "font-family": "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        "font-weight": "400",
        color: "#e5e7eb",
      },
      ".invalid": { color: "#f87171" },
    },
  });

  if (cardField.isEligible()) {
    cardField.NameField().render("#card-name-field-container");
    cardField.NumberField().render("#card-number-field-container");
    cardField.ExpiryField().render("#card-expiry-field-container");
    cardField.CVVField().render("#card-cvv-field-container");

    document.getElementById("card-field-submit-button").addEventListener("click", async () => {
      resultMessage("");
      const btn = document.getElementById("card-field-submit-button");
      btn.disabled = true;

      try {
        await cardField.submit({
          billingAddress: {
            addressLine1: document.getElementById("card-billing-address-line-1").value,
            addressLine2: document.getElementById("card-billing-address-line-2").value,
            adminArea1: document.getElementById("card-billing-address-admin-area-line-1").value,
            adminArea2: document.getElementById("card-billing-address-admin-area-line-2").value,
            countryCode: document.getElementById("card-billing-address-country-code").value || "US",
            postalCode: document.getElementById("card-billing-address-postal-code").value,
          },
        });
        // onApproveCallback вызовется сам после submit()
      } catch (error) {
        console.error(error);
        resultMessage(`❌ Не получилось оплатить картой:<br><br>${String(error)}`);
      } finally {
        btn.disabled = false;
      }
    });
  } else {
    console.warn("CardFields isEligible() = false");
    const form = document.getElementById("card-form");
    if (form) form.style.display = "none";
  }
}

// ---- Callbacks ----
async function createOrderCallback() {
  resultMessage("");
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // можешь убрать cart вообще, если твой backend не использует
        cart: [{ id: "ARCHIVE", quantity: "1" }],
      }),
    });

    const orderData = await response.json();

    if (orderData.id) return orderData.id;

    const errorDetail = orderData?.details?.[0];
    const errorMessage = errorDetail
      ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
      : JSON.stringify(orderData);

    throw new Error(errorMessage);
  } catch (error) {
    console.error(error);
    resultMessage(`❌ Could not initiate PayPal Checkout...<br><br>${String(error)}`);
  }
}

async function onApproveCallback(data, actions) {
  try {
    // ВАЖНО: CAPTURE (а не authorize)
    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const orderData = await response.json();

    const errorDetail = orderData?.details?.[0];
    if (errorDetail?.issue === "INSTRUMENT_DECLINED") return actions.restart();
    if (errorDetail) throw new Error(`${errorDetail.description} (${orderData.debug_id})`);

    const transaction = orderData?.purchase_units?.[0]?.payments?.captures?.[0];
    if (!transaction) throw new Error("No capture in response: " + JSON.stringify(orderData));

    resultMessage(`✅ Transaction ${transaction.status}: ${transaction.id}`);
    console.log("Capture result", orderData, JSON.stringify(orderData, null, 2));
  } catch (error) {
    console.error(error);
    resultMessage(`❌ Sorry, your transaction could not be processed...<br><br>${String(error)}`);
  }
}
