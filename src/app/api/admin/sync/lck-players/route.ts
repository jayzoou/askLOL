export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { syncLckPlayers } from "@/lib/syncPlayers";

export async function POST() {
  const result = await syncLckPlayers();
  return NextResponse.json({ ok: true, ...result });
}
