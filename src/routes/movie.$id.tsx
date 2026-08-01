import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MarkWatchedDialog } from "@/components/MarkWatchedDialog";
import { getSessionStatus } from "@/lib/gate.functions";
import { getMovie, updateMovie, deleteMovie } from "@/lib/movies.functions";
import { formatDate, formatRuntime } from "@/lib/format";
import { ArrowLeft, Calendar, Clock, Star, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

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

function MovieDetail() {
  const { id } = Route.useParams();
  const { who } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const update = useServerFn(updateMovie);
  const del = useServerFn(deleteMovie);
  const [watching, setWatching] = useState(false);
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

  // Which rating field belongs to the current user
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

  return (
    <AppShell>
      <Link
        to={m.status === "watched" ? "/watched" : "/watchlist"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* ── Rate-reminder banner ─────────────────────────────────────────── */}
      {needsMyRating && !editingRating && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/8 px-5 py-4 animate-fade-in">
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
            onClick={() => {
              setEditingRating(true);
              setRatingValue(myCurrentRating ?? null);
            }}
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
              <div className="w-full h-full grid place-items-center text-muted-foreground">
                No poster
              </div>
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
            <p className="mt-4 text-sm text-foreground/80 leading-relaxed max-w-2xl">
              {m.overview}
            </p>
          )}

          {/* ── Ratings ──────────────────────────────────────────────────── */}
          {m.status === "watched" && (
            <div className="mt-6 space-y-4 max-w-md">
              {/* Your rating — editable */}
              <div className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className={cn("text-xs uppercase tracking-widest font-semibold",
                    myColor === "gold" ? "text-primary" : "text-lavender"
                  )}>
                    {myLabel} (you)
                  </p>
                  {!editingRating && (
                    <button
                      onClick={() => {
                        setEditingRating(true);
                        setRatingValue(myCurrentRating ?? null);
                      }}
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
                      <button
                        onClick={saveMyRating}
                        disabled={savingRating || ratingValue == null}
                        className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:brightness-110 disabled:opacity-50 transition"
                      >
                        {savingRating ? "Saving…" : "Save rating"}
                      </button>
                      <button
                        onClick={() => { setEditingRating(false); setRatingValue(null); }}
                        className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <RatingStars value={myCurrentRating} color={myColor} disabled />
                )}
                {!editingRating && myCurrentRating == null && (
                  <p className="text-xs text-muted-foreground italic mt-1">No rating yet</p>
                )}
              </div>

              {/* Other person's rating — always read-only */}
              <div className="rounded-xl bg-card border border-border p-4">
                <p className={cn("text-xs uppercase tracking-widest font-semibold mb-2",
                  otherColor === "gold" ? "text-primary" : "text-lavender"
                )}>
                  {otherLabel}
                </p>
                <RatingStars value={otherRating} color={otherColor} disabled />
                {otherRating == null && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    {otherLabel} hasn't rated yet
                  </p>
                )}
              </div>

              {/* Average */}
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
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Recommended by
                    </p>
                    <p className="mt-1">{m.recommended_by}</p>
                  </div>
                )}
                {m.mood_afterwards && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Mood afterwards
                    </p>
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
  title,
  text,
  accent = "muted",
  quote,
}: {
  title: string;
  text?: string | null;
  accent?: "gold" | "lavender" | "muted";
  quote?: boolean;
}) {
  if (!text) return null;
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <p
        className={
          "text-xs uppercase tracking-widest " +
          (accent === "gold"
            ? "text-primary"
            : accent === "lavender"
              ? "text-lavender"
              : "text-muted-foreground")
        }
      >
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
