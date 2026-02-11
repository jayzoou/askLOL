function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number) {
  const base = Math.min(30000, 1000 * Math.pow(2, attempt)); // 1s,2s,4s... capped
  const jitter = Math.floor(Math.random() * 300); // 0-300ms
  return base + jitter;
}

export async function cargoQuery(params: {
  tables: string;
  fields: string;
  where?: string;
  join_on?: string;
  order_by?: string;
  limit?: number;
  offset?: number;
}, opts?: { maxRetries?: number }) {
  const maxRetries = opts?.maxRetries ?? 5;
  const base = process.env.LEAGUEPEDIA_API_BASE!; // https://lol.fandom.com/api.php

  const body = new URLSearchParams({
    action: "cargoquery",
    format: "json",
    tables: params.tables,
    fields: params.fields,
  });
  if (params.where) body.set("where", params.where);
  if (params.join_on) body.set("join_on", params.join_on);
  if (params.order_by) body.set("order_by", params.order_by);
  if (typeof params.limit === "number") body.set("limit", String(params.limit));
  if (typeof params.offset === "number") body.set("offset", String(params.offset));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json",
        "User-Agent": "leaguepedia-app/1.0 (contact: chrischau666@gmail.com)",
      },
      body,
      cache: "no-store",
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    // 命中限流：退避重试
    if (json?.error?.code === "ratelimited") {
      if (attempt === maxRetries) {
        throw new Error(`Cargo API error: ratelimited ${json.error.info || ""}`);
      }
      await sleep(backoffMs(attempt));
      continue;
    }

    if (!res.ok) {
      // 5xx 也可以选择重试
      if (res.status >= 500 && attempt < maxRetries) {
        await sleep(backoffMs(attempt));
        continue;
      }
      throw new Error(`Cargo API HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
    }

    if (json?.error) {
      throw new Error(`Cargo API error: ${json.error.code} ${json.error.info || ""}`);
    }

    return json;
  }

  throw new Error("Cargo API failed unexpectedly");
}
