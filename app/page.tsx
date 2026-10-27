import { HomeExperience, type HomeStats } from "@/components/home/HomeExperience";
import { communityLists, type CommunityListGame, type CommunityListSeed } from "@/data/community";
import { FALLBACK_USERS } from "@/data/fallback-users";
import { createSqlClient } from "@/services/database";
import { getExploreGames, getHomeCollections } from "@/services/games";

export const revalidate = 600;

export default async function HomePage() {
  const [collections, resolvedCommunityLists, stats] = await Promise.all([
    getHomeCollections(),
    getResolvedCommunityLists(),
    getHomeStats()
  ]);

  return <HomeExperience collections={collections} communityLists={resolvedCommunityLists} stats={stats} />;
}

/** Cifras reales para el hero y el CTA: catálogo + comunidad (Neon si está, si no los perfiles de ejemplo). */
async function getHomeStats(): Promise<HomeStats> {
  const catalog = await getExploreGames({ pageSize: 1 }).catch(() => null);
  const fallback = {
    reviews: FALLBACK_USERS.reduce((total, user) => total + user.reviews.length, 0),
    members: FALLBACK_USERS.length
  };

  let community = fallback;
  if (process.env.DATABASE_URL) {
    try {
      const sql = createSqlClient();
      const rows = (await sql.query(
        `select (select count(*)::int from reviews where hidden_at is null) as reviews,
                (select count(*)::int from profiles) as members`
      )) as Array<{ reviews: number; members: number }>;
      if (rows[0]) community = { reviews: Number(rows[0].reviews), members: Number(rows[0].members) };
    } catch {
      community = fallback;
    }
  }

  return { games: catalog?.count ?? 0, ...community };
}

async function getResolvedCommunityLists(): Promise<CommunityListSeed[]> {
  return Promise.all(
    [...communityLists]
      .sort((a, b) => b.likes - a.likes)
      .map(async (list) => ({
        ...list,
        games: await Promise.all(list.games.map(resolveCommunityListGame))
      }))
  );
}

async function resolveCommunityListGame(game: CommunityListGame): Promise<CommunityListGame> {
  const seed = normalizeCommunityListGame(game);
  if (seed.coverUrl) return seed;

  try {
    const result = await getExploreGames({ query: seed.title, pageSize: 1 });
    const match = result.games[0];
    return {
      title: seed.title,
      coverUrl: match?.coverUrl ?? null
    };
  } catch {
    return seed;
  }
}

function normalizeCommunityListGame(game: CommunityListGame) {
  if (typeof game === "string") return { title: game, coverUrl: null };
  return { title: game.title, coverUrl: game.coverUrl ?? null };
}
