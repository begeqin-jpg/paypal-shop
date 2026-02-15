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
  return Object.fromEntries(new URLSearchParams(text));
}

export async function POST(req) {
  const { token } = await req.json();
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  const details = await callNvp({ METHOD: "GetExpressCheckoutDetails", TOKEN: token });

  if (details.ACK !== "Success" && details.ACK !== "SuccessWithWarning") {
    return Response.json({ error: "GetExpressCheckoutDetails failed", details }, { status: 500 });
  }

  const payerId = details.PAYERID;

  // ВАЖНО: сумму лучше хранить у себя (DB), но для демо берём из details
  const amt = details.PAYMENTREQUEST_0_AMT || details.AMT;
  const currency = details.PAYMENTREQUEST_0_CURRENCYCODE || "USD";

  const pay = await callNvp({
    METHOD: "DoExpressCheckoutPayment",
    TOKEN: token,
    PAYERID: payerId,
    PAYMENTREQUEST_0_PAYMENTACTION: "Sale",
    PAYMENTREQUEST_0_AMT: amt,
    PAYMENTREQUEST_0_CURRENCYCODE: currency,
  });

  if (pay.ACK !== "Success" && pay.ACK !== "SuccessWithWarning") {
    return Response.json({ error: "DoExpressCheckoutPayment failed", pay }, { status: 500 });
  }

  return Response.json({ ok: true, pay });
}
