import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewComposer } from "@/components/reviews/ReviewComposer";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { REVIEW_SORTS, REVIEW_SPOILER_FILTERS, type ReviewSort } from "@/lib/review-filters";
import type { Review } from "@/data/games";
import { CommunityScoreCard } from "@/components/ratings/CommunityScoreCard";
import { ExternalScoresSidebar } from "@/components/reviews/ExternalScoresSidebar";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getGameBySlug, getIgdbScoreSummaryByGameSlug } from "@/services/games";
import { createServiceDatabaseClient } from "@/services/database";
import { reviewFromRow } from "@/services/community";
import { getFallbackReviewsByGameSlug } from "@/data/fallback-users";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  return {
    title: game ? `Reseñas de ${game.title}` : "Reseñas",
    description: game ? `Lee reseñas de usuarios, distribución de puntuaciones y opiniones sobre ${game.title}.` : undefined
  };
}

export default async function GameReviewsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const sort = pickParam(query.sort, REVIEW_SORTS, "popular");
  const spoilers = pickParam(query.spoilers, REVIEW_SPOILER_FILTERS, "all");

  const [{ reviews: allReviews, error }, igdbScores] = await Promise.all([
    getReviews(slug),
    getIgdbScoreSummaryByGameSlug(game.slug)
  ]);
  const reviews = sortReviews(
    allReviews.filter((review) =>
      spoilers === "none" ? !review.hasSpoilers : spoilers === "only" ? review.hasSpoilers : true
    ),
    sort
  );

  return (
    <section className="container-page space-y-8 py-10">
      <SectionHeader eyebrow="Comunidad" title={`Reseñas de ${game.title}`} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <CommunityScoreCard
            averageScore={game.userScore}
            ratingsCount={game.ratings}
            reviewsCount={game.reviews}
          />

          <ReviewComposer game={game} />

          <Button asChild href={`/games/${game.slug}#community-rating`} variant="secondary" className="w-full sm:w-auto">
            Prefiero solo una nota rápida con comentario corto
          </Button>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-px w-5 rounded-full bg-electric" aria-hidden />
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-electric">Críticas</p>
                </div>
                <h3 className="text-xl font-black md:text-2xl">Reseñas de la comunidad</h3>
              </div>
              <ReviewFilters />
            </div>

            {error && <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 text-sm text-danger">{error}</div>}
            {!error && reviews.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm leading-6 text-muted">
                {allReviews.length > 0
                  ? "Ninguna reseña coincide con este filtro."
                  : "Todavía no hay reseñas largas. Publica la primera y ayuda a la comunidad a decidir qué jugar."}
              </div>
            )}
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} {...review} />
              ))}
            </div>
          </div>
        </div>

        <ExternalScoresSidebar
          averageScore={igdbScores?.averageScore}
          ratingsCount={igdbScores?.ratingsCount}
          criticScore={igdbScores?.criticScore}
          source={igdbScores?.source ?? "IGDB"}
        />
      </div>
    </section>
  );
}

async function getReviews(slug: string) {
  const fallbackReviews = getFallbackReviewsByGameSlug(slug);
  try {
    const serviceClient = createServiceDatabaseClient();
    const { data, error } = await serviceClient
      .from("reviews")
      .select("*, profiles:user_id(id,username,display_name,bio,avatar_url,created_at), games:game_id!inner(slug,title)")
      .eq("games.slug", slug)
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    const realReviews: Review[] = (data ?? []).map(reviewFromRow);
    return { reviews: [...realReviews, ...fallbackReviews], error: null };
  } catch {
    return { reviews: fallbackReviews, error: null };
  }
}

function pickParam<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const single = Array.isArray(value) ? value[0] : value;
  return allowed.includes(single as T) ? (single as T) : fallback;
}

function sortReviews(reviews: Review[], sort: ReviewSort) {
  const time = (value?: string) => (value ? new Date(value).getTime() || 0 : 0);
  return [...reviews].sort((a, b) => {
    if (sort === "recent") return time(b.createdAt) - time(a.createdAt);
    if (sort === "score-high") return b.score - a.score || b.helpfulCount - a.helpfulCount;
    if (sort === "score-low") return a.score - b.score || b.helpfulCount - a.helpfulCount;
    return b.helpfulCount - a.helpfulCount || time(b.createdAt) - time(a.createdAt);
  });
}


