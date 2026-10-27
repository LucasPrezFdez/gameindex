import { cn, scoreAccent } from "@/lib/utils";

export function RatingBadge({
  score,
  label = "Usuarios",
  compact = false
}: {
  score?: number | null;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border bg-[#080A12]/80 px-2 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.45)] backdrop-blur-md",
        scoreAccent(score)
      )}
      aria-label={`${label}: ${score ? score.toFixed(1) : "sin puntuación"}`}
    >
      <span className="font-mono text-[13px] font-bold tabular-nums leading-none">
        {score ? score.toFixed(1) : "–"}
      </span>
      {!compact && (
        <span className="text-xs font-medium leading-none text-foreground/75">
          {label}
        </span>
      )}
    </div>
  );
}
