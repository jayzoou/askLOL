export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { syncPlayers } from "@/lib/syncPlayers";

export async function POST() {
  const result = await syncPlayers();
  return NextResponse.json({ ok: true, ...result });
}
