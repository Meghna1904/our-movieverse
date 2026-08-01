import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { MarkWatchedDialog } from "@/components/MarkWatchedDialog";
import { getSessionStatus } from "@/lib/gate.functions";
import { getMovie, updateMovie, deleteMovie } from "@/lib/movies.functions";
import { formatDate, formatRuntime, GENRES, MOODS, PLATFORMS } from "@/lib/format";
import { ArrowLeft, Calendar, Clock, Star, Trash2, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/lib/movies.functions";

export const Route = createFileRoute("/movie/$id")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who as "whiskeyy" | "matildaa" };
  },
  head: () => ({
    meta: [
      { title: "Movie — The Movieverse" },
      { name: "description", content: "A memory from our little cinema." },
    ],
  }),
  component: MovieDetail,
});

// ── Inline star rating ────────────────────────────────────────────────────────
function RatingStars({
  value,
  onChange,
  color = "gold",
  disabled = false,
}: {
  value?: number | null;
  onChange?: (v: number) => void;
  color?: "gold" | "lavender";
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {Array.from({ length: 10 }).map((_, i) => {
        const v = i + 1;
        const active = value != null && v <= value;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange?.(v)}
            className={cn(
              "p-0.5 transition-transform",
              !disabled && "hover:scale-125 cursor-pointer",
              disabled && "cursor-default",
            )}
          >
            <Star
              className={cn(
                "w-5 h-5",
                active
                  ? color === "gold"
                    ? "fill-primary text-primary"
                    : "fill-lavender text-lavender"
                  : "text-muted-foreground/30",
              )}
            />
          </button>
        );
      })}
      {value != null && (
        <span className="ml-2 font-mono text-sm text-muted-foreground">{value}/10</span>
      )}
    </div>
  );
}

// ── Edit form schema ──────────────────────────────────────────────────────────
const editSchema = z.object({
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
  // Watched-only fields
  watched_date: z.string().optional(),
  my_rating: z.coerce.number().min(0).max(10).optional().or(z.literal("")),
  his_rating: z.coerce.number().min(0).max(10).optional().or(z.literal("")),
  favorite_scene: z.string().max(2000).optional(),
  funny_memory: z.string().max(2000).optional(),
  favorite_quote: z.string().max(500).optional(),
  notes: z.string().max(4000).optional(),
  mood_afterwards: z.string().optional(),
  recommended_by: z.string().max(60).optional(),
});
type EditValues = z.infer<typeof editSchema>;

// ── Edit panel ────────────────────────────────────────────────────────────────
function EditPanel({
  movie,
  who,
  onSaved,
  onCancel,
}: {
  movie: Movie;
  who: "whiskeyy" | "matildaa";
  onSaved: () => void;
  onCancel: () => void;
}) {
  const update = useServerFn(updateMovie);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: movie.title ?? "",
      year: (movie.year ?? "") as number | "",
      runtime: (movie.runtime ?? "") as number | "",
      poster_url: movie.poster_url ?? "",
      overview: movie.overview ?? "",
      genre: movie.genre ?? [],
      added_by: movie.added_by,
      priority: (movie.priority ?? "medium") as "low" | "medium" | "high",
      streaming_platform: movie.streaming_platform ?? "",
      expected_mood: movie.expected_mood ?? "",
      watched_date: movie.watched_date ?? "",
      my_rating: (movie.my_rating ?? "") as number | "",
      his_rating: (movie.his_rating ?? "") as number | "",
      favorite_scene: movie.favorite_scene ?? "",
      funny_memory: movie.funny_memory ?? "",
      favorite_quote: movie.favorite_quote ?? "",
      notes: movie.notes ?? "",
      mood_afterwards: movie.mood_afterwards ?? "",
      recommended_by: movie.recommended_by ?? "",
    },
  });

  const posterUrl = watch("poster_url");
  const myRatingWatch = watch(who === "whiskeyy" ? "my_rating" : "his_rating");

  async function onSubmit(v: EditValues) {
    setSaving(true);
    try {
      await update({
        data: {
          id: movie.id,
          patch: {
            title: v.title,
            year: v.year === "" || v.year == null ? null : Number(v.year),
            runtime: v.runtime === "" || v.runtime == null ? null : Number(v.runtime),
            poster_url: v.poster_url?.trim() || null,
            overview: v.overview?.trim() || null,
            genre: v.genre ?? [],
            added_by: v.added_by,
            priority: v.priority ?? null,
            streaming_platform: v.streaming_platform?.trim() || null,
            expected_mood: v.expected_mood?.trim() || null,
            ...(movie.status === "watched" && {
              watched_date: v.watched_date?.trim() || null,
              my_rating: v.my_rating === "" || v.my_rating == null ? null : Number(v.my_rating),
              his_rating: v.his_rating === "" || v.his_rating == null ? null : Number(v.his_rating),
              favorite_scene: v.favorite_scene?.trim() || null,
              funny_memory: v.funny_memory?.trim() || null,
              favorite_quote: v.favorite_quote?.trim() || null,
              notes: v.notes?.trim() || null,
              mood_afterwards: v.mood_afterwards?.trim() || null,
              recommended_by: v.recommended_by?.trim() || null,
            }),
          } as never,
        },
      });
      toast.success("Saved! ✨");
      onSaved();
    } catch {
      toast.error("Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border p-6 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl">Edit movie</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        {/* Poster preview + URL */}
        <div className="grid md:grid-cols-[160px_1fr] gap-4">
          <div className="space-y-2">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary border border-border">
              {posterUrl ? (
                <img src={posterUrl} alt="" className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-muted-foreground px-2 text-center">
                  No poster
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-4 content-start">
            <div>
              <Label>Poster URL</Label>
              <Input {...register("poster_url")} placeholder="https://…jpg"
                className="mt-1 bg-input border-border" />
            </div>
            <div>
              <Label>Title *</Label>
              <Input {...register("title")} className="mt-1 bg-input border-border" />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Year</Label>
                <Input type="number" {...register("year")} className="mt-1 bg-input border-border" />
              </div>
              <div>
                <Label>Runtime (min)</Label>
                <Input type="number" {...register("runtime")} className="mt-1 bg-input border-border" />
              </div>
            </div>
          </div>
        </div>

        {/* Genre */}
        <div>
          <Label>Genres</Label>
          <Controller control={control} name="genre" render={({ field }) => (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const on = field.value?.includes(g);
                return (
                  <button type="button" key={g}
                    onClick={() => field.onChange(on ? field.value.filter((x: string) => x !== g) : [...(field.value ?? []), g])}
                    className={cn("px-3 py-1 rounded-full text-xs border transition",
                      on ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                    )}>{g}</button>
                );
              })}
            </div>
          )} />
        </div>

        {/* Overview */}
        <div>
          <Label>Overview</Label>
          <Textarea {...register("overview")} rows={3}
            className="mt-1 bg-input border-border resize-none" />
        </div>

        {/* Added by + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Added by</Label>
            <Controller control={control} name="added_by" render={({ field }) => (
              <div className="mt-1 grid grid-cols-2 gap-1 p-1 bg-input rounded-full border border-border">
                {(["whiskeyy", "matildaa"] as const).map((who) => (
                  <button type="button" key={who} onClick={() => field.onChange(who)}
                    className={cn("py-1.5 rounded-full text-xs capitalize transition",
                      field.value === who ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                    )}>{who}</button>
                ))}
              </div>
            )} />
          </div>
          <div>
            <Label>Priority</Label>
            <Controller control={control} name="priority" render={({ field }) => (
              <div className="mt-1 grid grid-cols-3 gap-1 p-1 bg-input rounded-full border border-border">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button type="button" key={p} onClick={() => field.onChange(p)}
                    className={cn("py-1.5 rounded-full text-xs capitalize transition",
                      field.value === p ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                    )}>{p}</button>
                ))}
              </div>
            )} />
          </div>
        </div>

        {/* Streaming + Mood */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Where to watch</Label>
            <Controller control={control} name="streaming_platform" render={({ field }) => (
              <select {...field} value={field.value ?? ""} className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                <option value="">—</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )} />
          </div>
          <div>
            <Label>Expected mood</Label>
            <Controller control={control} name="expected_mood" render={({ field }) => (
              <select {...field} value={field.value ?? ""} className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                <option value="">—</option>
                {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )} />
          </div>
        </div>

        {/* ── Watched-only fields ─────────────────────────────────────────── */}
        {movie.status === "watched" && (
          <>
            <div className="border-t border-border pt-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Memory & ratings</p>
            </div>

            <div>
              <Label>Watched on <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" {...register("watched_date")}
                max={new Date().toISOString().slice(0, 10)}
                className="mt-1 bg-input border-border" />
            </div>

            {/* Ratings — only your own is editable */}
            <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-background/50 border border-border">
              <div>
                <Label className={who === "whiskeyy" ? "text-primary" : "text-lavender"}>
                  Whiskeyy's rating{who === "whiskeyy" ? " (you)" : ""}
                </Label>
                {who === "whiskeyy" ? (
                  <Controller control={control} name="my_rating" render={({ field }) => (
                    <div className="mt-2">
                      <RatingStars
                        value={field.value === "" || field.value == null ? null : Number(field.value)}
                        onChange={field.onChange}
                        color="gold"
                      />
                    </div>
                  )} />
                ) : (
                  <div className="mt-2">
                    <RatingStars value={movie.my_rating} color="gold" disabled />
                    <p className="text-[10px] text-muted-foreground mt-1">Only Whiskeyy can edit this</p>
                  </div>
                )}
              </div>
              <div>
                <Label className={who === "matildaa" ? "text-lavender" : "text-primary"}>
                  matildaa's rating{who === "matildaa" ? " (you)" : ""}
                </Label>
                {who === "matildaa" ? (
                  <Controller control={control} name="his_rating" render={({ field }) => (
                    <div className="mt-2">
                      <RatingStars
                        value={field.value === "" || field.value == null ? null : Number(field.value)}
                        onChange={field.onChange}
                        color="lavender"
                      />
                    </div>
                  )} />
                ) : (
                  <div className="mt-2">
                    <RatingStars value={movie.his_rating} color="lavender" disabled />
                    <p className="text-[10px] text-muted-foreground mt-1">Only matildaa can edit this</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Favorite scene</Label>
              <Textarea {...register("favorite_scene")} rows={2}
                placeholder="The one that made us both gasp…"
                className="mt-1 bg-input border-border resize-none" />
            </div>

            <div>
              <Label>Funny memory / inside joke</Label>
              <Textarea {...register("funny_memory")} rows={2}
                placeholder="What we'll remember about tonight…"
                className="mt-1 bg-input border-border resize-none" />
            </div>

            <div>
              <Label>Favorite quote</Label>
              <Input {...register("favorite_quote")} placeholder='"…"'
                className="mt-1 bg-input border-border" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Who recommended it?</Label>
                <Input {...register("recommended_by")} placeholder="A friend, Reddit…"
                  className="mt-1 bg-input border-border" />
              </div>
              <div>
                <Label>Mood afterwards</Label>
                <Controller control={control} name="mood_afterwards" render={({ field }) => (
                  <select {...field} value={field.value ?? ""} className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                    <option value="">—</option>
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                )} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={3}
                placeholder="Anything else — what we ate, weather, mood…"
                className="mt-1 bg-input border-border resize-none" />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}
            className="rounded-full h-11 px-6 bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}
            className="rounded-full h-11 px-4 text-muted-foreground">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Main movie detail ─────────────────────────────────────────────────────────
function MovieDetail() {
  const { id } = Route.useParams();
  const { who } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const update = useServerFn(updateMovie);
  const del = useServerFn(deleteMovie);
  const [watching, setWatching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingRating, setEditingRating] = useState(false);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);

  const q = useQuery({ queryKey: ["movie", id], queryFn: () => getMovie({ data: { id } }) });
  const m = q.data;

  if (q.isLoading)
    return (
      <AppShell>
        <div className="h-96 rounded-3xl skeleton" />
      </AppShell>
    );

  if (!m)
    return (
      <AppShell>
        <p className="text-center py-20 text-muted-foreground">Movie not found.</p>
      </AppShell>
    );

  const avg =
    m.my_rating != null && m.his_rating != null
      ? ((Number(m.my_rating) + Number(m.his_rating)) / 2).toFixed(1)
      : null;

  const myRatingField = who === "whiskeyy" ? "my_rating" : "his_rating";
  const myCurrentRating = who === "whiskeyy" ? m.my_rating : m.his_rating;
  const otherRating = who === "whiskeyy" ? m.his_rating : m.my_rating;
  const otherLabel = who === "whiskeyy" ? "matildaa" : "Whiskeyy";
  const myLabel = who === "whiskeyy" ? "Whiskeyy" : "matildaa";
  const myColor: "gold" | "lavender" = who === "whiskeyy" ? "gold" : "lavender";
  const otherColor: "gold" | "lavender" = who === "whiskeyy" ? "lavender" : "gold";
  const needsMyRating = m.status === "watched" && myCurrentRating == null;

  async function saveMyRating() {
    if (ratingValue == null) return;
    setSavingRating(true);
    try {
      await update({ data: { id: m!.id, patch: { [myRatingField]: ratingValue } as never } });
      toast.success("Rating saved! 🌟");
      setEditingRating(false);
      setRatingValue(null);
      qc.invalidateQueries();
    } catch {
      toast.error("Couldn't save rating");
    } finally {
      setSavingRating(false);
    }
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <AppShell>
        <Link
          to={m.status === "watched" ? "/watched" : "/watchlist"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <EditPanel
          movie={m}
          who={who}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            qc.invalidateQueries();
          }}
        />
      </AppShell>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <Link
        to={m.status === "watched" ? "/watched" : "/watchlist"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Rate-reminder banner */}
      {needsMyRating && !editingRating && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/[0.08] px-5 py-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold text-sm">You haven't rated this yet, {who}!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share how you felt about <span className="text-foreground">{m.title}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEditingRating(true); setRatingValue(myCurrentRating ?? null); }}
            className="flex-shrink-0 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:brightness-110 transition"
          >
            Rate now
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        <div>
          <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-secondary shadow-[var(--shadow-poster)] card-lift hover:[&]:card-lift-hover">
            {m.poster_url ? (
              <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-muted-foreground">No poster</div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {m.status === "watched" ? "A memory" : "On the watchlist"}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">{m.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {m.year && <span>{m.year}</span>}
            {m.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatRuntime(m.runtime)}
              </span>
            )}
            {m.watched_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(m.watched_date)}
              </span>
            )}
            {m.genre?.length ? <span>{m.genre.join(" · ")}</span> : null}
          </div>

          {m.overview && (
            <p className="mt-4 text-sm text-foreground/80 leading-relaxed max-w-2xl">{m.overview}</p>
          )}

          {/* Ratings */}
          {m.status === "watched" && (
            <div className="mt-6 space-y-3 max-w-md">
              {/* Your rating — editable */}
              <div className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className={cn("text-xs uppercase tracking-widest font-semibold",
                    myColor === "gold" ? "text-primary" : "text-lavender")}>
                    {myLabel} (you)
                  </p>
                  {!editingRating && (
                    <button
                      onClick={() => { setEditingRating(true); setRatingValue(myCurrentRating ?? null); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      <Edit2 className="w-3 h-3" />
                      {myCurrentRating != null ? "Edit" : "Rate"}
                    </button>
                  )}
                </div>
                {editingRating ? (
                  <div className="space-y-3">
                    <RatingStars value={ratingValue} onChange={setRatingValue} color={myColor} />
                    <div className="flex gap-2">
                      <button onClick={saveMyRating} disabled={savingRating || ratingValue == null}
                        className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:brightness-110 disabled:opacity-50 transition">
                        {savingRating ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setEditingRating(false); setRatingValue(null); }}
                        className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <RatingStars value={myCurrentRating} color={myColor} disabled />
                    {myCurrentRating == null && <p className="text-xs text-muted-foreground italic mt-1">No rating yet</p>}
                  </>
                )}
              </div>

              {/* Other person — read only */}
              <div className="rounded-xl bg-card border border-border p-4">
                <p className={cn("text-xs uppercase tracking-widest font-semibold mb-2",
                  otherColor === "gold" ? "text-primary" : "text-lavender")}>
                  {otherLabel}
                </p>
                <RatingStars value={otherRating} color={otherColor} disabled />
                {otherRating == null && (
                  <p className="text-xs text-muted-foreground italic mt-1">{otherLabel} hasn't rated yet</p>
                )}
              </div>

              {avg && (
                <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <div>
                    <p className="font-mono text-xl">{avg}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Average</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex gap-2 flex-wrap">
            {m.status === "watchlist" && (
              <button
                onClick={() => setWatching(true)}
                className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-110"
              >
                Mark watched
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-muted/50 transition"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Delete "${m.title}" forever?`)) return;
                await del({ data: { id: m.id } });
                toast.success("Deleted");
                qc.invalidateQueries();
                navigate({ to: m.status === "watched" ? "/watched" : "/watchlist" });
              }}
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {m.status === "watched" && (
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <MemoryBlock title="Favorite scene" text={m.favorite_scene} />
          <MemoryBlock title="Funny memory" text={m.funny_memory} accent="lavender" />
          <MemoryBlock title="Favorite quote" text={m.favorite_quote} accent="gold" quote />
          <MemoryBlock title="Notes" text={m.notes} />
          {(m.recommended_by || m.mood_afterwards) && (
            <div className="rounded-2xl bg-card border border-border p-5 md:col-span-2">
              <div className="grid grid-cols-2 gap-6">
                {m.recommended_by && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Recommended by</p>
                    <p className="mt-1">{m.recommended_by}</p>
                  </div>
                )}
                {m.mood_afterwards && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Mood afterwards</p>
                    <p className="mt-1">{m.mood_afterwards}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {watching && (
        <MarkWatchedDialog
          open
          who={who}
          onOpenChange={setWatching}
          title={m.title}
          onSave={async (values) => {
            await update({
              data: { id: m.id, patch: { ...(values as object), status: "watched" } as never },
            });
            toast.success(`${m.title} — added to your memories`);
            setWatching(false);
            qc.invalidateQueries();
          }}
        />
      )}
    </AppShell>
  );
}

function MemoryBlock({
  title, text, accent = "muted", quote,
}: {
  title: string;
  text?: string | null;
  accent?: "gold" | "lavender" | "muted";
  quote?: boolean;
}) {
  if (!text) return null;
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <p className={"text-xs uppercase tracking-widest " +
        (accent === "gold" ? "text-primary" : accent === "lavender" ? "text-lavender" : "text-muted-foreground")}>
        {title}
      </p>
      {quote ? (
        <blockquote className="mt-2 font-serif text-xl leading-snug">"{text}"</blockquote>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{text}</p>
      )}
    </div>
  );
}
