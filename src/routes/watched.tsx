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
      { title: "Archive - Our Movieverse" },
      { name: "description", content: "Every movie we have watched together." },
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
    if (sort === "rating") {
      return [...list].sort((a, b) => {
        const av = ((Number(a.my_rating) || 0) + (Number(a.his_rating) || 0)) / 2;
        const bv = ((Number(b.my_rating) || 0) + (Number(b.his_rating) || 0)) / 2;
        return bv - av;
      });
    }
    return [...list].sort((a, b) =>
      (b.watched_date ?? "").localeCompare(a.watched_date ?? ""),
    );
  }, [query.data, q, sort]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">The archive</p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">Watched together</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "movie" : "movies"} saved as part of
            your little cinema.
          </p>
        </div>
        <Link to="/add" className="our-button our-button-primary">
          <Plus className="h-4 w-4" /> Add movie
        </Link>
      </div>

      <div className="room-panel mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the archive..."
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
            <option value="title">A-Z</option>
          </select>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="room-panel grid min-h-80 place-items-center text-center">
          <div>
            <Film className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-4 font-serif text-2xl">No memories here yet.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              When a movie is marked watched, its poster lands here and on the wall.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <MoviePosterCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
