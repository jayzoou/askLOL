export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Region } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const q = (searchParams.get("q") ?? "").trim();
  const team = (searchParams.get("team") ?? "").trim();
  const role = (searchParams.get("role") ?? "").trim();
  const isActiveParam = (searchParams.get("isActive") ?? "").trim(); // "true" | "false" | ""
  const takeParam = searchParams.get("take");
  const cursor = (searchParams.get("cursor") ?? "").trim(); // 用 id 做 cursor（你的主键字符串）

  const takeRaw = takeParam ? Number(takeParam) : 50;
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 100) : 50;

  const where: {
    region: Region;
    OR?: any[];
    teamName?: any;
    role?: any;
    isActive?: boolean;
  } = {
    region: Region.LCK,
  };

  // q 搜索：name/slug/teamName + (若 q 为纯数字) leaguepediaId(Int)
  if (q) {
    const isNumeric = /^\d+$/.test(q);
    const qNum = isNumeric ? Number(q) : null;

    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { teamName: { contains: q, mode: "insensitive" } },
      ...(isNumeric ? [{ leaguepediaId: qNum }] : []),
    ];
  }

  if (team) {
    where.teamName = { contains: team, mode: "insensitive" };
  }

  if (role) {
    // role 精确匹配（按你的库内存储值）
    where.role = role;
  }

  if (isActiveParam === "true") where.isActive = true;
  if (isActiveParam === "false") where.isActive = false;

  const rows = await prisma.player.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: take + 1, // 多取 1 条用于判断 hasNext
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      slug: true,
      leaguepediaId: true,
      name: true,
      country: true,
      role: true,
      teamName: true,
      isActive: true,
      updatedAt: true,
      lastSyncedAt: true,
    },
  });

  const hasNext = rows.length > take;
  const items = hasNext ? rows.slice(0, take) : rows;
  const nextCursor = hasNext ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({
    items,
    page: {
      take,
      nextCursor,
      hasNext,
    },
  });
}
