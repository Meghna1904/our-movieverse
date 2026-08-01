import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
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
import { Search, Bookmark, Plus, ChevronDown } from "lucide-react";
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
      { title: "Watchlist — The Movieverse" },
      { name: "description", content: "Movies we still want to watch together." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { who } = Route.useRouteContext();
  const qc       = useQueryClient();
  const navigate  = useNavigate();
  const update    = useServerFn(updateMovie);
  const del       = useServerFn(deleteMovie);

  const [q, setQ]         = useState("");
  const [sort, setSort]   = useState<"recent" | "priority" | "title">("recent");
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

  const count = query.data?.length ?? 0;

  return (
    <AppShell>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">The queue</p>
          <h1 className="font-serif text-4xl mt-1">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {count} {count === 1 ? "movie" : "movies"} waiting for a movie night.
          </p>
        </div>
        <Link
          to="/add"
          className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-110 inline-flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add movie
        </Link>
      </div>

      {/* ── Movie Jar hero ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div
          className="rounded-3xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0D1324 0%, #151A2E 50%, #1A2038 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Top gold line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: "60%",
              height: "1px",
              background: "linear-gradient(to right, transparent, rgba(232,184,96,0.3), transparent)",
            }}
          />

          {query.isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-muted-foreground animate-pulse">Loading jar…</p>
            </div>
          ) : count === 0 ? (
            <div className="py-16 flex flex-col items-center text-center px-6">
              <span className="text-5xl mb-4">🫙</span>
              <h3 className="font-serif text-2xl">The jar is empty</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Add movies you both want to see. Then shake the jar to pick tonight's film.
              </p>
              <Link
                to="/add"
                className="mt-5 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:brightness-110"
              >
                Add the first movie
              </Link>
            </div>
          ) : (
            <div className="px-6 py-8">
              <div className="text-center mb-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60">The Movie Jar</p>
                <p className="text-sm text-muted-foreground mt-0.5">Can't decide? Let fate choose.</p>
              </div>
              <MovieJar movies={items.length > 0 ? items : (query.data ?? [])} />
            </div>
          )}
        </div>
      </section>

      {/* ── All movies list ────────────────────────────────────────────── */}
      {count > 0 && (
        <>
          {/* Collapsible header */}
          <button
            onClick={() => setShowList((v) => !v)}
            className="flex items-center gap-2 w-full text-left mb-4 group"
          >
            <h2 className="font-serif text-2xl">All movies</h2>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${showList ? "" : "-rotate-90"}`}
            />
          </button>

          {showList && (
            <>
              {/* Search + sort */}
              <div className="mb-5 flex gap-3 flex-wrap">
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
                <p className="text-center py-10 text-sm text-muted-foreground">
                  No results for "{q}"
                </p>
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
            </>
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
