export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Region } from "@/generated/prisma/enums";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const player = await prisma.player.findFirst({
    where: { id, region: Region.LCK },
    select: {
      id: true,
      slug: true,
      leaguepediaId: true,
      name: true,
      country: true,
      role: true,
      teamName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastSyncedAt: true,
    },
  });

  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(player);
}
