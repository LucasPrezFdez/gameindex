"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

export function ReviewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "popular";
  const spoilers = searchParams.get("spoilers") ?? "all";

  function update(key: "sort" | "spoilers", value: string, defaultValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select aria-label="Ordenar reseñas" value={sort} onChange={(event) => update("sort", event.target.value, "popular")}>
        <option value="popular">Más útiles</option>
        <option value="recent">Más recientes</option>
        <option value="score-high">Nota más alta</option>
        <option value="score-low">Nota más baja</option>
      </Select>
      <Select aria-label="Filtrar spoilers" value={spoilers} onChange={(event) => update("spoilers", event.target.value, "all")}>
        <option value="all">Todas (spoilers ocultos)</option>
        <option value="none">Sin spoilers</option>
        <option value="only">Solo con spoilers</option>
      </Select>
    </div>
  );
}
