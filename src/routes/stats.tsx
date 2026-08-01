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
      { title: "Patterns - Our Movieverse" },
      { name: "description", content: "The shape of our movie nights, in numbers." },
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
        <p className="page-kicker">Us, in numbers</p>
        <h1 className="mt-1 font-serif text-4xl md:text-5xl">Movie-night patterns</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          A soft little dashboard of what you watch, who adds what, and the genres
          that keep showing up.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Big label="Watched" value={s?.totalWatched ?? "-"} />
        <Big label="In the jar" value={s?.totalWatchlist ?? "-"} />
        <Big label="Hours" value={s?.hoursWatched ?? "-"} />
        <Big label="This year" value={s?.thisYear ?? "-"} />
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-serif text-2xl">Ratings</h2>
          <Row label="Average" value={s?.avgRating ?? "-"} accent="gold" />
          <Row label="Whiskeyy's average" value={s?.myAvg ?? "-"} accent="gold" />
          <Row label="matildaa's average" value={s?.hisAvg ?? "-"} accent="lavender" />
        </Card>
        <Card>
          <h2 className="mb-4 font-serif text-2xl">Who added what</h2>
          <Row label="Whiskeyy" value={s?.addedByWhiskeyy ?? "-"} accent="gold" />
          <Row label="matildaa" value={s?.addedByMatildaa ?? "-"} accent="lavender" />
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Favorite genre</p>
            <p className="mt-1 font-serif text-2xl">{s?.favoriteGenre ?? "-"}</p>
          </div>
        </Card>
      </div>

      {genres.length > 0 && (
        <Card>
          <h2 className="mb-4 font-serif text-2xl">Genre breakdown</h2>
          <div className="space-y-3">
            {genres.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-mono text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[#D89B3D]"
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
    <div className="room-panel p-5">
      <p className="font-mono text-4xl">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="room-panel p-6">{children}</div>;
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
    <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          "font-mono text-xl " + (accent === "gold" ? "text-primary" : "text-lavender")
        }
      >
        {value ?? "-"}
      </span>
    </div>
  );
}
