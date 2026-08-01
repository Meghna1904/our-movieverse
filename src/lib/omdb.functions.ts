import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OMDB_BASE = "https://www.omdbapi.com";

function getKey() {
  const key = process.env.OMDB_API_KEY;
  if (!key) throw new Error("OMDB_API_KEY is not set in environment variables.");
  return key;
}

/** Shape returned by OMDb search results list */
export type OmdbSearchResult = {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string; // "N/A" or a URL
  Type: string;
};

/** Full movie details from OMDb */
export type OmdbMovieDetail = {
  imdbID: string;
  Title: string;
  Year: string;
  Runtime: string; // e.g. "169 min"
  Genre: string;   // e.g. "Adventure, Drama, Sci-Fi"
  Plot: string;
  Director: string;
  Actors: string;
  imdbRating: string; // e.g. "8.7"
  Poster: string;     // URL or "N/A"
  Type: string;
};

/** Search OMDb for movies by title — returns up to 5 results */
export const searchOmdb = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().trim().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./session.server");
    await requireUnlocked();

    const key = getKey();
    const url = `${OMDB_BASE}/?apikey=${key}&type=movie&s=${encodeURIComponent(data.query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OMDb search request failed");
    const json = (await res.json()) as { Response: string; Search?: OmdbSearchResult[]; Error?: string };

    if (json.Response === "False") return [] as OmdbSearchResult[];
    return (json.Search ?? []).slice(0, 5) as OmdbSearchResult[];
  });

/** Fetch full details for a specific movie by IMDb ID */
export const getOmdbDetail = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ imdbID: z.string().trim().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./session.server");
    await requireUnlocked();

    const key = getKey();
    const url = `${OMDB_BASE}/?apikey=${key}&i=${encodeURIComponent(data.imdbID)}&plot=short`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OMDb detail request failed");
    const json = (await res.json()) as OmdbMovieDetail & { Response: string };
    if (json.Response === "False") throw new Error("Movie not found on OMDb");
    return json as OmdbMovieDetail;
  });
