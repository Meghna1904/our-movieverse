import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { TicketCard } from "@/components/MovieCard";
import { MarkWatchedDialog } from "@/components/MarkWatchedDialog";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies, updateMovie, deleteMovie, type Movie } from "@/lib/movies.functions";
import { Input } from "@/components/ui/input";
import { Search, Bookmark } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/watchlist")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
  },
  head: () => ({
    meta: [
      { title: "Watchlist — The Movieverse" },
      { name: "description", content: "Movies we still want to watch together." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const update = useServerFn(updateMovie);
  const del = useServerFn(deleteMovie);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "priority" | "title">("recent");
  const [watching, setWatching] = useState<Movie | null>(null);

  const query = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => listMovies({ data: { status: "watchlist" } }),
  });

  const items = useMemo(() => {
    const list = (query.data ?? []).filter((m) =>
      q ? m.title.toLowerCase().includes(q.toLowerCase()) : true,
    );
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "priority") {
      const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return [...list].sort((a, b) => (rank[a.priority ?? "z"] ?? 3) - (rank[b.priority ?? "z"] ?? 3));
    }
    return list;
  }, [query.data, q, sort]);

  const handleMarkWatched = async (values: Record<string, unknown>) => {
    if (!watching) return;
    try {
      await update({
        data: {
          id: watching.id,
          patch: { ...(values as object), status: "watched" } as never,
        },
      });
      toast.success(`${watching.title} — added to your memories`);
      setWatching(null);
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (m: Movie) => {
    if (!confirm(`Remove "${m.title}" from watchlist?`)) return;
    await del({ data: { id: m.id } });
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["movies"] });
  };

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">The queue</p>
          <h1 className="font-serif text-4xl mt-1">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "movie" : "movies"} waiting for us.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/add" })}
          className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-110"
        >
          + Add movie
        </button>
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
          <option value="recent">Recently added</option>
          <option value="priority">Priority</option>
          <option value="title">A–Z</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl">
          <Bookmark className="mx-auto w-10 h-10 text-muted-foreground/50" />
          <h3 className="mt-4 font-serif text-2xl">Nothing here yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Add the first movie you both want to see. It'll live here until movie night.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((m) => (
            <TicketCard
              key={m.id}
              movie={m}
              onMarkWatched={() => setWatching(m)}
              onDelete={() => handleDelete(m)}
            />
          ))}
        </div>
      )}

      {watching && (
        <MarkWatchedDialog
          open
          onOpenChange={(v) => !v && setWatching(null)}
          title={watching.title}
          onSave={handleMarkWatched}
        />
      )}
    </AppShell>
  );
}
