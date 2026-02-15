export const runtime = "nodejs";

function toNvp(obj) {
  return new URLSearchParams(obj).toString();
}

async function callNvp(params) {
  const base = {
    METHOD: params.METHOD,
    VERSION: "204.0",
    USER: process.env.PP_USER,
    PWD: process.env.PP_PWD,
    SIGNATURE: process.env.PP_SIGNATURE,
  };

  const res = await fetch(process.env.PP_NVP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toNvp({ ...base, ...params }),
  });

  const text = await res.text();
  const data = Object.fromEntries(new URLSearchParams(text));
  return data;
}

export async function POST(req) {
  const { items } = await req.json().catch(() => ({}));

  // Серверный прайс (замени под себя)
  const PRICE = { sku1: 9.99, sku2: 14.5 };
  let total = 0;

  for (const it of items || []) {
    const unit = PRICE[it.sku];
    if (!unit || !Number.isFinite(it.qty) || it.qty < 1) {
      return Response.json({ error: "Bad cart" }, { status: 400 });
    }
    total += unit * it.qty;
  }
  total = Math.round(total * 100) / 100;
  if (total <= 0) return Response.json({ error: "Cart empty" }, { status: 400 });

  const BASE = process.env.PUBLIC_BASE_URL;

  const resp = await callNvp({
    METHOD: "SetExpressCheckout",
    PAYMENTREQUEST_0_PAYMENTACTION: "Sale",
    PAYMENTREQUEST_0_AMT: total.toFixed(2),
    PAYMENTREQUEST_0_CURRENCYCODE: "USD",

    // чтобы PayPal показал review-страницу и вернулся к тебе
    RETURNURL: `${BASE}/pp-ec/return`,
    CANCELURL: `${BASE}/pp-ec/cancel`,

    // необязательно, но красиво
    BRANDNAME: "bege store",
    NOSHIPPING: "0",
    REQCONFIRMSHIPPING: "0",
  });

  if (resp.ACK !== "Success" && resp.ACK !== "SuccessWithWarning") {
    return Response.json({ error: "SetExpressCheckout failed", resp }, { status: 500 });
  }

  const token = resp.TOKEN;

  // Редирект на PayPal (Live vs Sandbox разные домены)
  const isSandbox = process.env.PP_NVP_ENDPOINT.includes("sandbox");
  const redirectBase = isSandbox
    ? "https://www.sandbox.paypal.com/cgi-bin/webscr"
    : "https://www.paypal.com/cgi-bin/webscr";

  return Response.json({
    redirectUrl: `${redirectBase}?cmd=_express-checkout&token=${encodeURIComponent(token)}`,
  });
}
