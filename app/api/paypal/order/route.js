export const runtime = "nodejs";

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${process.env.PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.access_token;
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const items = body.items || []; // [{ sku: "sku1", qty: 2 }, ...]

  // Серверный прайс (замени на свой)
  const PRICE = {
    sku1: 9.99,
    sku2: 14.5,
  };

  // Валидация + расчёт суммы
  let total = 0;
  for (const it of items) {
    const unit = PRICE[it.sku];
    if (!unit || !Number.isFinite(it.qty) || it.qty < 1) {
      return Response.json({ error: "Bad cart" }, { status: 400 });
    }
    total += unit * it.qty;
  }
  total = Math.round(total * 100) / 100;

  // Если корзина пустая — можно запретить
  if (total <= 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  const token = await getAccessToken();

  const BASE_URL =
    process.env.PUBLIC_BASE_URL || "https://paypal-shop.vercel.app"; // можно добавить env и хранить тут домен

  const orderRes = await fetch(`${process.env.PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",

      // 👇 Это важный блок, приближающий UX к “Proton”
      application_context: {
        brand_name: "bege store",
        landing_page: "LOGIN", // чаще показывает полный checkout flow
        user_action: "PAY_NOW",
        shipping_preference: "GET_FROM_FILE", // подтянуть адрес из PayPal
        return_url: `${BASE_URL}/success`,
        cancel_url: `${BASE_URL}/cancel`,
      },

      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: total.toFixed(2) },
            },
          },

          // 👇 Детали товаров (чтобы PayPal показывал “item details”)
          items: items.map((it) => ({
            name: it.sku,
            quantity: String(it.qty),
            unit_amount: {
              currency_code: "USD",
              value: PRICE[it.sku].toFixed(2),
            },
            category: "PHYSICAL_GOODS",
          })),
        },
      ],
    }),
  });

  const order = await orderRes.json();
  if (!orderRes.ok) return Response.json(order, { status: orderRes.status });

  return Response.json({ id: order.id });
}
