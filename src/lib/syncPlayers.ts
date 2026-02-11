import { prisma } from "@/lib/db";
import { sha256Json } from "@/lib/hash";
import { fetchPlayersFromLeaguepedia } from "@/lib/playersSource";
import { Region } from "@/generated/prisma/enums";

export async function syncPlayers() {
  const sourcePlayers = await fetchPlayersFromLeaguepedia();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const sp of sourcePlayers) {
    const slug = (sp as any).Player ?? (sp as any).slug ?? (sp.Name ? String(sp.Name).replace(/\s+/g, "-").toLowerCase() : null);

    const dataHash = sha256Json({
      leaguepediaId: sp.leaguepediaId ?? null,
      slug,
      name: sp.Name ?? null,
      country: sp.Country ?? null,
      role: sp.Role ?? null,
      isActive: sp.IsActive ?? true,
      overviewPage: (sp as any).OverviewPage ?? null,
      player: (sp as any).Player ?? null,
      image: (sp as any).Image ?? null,
      nameAlphabet: (sp as any).NameAlphabet ?? null,
      nameFull: (sp as any).NameFull ?? null,
      nativeName: (sp as any).NativeName ?? null,
      nationality: (sp as any).Nationality ?? null,
      nationalityPrimary: (sp as any).NationalityPrimary ?? null,
      age: (sp as any).Age ?? null,
      birthdate: (sp as any).Birthdate ?? null,
      deathdate: (sp as any).Deathdate ?? null,
      residencyFormer: (sp as any).ResidencyFormer ?? null,
      team2: (sp as any).Team2 ?? null,
      currentTeams: (sp as any).CurrentTeams ?? null,
      teamSystem: (sp as any).TeamSystem ?? null,
      team2System: (sp as any).Team2System ?? null,
      residency: (sp as any).Residency ?? null,
      contract: (sp as any).Contract ?? null,
      contractText: (sp as any).ContractText ?? null,
      favChamps: (sp as any).FavChamps ?? null,
      soloqueueIds: (sp as any).SoloqueueIds ?? null,
      askfm: (sp as any).Askfm ?? null,
      bluesky: (sp as any).Bluesky ?? null,
      discord: (sp as any).Discord ?? null,
      facebook: (sp as any).Facebook ?? null,
      instagram: (sp as any).Instagram ?? null,
      lolpros: (sp as any).Lolpros ?? null,
      dpmlol: (sp as any).DPMLOL ?? null,
      reddit: (sp as any).Reddit ?? null,
      snapchat: (sp as any).Snapchat ?? null,
      stream: (sp as any).Stream ?? null,
      kick: (sp as any).KICK ?? null,
      twitter: (sp as any).Twitter ?? null,
      threads: (sp as any).Threads ?? null,
      linkedIn: (sp as any).LinkedIn ?? null,
      vk: (sp as any).Vk ?? null,
      website: (sp as any).Website ?? null,
      weibo: (sp as any).Weibo ?? null,
      youtube: (sp as any).Youtube ?? null,
      teamLast: (sp as any).TeamLast ?? null,
      roleLast: (sp as any).RoleLast ?? null,
      isRetired: !!(sp as any).IsRetired,
      toWildrift: !!(sp as any).ToWildrift,
      toValorant: !!(sp as any).ToValorant,
      toTFT: !!(sp as any).ToTFT,
      toLegendsOfRuneterra: !!(sp as any).ToLegendsOfRuneterra,
      to2XKO: !!(sp as any).To2XKO,
      isPersonality: !!(sp as any).IsPersonality,
      isSubstitute: !!(sp as any).IsSubstitute,
      isTrainee: !!(sp as any).IsTrainee,
      isLowercase: !!(sp as any).IsLowercase,
      isAutoTeam: !!(sp as any).IsAutoTeam,
      isLowContent: !!(sp as any).IsLowContent,
    });

    const existingBySlug = slug
      ? await prisma.player.findUnique({ where: { slug }, select: { id: true, dataHash: true } })
      : null;

    if (existingBySlug && existingBySlug.dataHash === dataHash) {
      skipped++;
      await prisma.player.update({ where: { id: existingBySlug.id }, data: { lastSyncedAt: new Date() } });
      continue;
    }

    let lpId = sp.leaguepediaId != null ? Number(sp.leaguepediaId) : null;
    if (!Number.isFinite(lpId)) lpId = null;

    const upsertData = {
      region: Region.LCK,
      leaguepediaId: lpId,
      slug,
      name: sp.Name ?? null,
      country: sp.Country ?? null,
      role: sp.Role ?? null,
      teamName: (sp as any).Team ?? null,
      overviewPage: (sp as any).OverviewPage ?? null,
      player: (sp as any).Player ?? null,
      image: (sp as any).Image ?? null,
      nameAlphabet: (sp as any).NameAlphabet ?? null,
      nameFull: (sp as any).NameFull ?? null,
      nativeName: (sp as any).NativeName ?? null,
      nationality: (sp as any).Nationality ?? null,
      nationalityPrimary: (sp as any).NationalityPrimary ?? null,
      age: (sp as any).Age ?? null,
      birthdate: (sp as any).Birthdate ?? null,
      deathdate: (sp as any).Deathdate ?? null,
      residencyFormer: (sp as any).ResidencyFormer ?? null,
      team2: (sp as any).Team2 ?? null,
      currentTeams: (sp as any).CurrentTeams ?? null,
      teamSystem: (sp as any).TeamSystem ?? null,
      team2System: (sp as any).Team2System ?? null,
      residency: (sp as any).Residency ?? null,
      contract: (sp as any).Contract ?? null,
      contractText: (sp as any).ContractText ?? null,
      favChamps: (sp as any).FavChamps ?? null,
      soloqueueIds: (sp as any).SoloqueueIds ?? null,
      askfm: (sp as any).Askfm ?? null,
      bluesky: (sp as any).Bluesky ?? null,
      discord: (sp as any).Discord ?? null,
      facebook: (sp as any).Facebook ?? null,
      instagram: (sp as any).Instagram ?? null,
      lolpros: (sp as any).Lolpros ?? null,
      dpmlol: (sp as any).DPMLOL ?? null,
      reddit: (sp as any).Reddit ?? null,
      snapchat: (sp as any).Snapchat ?? null,
      stream: (sp as any).Stream ?? null,
      kick: (sp as any).KICK ?? null,
      twitter: (sp as any).Twitter ?? null,
      threads: (sp as any).Threads ?? null,
      linkedIn: (sp as any).LinkedIn ?? null,
      vk: (sp as any).Vk ?? null,
      website: (sp as any).Website ?? null,
      weibo: (sp as any).Weibo ?? null,
      youtube: (sp as any).Youtube ?? null,
      teamLast: (sp as any).TeamLast ?? null,
      roleLast: (sp as any).RoleLast ?? null,
      isRetired: !!(sp as any).IsRetired,
      toWildrift: !!(sp as any).ToWildrift,
      toValorant: !!(sp as any).ToValorant,
      toTFT: !!(sp as any).ToTFT,
      toLegendsOfRuneterra: !!(sp as any).ToLegendsOfRuneterra,
      to2XKO: !!(sp as any).To2XKO,
      isPersonality: !!(sp as any).IsPersonality,
      isSubstitute: !!(sp as any).IsSubstitute,
      isTrainee: !!(sp as any).IsTrainee,
      isLowercase: !!(sp as any).IsLowercase,
      isAutoTeam: !!(sp as any).IsAutoTeam,
      isLowContent: !!(sp as any).IsLowContent,
      isActive: sp.IsActive ?? true,
      dataHash,
      lastSyncedAt: new Date(),
    };

    if (existingBySlug) {
      try {
        await prisma.player.update({ where: { id: existingBySlug.id }, data: upsertData });
        updated++;
        console.log('Updated count:', updated);
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
      const existingByLp = await prisma.player.findUnique({ where: { leaguepediaId: lpId }, select: { id: true, slug: true } });

      if (existingByLp) {
        await prisma.player.update({ where: { id: existingByLp.id }, data: upsertData });
        updated++;
        continue;
      }
    }

    try {
      await prisma.player.create({ data: upsertData });
      created++;
      console.log('Created count:', created);
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
