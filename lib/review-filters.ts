// Compartido entre el selector cliente (ReviewFilters) y la página de reseñas (servidor).
// Va en un módulo aparte porque los valores exportados desde un archivo "use client"
// no se pueden usar como datos en un componente de servidor.
export const REVIEW_SORTS = ["popular", "recent", "score-high", "score-low"] as const;
export const REVIEW_SPOILER_FILTERS = ["all", "none", "only"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];
export type ReviewSpoilerFilter = (typeof REVIEW_SPOILER_FILTERS)[number];
