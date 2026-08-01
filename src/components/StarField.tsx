import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Movie } from "@/lib/movies.functions";
import { formatDate } from "@/lib/format";

type PlacedMovie = {
  movie: Movie;
  index: number;
  x: number;
  y: number;
  size: number;
  color: string;
  glow: string;
  groupKey: string | null;
  groupName: string | null;
  twinkleDuration: number;
  twinkleDelay: number;
  favorite: boolean;
};

type ConstellationGroup = {
  key: string;
  name: string;
  stars: PlacedMovie[];
  x: number;
  y: number;
};

interface Props {
  movies: Movie[];
  compact?: boolean;
}

const CLOUDS = [
  { top: "12%", width: "32rem", dur: "76s", delay: "-12s", opacity: 0.2 },
  { top: "29%", width: "24rem", dur: "92s", delay: "-48s", opacity: 0.15 },
  { top: "51%", width: "36rem", dur: "110s", delay: "-28s", opacity: 0.11 },
];

const FIREFLIES = [
  { left: "9%", bottom: "13%", delay: "0s" },
  { left: "18%", bottom: "8%", delay: "1.7s" },
  { left: "31%", bottom: "15%", delay: "0.8s" },
  { left: "68%", bottom: "11%", delay: "2.6s" },
  { left: "80%", bottom: "18%", delay: "1.1s" },
  { left: "91%", bottom: "10%", delay: "3.2s" },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rating(movie: Movie) {
  const values = [movie.my_rating, movie.his_rating].filter(
    (value): value is number => typeof value === "number",
  );
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function ratingStars(value: number | null) {
  if (value == null) return "☆☆☆☆☆";
  const filled = clamp(Math.round(value / 2), 0, 5);
  return "★★★★★".slice(0, filled) + "☆☆☆☆☆".slice(filled);
}

function sortByMemory(a: Movie, b: Movie) {
  const aTime = new Date(a.watched_date ?? a.created_at).getTime();
  const bTime = new Date(b.watched_date ?? b.created_at).getTime();
  return aTime - bTime;
}

function constellationPosition(index: number, total: number) {
  if (total === 1) return { x: 50, y: 44 };

  const progress = index / Math.max(total - 1, 1);
  const angle = index * 2.399963 + total * 0.17;
  const radius = 8 + (Math.sqrt(index + 1) / Math.sqrt(total)) * 39;
  const drift = Math.sin(progress * Math.PI * 3) * 4;

  return {
    x: clamp(50 + Math.cos(angle) * radius + drift, 7, 93),
    y: clamp(
      45 + Math.sin(angle) * radius * 0.58 + Math.cos(progress * Math.PI * 2) * 4,
      12,
      78,
    ),
  };
}

function titleWords(title: string) {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !["a", "an", "the"].includes(word));
}

function displayName(key: string, count: number) {
  const name = key
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  if (count === 3) return `The ${name} Trilogy`;
  return `The ${name} Constellation`;
}

function colorForMovie(movie: Movie, favorite: boolean) {
  const text = [
    ...(movie.genre ?? []),
    movie.expected_mood,
    movie.mood_afterwards,
    movie.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (favorite) return { color: "#FFF4A3", glow: "rgba(255,244,163,0.92)" };
  if (/horror|thriller|scary|dark|crime|mystery/.test(text)) {
    return { color: "#9EDBFF", glow: "rgba(126,210,255,0.78)" };
  }
  if (/romance|love|date|warm|cozy/.test(text)) {
    return { color: "#FFD37A", glow: "rgba(255,194,92,0.86)" };
  }
  if (/comedy|funny|laugh|happy/.test(text)) {
    return { color: "#FFF06A", glow: "rgba(255,224,74,0.82)" };
  }
  if (/sad|cry|drama|melancholy|heartbreak/.test(text)) {
    return { color: "#C9AAFF", glow: "rgba(190,148,255,0.8)" };
  }
  return { color: "#F7F0D2", glow: "rgba(245,241,232,0.58)" };
}

function memoryLine(movie: Movie) {
  return (
    movie.funny_memory ||
    movie.favorite_scene ||
    movie.favorite_quote ||
    movie.notes ||
    "A little light we kept."
  );
}

function usePlacedMovies(movies: Movie[]) {
  return useMemo(() => {
    const ordered = [...movies].sort(sortByMemory);
    const firstWordCounts = ordered.reduce<Record<string, number>>((counts, movie) => {
      const first = titleWords(movie.title)[0];
      if (first && first.length > 3) counts[first] = (counts[first] ?? 0) + 1;
      return counts;
    }, {});

    const placed = ordered.map((movie, index) => {
      const score = rating(movie);
      const favorite = score != null && score >= 9;
      const { x, y } = constellationPosition(index, ordered.length);
      const { color, glow } = colorForMovie(movie, favorite);
      const words = titleWords(movie.title);
      const groupKey = words[0] && firstWordCounts[words[0]] >= 2 ? words[0] : null;
      const groupName = groupKey ? displayName(groupKey, firstWordCounts[groupKey]) : null;

      return {
        movie,
        index,
        x,
        y,
        color,
        glow,
        groupKey,
        groupName,
        favorite,
        size: 5 + ((score ?? 5) / 10) * 8 + (favorite ? 4 : 0),
        twinkleDuration: 3.4 + (index % 5) * 0.6,
        twinkleDelay: (index % 9) * 0.25,
      };
    });

    const groups = Object.values(
      placed.reduce<Record<string, ConstellationGroup>>((acc, star) => {
        if (!star.groupKey || !star.groupName) return acc;
        acc[star.groupKey] ??= {
          key: star.groupKey,
          name: star.groupName,
          stars: [],
          x: 0,
          y: 0,
        };
        acc[star.groupKey].stars.push(star);
        return acc;
      }, {}),
    )
      .filter((group) => group.stars.length >= 2)
      .map((group) => ({
        ...group,
        stars: [...group.stars].sort((a, b) => a.index - b.index),
        x: group.stars.reduce((sum, star) => sum + star.x, 0) / group.stars.length,
        y: group.stars.reduce((sum, star) => sum + star.y, 0) / group.stars.length,
      }));

    return { placed, groups };
  }, [movies]);
}

export function StarField({ movies, compact = false }: Props) {
  const navigate = useNavigate();
  const { placed, groups } = usePlacedMovies(movies);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState<PlacedMovie | null>(null);

  const hoveredStar = placed.find((star) => star.movie.id === hoveredId) ?? null;
  const activeGroup = hoveredStar?.groupKey ?? hoveredGroup;
  const isFocused = Boolean(hoveredStar || hoveredGroup);

  const flyToMovie = (star: PlacedMovie) => {
    if (compact) return;
    setFlyingTo(star);
    window.setTimeout(() => {
      navigate({ to: "/movie/$id", params: { id: star.movie.id } });
    }, 900);
  };

  return (
    <div
      className={`memory-sky relative w-full overflow-hidden ${
        compact ? "rounded-2xl" : "min-h-[calc(100svh-4.25rem)]"
      }`}
      style={{ height: compact ? "190px" : "calc(100svh - 4.25rem)" }}
      onMouseLeave={() => {
        setHoveredId(null);
        setHoveredGroup(null);
      }}
    >
      <div className="sky-gradient absolute inset-0" />
      <div className="aurora-ribbon aurora-ribbon-one absolute inset-x-[-15%] top-[5%] h-52" />
      <div className="aurora-ribbon aurora-ribbon-two absolute inset-x-[-20%] top-[18%] h-44" />
      <div className="moon absolute right-[9%] top-[9%]" />
      <div className="moonbeam absolute right-0 top-0 h-full w-1/2" />

      {!compact &&
        CLOUDS.map((cloud, i) => (
          <div
            key={i}
            className="sky-cloud absolute"
            style={{
              top: cloud.top,
              width: cloud.width,
              opacity: cloud.opacity,
              animationDuration: cloud.dur,
              animationDelay: cloud.delay,
            }}
          />
        ))}

      <div className="shooting-star shooting-star-one absolute" />
      {!compact && <div className="shooting-star shooting-star-two absolute" />}

      <div className="distant-stars absolute inset-0" />

      {movies.length === 0 ? (
        <div className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 text-5xl">🌌</div>
          <h2 className="font-serif text-3xl">The sky is waiting.</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Watch your first movie together and the first lonely star will appear.
          </p>
        </div>
      ) : (
        <>
          <svg className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {placed.slice(1).map((star, index) => {
              const prev = placed[index];
              const dim = isFocused && hoveredId !== star.movie.id && hoveredId !== prev.movie.id;
              return (
                <line
                  key={`${prev.movie.id}-${star.movie.id}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={star.x}
                  y2={star.y}
                  className="memory-thread"
                  style={{ opacity: dim ? 0.08 : 0.28 }}
                />
              );
            })}

            {groups.map((group) => (
              <g
                key={group.key}
                onMouseEnter={() => setHoveredGroup(group.key)}
                onMouseLeave={() => setHoveredGroup(null)}
                className="cursor-default"
              >
                {group.stars.slice(1).map((star, index) => {
                  const prev = group.stars[index];
                  const active = activeGroup === group.key;
                  return (
                    <line
                      key={`${group.key}-${prev.movie.id}-${star.movie.id}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={star.x}
                      y2={star.y}
                      className="constellation-thread"
                      style={{ opacity: active ? 0.86 : 0.38 }}
                    />
                  );
                })}
                {group.stars.slice(1).map((star, index) => {
                  const prev = group.stars[index];
                  return (
                    <line
                      key={`${group.key}-hit-${prev.movie.id}-${star.movie.id}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={star.x}
                      y2={star.y}
                      stroke="transparent"
                      strokeWidth="3.5"
                    />
                  );
                })}
              </g>
            ))}
          </svg>

          <div className={`absolute inset-0 z-20 transition-opacity duration-300 ${isFocused ? "opacity-55" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-[#02040A]/70" />
          </div>

          {placed.map((star) => {
            const active = hoveredId === star.movie.id;
            const related = activeGroup != null && star.groupKey === activeGroup;
            const dimmed = isFocused && !active && !related;
            const StarTag = compact ? "span" : "button";

            return (
              <StarTag
                key={star.movie.id}
                type={compact ? undefined : "button"}
                aria-label={compact ? undefined : star.movie.title}
                className={`memory-star absolute z-30 rounded-full ${active ? "memory-star-active" : ""}`}
                style={
                  {
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${active ? star.size + 12 : star.size}px`,
                    height: `${active ? star.size + 12 : star.size}px`,
                    "--star-color": star.color,
                    "--star-glow": star.glow,
                    "--twinkle-duration": `${star.twinkleDuration}s`,
                    "--twinkle-delay": `${star.twinkleDelay}s`,
                    opacity: dimmed ? 0.18 : 1,
                  } as CSSProperties
                }
                onMouseEnter={() => !compact && setHoveredId(star.movie.id)}
                onFocus={() => !compact && setHoveredId(star.movie.id)}
                onClick={() => flyToMovie(star)}
              >
                {!compact && <span className="star-rays" />}
              </StarTag>
            );
          })}

          {hoveredStar && !compact && (
            <div
              className="memory-card pointer-events-none absolute z-40 w-[min(18rem,calc(100vw-2rem))] animate-fade-in"
              style={{
                top: `${clamp(hoveredStar.y - 8, 9, 70)}%`,
                ...(hoveredStar.x > 58
                  ? { right: `${clamp(100 - hoveredStar.x + 4, 4, 52)}%` }
                  : { left: `${clamp(hoveredStar.x + 4, 4, 58)}%` }),
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary/70">Memory</p>
              <h3 className="mt-1 font-serif text-2xl leading-tight">{hoveredStar.movie.title}</h3>
              <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-4">
                  <dt>Watched</dt>
                  <dd className="text-foreground/90">
                    {hoveredStar.movie.watched_date
                      ? formatDate(hoveredStar.movie.watched_date)
                      : "Saved in the archive"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Rating</dt>
                  <dd className="text-primary">{ratingStars(rating(hoveredStar.movie))}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-foreground/82">
                “{memoryLine(hoveredStar.movie)}”
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/55">
                Click the star to fly in
              </p>
            </div>
          )}

          {activeGroup && !hoveredStar && !compact && (
            <div
              className="constellation-label pointer-events-none absolute z-40 animate-fade-in"
              style={{
                left: `${groups.find((group) => group.key === activeGroup)?.x ?? 50}%`,
                top: `${groups.find((group) => group.key === activeGroup)?.y ?? 50}%`,
              }}
            >
              {groups.find((group) => group.key === activeGroup)?.name}
            </div>
          )}
        </>
      )}

      {!compact && (
        <div className="pointer-events-none absolute left-6 top-6 z-40 max-w-sm">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Memory Sky
          </p>
          <h1 className="mt-1 font-serif text-4xl text-foreground">
            {movies.length === 1 ? "One lonely star" : `${movies.length} stars of us`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground/80">
            Hover a star to remember. Click one to travel into it.
          </p>
        </div>
      )}

      {compact && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-40">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {movies.length} {movies.length === 1 ? "star" : "stars"} ✦
          </p>
        </div>
      )}

      {!compact &&
        FIREFLIES.map((firefly, i) => (
          <span
            key={i}
            className="firefly absolute z-30"
            style={{
              left: firefly.left,
              bottom: firefly.bottom,
              animationDelay: firefly.delay,
            }}
          />
        ))}

      {flyingTo && (
        <div
          className="star-flight fixed inset-0 z-[9998]"
          style={
            {
              "--flight-x": `${flyingTo.x}%`,
              "--flight-y": `${flyingTo.y}%`,
              "--flight-color": flyingTo.color,
              "--flight-glow": flyingTo.glow,
            } as CSSProperties
          }
        >
          <div className="star-flight-planet" />
        </div>
      )}
    </div>
  );
}
