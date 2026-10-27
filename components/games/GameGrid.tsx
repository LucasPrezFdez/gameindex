import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/data/games";
import { GameCard } from "@/components/games/GameCard";
import { Badge } from "@/components/ui/Badge";
import { RatingBadge } from "@/components/ratings/RatingBadge";
import { genreLabelList, platformLabelList } from "@/lib/labels";
import { formatCompactNumber, prioritizePlatform } from "@/lib/utils";

export function GameGrid({
  games,
  view = "grid",
  highlightPlatform
}: {
  games: Game[];
  view?: "grid" | "list";
  highlightPlatform?: string | null;
}) {
  if (view === "list") {
    return (
      <div className="space-y-3">
        {games.map((game, index) => (
          <GameListRow key={game.slug} game={game} priority={index < 3} highlightPlatform={highlightPlatform} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {games.map((game, index) => (
        <GameCard key={game.slug} game={game} priority={index < 4} highlightPlatform={highlightPlatform} />
      ))}
    </div>
  );
}

function GameListRow({
  game,
  priority,
  highlightPlatform
}: {
  game: Game;
  priority?: boolean;
  highlightPlatform?: string | null;
}) {
  const yearLabel = game.year > 0 ? String(game.year) : "Por anunciar";
  const platforms = platformLabelList(prioritizePlatform(game.platforms, highlightPlatform)).slice(0, 3);
  const meta = [yearLabel, game.developer, platforms.join(", ")].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/games/${game.slug}`}
      className="surface-card group grid grid-cols-[72px_1fr] gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5 hover:border-electric/45 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:grid-cols-[86px_1fr_auto] sm:items-center"
    >
      <div className="relative aspect-[3/4] w-[72px] overflow-hidden rounded-xl bg-white/5 sm:w-[86px]">
        {game.coverUrl && (
          <Image src={game.coverUrl} alt={`Portada de ${game.title}`} fill priority={priority} className="object-cover" sizes="86px" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-black transition-colors group-hover:text-blue-300 sm:text-lg">{game.title}</h3>
          {game.status !== "released" && (
            <Badge tone={game.status === "upcoming" ? "lime" : "violet"}>
              {game.status === "upcoming" ? "Próximo" : "Early Access"}
            </Badge>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{meta}</p>
        {game.summary && (
          <div className="hidden sm:block">
            <p className="mt-2 line-clamp-2 text-sm text-muted">{game.summary}</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {genreLabelList(game.genres).slice(0, 4).map((genre) => (
            <Badge key={genre} tone="muted">
              {genre}
            </Badge>
          ))}
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-3 sm:col-span-1 sm:flex-col sm:items-end">
        <RatingBadge score={game.userScore} label="Usuarios" />
        {game.ratings > 0 && (
          <span className="text-xs text-muted">{formatCompactNumber(game.ratings)} valoraciones</span>
        )}
      </div>
    </Link>
  );
}
