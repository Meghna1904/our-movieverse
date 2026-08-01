import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { MovieJar } from "@/components/MovieJar";
import { CinemaGarden } from "@/components/CinemaGarden";
import { StarField } from "@/components/StarField";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies, getStats } from "@/lib/movies.functions";
import { Star, Film, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who as "whiskeyy" | "matildaa" };
  },
  head: () => ({
    meta: [
      { title: "Home — The Movieverse" },
      { name: "description", content: "Welcome back to our little cinema." },
    ],
  }),
  component: Home,
});

function greeting(who: string): { time: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 5)  return { time: "Still up",        emoji: "🌃" };
  if (h < 12) return { time: "Good morning",    emoji: "☀️" };
  if (h < 17) return { time: "Good afternoon",  emoji: "🎞️" };
  if (h < 21) return { time: "Good evening",    emoji: "🌆" };
  return              { time: "Good night",      emoji: "🌙" };
}

function Home() {
  const { who } = Route.useRouteContext();
  const { time, emoji } = greeting(who);
  const other = who === "whiskeyy" ? "matildaa" : "Whiskeyy";

  const statsQ    = useQuery({ queryKey: ["stats"],                    queryFn: () => getStats() });
  const watchedQ  = useQuery({ queryKey: ["movies", "watched"],        queryFn: () => listMovies({ data: { status: "watched" } }) });
  const watchlistQ= useQuery({ queryKey: ["movies", "watchlist"],      queryFn: () => listMovies({ data: { status: "watchlist" } }) });

  const watched   = watchedQ.data ?? [];
  const watchlist = watchlistQ.data ?? [];
  const recent    = watched.slice(0, 4);
  const stats     = statsQ.data;

  return (
    <AppShell>

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {time}, {emoji}
        </p>
        <h1 className="mt-1 font-serif text-4xl md:text-5xl leading-tight">
          <span className="text-primary capitalize">{who}</span>.{" "}
          <span className="text-foreground/70">Ready for a movie?</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your little cinema with{" "}
          <span className="text-lavender">{other}</span> — {watched.length} memories so far.
        </p>
      </section>

      {/* ── Movie Jar hero ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div
          className="rounded-3xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0D1324 0%, #151A2E 50%, #1A2038 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Subtle gold shimmer at top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: "60%",
              height: "1px",
              background: "linear-gradient(to right, transparent, rgba(232,184,96,0.3), transparent)",
            }}
          />

          <div className="px-6 pt-7 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60">
                  The Movie Jar
                </p>
                <h2 className="font-serif text-xl mt-0.5">
                  Can't decide?
                </h2>
              </div>
              <Link
                to="/watchlist"
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition"
              >
                See all {watchlist.length} →
              </Link>
            </div>
          </div>

          <div className="px-6 pb-8">
            {watchlistQ.isLoading ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
                Loading jar…
              </div>
            ) : watchlist.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">🫙</p>
                <p className="text-sm text-muted-foreground">The jar is empty.</p>
                <Link
                  to="/add"
                  className="mt-3 inline-flex rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs hover:bg-primary/20 transition"
                >
                  Add the first movie →
                </Link>
              </div>
            ) : (
              <MovieJar movies={watchlist} />
            )}
          </div>
        </div>
      </section>

      {/* ── Recently watched ─────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-2xl">Recently watched</h2>
            <Link to="/watched" className="text-xs text-primary hover:underline">See all →</Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {recent.map((m) => (
              <Link
                key={m.id}
                to="/movie/$id"
                params={{ id: m.id }}
                className="group"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary card-lift hover:[&]:card-lift-hover shadow-[var(--shadow-poster)]">
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[10px] text-muted-foreground px-2 text-center">
                      {m.title}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground truncate group-hover:text-foreground transition-colors">
                  {m.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Cinema Garden ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <CinemaGarden watchedCount={stats?.totalWatched ?? 0} />
      </section>

      {/* ── Memory Sky preview ────────────────────────────────────────── */}
      {watched.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl">Memory Sky</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {watched.length} {watched.length === 1 ? "star" : "stars"} — each one a memory
              </p>
            </div>
            <Link to="/sky" className="text-xs text-primary hover:underline">Open sky →</Link>
          </div>
          <Link to="/sky" className="block group">
            <div className="relative overflow-hidden rounded-2xl transition-transform group-hover:scale-[1.01]">
              <StarField movies={watched} compact />
              <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
            </div>
          </Link>
        </section>
      )}

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      {stats && (
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <Film className="w-4 h-4 text-muted-foreground mx-auto" />
            <p className="font-mono text-2xl mt-2">{stats.totalWatched}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Watched</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <Star className="w-4 h-4 text-primary mx-auto" />
            <p className="font-mono text-2xl mt-2">{stats.avgRating ?? "—"}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Avg rating</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto" />
            <p className="font-mono text-2xl mt-2">{stats.hoursWatched}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Hours</p>
          </div>
        </section>
      )}

    </AppShell>
  );
}
