import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { MovieJar } from "@/components/MovieJar";
import { TicketCard } from "@/components/MovieCard";
import { MarkWatchedDialog } from "@/components/MarkWatchedDialog";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies, updateMovie, deleteMovie, type Movie } from "@/lib/movies.functions";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronDown, Bookmark } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/watchlist")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who as "whiskeyy" | "matildaa" };
  },
  head: () => ({
    meta: [
      { title: "The Jar - Our Movieverse" },
      { name: "description", content: "Movies waiting for the next shared movie night." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { who } = Route.useRouteContext();
  const qc = useQueryClient();
  const update = useServerFn(updateMovie);
  const del = useServerFn(deleteMovie);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "priority" | "title">("recent");
  const [watching, setWatching] = useState<Movie | null>(null);
  const [showList, setShowList] = useState(true);

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
      toast.success(`${watching.title} saved to your memories`);
      window.dispatchEvent(
        new CustomEvent("movieverse:garden-bloom", {
          detail: { title: watching.title },
        }),
      );
      setWatching(null);
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (m: Movie) => {
    if (!confirm(`Remove "${m.title}" from the jar?`)) return;
    await del({ data: { id: m.id } });
    toast.success("Removed from the jar");
    qc.invalidateQueries({ queryKey: ["movies"] });
  };

  const count = query.data?.length ?? 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">The shared queue</p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">The movie jar</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {count} {count === 1 ? "movie is" : "movies are"} folded up and waiting
            for the next night you cannot decide.
          </p>
        </div>
        <Link to="/add" className="our-button our-button-primary">
          <Plus className="h-4 w-4" /> Add movie
        </Link>
      </div>

      <section className="mb-8">
        {query.isLoading ? (
          <div className="room-panel grid min-h-80 place-items-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading the jar...</p>
          </div>
        ) : count === 0 ? (
          <div className="room-panel grid min-h-80 place-items-center px-6 text-center">
            <div>
              <Bookmark className="mx-auto h-10 w-10 text-primary/70" />
              <h3 className="mt-4 font-serif text-2xl">The jar is empty.</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Add movies you both want to see. The first ticket will make this room
                feel alive.
              </p>
              <Link to="/add" className="our-button our-button-primary mt-5">
                <Plus className="h-4 w-4" /> Add the first movie
              </Link>
            </div>
          </div>
        ) : (
          <MovieJar movies={items.length > 0 ? items : (query.data ?? [])} />
        )}
      </section>

      {count > 0 && (
        <>
          <button
            onClick={() => setShowList((v) => !v)}
            className="mb-4 flex w-full items-center gap-2 text-left group"
          >
            <h2 className="font-serif text-2xl">Folded tickets</h2>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${showList ? "" : "-rotate-90"}`}
            />
          </button>

          {showList && (
            <div className="room-panel">
              <div className="mb-5 flex flex-wrap gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search the jar..."
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
                  <option value="title">A-Z</option>
                </select>
              </div>

              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No tickets match "{q}".
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
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
            </div>
          )}
        </>
      )}

      {watching && (
        <MarkWatchedDialog
          open
          who={who}
          onOpenChange={(v) => !v && setWatching(null)}
          title={watching.title}
          onSave={handleMarkWatched}
        />
      )}
    </AppShell>
  );
}
