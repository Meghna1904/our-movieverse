import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Movie } from "@/lib/movies.functions";
import { formatDate } from "@/lib/format";

interface Props {
  movies: Movie[];
  compact?: boolean;
}

type WallMovie = {
  movie: Movie;
  rotate: number;
  lift: number;
  delay: number;
  stringDrop: number;
  pinColor: string;
  memory: string;
  rating: string | null;
};

const PIN_COLORS = ["#E8B860", "#C3A6E8", "#E8A6B0", "#7BA88C", "#F5F1E8"];

function sortByMemory(a: Movie, b: Movie) {
  const aTime = new Date(a.watched_date ?? a.created_at).getTime();
  const bTime = new Date(b.watched_date ?? b.created_at).getTime();
  return aTime - bTime;
}

function averageRating(movie: Movie) {
  const values = [movie.my_rating, movie.his_rating].filter(
    (value): value is number => typeof value === "number",
  );
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function memoryLine(movie: Movie) {
  return (
    movie.funny_memory ||
    movie.favorite_scene ||
    movie.favorite_quote ||
    movie.notes ||
    movie.mood_afterwards ||
    "A tiny night we kept."
  );
}

function useWallMovies(movies: Movie[]) {
  return useMemo<WallMovie[]>(() => {
    return [...movies].sort(sortByMemory).map((movie, index) => {
      const rating = averageRating(movie);
      return {
        movie,
        rotate: ((index * 7) % 13) - 6,
        lift: (index % 4) * 10,
        delay: index * 0.04,
        stringDrop: 28 + ((index * 17) % 46),
        pinColor: PIN_COLORS[index % PIN_COLORS.length],
        memory: memoryLine(movie),
        rating: rating == null ? null : rating.toFixed(1),
      };
    });
  }, [movies]);
}

export function StarField({ movies, compact = false }: Props) {
  const navigate = useNavigate();
  const wallMovies = useWallMovies(movies);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [flyingId, setFlyingId] = useState<string | null>(null);

  const openMovie = (movie: Movie) => {
    if (compact) return;
    setFlyingId(movie.id);
    window.setTimeout(() => {
      navigate({ to: "/movie/$id", params: { id: movie.id } });
    }, 520);
  };

  return (
    <div
      className={`polaroid-wall relative w-full overflow-hidden ${
        compact ? "rounded-2xl" : "min-h-[calc(100svh-4.25rem)]"
      }`}
      style={{ minHeight: compact ? "210px" : "calc(100svh - 4.25rem)" }}
    >
      <div className="wood-wall absolute inset-0" />
      <div className="wall-vignette absolute inset-0" />
      <div className="wall-dust absolute inset-0" />

      <div className="fairy-string fairy-string-one absolute left-[-4%] right-[-4%] top-9" />
      <div className="fairy-string fairy-string-two absolute left-[-4%] right-[-4%] top-28" />
      <div className="fairy-lights fairy-lights-one absolute left-0 right-0 top-6" />
      <div className="fairy-lights fairy-lights-two absolute left-0 right-0 top-24" />

      {!compact && (
        <div className="pointer-events-none absolute left-6 top-6 z-30 max-w-sm">
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary/75">
            Memory wall
          </p>
          <h1 className="mt-1 font-serif text-4xl text-foreground">
            {movies.length === 1 ? "One movie pinned up" : `${movies.length} movies on the wall`}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Every watched movie becomes a little Polaroid on the wooden wall.
          </p>
        </div>
      )}

      {movies.length === 0 ? (
        <div className="relative z-20 flex min-h-[inherit] flex-col items-center justify-center px-6 text-center">
          <div className="empty-polaroid mb-5" />
          <h2 className="font-serif text-3xl">The wall is waiting.</h2>
          <p className="mt-2 max-w-sm text-sm text-foreground/70">
            Watch your first movie together and the first Polaroid will go up.
          </p>
        </div>
      ) : (
        <div
          className={`relative z-20 ${
            compact
              ? "flex h-[210px] items-center gap-4 overflow-hidden px-6 pt-10"
              : "polaroid-grid px-5 pb-12 pt-44 sm:px-8 lg:px-12"
          }`}
          onMouseLeave={() => setFocusedId(null)}
        >
          {wallMovies.slice(0, compact ? 7 : wallMovies.length).map((item) => {
            const isFocused = focusedId === item.movie.id;
            const isDimmed = focusedId != null && !isFocused;
            const isFlying = flyingId === item.movie.id;

            return (
              <button
                key={item.movie.id}
                type="button"
                className={`polaroid group relative text-left ${isFlying ? "polaroid-fly-in" : ""}`}
                style={
                  {
                    "--rotate": `${item.rotate}deg`,
                    "--lift": `${item.lift}px`,
                    "--delay": `${item.delay}s`,
                    "--string-drop": `${item.stringDrop}px`,
                    "--pin-color": item.pinColor,
                    opacity: isDimmed ? 0.38 : 1,
                  } as CSSProperties
                }
                onMouseEnter={() => !compact && setFocusedId(item.movie.id)}
                onFocus={() => !compact && setFocusedId(item.movie.id)}
                onClick={() => openMovie(item.movie)}
                aria-label={item.movie.title}
              >
                <span className="polaroid-string" />
                <span className="polaroid-pin" />
                <span className="polaroid-tape polaroid-tape-left" />
                <span className="polaroid-tape polaroid-tape-right" />

                <span className="polaroid-photo">
                  {item.movie.poster_url ? (
                    <img src={item.movie.poster_url} alt={item.movie.title} loading="lazy" />
                  ) : (
                    <span className="polaroid-placeholder">{item.movie.title}</span>
                  )}
                </span>

                <span className="block px-3 pb-3 pt-2">
                  <span className="block truncate font-serif text-base text-[#302015]">
                    {item.movie.title}
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-[#765B43]">
                    {item.movie.watched_date ? formatDate(item.movie.watched_date) : "Movie night"}
                  </span>
                  {!compact && (
                    <span className="mt-2 line-clamp-2 block text-xs leading-relaxed text-[#4F3928]">
                      {item.memory}
                    </span>
                  )}
                  {!compact && item.rating && (
                    <span className="mt-2 block text-[10px] font-semibold text-[#9A6428]">
                      Rated {item.rating}/10
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {compact && movies.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-30">
          <p className="text-[10px] uppercase tracking-widest text-foreground/65">
            {movies.length} pinned memories
          </p>
        </div>
      )}
    </div>
  );
}
