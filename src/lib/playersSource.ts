import { cargoQuery } from "@/lib/leaguepedia";

export type SourcePlayer = {
  leaguepediaId?: number;
  Name?: string | null;
  Role?: string | null;
  IsActive?: boolean;
  OverviewPage?: string | null;
  Player?: string | null;
  Image?: string | null;
  NameAlphabet?: string | null;
  NameFull?: string | null;
  NativeName?: string | null;
  Country?: string | null;
  Nationality?: string | null; // comma-separated
  NationalityPrimary?: string | null;
  Age?: number | null;
  Birthdate?: string | null;
  Deathdate?: string | null;
  ResidencyFormer?: string | null;
  Team?: string | null;
  Team2?: string | null;
  CurrentTeams?: string | null; // comma-separated
  TeamSystem?: string | null;
  Team2System?: string | null;
  Residency?: string | null;
  Contract?: string | null;
  ContractText?: string | null;
  FavChamps?: string | null; // comma-separated
  SoloqueueIds?: string | null;
  Askfm?: string | null;
  Bluesky?: string | null;
  Discord?: string | null;
  Facebook?: string | null;
  Instagram?: string | null;
  Lolpros?: string | null;
  DPMLOL?: string | null;
  Reddit?: string | null;
  Snapchat?: string | null;
  Stream?: string | null;
  KICK?: string | null;
  Twitter?: string | null;
  Threads?: string | null;
  LinkedIn?: string | null;
  Vk?: string | null;
  Website?: string | null;
  Weibo?: string | null;
  Youtube?: string | null;
  TeamLast?: string | null;
  RoleLast?: string | null; // semicolon-separated
  IsRetired?: boolean;
  ToWildrift?: boolean;
  ToValorant?: boolean;
  ToTFT?: boolean;
  ToLegendsOfRuneterra?: boolean;
  To2XKO?: boolean;
  IsPersonality?: boolean;
  IsSubstitute?: boolean;
  IsTrainee?: boolean;
  IsLowercase?: boolean;
  IsAutoTeam?: boolean;
  IsLowContent?: boolean;
};

export async function fetchPlayersFromLeaguepedia(): Promise<SourcePlayer[]> {
  const data = await cargoQuery({
    tables: "Players",
    fields: "Players.ID, Players.Player, Players.Name, Players.Country, Players.Role, Players.OverviewPage, Players.Image, Players.NameAlphabet, Players.NameFull, Players.NativeName, Players.Nationality, Players.NationalityPrimary, Players.Age, Players.Birthdate, Players.Deathdate, Players.ResidencyFormer, Players.Team, Players.Team2, Players.CurrentTeams, Players.TeamSystem, Players.Team2System, Players.Residency, Players.Contract, Players.ContractText, Players.FavChamps, Players.SoloqueueIds, Players.Askfm, Players.Bluesky, Players.Discord, Players.Facebook, Players.Instagram, Players.Lolpros, Players.DPMLOL, Players.Reddit, Players.Snapchat, Players.Stream, Players.KICK, Players.Twitter, Players.Threads, Players.LinkedIn, Players.Vk, Players.Website, Players.Weibo, Players.Youtube, Players.TeamLast, Players.RoleLast, Players.IsRetired, Players.ToWildrift, Players.ToValorant, Players.ToTFT, Players.ToLegendsOfRuneterra, Players.To2XKO, Players.IsPersonality, Players.IsSubstitute, Players.IsTrainee, Players.IsLowercase, Players.IsAutoTeam, Players.IsLowContent",
    // TODO: 加上 where/join_on，做“只拉 LCK（现役/历史）”过滤
    limit: 500,
    offset: 20000
  });

  const rows = (data?.cargoquery ?? []).map((x: any) => x.title);

  console.log(`Fetched ${rows.length} players from Leaguepedia`);

  return rows.map((r: any) => ({
  leaguepediaId: r.ID ? (Number(r.ID) || undefined) : undefined,
    Name: r.Name ?? null,
    Country: r.Country ?? null,
    Role: r.Role ?? null,
    IsActive: true,
    OverviewPage: r.OverviewPage ?? null,
    Player: r.Player ?? null,
    Image: r.Image ?? null,
    NameAlphabet: r.NameAlphabet ?? null,
    NameFull: r.NameFull ?? null,
    NativeName: r.NativeName ?? null,
    Nationality: r.Nationality ?? null,
    NationalityPrimary: r.NationalityPrimary ?? null,
    Age: r.Age ? (Number(r.Age) || null) : null,
    Birthdate: r.Birthdate ?? null,
    Deathdate: r.Deathdate ?? null,
    ResidencyFormer: r.ResidencyFormer ?? null,
    Team2: r.Team2 ?? null,
    CurrentTeams: r.CurrentTeams ?? null,
    TeamSystem: r.TeamSystem ?? null,
    Team2System: r.Team2System ?? null,
    Residency: r.Residency ?? null,
    Contract: r.Contract ?? null,
    ContractText: r.ContractText ?? null,
    FavChamps: r.FavChamps ?? null,
    SoloqueueIds: r.SoloqueueIds ?? null,
    Askfm: r.Askfm ?? null,
    Bluesky: r.Bluesky ?? null,
    Discord: r.Discord ?? null,
    Facebook: r.Facebook ?? null,
    Instagram: r.Instagram ?? null,
    Lolpros: r.Lolpros ?? null,
    DPMLOL: r.DPMLOL ?? null,
    Reddit: r.Reddit ?? null,
    Snapchat: r.Snapchat ?? null,
    Stream: r.Stream ?? null,
    KICK: r.KICK ?? null,
    Twitter: r.Twitter ?? null,
    Threads: r.Threads ?? null,
    LinkedIn: r.LinkedIn ?? null,
    Vk: r.Vk ?? null,
    Website: r.Website ?? null,
    Weibo: r.Weibo ?? null,
    Youtube: r.Youtube ?? null,
    TeamLast: r.TeamLast ?? null,
    RoleLast: r.RoleLast ?? null,
    IsRetired: !!(r.IsRetired),
    ToWildrift: !!(r.ToWildrift),
    ToValorant: !!(r.ToValorant),
    ToTFT: !!(r.ToTFT),
    ToLegendsOfRuneterra: !!(r.ToLegendsOfRuneterra),
    To2XKO: !!(r.To2XKO),
    IsPersonality: !!(r.IsPersonality),
    IsSubstitute: !!(r.IsSubstitute),
    IsTrainee: !!(r.IsTrainee),
    IsLowercase: !!(r.IsLowercase),
    IsAutoTeam: !!(r.IsAutoTeam),
    IsLowContent: !!(r.IsLowContent),
  }));
}
