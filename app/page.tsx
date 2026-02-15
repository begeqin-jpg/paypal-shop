"use client";

import { useMemo, useState } from "react";

type CartItem = { sku: "sku1" | "sku2"; qty: number };

export default function Home() {
  // демо-корзина
  const [cart, setCart] = useState<CartItem[]>([
    { sku: "sku1", qty: 2 },
    { sku: "sku2", qty: 1 },
  ]);

  // демо-прайс (только для отображения на странице)
  const PRICE: Record<CartItem["sku"], number> = {
    sku1: 9.99,
    sku2: 14.5,
  };

  const total = useMemo(() => {
    const sum = cart.reduce((acc, it) => acc + PRICE[it.sku] * it.qty, 0);
    return Math.round(sum * 100) / 100;
  }, [cart]);

  const inc = (sku: CartItem["sku"]) => {
    setCart((prev) =>
      prev.map((it) => (it.sku === sku ? { ...it, qty: it.qty + 1 } : it))
    );
  };

  const dec = (sku: CartItem["sku"]) => {
    setCart((prev) =>
      prev.map((it) =>
        it.sku === sku ? { ...it, qty: Math.max(1, it.qty - 1) } : it
      )
    );
  };

  const startExpressCheckout = async () => {
    try {
      const res = await fetch("/api/pp-ec/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("EC start failed:", data);
        alert("Ошибка Express Checkout. Открой консоль (F12) и пришли ошибку.");
        return;
      }

      if (!data?.redirectUrl) {
        console.error("No redirectUrl:", data);
        alert("Сервер не вернул redirectUrl.");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch (e) {
      console.error(e);
      alert("Ошибка сети/скрипта. Открой консоль (F12) и пришли ошибку.");
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 720 }}>
      <h1 style={{ marginBottom: 8 }}>bege store</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        PayPal Express Checkout (Classic)
      </p>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Корзина</h2>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 12,
            padding: 16,
            border: "1px solid #333",
            borderRadius: 12,
          }}
        >
          {cart.map((it) => (
            <div
              key={it.sku}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{it.sku}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  ${PRICE[it.sku].toFixed(2)} / шт
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => dec(it.sku)} style={btnSmall}>
                  −
                </button>
                <div style={{ minWidth: 24, textAlign: "center" }}>{it.qty}</div>
                <button onClick={() => inc(it.sku)} style={btnSmall}>
                  +
                </button>
              </div>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #333",
              paddingTop: 12,
              marginTop: 4,
              fontWeight: 700,
            }}
          >
            <span>Итого</span>
            <span>${total.toFixed(2)} USD</span>
          </div>

          <button
            onClick={startExpressCheckout}
            style={{
              marginTop: 8,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            PayPal Express Checkout
          </button>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Если после редиректа хочешь завершать оплату — нужны страницы:
            <code> /pp-ec/return </code> и <code> /pp-ec/cancel </code>.
          </div>
        </div>
      </div>
    </main>
  );
}

const btnSmall: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #555",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};
