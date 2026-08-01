import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GENRES, MOODS, PLATFORMS } from "@/lib/format";
import type { MovieInput } from "@/lib/movies.functions";
import { cn } from "@/lib/utils";
import { searchOmdb, getOmdbDetail } from "@/lib/omdb.functions";
import { proxyImage } from "@/lib/image.functions";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OmdbSearchResult } from "@/lib/omdb.functions";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  year: z.coerce.number().int().min(1888).max(2100).optional().or(z.literal("")),
  runtime: z.coerce.number().int().min(1).max(1000).optional().or(z.literal("")),
  poster_url: z.string().trim().max(2000).optional(),
  overview: z.string().max(4000).optional(),
  genre: z.array(z.string()),
  added_by: z.enum(["whiskeyy", "matildaa"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  streaming_platform: z.string().optional(),
  expected_mood: z.string().optional(),
  status: z.enum(["watchlist", "watched"]).default("watchlist"),
  watched_date: z.string().optional(),
});

export type MovieFormValues = z.infer<typeof schema>;

// Parse runtime string like "169 min" → 169
function parseRuntime(s: string): number | undefined {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : undefined;
}

// Parse year string like "2014" or "2014–2016" → 2014
function parseYear(s: string): number | undefined {
  const m = s.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : undefined;
}

// Split "Adventure, Drama, Sci-Fi" into array, filter against known GENRES
function parseGenres(s: string): string[] {
  return s
    .split(",")
    .map((g) => g.trim())
    .filter((g) => GENRES.includes(g));
}

// Returns true if URL is already in Supabase Storage (no need to re-proxy)
function isSupabaseUrl(url: string): boolean {
  return url.includes(".supabase.co/storage/");
}

export function MovieForm({
  defaults,
  onSubmit,
  submitting,
}: {
  defaults?: Partial<MovieFormValues>;
  onSubmit: (values: MovieInput) => void | Promise<void>;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      genre: [],
      added_by: "whiskeyy",
      priority: "medium",
      status: "watchlist",
      watched_date: "",
      ...defaults,
    },
  });

  const posterUrl = watch("poster_url");
  const status = watch("status");
  const isWatched = status === "watched";

  // ── OMDb search state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OmdbSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useServerFn(searchOmdb);
  const doDetail = useServerFn(getOmdbDetail);
  const doProxy = useServerFn(proxyImage);

  // Debounced search — fires 500 ms after user stops typing
  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      setSearchResults([]);
      setShowDropdown(false);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q.trim()) return;

      debounceRef.current = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const results = await doSearch({ data: { query: q.trim() } });
          setSearchResults(results);
          setShowDropdown(results.length > 0);
        } catch {
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
    },
    [doSearch],
  );

  // Click outside → close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When a search result is selected → fetch full details and auto-fill form
  async function handleSelectResult(result: OmdbSearchResult) {
    setShowDropdown(false);
    setSearchQuery(`${result.Title} (${result.Year})`);
    setDetailLoading(true);
    try {
      const detail = await doDetail({ data: { imdbID: result.imdbID } });

      setValue("title", detail.Title);

      const yr = parseYear(detail.Year);
      if (yr) setValue("year", yr);

      const rt = parseRuntime(detail.Runtime);
      if (rt) setValue("runtime", rt);

      if (detail.Plot && detail.Plot !== "N/A") setValue("overview", detail.Plot);

      const genres = parseGenres(detail.Genre);
      if (genres.length > 0) setValue("genre", genres);

      if (detail.Poster && detail.Poster !== "N/A") {
        setValue("poster_url", detail.Poster);
      }
    } catch {
      // silently ignore — user can fill manually
    } finally {
      setDetailLoading(false);
    }
  }

  // On submit: proxy poster if it's an external URL, then call onSubmit
  async function handleFormSubmit(v: MovieFormValues) {
    let finalPosterUrl = v.poster_url?.trim() || null;

    if (finalPosterUrl && !isSupabaseUrl(finalPosterUrl)) {
      try {
        const { publicUrl } = await doProxy({ data: { url: finalPosterUrl } });
        finalPosterUrl = publicUrl;
      } catch {
        // If proxy fails, fall back to original URL
      }
    }

    return onSubmit({
      title: v.title,
      year: v.year === "" || v.year == null ? null : Number(v.year),
      runtime: v.runtime === "" || v.runtime == null ? null : Number(v.runtime),
      poster_url: finalPosterUrl,
      overview: v.overview?.trim() || null,
      genre: v.genre ?? [],
      added_by: v.added_by,
      priority: v.priority ?? null,
      streaming_platform: v.streaming_platform?.trim() || null,
      expected_mood: v.expected_mood?.trim() || null,
      status: v.status ?? "watchlist",
      watched_date: v.status === "watched" ? (v.watched_date?.trim() || null) : null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid gap-6 md:grid-cols-[180px_1fr]"
    >
      {/* Poster preview */}
      <div className="space-y-2">
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary border border-border">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs text-muted-foreground px-3 text-center">
              {detailLoading ? "Loading poster…" : "Poster preview appears here"}
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs">Poster image URL</Label>
          <Input
            {...register("poster_url")}
            placeholder="https://…jpg"
            className="mt-1 bg-input border-border"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Any URL works — Google, IMDb, etc. It'll be uploaded to your storage automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-4">

        {/* ── OMDb Search ──────────────────────────────────────────────── */}
        <div className="relative" ref={dropdownRef}>
          <Label className="text-xs font-semibold text-primary">
            🔍 Search &amp; auto-fill from OMDb
          </Label>
          <div className="relative mt-1">
            <Input
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Type a movie title to auto-fill details…"
              className="bg-input border-border pr-8"
              autoComplete="off"
            />
            {(searchLoading || detailLoading) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-pulse text-xs">
                ⏳
              </span>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={r.imdbID}
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted transition-colors"
                >
                  {r.Poster && r.Poster !== "N/A" ? (
                    <img
                      src={r.Poster}
                      alt={r.Title}
                      className="w-8 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-12 rounded bg-secondary flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.Title}</p>
                    <p className="text-xs text-muted-foreground">{r.Year}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="mt-1 text-[10px] text-muted-foreground">
            Select a result to auto-fill title, year, runtime, genre, plot &amp; poster. You can edit anything after.
          </p>
        </div>

        <div className="border-t border-border" />

        {/* ── Add to: Watchlist / Already Watched ──────────────────────── */}
        <div>
          <Label className="text-xs font-semibold">Add to</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div className="mt-1.5 inline-flex gap-1 p-1 bg-input rounded-full border border-border">
                {(["watchlist", "watched"] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => field.onChange(s)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium transition",
                      field.value === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s === "watchlist" ? "📋 Watchlist" : "✅ Already Watched"}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Optional watched date — only when Already Watched is selected */}
        {isWatched && (
          <div className="animate-fade-in">
            <Label>
              When did you watch it?{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="date"
              {...register("watched_date")}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-1 bg-input border-border"
            />
          </div>
        )}

        {/* Title */}
        <div>
          <Label>Title *</Label>
          <Input
            {...register("title")}
            placeholder="e.g. Interstellar"
            className="mt-1 bg-input border-border"
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              {...register("year")}
              placeholder="2014"
              className="mt-1 bg-input border-border"
            />
          </div>
          <div>
            <Label>Runtime (min)</Label>
            <Input
              type="number"
              {...register("runtime")}
              placeholder="169"
              className="mt-1 bg-input border-border"
            />
          </div>
        </div>

        <div>
          <Label>Genres</Label>
          <Controller
            control={control}
            name="genre"
            render={({ field }) => (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GENRES.map((g) => {
                  const on = field.value?.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() =>
                        field.onChange(
                          on
                            ? field.value.filter((x: string) => x !== g)
                            : [...(field.value ?? []), g],
                        )
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition",
                        on
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <div>
          <Label>Overview / synopsis</Label>
          <Textarea
            {...register("overview")}
            rows={3}
            className="mt-1 bg-input border-border resize-none"
            placeholder="A short summary…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Added by</Label>
            <Controller
              control={control}
              name="added_by"
              render={({ field }) => (
                <div className="mt-1 grid grid-cols-2 gap-1 p-1 bg-input rounded-full border border-border">
                  {(["whiskeyy", "matildaa"] as const).map((who) => (
                    <button
                      type="button"
                      key={who}
                      onClick={() => field.onChange(who)}
                      className={cn(
                        "py-1.5 rounded-full text-xs capitalize transition",
                        field.value === who
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {who}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <div className="mt-1 grid grid-cols-3 gap-1 p-1 bg-input rounded-full border border-border">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => field.onChange(p)}
                      className={cn(
                        "py-1.5 rounded-full text-xs capitalize transition",
                        field.value === p
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Where to watch</Label>
            <Controller
              control={control}
              name="streaming_platform"
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value ?? ""}
                  className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm"
                >
                  <option value="">—</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <Label>Expected mood</Label>
            <Controller
              control={control}
              name="expected_mood"
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value ?? ""}
                  className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm"
                >
                  <option value="">—</option>
                  {MOODS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitting || detailLoading}
            className="rounded-full h-11 px-6 bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Saving…" : detailLoading ? "Loading details…" : isWatched ? "Save as Watched" : "Add to Watchlist"}
          </Button>
        </div>
      </div>
    </form>
  );
}
