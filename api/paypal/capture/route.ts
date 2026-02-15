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
  return data.access_token as string;
}

export async function POST(req: Request) {
  const { orderID } = await req.json();
  const token = await getAccessToken();

  const capRes = await fetch(
    `${process.env.PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await capRes.json();
  return Response.json(data, { status: capRes.status });
}
