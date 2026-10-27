import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterSidebar } from "@/components/games/FilterSidebar";
import { GameGrid } from "@/components/games/GameGrid";
import { GameSearchBar } from "@/components/games/GameSearchBar";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Button } from "@/components/ui/Button";
import type { GameSort } from "@/data/games";
import { genreLabel, platformLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { getExploreGames, type ExploreGamesResult } from "@/services/games";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Explorar videojuegos",
  description: "Busca videojuegos por plataforma, género, año, desarrolladora, modo de juego, puntuación y estado."
};

const statusLabels: Record<string, string> = {
  released: "Lanzado",
  upcoming: "Próximo",
  early_access: "Early Access"
};

const sortLabels: Record<GameSort, string> = {
  popular: "Popularidad",
  score: "Mejor puntuados",
  recent: "Más recientes",
  upcoming: "Próximos lanzamientos",
  reviewed: "Más reseñados"
};

export default async function GamesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = getSingleParam(params.q ?? params.search);
  const page = getPositivePage(getSingleParam(params.page));
  const platform = getSingleParam(params.platform);
  const genre = getSingleParam(params.genre);
  const status = getSingleParam(params.status);
  const year = getOptionalNumber(getSingleParam(params.year));
  const scoreMin = getOptionalNumber(getSingleParam(params.scoreMin));
  const sort = getSort(getSingleParam(params.sort));
  const view = getSingleParam(params.view) === "list" ? "list" : "grid";
  const gamesResult = await getExploreGames({ query, page, platform, genre, status, year, scoreMin, sort });
  const firstResult = gamesResult.count === 0 ? 0 : (gamesResult.page - 1) * gamesResult.pageSize + 1;
  const lastResult = Math.min(gamesResult.page * gamesResult.pageSize, gamesResult.count);

  const activeFilters = [
    platform && { key: "platform", label: platformLabel(platform) },
    genre && { key: "genre", label: genreLabel(genre) },
    status && { key: "status", label: statusLabels[status] ?? status },
    year && { key: "year", label: String(year) },
    scoreMin && { key: "scoreMin", label: `Nota ${scoreMin}+` },
    query && { key: "q", label: `“${query}”` }
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Catálogo"
        title={query ? `Resultados para “${query}”` : "Explora el catálogo"}
      />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
        <div>
          <FilterSidebar />
        </div>

        <div className="min-w-0 space-y-5">
          <GameSearchBar initialQuery={query ?? ""} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">{gamesResult.count.toLocaleString("es-ES")}</span> videojuegos
                {gamesResult.count > 0 ? ` · ${firstResult.toLocaleString("es-ES")}–${lastResult.toLocaleString("es-ES")}` : ""}
                {sort && sort !== "popular" ? ` · ${sortLabels[sort]}` : ""}
              </p>
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter) => (
                    <Link
                      key={filter.key}
                      href={buildGamesUrl(params, { [filter.key]: undefined, ...(filter.key === "q" ? { search: undefined } : {}), page: undefined })}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-violet/40 bg-violet/10 py-1 pl-3 pr-2 text-xs font-medium text-violet-200 transition hover:border-violet/70 hover:bg-violet/20"
                      aria-label={`Quitar filtro ${filter.label}`}
                    >
                      {filter.label}
                      <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-white/10 text-[10px] leading-none group-hover:bg-white/20">
                        ✕
                      </span>
                    </Link>
                  ))}
                  {activeFilters.length > 1 && (
                    <Link href={buildGamesUrl({ view: params.view, sort: params.sort }, {})} className="text-xs font-medium text-muted underline-offset-4 hover:text-foreground hover:underline">
                      Limpiar todo
                    </Link>
                  )}
                </div>
              )}
            </div>
            <ViewToggle params={params} view={view} />
          </div>

          {gamesResult.error && gamesResult.games.length === 0 && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-rose-200">{gamesResult.error}</p>
          )}

          {gamesResult.games.length ? (
            <>
              <GameGrid games={gamesResult.games} view={view} />
              <Pagination params={params} result={gamesResult} />
            </>
          ) : (
            <EmptyState
              title="No hay resultados"
              body={
                activeFilters.length
                  ? "Ningún juego coincide con esta combinación. Prueba a quitar algún filtro o a buscar otro término."
                  : "El catálogo no está disponible ahora mismo. Vuelve a intentarlo en unos minutos."
              }
              action={
                activeFilters.length ? (
                  <Button asChild href="/games" variant="secondary">
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          )}

          <SourceNote source={gamesResult.source} />
        </div>
      </div>
    </section>
  );
}

function ViewToggle({ params, view }: { params: Params; view: "grid" | "list" }) {
  const options = [
    { value: "grid", label: "Cuadrícula", icon: <GridIcon /> },
    { value: "list", label: "Lista", icon: <ListIcon /> }
  ] as const;
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1" role="group" aria-label="Modo de vista">
      {options.map((option) => {
        const active = view === option.value;
        return (
          <Link
            key={option.value}
            href={buildGamesUrl(params, { view: option.value === "grid" ? undefined : option.value })}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition",
              active ? "bg-electric text-white shadow-[0_0_18px_rgba(59,130,246,0.35)]" : "text-muted hover:bg-white/[0.07] hover:text-foreground"
            )}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SourceNote({ source }: { source: ExploreGamesResult["source"] }) {
  if (source === "none") return null;
  const credit =
    source === "igdb" ? (
      <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-foreground hover:underline">IGDB</a>
    ) : source === "rawg" ? (
      <a href="https://rawg.io" target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-foreground hover:underline">RAWG</a>
    ) : source === "fallback" ? (
      "catálogo local de demostración"
    ) : (
      "IGDB y RAWG"
    );
  return <p className="pt-2 text-center text-xs text-muted/60">Datos de {credit}</p>;
}

function Pagination({ params, result }: { params: Params; result: ExploreGamesResult }) {
  const { previousPage, nextPage, page, pageSize, count } = result;
  if (!previousPage && !nextPage) return null;
  const totalPages = Math.max(page, Math.ceil(count / Math.max(pageSize, 1)));
  const pages = paginationRange(page, totalPages);

  const baseClass = "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition";
  const idleClass = "border-white/10 bg-white/[0.04] text-muted hover:border-white/20 hover:bg-white/[0.08] hover:text-foreground";
  const disabledClass = "pointer-events-none border-white/5 text-muted/40";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-4" aria-label="Paginación">
      {previousPage ? (
        <Link href={buildGamesUrl(params, { page: previousPage })} className={cn(baseClass, idleClass)} rel="prev">
          ← <span className="ml-1 hidden sm:inline">Anterior</span>
        </Link>
      ) : (
        <span className={cn(baseClass, disabledClass)} aria-disabled="true">
          ← <span className="ml-1 hidden sm:inline">Anterior</span>
        </span>
      )}

      {pages.map((entry, index) =>
        entry === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-muted/50" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildGamesUrl(params, { page: entry })}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              baseClass,
              entry === page ? "border-electric/60 bg-electric/15 text-foreground" : idleClass,
              Math.abs(entry - page) > 1 && entry !== 1 && entry !== totalPages && "hidden sm:inline-flex"
            )}
          >
            {entry}
          </Link>
        )
      )}

      {nextPage ? (
        <Link href={buildGamesUrl(params, { page: nextPage })} className={cn(baseClass, idleClass)} rel="next">
          <span className="mr-1 hidden sm:inline">Siguiente</span> →
        </Link>
      ) : (
        <span className={cn(baseClass, disabledClass)} aria-disabled="true">
          <span className="mr-1 hidden sm:inline">Siguiente</span> →
        </span>
      )}
    </nav>
  );
}

function paginationRange(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1, current - 2, current + 2]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const output: Array<number | "…"> = [];
  for (const value of sorted) {
    const previous = output[output.length - 1];
    if (typeof previous === "number" && value - previous > 1) output.push("…");
    output.push(value);
  }
  return output;
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPositivePage(value: string | undefined) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getOptionalNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function getSort(value: string | undefined): GameSort | undefined {
  return value === "popular" || value === "score" || value === "recent" || value === "upcoming" || value === "reviewed" ? value : undefined;
}

function buildGamesUrl(params: Params, overrides: Record<string, string | number | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const single = getSingleParam(value);
    if (single) next.set(key, single);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  if (next.get("page") === "1") next.delete("page");
  const query = next.toString();
  return query ? `/games?${query}` : "/games";
}
