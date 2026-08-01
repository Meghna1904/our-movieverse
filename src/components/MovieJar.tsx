import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Movie } from "@/lib/movies.functions";
import { formatRuntime } from "@/lib/format";

type Phase = "idle" | "shaking" | "rising" | "revealed";

const TICKET_DIRECTIONS = [
  { tx: "-90px", ty: "-130px", rot: "-50deg" },
  { tx: "80px",  ty: "-150px", rot: "35deg" },
  { tx: "-50px", ty: "-170px", rot: "-20deg" },
  { tx: "110px", ty: "-110px", rot: "55deg" },
  { tx: "-25px", ty: "-190px", rot: "12deg" },
  { tx: "70px",  ty: "-140px", rot: "-40deg" },
  { tx: "-110px",ty: "-100px", rot: "25deg" },
];

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function MovieJar({ movies }: { movies: Movie[] }) {
  const navigate = useNavigate();
  const [phase, setPhase]   = useState<Phase>("idle");
  const [picked, setPicked] = useState<Movie | null>(null);
  const [seen, setSeen]     = useState<Set<string>>(new Set());
  const [isExiting, setIsExiting] = useState(false);

  const count = movies.length;

  function pickNext(exclude: Set<string>): Movie {
    const pool = movies.filter((m) => !exclude.has(m.id));
    const source = pool.length > 0 ? pool : movies;
    return source[Math.floor(Math.random() * source.length)];
  }

  const runPick = useCallback(async (exclude: Set<string>) => {
    const movie = pickNext(exclude);
    setPicked(movie);
    setIsExiting(false);

    setPhase("shaking");
    await sleep(700);
    setPhase("rising");
    await sleep(900);
    setPhase("revealed");
  }, [movies]);

  async function shake() {
    if (phase !== "idle" || count === 0) return;
    await runPick(seen);
  }

  async function drawAgain() {
    if (!picked) return;
    setIsExiting(true);
    await sleep(350);
    const newSeen = new Set(seen);
    newSeen.add(picked.id);
    setSeen(newSeen);
    setPhase("idle");
    await sleep(50);
    await runPick(newSeen);
  }

  function reset() {
    setPhase("idle");
    setPicked(null);
    setIsExiting(false);
  }

  return (
    <div className="flex flex-col items-center select-none">

      {/* Jar stage — always visible in idle/shaking/rising */}
      {phase !== "revealed" && (
        <div className="relative flex flex-col items-center">

          {/* Rising ticket */}
          {phase === "rising" && (
            <div
              className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 animate-ticket-rise pointer-events-none"
              style={{ transformOrigin: "bottom center" }}
            >
              <div
                className="w-10 h-6 rounded shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #F5F1E8 0%, #E8E2D0 100%)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 0 20px rgba(232,184,96,0.6), 0 4px 12px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          )}

          {/* Jar illustration */}
          <div className={`relative ${phase === "shaking" ? "animate-jar-shake" : ""}`}>
            {/* Jar lid */}
            <div
              className="relative mx-auto z-10"
              style={{
                width: "88px",
                height: "18px",
                borderRadius: "6px 6px 0 0",
                background: "linear-gradient(to bottom, #2E3A5E, #1E2848)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 -2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {/* lid knob */}
              <div
                className="absolute top-[-6px] left-1/2 -translate-x-1/2"
                style={{
                  width: "20px",
                  height: "8px",
                  borderRadius: "4px 4px 0 0",
                  background: "#1E2848",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            {/* Jar body */}
            <div
              className="relative overflow-hidden"
              style={{
                width: "120px",
                height: "160px",
                borderRadius: "4px 4px 24px 24px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.09) 100%)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                boxShadow: "inset 6px 0 14px rgba(255,255,255,0.08), inset -4px 0 8px rgba(0,0,0,0.15), 0 0 40px rgba(232,184,96,0.12), 0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              {/* Glass highlight streak */}
              <div
                className="absolute top-3 left-3 w-[6px] rounded-full opacity-50"
                style={{
                  bottom: "20px",
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)",
                }}
              />
              {/* Second subtle highlight */}
              <div
                className="absolute top-6 left-8 w-[3px] h-16 rounded-full opacity-20"
                style={{ background: "rgba(255,255,255,0.6)" }}
              />

              {/* Tickets inside (idle state) */}
              {phase === "idle" && count > 0 && (
                <div className="absolute inset-x-3 bottom-4 flex flex-wrap gap-1 justify-center items-end">
                  {Array.from({ length: Math.min(count, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm animate-float"
                      style={{
                        width: i % 3 === 0 ? "32px" : "28px",
                        height: i % 2 === 0 ? "20px" : "16px",
                        background: `rgba(245,241,232,${0.7 + (i % 3) * 0.1})`,
                        border: "1px solid rgba(0,0,0,0.08)",
                        transform: `rotate(${(i % 5 - 2) * 12}deg)`,
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: `${3.5 + i * 0.6}s`,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Flying tickets on shake */}
              {phase === "shaking" && count > 0 &&
                TICKET_DIRECTIONS.slice(0, Math.min(count, 7)).map((dir, i) => (
                  <div
                    key={i}
                    className="absolute rounded-sm"
                    style={{
                      bottom: `${20 + (i % 3) * 15}px`,
                      left: `${10 + (i % 4) * 22}px`,
                      width: "28px",
                      height: "18px",
                      background: "rgba(245,241,232,0.9)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      animation: `ticket-fly 0.65s ease-out ${i * 0.04}s forwards`,
                      "--tx": dir.tx,
                      "--ty": dir.ty,
                      "--rot": dir.rot,
                    } as React.CSSProperties}
                  />
                ))}
            </div>
          </div>

          {/* Counter */}
          <p className="mt-3 text-xs text-muted-foreground">
            {count === 0
              ? "No movies yet — add some! 🎬"
              : `${count} ${count === 1 ? "movie" : "movies"} waiting`}
          </p>

          {/* Status text during animation */}
          {phase === "shaking" && (
            <p className="mt-4 text-sm text-muted-foreground animate-pulse tracking-wide">
              Drawing a ticket…
            </p>
          )}
          {phase === "rising" && (
            <p className="mt-4 text-sm text-primary animate-pulse tracking-wide font-medium">
              Tonight's movie is…
            </p>
          )}

          {/* Shake button */}
          {phase === "idle" && (
            <button
              onClick={shake}
              disabled={count === 0}
              className="mt-5 rounded-full text-sm font-semibold px-7 py-3 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #E8B860, #D89B3D)",
                color: "#0D1324",
                boxShadow: "0 0 24px rgba(232,184,96,0.35), 0 4px 12px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              🍿 Shake the Jar
            </button>
          )}
        </div>
      )}

      {/* ── Reveal card ─────────────────────────────────────────────── */}
      {phase === "revealed" && picked && (
        <div
          className={`w-full max-w-sm ${isExiting ? "animate-intro-exit" : "animate-ticket-unfold"}`}
        >
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg, #1A2038 0%, #151A2E 100%)",
              border: "1px solid rgba(232,184,96,0.25)",
              boxShadow: "0 0 60px rgba(232,184,96,0.12), 0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <p className="text-[9px] uppercase tracking-[0.35em] text-primary/70 mb-1">
              🎬 Tonight's Movie
            </p>

            {picked.poster_url ? (
              <div className="w-20 h-28 mx-auto rounded-xl overflow-hidden mt-3 mb-3 shadow-lg">
                <img
                  src={picked.poster_url}
                  alt={picked.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-4xl my-4">🎞️</div>
            )}

            <h2 className="font-serif text-2xl mt-1 leading-tight">{picked.title}</h2>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              {picked.year && (
                <div className="rounded-lg bg-white/5 py-2 px-3">
                  <p className="text-[9px] uppercase tracking-widest text-primary/60">Year</p>
                  <p className="text-sm font-medium mt-0.5">{picked.year}</p>
                </div>
              )}
              {picked.runtime && (
                <div className="rounded-lg bg-white/5 py-2 px-3">
                  <p className="text-[9px] uppercase tracking-widest text-primary/60">Runtime</p>
                  <p className="text-sm font-medium mt-0.5">{formatRuntime(picked.runtime)}</p>
                </div>
              )}
              {picked.added_by && (
                <div className="rounded-lg bg-white/5 py-2 px-3">
                  <p className="text-[9px] uppercase tracking-widest text-primary/60">Added by</p>
                  <p className="text-sm font-medium mt-0.5 capitalize">{picked.added_by}</p>
                </div>
              )}
              {picked.expected_mood && (
                <div className="rounded-lg bg-white/5 py-2 px-3">
                  <p className="text-[9px] uppercase tracking-widest text-primary/60">Mood</p>
                  <p className="text-sm font-medium mt-0.5">{picked.expected_mood}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2 justify-center">
              <button
                onClick={drawAgain}
                className="rounded-full border border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Draw Again
              </button>
              <button
                onClick={() => navigate({ to: "/movie/$id", params: { id: picked.id } })}
                className="rounded-full px-5 py-2.5 text-xs font-semibold transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #E8B860, #D89B3D)",
                  color: "#0D1324",
                  boxShadow: "0 0 16px rgba(232,184,96,0.3)",
                }}
              >
                Let's Watch Tonight →
              </button>
            </div>

            <button
              onClick={reset}
              className="mt-3 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Put it back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
