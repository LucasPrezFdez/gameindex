// Etiquetas en español para los géneros y plataformas que llegan de IGDB / RAWG.
// Solo afectan a lo que se muestra: los valores originales se siguen usando en
// filtros, URLs y consultas.

const genreLabels: Record<string, string> = {
  action: "Acción",
  adventure: "Aventura",
  arcade: "Arcade",
  "board games": "Juegos de mesa",
  card: "Cartas",
  "card & board game": "Cartas y tablero",
  casual: "Casual",
  educational: "Educativo",
  family: "Familiar",
  fighting: "Lucha",
  "hack and slash/beat 'em up": "Hack and slash",
  horror: "Terror",
  indie: "Indie",
  "massively multiplayer": "MMO",
  mmo: "MMO",
  moba: "MOBA",
  music: "Música",
  pinball: "Pinball",
  platform: "Plataformas",
  platformer: "Plataformas",
  "point-and-click": "Point & click",
  puzzle: "Puzle",
  "quiz/trivia": "Preguntas",
  racing: "Carreras",
  "real time strategy (rts)": "Estrategia en tiempo real",
  "role-playing (rpg)": "RPG",
  rpg: "RPG",
  shooter: "Shooter",
  simulation: "Simulación",
  simulator: "Simulación",
  sport: "Deportes",
  sports: "Deportes",
  strategy: "Estrategia",
  survival: "Supervivencia",
  tactical: "Táctico",
  "turn-based strategy (tbs)": "Estrategia por turnos",
  "visual novel": "Novela visual"
};

const platformLabels: Record<string, string> = {
  "pc (microsoft windows)": "PC",
  "pc (windows)": "PC",
  mac: "macOS",
  "android": "Android",
  "ios": "iOS",
  "web browser": "Navegador"
};

export function genreLabel(genre: string) {
  return genreLabels[genre.trim().toLowerCase()] ?? genre;
}

export function platformLabel(platform: string) {
  return platformLabels[platform.trim().toLowerCase()] ?? platform;
}

/** Traduce y elimina duplicados que aparecen tras traducir (p. ej. "Sport" y "Sports"). */
export function genreLabelList(genres: string[]) {
  return Array.from(new Set(genres.map(genreLabel)));
}

export function platformLabelList(platforms: string[]) {
  return Array.from(new Set(platforms.map(platformLabel)));
}
