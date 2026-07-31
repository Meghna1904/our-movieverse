import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getSessionStatus } from "@/lib/gate.functions";
import { getStats } from "@/lib/movies.functions";

export const Route = createFileRoute("/stats")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
  },
  head: () => ({
    meta: [
      { title: "Stats — The Movieverse" },
      { name: "description", content: "The story of our movie nights, in numbers." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const q = useQuery({ queryKey: ["stats"], queryFn: () => getStats() });
  const s = q.data;
  const genres = Object.entries(s?.genreBreakdown ?? {}).sort((a, b) => b[1] - a[1]);
  const maxGenre = genres[0]?.[1] ?? 1;

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Us, in numbers
        </p>
        <h1 className="font-serif text-4xl mt-1">Statistics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Big label="Watched" value={s?.totalWatched ?? "—"} />
        <Big label="In watchlist" value={s?.totalWatchlist ?? "—"} />
        <Big label="Hours" value={s?.hoursWatched ?? "—"} />
        <Big label="This year" value={s?.thisYear ?? "—"} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="font-serif text-2xl mb-4">Ratings</h2>
          <Row label="Average" value={s?.avgRating ?? "—"} accent="gold" />
          <Row label="Whiskeyy's average" value={s?.myAvg ?? "—"} accent="gold" />
          <Row label="matildaa's average" value={s?.hisAvg ?? "—"} accent="lavender" />
        </Card>
        <Card>
          <h2 className="font-serif text-2xl mb-4">Who added what</h2>
          <Row label="Whiskeyy" value={s?.addedByWhiskeyy ?? "—"} accent="gold" />
          <Row label="matildaa" value={s?.addedByMatildaa ?? "—"} accent="lavender" />
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Favorite genre</p>
            <p className="font-serif text-2xl mt-1">{s?.favoriteGenre ?? "—"}</p>
          </div>
        </Card>
      </div>

      {genres.length > 0 && (
        <Card>
          <h2 className="font-serif text-2xl mb-4">Genre breakdown</h2>
          <div className="space-y-2">
            {genres.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{name}</span>
                  <span className="font-mono text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-[#D89B3D]"
                    style={{ width: `${(count / maxGenre) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function Big({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <p className="font-mono text-4xl">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-card border border-border p-6">{children}</div>;
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string | null;
  accent: "gold" | "lavender";
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          "font-mono text-xl " + (accent === "gold" ? "text-primary" : "text-lavender")
        }
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
