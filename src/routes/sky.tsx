import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { StarField } from "@/components/StarField";
import { getSessionStatus } from "@/lib/gate.functions";
import { listMovies } from "@/lib/movies.functions";

export const Route = createFileRoute("/sky")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
  },
  head: () => ({
    meta: [
      { title: "Memory Sky — The Movieverse" },
      { name: "description", content: "Every movie we watched together, a star in our sky." },
    ],
  }),
  component: SkyPage,
});

function SkyPage() {
  const q = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => listMovies({ data: { status: "watched" } }),
  });

  const movies = q.data ?? [];

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Our universe</p>
        <h1 className="font-serif text-4xl mt-1">Memory Sky</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {movies.length === 0
            ? "Watch your first movie together to light the first star."
            : `${movies.length} ${movies.length === 1 ? "star" : "stars"} — each one a memory. Hover to remember.`}
        </p>
      </div>

      {q.isLoading ? (
        <div className="h-[70vh] rounded-2xl skeleton" />
      ) : (
        <StarField movies={movies} />
      )}

      {movies.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Link
            to="/watched"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to the archive
          </Link>
        </div>
      )}
    </AppShell>
  );
}
