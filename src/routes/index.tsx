import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies, getStats } from "@/lib/movies.functions";
import { quoteOfTheDay } from "@/lib/movie-quotes";
import { todayLong } from "@/lib/format";
import { Sparkles, Bookmark, Film, Clock, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who };
  },
  head: () => ({
    meta: [
      { title: "Home — The Movieverse" },
      { name: "description", content: "Welcome back to our little cinema." },
    ],
  }),
  component: Home,
});

function Home() {
  const { who } = Route.useRouteContext();
  const q = quoteOfTheDay();

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => getStats() });
  const recent = useQuery({
    queryKey: ["movies", "watched", "recent"],
    queryFn: () => listMovies({ data: { status: "watched" } }),
  });
  const watchlist = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => listMovies({ data: { status: "watchlist" } }),
  });

  const recentThree = (recent.data ?? []).slice(0, 4);
  const upcoming = (watchlist.data ?? []).slice(0, 4);

  return (
    <AppShell>
      <section className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {todayLong()}
        </p>
        <h1 className="mt-2 font-serif text-5xl md:text-6xl leading-tight">
          Welcome back, <span className="text-primary">{who}</span>.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          A little scrapbook of every movie you and{" "}
          <span className="text-lavender">
            {who === "whiskeyy" ? "matildaa" : "Whiskeyy"}
          </span>{" "}
          have watched together.
        </p>
      </section>

      {/* Quote of the day */}
      <section className="mb-10 glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <Sparkles className="absolute top-4 right-4 w-4 h-4 text-primary/60" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Quote of the day
        </p>
        <blockquote className="mt-3 font-serif text-2xl md:text-3xl leading-snug">
          “{q.quote}”
        </blockquote>
        <p className="mt-2 text-xs text-muted-foreground">— {q.movie}</p>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard icon={Film} label="Watched" value={stats.data?.totalWatched ?? "—"} />
        <StatCard icon={Bookmark} label="Watchlist" value={stats.data?.totalWatchlist ?? "—"} />
        <StatCard icon={Star} label="Avg rating" value={stats.data?.avgRating ?? "—"} accent />
        <StatCard icon={Clock} label="Hours" value={stats.data?.hoursWatched ?? "—"} />
      </section>

      {/* Recent + Upcoming */}
      <div className="grid md:grid-cols-2 gap-8">
        <Panel
          title="Recently watched"
          link="/watched"
          empty="No memories yet. Watch your first movie together."
          items={recentThree}
        />
        <Panel
          title="Up next"
          link="/watchlist"
          empty="Watchlist is empty. Add a movie you both want to see."
          items={upcoming}
        />
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 card-lift hover:[&]:card-lift-hover">
      <Icon className={"w-4 h-4 " + (accent ? "text-primary" : "text-muted-foreground")} />
      <p className="mt-3 font-mono text-3xl">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}

function Panel({
  title,
  link,
  empty,
  items,
}: {
  title: string;
  link: "/watched" | "/watchlist";
  empty: string;
  items: Array<{ id: string; title: string; poster_url?: string | null; year?: number | null }>;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <Link to={link} className="text-xs text-primary hover:underline">
          See all →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-2xl">
          {empty}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {items.map((m) => (
            <Link
              key={m.id}
              to="/movie/$id"
              params={{ id: m.id }}
              className="group"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary card-lift hover:[&]:card-lift-hover">
                {m.poster_url ? (
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[10px] text-muted-foreground px-2 text-center">
                    {m.title}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
