"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      window.paypal
        .Buttons({
          createOrder: async () => {
            // ТЕСТОВАЯ КОРЗИНА (замени на свою логику/данные)
            const items = [
              { sku: "sku1", qty: 2 },
              { sku: "sku2", qty: 1 },
            ];

            const res = await fetch("/api/paypal/order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              console.error("Create order failed:", data);
              throw new Error(data?.error || data?.message || "Create order failed");
            }

            if (!data?.id) {
              console.error("No order id returned:", data);
              throw new Error("No order id returned from server");
            }

            return data.id;
          },

          onApprove: async (data: any) => {
            const res = await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });

            const cap = await res.json().catch(() => ({}));
            if (!res.ok) {
              console.error("Capture failed:", cap);
              alert("Ошибка при подтверждении оплаты. Смотри console.");
              return;
            }

            alert("Оплата прошла!");
          },

          onError: (err: any) => {
            console.error("PayPal Buttons error:", err);
            alert("PayPal ошибка. Открой консоль (F12) и пришли текст ошибки.");
          },
        })
        .render("#paypal-buttons");
    };

    document.body.appendChild(script);

    // На всякий случай: чтобы не дублировать скрипт при hot reload
    return () => {
      script.remove();
    };
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Магазин</h1>
      <p>Оплата через PayPal (USD)</p>
      <div id="paypal-buttons"></div>
      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        Если окно PayPal закрывается — открой DevTools (F12) → Console и пришли ошибку.
      </p>
    </main>
  );
}
