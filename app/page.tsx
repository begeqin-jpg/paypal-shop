"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // ОБЯЗАТЕЛЬНО
          });

          const data = await res.json();
          return data.id;
        },

        onApprove: async (data: any) => {
          await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });

          alert("Оплата прошла!");
        },
      }).render("#paypal-buttons");
    };

    document.body.appendChild(script);
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Магазин</h1>
      <p>Оплата через PayPal</p>
      <div id="paypal-buttons"></div>
    </main>
  );
}
