import { Link } from "@tanstack/react-router";
import type { Movie } from "@/lib/movies.functions";
import { formatRuntime } from "@/lib/format";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function MoviePosterCard({ movie }: { movie: Movie }) {
  const avg =
    movie.my_rating != null && movie.his_rating != null
      ? ((Number(movie.my_rating) + Number(movie.his_rating)) / 2).toFixed(1)
      : movie.my_rating ?? movie.his_rating ?? null;

  return (
    <Link to="/movie/$id" params={{ id: movie.id }} className="group block">
      <div className="poster-memory-frame card-lift hover:[&]:card-lift-hover">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-secondary to-card">
            <span className="px-4 text-center font-serif text-xl text-muted-foreground">
              {movie.title}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 to-transparent" />
        {avg != null && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs backdrop-blur">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="font-mono">{avg}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="truncate text-sm font-semibold">{movie.title}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {movie.year ?? "-"}
          {movie.runtime ? ` - ${formatRuntime(movie.runtime)}` : ""}
        </p>
      </div>
    </Link>
  );
}

export function TicketCard({
  movie,
  onMarkWatched,
  onDelete,
}: {
  movie: Movie;
  onMarkWatched?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative flex overflow-hidden rounded-2xl border border-border bg-card/88 card-lift hover:[&]:card-lift-hover">
      <div className="relative aspect-[2/3] w-24 shrink-0 bg-secondary sm:w-32">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center px-2 text-center text-xs text-muted-foreground">
            No poster
          </div>
        )}
      </div>

      <div className="hidden w-4 flex-col items-center justify-around bg-card py-4 sm:flex">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-background" />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to="/movie/$id"
              params={{ id: movie.id }}
              className="block truncate font-serif text-lg leading-tight hover:text-primary"
            >
              {movie.title}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {movie.year ?? "-"}
              {movie.genre?.length ? ` - ${movie.genre.slice(0, 2).join(", ")}` : ""}
            </p>
          </div>
          {movie.priority && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-1 text-[10px] uppercase tracking-widest",
                movie.priority === "high" && "bg-blush/20 text-blush",
                movie.priority === "medium" && "bg-primary/20 text-primary",
                movie.priority === "low" && "bg-forest/20 text-forest",
              )}
            >
              {movie.priority}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <span className="rounded-full bg-white/5 px-2 py-0.5">
            added by {movie.added_by}
          </span>
          {movie.streaming_platform && (
            <span className="rounded-full bg-white/5 px-2 py-0.5">
              {movie.streaming_platform}
            </span>
          )}
          {movie.expected_mood && (
            <span className="rounded-full bg-lavender/10 px-2 py-0.5 text-lavender">
              {movie.expected_mood}
            </span>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          {onMarkWatched && (
            <button
              onClick={onMarkWatched}
              className="flex-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Mark watched
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
