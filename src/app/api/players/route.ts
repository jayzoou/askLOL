import { NextResponse } from "next/server";
import { cargoQuery } from "@/lib/leaguepedia";

// Simple in-memory cache to provide a fallback when the upstream API rate-limits us.
// This is per-process and will reset on server restart — good enough for short-term fallback.
const playersCache: { ts: number; data: any } = { ts: 0, data: null };
// TTL for cached data (ms)
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function GET() {
  try {
    // 这里先做一个示例：取一些选手基础字段（不同表字段可能会变）
    // 如果你不确定字段名，我可以根据你想要的数据（ID/选手名/队伍/赛区）帮你配一条可用 query
    const data = await cargoQuery({
      tables: "Players",
      fields: "Players.ID, Players.Player, Players.Name, Players.Country",
      limit: 20,
    });

    // store successful result in cache
    playersCache.ts = Date.now();
    playersCache.data = data;

    return NextResponse.json(data, { headers: { "X-Cache-Status": "MISS" } });
  } catch (err: any) {
    // If upstream indicates rate limit, try to return cached data if fresh enough.
    const isRateLimited = err && (err.code === "ratelimited" || String(err.message).toLowerCase().includes("ratelimit"));

    if (isRateLimited) {
      const age = Date.now() - playersCache.ts;
      if (playersCache.data && age <= CACHE_TTL) {
        return NextResponse.json(playersCache.data, {
          status: 200,
          headers: {
            "X-Cache-Status": "HIT",
            "X-Cache-Age": String(Math.floor(age / 1000)),
          },
        });
      }

      // No fresh cache available — surface a 429 with Retry-After so clients can back off.
      const retryAfter = err?.retryAfter || 60; // seconds — default to 60s if upstream didn't provide
      return NextResponse.json(
        { error: "Upstream rate limit exceeded. Please retry later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Generic error fallback
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
