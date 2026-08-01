import { useState } from "react";
import type { Movie } from "@/lib/movies.functions";
import { formatDate } from "@/lib/format";

/** Deterministic position from movie ID */
function starPos(id: string): { x: number; y: number } {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  const x = 2 + ((h % 9200) / 100);          // 2–94%
  const y = 4 + (((h >> 12) % 8000) / 100);  // 4–84%
  return { x, y };
}

/** Deterministic twinkle timing from movie ID */
function starTiming(id: string): { dur: number; delay: number } {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    dur:   2.5 + ((h % 40) / 10),   // 2.5–6.5s
    delay: ((h >> 8) % 30) / 10,    // 0–3s
  };
}

/** Star brightness from rating */
function starSize(movie: Movie): number {
  const avg =
    movie.my_rating != null && movie.his_rating != null
      ? (Number(movie.my_rating) + Number(movie.his_rating)) / 2
      : movie.my_rating ?? movie.his_rating ?? 5;
  return 3 + (Number(avg) / 10) * 5; // 3–8px
}

interface TooltipMovie {
  movie: Movie;
  x: number;
  y: number;
}

interface Props {
  movies: Movie[];
  compact?: boolean; /** render a small preview strip */
}

export function StarField({ movies, compact = false }: Props) {
  const [tooltip, setTooltip] = useState<TooltipMovie | null>(null);

  if (movies.length === 0) {
    return (
      <div
        className="w-full rounded-2xl flex flex-col items-center justify-center text-center"
        style={{ height: compact ? "120px" : "70vh", background: "#070A12" }}
      >
        <p className="text-3xl mb-2">🌌</p>
        <p className="text-sm text-muted-foreground">
          {compact ? "Your sky awaits" : "Watch your first movie to light the first star"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: compact ? "140px" : "70vh",
        background: "radial-gradient(ellipse at 50% 0%, #0D1324 0%, #070A12 70%)",
        cursor: "crosshair",
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      {/* Milky way smear */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 30% at 50% 50%, rgba(195,166,232,0.3), transparent)",
        }}
      />

      {/* Stars */}
      {movies.map((m) => {
        const { x, y } = starPos(m.id);
        const { dur, delay } = starTiming(m.id);
        const size = starSize(m);
        const isHovered = tooltip?.movie.id === m.id;

        return (
          <button
            key={m.id}
            type="button"
            className="absolute rounded-full transition-all duration-300 animate-star"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${isHovered ? size + 4 : size}px`,
              height: `${isHovered ? size + 4 : size}px`,
              transform: "translate(-50%, -50%)",
              background: isHovered
                ? "rgba(232,184,96,1)"
                : `rgba(245,241,232,${0.5 + (size - 3) / 10})`,
              boxShadow: isHovered
                ? `0 0 ${size * 3}px rgba(232,184,96,0.8)`
                : `0 0 ${size}px rgba(245,241,232,0.4)`,
              "--dur": `${dur}s`,
              "--delay": `${delay}s`,
            } as React.CSSProperties}
            onMouseEnter={() => setTooltip({ movie: m, x, y })}
            onClick={() => setTooltip(tooltip?.movie.id === m.id ? null : { movie: m, x, y })}
          />
        );
      })}

      {/* Tooltip card */}
      {tooltip && !compact && (
        <div
          className="absolute z-20 pointer-events-none animate-fade-in"
          style={{
            left: `${Math.min(tooltip.x, 75)}%`,
            top: `${Math.min(tooltip.y + 4, 70)}%`,
          }}
        >
          <div
            className="rounded-xl p-3 text-left min-w-[160px] shadow-xl"
            style={{
              background: "rgba(21,26,46,0.95)",
              border: "1px solid rgba(232,184,96,0.25)",
              backdropFilter: "blur(8px)",
            }}
          >
            {tooltip.movie.poster_url && (
              <img
                src={tooltip.movie.poster_url}
                alt={tooltip.movie.title}
                className="w-full h-20 object-cover rounded-lg mb-2"
              />
            )}
            <p className="text-sm font-semibold leading-tight">{tooltip.movie.title}</p>
            {tooltip.movie.watched_date && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatDate(tooltip.movie.watched_date)}
              </p>
            )}
            {(tooltip.movie.my_rating || tooltip.movie.his_rating) && (
              <p className="text-primary text-xs mt-1">
                ★{" "}
                {tooltip.movie.my_rating != null && tooltip.movie.his_rating != null
                  ? ((Number(tooltip.movie.my_rating) + Number(tooltip.movie.his_rating)) / 2).toFixed(1)
                  : tooltip.movie.my_rating ?? tooltip.movie.his_rating}
                /10
              </p>
            )}
          </div>
        </div>
      )}

      {/* Counter badge (compact only) */}
      {compact && (
        <div className="absolute bottom-3 left-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {movies.length} {movies.length === 1 ? "star" : "stars"} ✦
          </p>
        </div>
      )}

      {/* Hint (full size) */}
      {!compact && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 tracking-widest uppercase">
          Hover a star to remember
        </p>
      )}
    </div>
  );
}
