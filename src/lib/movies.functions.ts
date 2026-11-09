import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StatusEnum = z.enum(["watchlist", "watched"]);
const AddedByEnum = z.enum(["whiskeyy", "matildaa"]);
const PriorityEnum = z.enum(["low", "medium", "high"]);

const MovieInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  year: z.number().int().min(1888).max(2100).nullable().optional(),
  genre: z.array(z.string().max(40)).max(10).default([]),
  poster_url: z.string().trim().max(2000).nullable().optional(),
  backdrop_url: z.string().trim().max(2000).nullable().optional(),
  overview: z.string().max(4000).nullable().optional(),
  runtime: z.number().int().min(1).max(1000).nullable().optional(),
  status: StatusEnum.default("watchlist"),
  added_by: AddedByEnum,
  priority: PriorityEnum.nullable().optional(),
  streaming_platform: z.string().max(60).nullable().optional(),
  expected_mood: z.string().max(60).nullable().optional(),
  watched_date: z.string().nullable().optional(),
  my_rating: z.number().min(0).max(10).multipleOf(0.5).nullable().optional(),
  his_rating: z.number().min(0).max(10).multipleOf(0.5).nullable().optional(),
  favorite_scene: z.string().max(2000).nullable().optional(),
  funny_memory: z.string().max(2000).nullable().optional(),
  recommended_by: z.string().max(60).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  mood_afterwards: z.string().max(60).nullable().optional(),
  favorite_quote: z.string().max(500).nullable().optional(),
  photo_url: z.string().max(2000).nullable().optional(),
});

export type MovieInput = z.infer<typeof MovieInputSchema>;

export type Movie = MovieInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

async function svc() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function gate() {
  const { requireUnlocked } = await import("./session.server");
  return requireUnlocked();
}

export const listMovies = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ status: StatusEnum.optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    await gate();
    const s = await svc();
    let q = s.from("movies").select("*");
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows as Movie[];
  });

export const getMovie = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await gate();
    const s = await svc();
    const { data: row, error } = await s.from("movies").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row as Movie | null;
  });

export const addMovie = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => MovieInputSchema.parse(data))
  .handler(async ({ data }) => {
    await gate();
    const s = await svc();
    const { data: row, error } = await s.from("movies").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row as Movie;
  });

export const updateMovie = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: MovieInputSchema.partial(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await gate();
    const s = await svc();
    const { data: row, error } = await s
      .from("movies")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Movie;
  });

export const deleteMovie = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await gate();
    const s = await svc();
    const { error } = await s.from("movies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  await gate();
  const s = await svc();
  const { data: rows, error } = await s.from("movies").select("*");
  if (error) throw new Error(error.message);
  const movies = (rows ?? []) as Movie[];
  const watched = movies.filter((m) => m.status === "watched");
  const watchlist = movies.filter((m) => m.status === "watchlist");
  const now = new Date();
  const thisYear = watched.filter(
    (m) => m.watched_date && new Date(m.watched_date).getFullYear() === now.getFullYear(),
  );
  const thisMonth = thisYear.filter(
    (m) => m.watched_date && new Date(m.watched_date).getMonth() === now.getMonth(),
  );

  const avg = (xs: Array<number | null | undefined>) => {
    const v = xs.filter((n): n is number => typeof n === "number");
    return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null;
  };

  const genreCount: Record<string, number> = {};
  for (const m of watched)
    for (const g of m.genre ?? []) genreCount[g] = (genreCount[g] ?? 0) + 1;
  const favoriteGenre =
    Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const hoursWatched = Math.round(
    watched.reduce((a, m) => a + (m.runtime ?? 0), 0) / 60,
  );

  return {
    totalWatched: watched.length,
    totalWatchlist: watchlist.length,
    avgRating: avg(watched.flatMap((m) => [m.my_rating, m.his_rating])),
    myAvg: avg(watched.map((m) => m.my_rating)),
    hisAvg: avg(watched.map((m) => m.his_rating)),
    favoriteGenre,
    hoursWatched,
    thisYear: thisYear.length,
    thisMonth: thisMonth.length,
    addedByWhiskeyy: movies.filter((m) => m.added_by === "whiskeyy").length,
    addedByMatildaa: movies.filter((m) => m.added_by === "matildaa").length,
    genreBreakdown: genreCount,
  };
});
