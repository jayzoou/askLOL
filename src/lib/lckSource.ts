import { cargoQuery } from "@/lib/leaguepedia";

export type SourcePlayer = {
  leaguepediaId?: number;
  slug: string;
  name?: string | null;
  country?: string | null;
  role?: string | null;
  teamName?: string | null;
  isActive?: boolean;
};

export async function fetchLckPlayersFromLeaguepedia(): Promise<SourcePlayer[]> {
  const data = await cargoQuery({
    tables: "Players",
    fields: "Players.ID, Players.Player, Players.Name, Players.Country",
    // TODO: 加上 where/join_on，做“只拉 LCK（现役/历史）”过滤
    limit: 500,
  });

  const rows = (data?.cargoquery ?? []).map((x: any) => x.title);

  console.log(`Fetched ${rows.length} players from Leaguepedia`);

  return rows.map((r: any) => ({
    leaguepediaId: r.ID ? Number(r.ID) : undefined,
    slug: r.Player,
    name: r.Name ?? null,
    country: r.Country ?? null,
    role: null,
    teamName: null,
    isActive: true,
  }));
}
