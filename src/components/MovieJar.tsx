import { useCallback, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Movie } from "@/lib/movies.functions";
import { formatRuntime } from "@/lib/format";

type Phase =
  | "idle"
  | "shaking"
  | "opening"
  | "swirling"
  | "emerging"
  | "pausing"
  | "unfolding"
  | "revealed";

const TICKET_PATHS = [
  { x: "-110px", y: "-150px", r: "-28deg" },
  { x: "105px", y: "-165px", r: "32deg" },
  { x: "-62px", y: "-210px", r: "18deg" },
  { x: "72px", y: "-205px", r: "-22deg" },
  { x: "-24px", y: "-178px", r: "48deg" },
  { x: "130px", y: "-120px", r: "-42deg" },
  { x: "-135px", y: "-108px", r: "38deg" },
];

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function MovieJar({ movies }: { movies: Movie[] }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [picked, setPicked] = useState<Movie | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [foldingBack, setFoldingBack] = useState(false);

  const count = movies.length;
  const isAnimating = phase !== "idle";

  const pickNext = useCallback(
    (exclude: Set<string>) => {
      const pool = movies.filter((movie) => !exclude.has(movie.id));
      const source = pool.length > 0 ? pool : movies;
      return source[Math.floor(Math.random() * source.length)];
    },
    [movies],
  );

  const runPick = useCallback(
    async (exclude: Set<string>) => {
      if (movies.length === 0) return;
      setPicked(pickNext(exclude));
      setFoldingBack(false);

      setPhase("shaking");
      await sleep(650);
      setPhase("opening");
      await sleep(550);
      setPhase("swirling");
      await sleep(950);
      setPhase("emerging");
      await sleep(1150);
      setPhase("pausing");
      await sleep(420);
      setPhase("unfolding");
      await sleep(620);
      setPhase("revealed");
    },
    [movies.length, pickNext],
  );

  async function shake() {
    if (isAnimating || count === 0) return;
    await runPick(seen);
  }

  async function drawAgain() {
    if (!picked) return;
    setFoldingBack(true);
    await sleep(520);
    const nextSeen = new Set(seen);
    nextSeen.add(picked.id);
    setSeen(nextSeen);
    await runPick(nextSeen);
  }

  async function putBack() {
    setFoldingBack(true);
    await sleep(520);
    setPhase("idle");
    setPicked(null);
    setFoldingBack(false);
  }

  return (
    <div className="movie-desk-scene relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl">
      <div className="desk-night absolute inset-0" />
      <div className="desk-spotlight absolute inset-0" />
      <div className="desk-fairy-lights absolute left-4 right-4 top-5" />
      <div className="desk-candle absolute right-[8%] bottom-[28%]">
        <span />
      </div>
      <div className="desk-fireflies absolute inset-0" />

      <div className="relative z-10 grid min-h-[620px] items-end gap-8 px-5 pb-8 pt-36 md:grid-cols-[1fr_1.35fr_1fr] md:px-8">
        <div className="hidden min-h-56 items-end md:flex">
          <div className="desk-projector">
            <span className="projector-lens" />
            <span className="projector-reel projector-reel-one" />
            <span className="projector-reel projector-reel-two" />
            <span className="projector-beam" />
          </div>
        </div>

        <div className="relative flex min-h-[520px] flex-col items-center justify-end">
          {(phase === "swirling" || phase === "emerging") &&
            TICKET_PATHS.slice(0, Math.min(count, 7)).map((path, index) => (
              <span
                key={index}
                className="jar-flying-ticket"
                style={
                  {
                    "--ticket-x": path.x,
                    "--ticket-y": path.y,
                    "--ticket-r": path.r,
                    animationDelay: `${index * 0.07}s`,
                  } as CSSProperties
                }
              />
            ))}

          {(phase === "emerging" || phase === "pausing") && (
            <span
              className={`chosen-ticket-rising ${
                phase === "pausing" ? "chosen-ticket-paused" : ""
              }`}
            />
          )}

          {(phase === "unfolding" || phase === "revealed") && picked && (
            <div
              className={`jar-ticket-reveal ${
                phase === "revealed" ? "jar-ticket-settled" : ""
              } ${foldingBack ? "jar-ticket-return" : ""}`}
            >
              <div className="grid items-center gap-4 sm:grid-cols-[7.5rem_1fr]">
                <div className="ticket-poster-frame">
                  {picked.poster_url ? (
                    <img src={picked.poster_url} alt={picked.title} />
                  ) : (
                    <div className="ticket-poster-placeholder">
                      <span>{picked.title}</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#9A6428]">
                    Tonight's movie
                  </p>
                  <h2 className="mt-2 font-serif text-2xl leading-tight text-[#2F2016] sm:text-3xl">
                    {picked.title}
                  </h2>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-left text-xs text-[#5A402E]">
                    {picked.added_by && (
                      <div>
                        <p className="uppercase tracking-[0.18em] text-[#9A6428]">Added by</p>
                        <p className="mt-1 capitalize">{picked.added_by}</p>
                      </div>
                    )}
                    {picked.runtime && (
                      <div>
                        <p className="uppercase tracking-[0.18em] text-[#9A6428]">Runtime</p>
                        <p className="mt-1">{formatRuntime(picked.runtime)}</p>
                      </div>
                    )}
                    {picked.expected_mood && (
                      <div className="col-span-2">
                        <p className="uppercase tracking-[0.18em] text-[#9A6428]">Mood</p>
                        <p className="mt-1">{picked.expected_mood}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="jar-ticket-actions mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={drawAgain}
                  className="rounded-full border border-[#8C6342]/30 px-4 py-2 text-xs font-semibold text-[#5A402E] transition hover:bg-[#8C6342]/10"
                >
                  Draw again
                </button>
                <button
                  onClick={() => navigate({ to: "/movie/$id", params: { id: picked.id } })}
                  className="rounded-full bg-[#8C4E26] px-5 py-2 text-xs font-semibold text-[#FFF7E8] shadow-lg transition hover:bg-[#A45F2E]"
                >
                  Let's watch
                </button>
              </div>
              <button
                onClick={putBack}
                className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#8C6342]/60 transition hover:text-[#5A402E]"
              >
                Fold it back
              </button>
            </div>
          )}

          <div
            className={`apothecary-jar ${phase === "opening" ? "jar-opening" : ""} ${
              phase === "shaking" ? "jar-shaking" : ""
            } ${
              phase !== "idle" && phase !== "shaking" ? "jar-open" : ""
            } ${
              phase === "swirling" || phase === "emerging" ? "jar-awake" : ""
            }`}
          >
            <div className="jar-lid">
              <span className="jar-lid-top" />
            </div>
            <div className="jar-neck" />
            <div className="jar-glass">
              <span className="jar-highlight jar-highlight-left" />
              <span className="jar-highlight jar-highlight-right" />
              <span className="jar-glow" />
              <div className="jar-ticket-pile">
                {Array.from({ length: Math.min(Math.max(count, 1) + 7, 28) }).map((_, index) => (
                  <span
                    key={index}
                    className="paper-ticket"
                    style={
                      {
                        "--paper-rotate": `${(index % 7) * 11 - 33}deg`,
                        "--paper-left": `${12 + ((index * 19) % 64)}%`,
                        "--paper-bottom": `${12 + ((index * 11) % 38)}%`,
                        "--paper-delay": `${index * 0.09}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
            <div className="jar-base-shadow" />
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[#D7B98A]/70">
              Movie jar
            </p>
            <p className="mt-1 text-sm text-[#F9E8C8]/80">
              {count === 0
                ? "The jar is waiting for its first ticket."
                : `${count} ${count === 1 ? "ticket" : "tickets"} folded inside`}
            </p>
            {phase === "idle" && (
              <button
                onClick={shake}
                disabled={count === 0}
                className="mt-4 rounded-full bg-[#E8B860] px-7 py-3 text-sm font-bold text-[#2F2016] shadow-[0_0_28px_rgba(232,184,96,0.35)] transition hover:-translate-y-0.5 hover:bg-[#F2C978] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Shake the jar
              </button>
            )}
            {phase === "shaking" && (
              <p className="mt-4 text-sm text-[#F9E8C8]/70">The papers start tumbling...</p>
            )}
            {phase === "opening" && (
              <p className="mt-4 text-sm text-[#F9E8C8]/70">The lid creaks open...</p>
            )}
            {phase === "swirling" && (
              <p className="mt-4 text-sm text-[#F9E8C8]/70">The tickets are stirring...</p>
            )}
            {phase === "emerging" && (
              <p className="mt-4 text-sm text-[#E8B860]">One ticket is choosing itself...</p>
            )}
            {(phase === "pausing" || phase === "unfolding" || phase === "revealed") && (
              <p className="mt-4 text-sm text-[#F9E8C8]/65">The jar settles back down.</p>
            )}
          </div>
        </div>

        <div className="hidden min-h-56 items-end justify-end md:flex">
          <div className="desk-side-props">
            <div className="desk-popcorn">
              <span />
              <span />
              <span />
            </div>
            <div className="desk-notebook">
              <p>movie notes</p>
            </div>
            <div className="desk-loose-tickets">
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      <div className="wooden-desktop absolute bottom-0 left-0 right-0 h-[30%]" />
    </div>
  );
}
