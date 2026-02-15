"use client";
import { useEffect, useState } from "react";

export default function ReturnPage() {
  const [msg, setMsg] = useState("Завершаю оплату...");

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    (async () => {
      const res = await fetch("/api/pp-ec/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        setMsg("Ошибка завершения оплаты (смотри console).");
        return;
      }
      setMsg("Оплата прошла!");
    })();
  }, []);

  return <main style={{ padding: 40 }}>{msg}</main>;
}
