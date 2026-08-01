import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { MoviePosterCard } from "@/components/MovieCard";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies } from "@/lib/movies.functions";
import { Input } from "@/components/ui/input";
import { Search, Film, Plus } from "lucide-react";

export const Route = createFileRoute("/watched")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who };
  },
  head: () => ({
    meta: [
      { title: "Watched — The Movieverse" },
      { name: "description", content: "Every movie we've watched together." },
    ],
  }),
  component: WatchedPage,
});

function WatchedPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "rating" | "title">("recent");

  const query = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => listMovies({ data: { status: "watched" } }),
  });

  const items = useMemo(() => {
    const list = (query.data ?? []).filter((m) =>
      q ? m.title.toLowerCase().includes(q.toLowerCase()) : true,
    );
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "rating")
      return [...list].sort((a, b) => {
        const av = ((Number(a.my_rating) || 0) + (Number(a.his_rating) || 0)) / 2;
        const bv = ((Number(b.my_rating) || 0) + (Number(b.his_rating) || 0)) / 2;
        return bv - av;
      });
    return [...list].sort((a, b) =>
      (b.watched_date ?? "").localeCompare(a.watched_date ?? ""),
    );
  }, [query.data, q, sort]);

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">The archive</p>
          <h1 className="font-serif text-4xl mt-1">Watched together</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "movie" : "movies"} in your little cinema.
          </p>
        </div>
        <Link
          to="/add"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add movie
        </Link>
      </div>

      <div className="mb-6 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title…"
            className="pl-9 bg-input border-border"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-9 rounded-md bg-input border border-border px-3 text-sm"
        >
          <option value="recent">Recently watched</option>
          <option value="rating">Highest rated</option>
          <option value="title">A–Z</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl">
          <Film className="mx-auto w-10 h-10 text-muted-foreground/50" />
          <h3 className="mt-4 font-serif text-2xl">No movies yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            When you mark something watched from your watchlist, it lands here forever.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((m) => (
            <MoviePosterCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
