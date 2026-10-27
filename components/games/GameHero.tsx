import Image from "next/image";
import { Game } from "@/data/games";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GameLibraryActions } from "@/components/games/GameLibraryActions";
import { GenreBadge } from "@/components/games/GenreBadge";
import { PlatformBadge } from "@/components/games/PlatformBadge";
import { RatingBadge } from "@/components/ratings/RatingBadge";
import { UserRatingModal } from "@/components/ratings/UserRatingModal";
import { genreLabelList, platformLabelList } from "@/lib/labels";
import { formatCompactNumber } from "@/lib/utils";

export function GameHero({ game }: { game: Game }) {
  const yearLabel = game.year > 0 ? String(game.year) : "Fecha por anunciar";
  const byline = Array.from(new Set([yearLabel, game.developer, game.publisher].filter(Boolean))).join(" · ");
  const backdrop = game.heroUrl || game.coverUrl;

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover opacity-25 blur-md"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      <div className="container-page relative grid gap-6 py-8 sm:grid-cols-[180px_1fr] sm:gap-8 lg:grid-cols-[260px_1fr] lg:py-16">
        <div className="relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-card sm:mx-0 sm:w-full lg:rounded-3xl">
          {game.coverUrl && (
            <Image
              src={game.coverUrl}
              alt={`Portada de ${game.title}`}
              fill
              priority
              sizes="(min-width: 1024px) 260px, 180px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-end">
          <div className="flex flex-wrap gap-2">
            <Badge tone={game.status === "released" ? "blue" : "lime"}>
              {game.status === "released"
                ? "Lanzado"
                : game.status === "upcoming"
                  ? "Próximo"
                  : "Early Access"}
            </Badge>
            {genreLabelList(game.genres).map((genre) => (
              <GenreBadge key={genre}>{genre}</GenreBadge>
            ))}
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-balance sm:text-4xl md:text-6xl">
            {game.title}
          </h1>
          <p className="mt-3 text-base text-muted sm:text-lg">{byline}</p>

          {game.platforms.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {platformLabelList(game.platforms).map((platform) => (
                <PlatformBadge key={platform}>{platform}</PlatformBadge>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <RatingBadge score={game.userScore} label="Usuarios" />
            {game.criticScore ? <RatingBadge score={game.criticScore / 10} label="Crítica" /> : null}
            {(game.ratings > 0 || game.reviews > 0) && (
              <span className="text-sm text-muted">
                {formatCompactNumber(game.ratings)} valoraciones · {formatCompactNumber(game.reviews)} reseñas
              </span>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <UserRatingModal game={game} />
            <Button asChild href={`/games/${game.slug}/reviews`} variant="secondary">
              Escribir reseña
            </Button>
          </div>
          <div className="mt-4">
            <GameLibraryActions game={game} />
          </div>
        </div>
      </div>
    </section>
  );
}
