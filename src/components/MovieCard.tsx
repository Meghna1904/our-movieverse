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
    <Link
      to="/movie/$id"
      params={{ id: movie.id }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-card card-lift hover:[&]:card-lift-hover">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center bg-gradient-to-br from-secondary to-card">
            <span className="font-serif text-xl px-4 text-center text-muted-foreground">
              {movie.title}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        {avg != null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-1 text-xs">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="font-mono">{avg}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-semibold truncate">{movie.title}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {movie.year ?? "—"}
          {movie.runtime ? ` · ${formatRuntime(movie.runtime)}` : ""}
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
    <div className="group relative flex overflow-hidden rounded-2xl bg-card border border-border card-lift hover:[&]:card-lift-hover">
      <div className="w-24 sm:w-32 shrink-0 aspect-[2/3] relative bg-secondary">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs px-2 text-center">
            No poster
          </div>
        )}
      </div>

      {/* perforation */}
      <div className="hidden sm:flex flex-col justify-around items-center py-4 w-4 bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-background" />
        ))}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to="/movie/$id"
              params={{ id: movie.id }}
              className="block font-serif text-lg leading-tight truncate hover:text-primary"
            >
              {movie.title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {movie.year ?? "—"}
              {movie.genre?.length ? ` · ${movie.genre.slice(0, 2).join(", ")}` : ""}
            </p>
          </div>
          {movie.priority && (
            <span
              className={cn(
                "text-[10px] uppercase tracking-widest px-2 py-1 rounded-full shrink-0",
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
            <span className="rounded-full bg-lavender/10 text-lavender px-2 py-0.5">
              {movie.expected_mood}
            </span>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          {onMarkWatched && (
            <button
              onClick={onMarkWatched}
              className="flex-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 transition"
            >
              Mark watched
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
