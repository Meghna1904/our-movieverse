export function formatRuntime(minutes?: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function todayLong() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music",
  "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western",
];

export const MOODS = [
  "Cozy", "Adventurous", "Romantic", "Scary", "Weepy",
  "Funny", "Mind-bending", "Nostalgic", "Epic", "Chill",
];

export const PLATFORMS = [
  "Netflix", "Prime Video", "Disney+", "Hotstar", "Apple TV+",
  "HBO Max", "JioCinema", "Sony Liv", "Zee5", "YouTube", "Other",
];
