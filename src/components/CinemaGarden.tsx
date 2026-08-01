/**
 * CinemaGarden — a growing outdoor scene that evolves as you watch more movies.
 *
 * Milestones:
 *   1  → First flower
 *   5  → Wooden bench
 *  10  → Street lamp
 *  25  → Cherry blossom tree
 *  50  → Little outdoor projector
 * 100  → Full cinema sign
 */

const MILESTONES = [
  { at: 1,   emoji: "🌸", label: "First bloom",          bottom: "12%", left: "18%" },
  { at: 5,   emoji: "🪑", label: "Our bench",             bottom: "8%",  left: "60%" },
  { at: 10,  emoji: "🏮", label: "Evening lamp",          bottom: "10%", left: "38%" },
  { at: 25,  emoji: "🌳", label: "Cherry tree",           bottom: "14%", left: "50%" },
  { at: 50,  emoji: "🎞️", label: "Little projector",      bottom: "10%", left: "12%" },
  { at: 100, emoji: "🎭", label: "Cinema stage",          bottom: "11%", left: "80%" },
] as const;

// Ambient decorations always visible
const ALWAYS = [
  { emoji: "✨", bottom: "40%", left: "8%",  size: "0.6rem", animate: true },
  { emoji: "⭐", bottom: "55%", left: "85%", size: "0.5rem", animate: true },
  { emoji: "🌙", bottom: "60%", left: "50%", size: "0.7rem", animate: false },
];

interface Props {
  watchedCount: number;
}

export function CinemaGarden({ watchedCount }: Props) {
  const reached = MILESTONES.filter((m) => watchedCount >= m.at);
  const next    = MILESTONES.find((m) => watchedCount < m.at);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: "180px" }}>
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #070A12 0%, #0D1324 50%, #151A2E 100%)",
        }}
      />

      {/* Starfield (tiny fixed stars) */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? "2px" : "1.5px",
            height: i % 3 === 0 ? "2px" : "1.5px",
            background: "rgba(245,241,232,0.7)",
            top: `${5 + (i * 17) % 45}%`,
            left: `${(i * 23 + 7) % 95}%`,
            opacity: 0.3 + (i % 4) * 0.15,
            animation: `star-twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "28%",
          background: "linear-gradient(to top, #1A2038, #1E2540)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      />

      {/* Reached milestones */}
      {reached.map((m, i) => (
        <div
          key={m.at}
          className="absolute garden-item"
          style={{
            bottom: m.bottom,
            left: m.left,
            animationDelay: `${i * 0.12}s`,
            fontSize: m.at >= 25 ? "2.2rem" : m.at >= 10 ? "1.8rem" : "1.5rem",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            cursor: "default",
          }}
          title={m.label}
        >
          {m.emoji}
        </div>
      ))}

      {/* Ambient decorations */}
      {ALWAYS.map((a, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            bottom: a.bottom,
            left: a.left,
            fontSize: a.size,
            opacity: 0.4,
            animation: a.animate ? `sway ${4 + i}s ease-in-out ${i * 1.2}s infinite` : undefined,
          }}
        >
          {a.emoji}
        </div>
      ))}

      {/* Counter overlay */}
      <div className="absolute top-3 left-4">
        <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          Your cinema
        </p>
        <p className="font-serif text-xl text-foreground/90 mt-0.5">
          {watchedCount} {watchedCount === 1 ? "memory" : "memories"}
        </p>
      </div>

      {/* Next milestone hint */}
      {next && (
        <div className="absolute top-3 right-4 text-right">
          <p className="text-[9px] text-muted-foreground/60">
            Next: {next.emoji} at {next.at} movies
          </p>
          <div className="mt-1 h-1 w-20 rounded-full bg-white/5 overflow-hidden ml-auto">
            <div
              className="h-full rounded-full bg-primary/40 transition-all duration-700"
              style={{ width: `${Math.min((watchedCount / next.at) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
