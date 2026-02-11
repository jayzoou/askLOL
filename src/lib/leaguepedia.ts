export function buildCargoUrl(params: Record<string, string>) {
  const base = process.env.LEAGUEPEDIA_API_BASE!;
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export async function cargoQuery(params: {
  tables: string;
  fields: string;
  where?: string;
  join_on?: string;
  order_by?: string;
  limit?: number;
  offset?: number;
}) {
  const url = buildCargoUrl({
    action: "cargoquery",
    format: "json",
    origin: "*", // 关键：避免某些跨域限制（尤其是你直接请求 fandom 时）
    tables: params.tables,
    fields: params.fields,
    ...(params.where ? { where: params.where } : {}),
    ...(params.join_on ? { join_on: params.join_on } : {}),
    ...(params.order_by ? { order_by: params.order_by } : {}),
    ...(typeof params.limit === "number" ? { limit: String(params.limit) } : {}),
    ...(typeof params.offset === "number" ? { offset: String(params.offset) } : {}),
  });

  const res = await fetch(url, {
    // 服务端 fetch，默认可用
    headers: { "User-Agent": "leaguepedia-app/1.0 (dev)" },
    // 可选：避免缓存影响调试
    cache: "no-store",
  });  // Clone the response to read a short preview for debugging (won't consume original)


  // if (!res.ok) {
  //   const text = await res.text().catch(() => "");
  //   throw new Error(`Cargo API failed: ${res.status} ${res.statusText} ${text}`);
  // }

  return res.json() as Promise<any>;
}
