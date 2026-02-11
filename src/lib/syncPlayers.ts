import { prisma } from "@/lib/db";
import { sha256Json } from "@/lib/hash";
import { fetchLckPlayersFromLeaguepedia } from "@/lib/lckSource";
import { Region } from "@/generated/prisma/enums";

export async function syncLckPlayers() {
  const sourcePlayers = await fetchLckPlayersFromLeaguepedia();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const sp of sourcePlayers) {
    const dataHash = sha256Json({
      leaguepediaId: sp.leaguepediaId ?? null,
      slug: sp.slug,
      name: sp.name ?? null,
      country: sp.country ?? null,
      role: sp.role ?? null,
      teamName: sp.teamName ?? null,
      isActive: sp.isActive ?? true,
    });

    const existingBySlug = await prisma.player.findUnique({
      where: { slug: sp.slug },
      select: { id: true, dataHash: true },
    });

    if (existingBySlug && existingBySlug.dataHash === dataHash) {
      skipped++;
      await prisma.player.update({
        where: { id: existingBySlug.id },
        data: { lastSyncedAt: new Date() },
      });
      continue;
    }

    let lpId = sp.leaguepediaId != null ? Number(sp.leaguepediaId) : null;
    if (!Number.isFinite(lpId)) lpId = null;

    const upsertData = {
      region: Region.LCK,
      leaguepediaId: lpId,
      slug: sp.slug,
      name: sp.name ?? null,
      country: sp.country ?? null,
      role: sp.role ?? null,
      teamName: sp.teamName ?? null,
      isActive: sp.isActive ?? true,
      dataHash,
      lastSyncedAt: new Date(),
    };

    if (existingBySlug) {
      try {
        await prisma.player.update({ where: { id: existingBySlug.id }, data: upsertData });
        updated++;
      } catch (err: any) {
        if (err?.code === "P2002" && lpId != null) {
          const existingByLp = await prisma.player.findUnique({ where: { leaguepediaId: lpId }, select: { id: true } });
          if (existingByLp) {
            await prisma.player.update({ where: { id: existingByLp.id }, data: upsertData });
            updated++;
          }
        } else {
          throw err;
        }
      }
      continue;
    }

    // If a leaguepediaId is present, prefer to find by that to avoid unique constraint conflicts
    if (lpId != null) {
      const existingByLp = await prisma.player.findUnique({
        where: { leaguepediaId: lpId },
        select: { id: true, slug: true },
      });

      if (existingByLp) {
        await prisma.player.update({ where: { id: existingByLp.id }, data: upsertData });
        updated++;
        continue;
      }
    }

    try {
      await prisma.player.create({ data: upsertData });
      created++;
    } catch (err: any) {
      if (err?.code === "P2002" && lpId != null) {
        const existingByLp = await prisma.player.findUnique({ where: { leaguepediaId: lpId }, select: { id: true } });
        if (existingByLp) {
          await prisma.player.update({ where: { id: existingByLp.id }, data: upsertData });
          updated++;
          continue;
        }
      }
      throw err;
    }
  }

  return { created, updated, skipped, total: sourcePlayers.length };
}
