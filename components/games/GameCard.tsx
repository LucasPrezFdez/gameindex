import Image from "next/image";
import Link from "next/link";
import { Game } from "@/data/games";
import { prioritizePlatform } from "@/lib/utils";
import { genreLabelList, platformLabel } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { RatingBadge } from "@/components/ratings/RatingBadge";

export function GameCard({
  game,
  priority = false,
  highlightPlatform
}: {
  game: Game;
  priority?: boolean;
  highlightPlatform?: string | null;
}) {
  const yearLabel = game.year > 0 ? String(game.year) : "Por anunciar";
  const orderedPlatforms = prioritizePlatform(game.platforms, highlightPlatform);
  const byline = game.developer || (orderedPlatforms[0] ? platformLabel(orderedPlatforms[0]) : "");

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/90 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-electric/35 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(59,130,246,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/games/${game.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={`Portada de ${game.title}`}
              fill
              priority={priority}
              className="object-cover transition duration-500 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 220px"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-electric/15 via-surface to-violet/15 p-4 text-center font-display text-sm font-bold text-muted">
              {game.title}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          <div className="absolute left-2.5 top-2.5">
            <RatingBadge score={game.userScore} compact />
          </div>
          {game.status !== "released" && (
            <Badge
              tone={game.status === "upcoming" ? "lime" : "violet"}
              className="absolute bottom-2.5 left-2.5 bg-[#080A12]/80 backdrop-blur-md"
            >
              {game.status === "upcoming" ? "Próximo" : "Early Access"}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors duration-150 group-hover:text-blue-300">
            {game.title}
          </h3>
          <p className="line-clamp-1 text-[11.5px] text-muted/80">
            {yearLabel}
            {byline ? ` · ${byline}` : ""}
          </p>
          {game.genres.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {genreLabelList(game.genres).slice(0, 2).map((genre) => (
                <Badge key={genre} tone="muted" className="px-2 py-0.5 text-[10.5px]">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
