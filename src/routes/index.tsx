import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { MovieJar } from "@/components/MovieJar";
import { CinemaGarden } from "@/components/CinemaGarden";
import { StarField } from "@/components/StarField";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies, getStats } from "@/lib/movies.functions";
import { Star, Film, Clock, Sparkles, Bookmark, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who as "whiskeyy" | "matildaa" };
  },
  head: () => ({
    meta: [
      { title: "Our Movieverse" },
      { name: "description", content: "A shared movie room for Whiskeyy and matildaa." },
    ],
  }),
  component: Home,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function displayName(who: "whiskeyy" | "matildaa") {
  return who === "whiskeyy" ? "Whiskeyy" : "matildaa";
}

function Home() {
  const { who } = Route.useRouteContext();
  const other = who === "whiskeyy" ? "matildaa" : "Whiskeyy";

  const statsQ = useQuery({ queryKey: ["stats"], queryFn: () => getStats() });
  const watchedQ = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => listMovies({ data: { status: "watched" } }),
  });
  const watchlistQ = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => listMovies({ data: { status: "watchlist" } }),
  });

  const watched = watchedQ.data ?? [];
  const watchlist = watchlistQ.data ?? [];
  const recent = watched.slice(0, 5);
  const stats = statsQ.data;

  return (
    <AppShell>
      <section className="home-room mb-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="page-kicker">{greeting()}, {displayName(who)}</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
              Welcome back to the little cinema you built together.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              A warm corner for Whiskeyy and matildaa: the jar for indecision, the wall
              for memories, and the archive for every night that became part of the story.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/watchlist" className="our-button our-button-primary">
                <Bookmark className="h-4 w-4" /> Shake the jar
              </Link>
              <Link to="/sky" className="our-button our-button-soft">
                <Sparkles className="h-4 w-4" /> Open the wall
              </Link>
              <Link to="/add" className="our-button our-button-ghost">
                <Plus className="h-4 w-4" /> Add a movie
              </Link>
            </div>
          </div>

          <div className="home-stat-stack">
            <MiniStat icon={Film} label="Watched" value={stats?.totalWatched ?? watched.length} />
            <MiniStat icon={Bookmark} label="In the jar" value={stats?.totalWatchlist ?? watchlist.length} />
            <MiniStat icon={Clock} label="Hours" value={stats?.hoursWatched ?? 0} />
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="page-kicker">Tonight's ritual</p>
            <h2 className="mt-1 font-serif text-3xl">The movie jar</h2>
          </div>
          <Link to="/watchlist" className="text-xs text-primary hover:underline">
            See all {watchlist.length}
          </Link>
        </div>

        {watchlistQ.isLoading ? (
          <div className="room-panel grid min-h-72 place-items-center text-sm text-muted-foreground">
            Loading the jar...
          </div>
        ) : watchlist.length === 0 ? (
          <div className="room-panel grid min-h-72 place-items-center text-center">
            <div>
              <h3 className="font-serif text-2xl">The jar is waiting.</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Add movies you both want to watch, then let one ticket rise out for movie night.
              </p>
              <Link to="/add" className="our-button our-button-primary mt-5">
                <Plus className="h-4 w-4" /> Add the first movie
              </Link>
            </div>
          </div>
        ) : (
          <MovieJar movies={watchlist} />
        )}
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <div className="room-panel">
          <div className="mb-5 flex items-baseline justify-between">
            <div>
              <p className="page-kicker">Recently saved</p>
              <h2 className="mt-1 font-serif text-3xl">Last memories</h2>
            </div>
            <Link to="/watched" className="text-xs text-primary hover:underline">
              Archive
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {recent.map((m) => (
                <Link key={m.id} to="/movie/$id" params={{ id: m.id }} className="group">
                  <div className="poster-memory-frame">
                    {m.poster_url ? (
                      <img
                        src={m.poster_url}
                        alt={m.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-3 text-center font-serif text-sm text-muted-foreground">
                        {m.title}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground group-hover:text-foreground">
                    {m.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center text-center">
              <div>
                <Film className="mx-auto h-9 w-9 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  The first watched movie will land here.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="room-panel overflow-hidden">
          <div className="mb-4">
            <p className="page-kicker">Growing with you</p>
            <h2 className="mt-1 font-serif text-3xl">Cinema garden</h2>
          </div>
          <CinemaGarden watchedCount={stats?.totalWatched ?? watched.length} />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="page-kicker">Pinned up</p>
            <h2 className="mt-1 font-serif text-3xl">The Polaroid wall</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every watched movie becomes a little poster memory.
            </p>
          </div>
          <Link to="/sky" className="text-xs text-primary hover:underline">
            Open wall
          </Link>
        </div>

        <Link to="/sky" className="block overflow-hidden rounded-[1.35rem] transition-transform hover:scale-[1.01]">
          <StarField movies={watched} compact />
        </Link>
      </section>

      {stats && (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatStrip icon={Film} label="Movies watched" value={stats.totalWatched} />
          <StatStrip icon={Star} label="Average rating" value={stats.avgRating ?? "-"} />
          <StatStrip icon={Clock} label="Hours together" value={stats.hoursWatched} />
        </section>
      )}
    </AppShell>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Film;
  label: string;
  value: number | string;
}) {
  return (
    <div className="home-mini-stat">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="font-mono text-2xl leading-none">{value}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatStrip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Film;
  label: string;
  value: number | string;
}) {
  return (
    <div className="room-panel flex items-center gap-4 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-mono text-2xl leading-none">{value}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
