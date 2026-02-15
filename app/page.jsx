"use client";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = () => {
      // пример корзины
      const items = [{ sku: "sku1", qty: 2 }];

      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message || "Create order failed");
          return data.id;
        },
        onApprove: async (data) => {
          const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });
          const cap = await res.json();
          if (!res.ok) throw new Error(cap?.message || "Capture failed");
          alert("Оплата прошла!");
        },
      }).render("#paypal-buttons");
    };
    document.body.appendChild(script);
  }, []);

  return <div id="paypal-buttons" />;
}
