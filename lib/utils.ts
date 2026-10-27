export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

/** "2015-05-19" → "19 de mayo de 2015". Devuelve el texto original si no es una fecha ISO. */
export function formatReleaseDate(value?: string | null) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function prioritizePlatform(platforms: string[], highlight?: string | null) {
  if (!highlight) return platforms;
  const target = slugify(highlight);
  if (!target) return platforms;
  const matchIndex = platforms.findIndex((platform) => slugify(platform) === target);
  if (matchIndex <= 0) return platforms;
  const reordered = [...platforms];
  const [match] = reordered.splice(matchIndex, 1);
  reordered.unshift(match);
  return reordered;
}

/** Solo borde + color de texto: para badges que van sobre imágenes con fondo propio. */
export function scoreAccent(score?: number | null) {
  if (!score) return "border-white/15 text-muted";
  if (score >= 9) return "border-lime/50 text-lime";
  if (score >= 8) return "border-electric/50 text-blue-300";
  if (score >= 7) return "border-violet/50 text-violet-300";
  return "border-danger/50 text-rose-300";
}

export function scoreTone(score?: number | null) {
  if (!score) return "border-white/10 bg-white/5 text-muted";
  if (score >= 9) return "border-lime/40 bg-lime/10 text-lime";
  if (score >= 8) return "border-electric/40 bg-electric/10 text-electric";
  if (score >= 7) return "border-violet/40 bg-violet/10 text-violet";
  return "border-danger/40 bg-danger/10 text-danger";
}
