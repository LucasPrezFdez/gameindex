"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Game } from "@/data/games";
import { cn } from "@/lib/utils";

export function GameSearchBar({ compact = false, initialQuery = "" }: { compact?: boolean; initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const inputId = `search-${id}`;
  const listboxId = `search-results-${id}`;
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Cierra el desplegable al navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/games?q=${encodeURIComponent(normalizedQuery)}&pageSize=6`, {
          signal: controller.signal
        });
        const payload = response.ok ? await response.json().catch(() => null) : null;
        if (controller.signal.aborted) return;
        setResults(Array.isArray(payload?.games) ? payload.games : []);
        setActiveIndex(-1);
        setSearched(true);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Atajo "/" para enfocar el buscador del header.
  useEffect(() => {
    if (!compact) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const input = inputRef.current;
      if (!input || input.offsetParent === null) return;
      event.preventDefault();
      input.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compact]);

  function goToResults() {
    setOpen(false);
    inputRef.current?.blur();
    router.push(normalizedQuery ? `/games?q=${encodeURIComponent(normalizedQuery)}` : "/games");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const active = activeIndex >= 0 ? results[activeIndex] : null;
    if (active && open) {
      setOpen(false);
      setQuery("");
      router.push(`/games/${active.slug}`);
      return;
    }
    goToResults();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      } else if (query) {
        setQuery("");
      }
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    }
  }

  const showPanel = open && normalizedQuery.length >= 2 && (loading || searched);

  return (
    <form ref={formRef} className="relative" onSubmit={handleSubmit} role="search">
      <label className="sr-only" htmlFor={inputId}>
        Buscar videojuegos, estudios, sagas o creadores
      </label>
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted/70",
          compact ? "left-3.5" : "left-4"
        )}
        aria-hidden
      >
        {loading ? <Spinner /> : <SearchIcon size={compact ? 15 : 18} />}
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={compact ? "Buscar juegos, estudios, sagas…" : "Busca videojuegos, estudios, sagas o creadores"}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted/80 transition focus:border-electric focus:bg-white/[0.07] [&::-webkit-search-cancel-button]:hidden",
          compact ? "h-10 pl-10 pr-10 text-[13.5px]" : "h-14 rounded-2xl pl-12 pr-12 text-base"
        )}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-white/10 hover:text-foreground"
          aria-label="Borrar búsqueda"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : (
        compact && (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10.5px] text-muted lg:block">
            /
          </kbd>
        )
      )}

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-elevated shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {loading && results.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3.5 text-sm text-muted">
              <Spinner />
              Buscando en el catálogo…
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="px-4 py-3.5 text-sm text-muted">
              Sin coincidencias para <span className="font-semibold text-foreground">“{normalizedQuery}”</span>.
            </div>
          )}
          {results.length > 0 && (
            <ul id={listboxId} role="listbox" aria-label="Sugerencias" className="py-1">
              {results.map((game, index) => (
                <li key={game.slug} id={`${listboxId}-${index}`} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={`/games/${game.slug}`}
                    tabIndex={-1}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors duration-100 hover:bg-white/[0.07]",
                      index === activeIndex && "bg-white/[0.08]"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="relative block h-11 w-8 flex-shrink-0 overflow-hidden rounded-md bg-white/5">
                      {game.coverUrl && <Image src={game.coverUrl} alt="" fill sizes="32px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{game.title}</span>
                      <span className="block truncate text-xs text-muted/80">
                        {game.year || "Por anunciar"}
                        {game.developer ? ` · ${game.developer}` : ""}
                      </span>
                    </span>
                    {game.userScore > 0 && (
                      <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-blue-300">
                        {game.userScore.toFixed(1)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {results.length > 0 && (
            <button
              type="button"
              onClick={goToResults}
              className="flex w-full items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-left text-[13px] font-semibold text-blue-300 transition hover:bg-white/[0.05]"
            >
              Ver todos los resultados
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </form>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin text-electric/70" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
