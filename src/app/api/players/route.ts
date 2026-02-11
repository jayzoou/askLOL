export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cargoQuery } from "@/lib/leaguepedia";

// Simple in-memory cache to provide a fallback when the upstream API rate-limits us.
// This is per-process and will reset on server restart — good enough for short-term fallback.
const playersCache: { ts: number; data: any } = { ts: 0, data: null };
// TTL for cached data (ms)
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

type CargoRow = {
  title?: {
    ID?: string;
    Player?: string;
    Name?: string;
    Country?: string;
  };
};

function toIntLeaguepediaId(id: unknown): number | null {
  if (id == null) return null;
  const s = String(id).trim();
  if (!/^\d+$/.test(s)) return null;
  return Number(s); // "057" -> 57
}

function normalizeToPlayerLikeIdEndpoint(raw: any) {
  const rows: CargoRow[] = Array.isArray(raw?.cargoquery) ? raw.cargoquery : [];

  // 这里输出的每个 item 字段与 /api/players/[id] 返回一致
  // Cargo 不具备的字段一律用 null（或你想要的默认值）
  return rows
    .map((r) => r?.title)
    .filter(Boolean)
    .map((t) => {
      const leaguepediaId = toIntLeaguepediaId(t?.ID);

      return {
        id: null as string | null, // 你库内主键（Cargo 没有）
        slug: t?.Player ? String(t.Player) : null, // 用 Player 页名当 slug（你也可改成 t.ID）
        leaguepediaId, // Int
        name: t?.Name ?? null,
        country: t?.Country ?? null,
        role: null as string | null,
        teamName: null as string | null,
        isActive: null as boolean | null,
        createdAt: null as string | null,
        updatedAt: null as string | null,
        lastSyncedAt: null as string | null,
      };
    });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const takeParam = url.searchParams.get("take");

  const takeRaw = takeParam ? Number(takeParam) : 20;
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 100) : 20;

  try {
    const raw = await cargoQuery({
      tables: "Players",
      fields: "Players.ID, Players.Player, Players.Name, Players.Country",
      limit: take,
    });

    const items = normalizeToPlayerLikeIdEndpoint(raw);

    // store successful result in cache (normalized, not cargo raw)
    playersCache.ts = Date.now();
    playersCache.data = items;

    // 跟 /id 一样：直接返回“player 形状”的数据（这里只是数组）
    return NextResponse.json(items, { headers: { "X-Cache-Status": "MISS" } });
  } catch (err: any) {
    const isRateLimited =
      err && (err.code === "ratelimited" || String(err.message).toLowerCase().includes("ratelimit"));

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

      const retryAfter = err?.retryAfter || 60;
      return NextResponse.json(
        { error: "Upstream rate limit exceeded. Please retry later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
