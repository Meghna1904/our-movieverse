import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lockSite, getSessionStatus } from "@/lib/gate.functions";
import { listMovies } from "@/lib/movies.functions";
import { Film, Home, Bookmark, BarChart3, Plus, LogOut, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { DustParticles } from "@/components/Ambient";
import { MouseGlow } from "@/components/MouseGlow";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/watched", label: "Watched", icon: Film },
  { to: "/sky", label: "Wall", icon: Sparkles },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Get current user
  const whoQuery = useQuery({
    queryKey: ["session"],
    queryFn: () => getSessionStatus(),
    staleTime: 60_000,
  });
  const who = whoQuery.data?.who as "whiskeyy" | "matildaa" | null | undefined;

  // Get watched movies
  const moviesQuery = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => listMovies({ data: { status: "watched" } }),
    staleTime: 30_000,
  });

  // Movies where THIS user hasn't rated yet
  const unrated = (moviesQuery.data ?? []).filter((m) => {
    if (!who) return false;
    const mine = who === "whiskeyy" ? m.my_rating : m.his_rating;
    return mine == null;
  });

  const count = unrated.length;

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-white/5 text-muted-foreground transition"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold">Pending ratings</p>
            {count === 0 && (
              <span className="text-xs text-muted-foreground">All caught up ✓</span>
            )}
          </div>

          {count === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              You've rated everything 🌟
            </div>
          ) : (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {unrated.map((m) => (
                <Link
                  key={m.id}
                  to="/movie/$id"
                  params={{ id: m.id }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-8 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-12 rounded bg-secondary flex-shrink-0 grid place-items-center">
                      <Film className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-xs text-primary mt-0.5">⭐ Tap to rate</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const lock = useServerFn(lockSite);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <MouseGlow />
      <DustParticles />

      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#D89B3D] text-primary-foreground">
              <Film className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg">The Movieverse</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Whiskeyy · matildaa
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active =
                to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/add"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add
            </Link>
            <NotificationBell />
            <button
              onClick={async () => {
                await lock();
                router.navigate({ to: "/unlock" });
              }}
              className="p-2 rounded-full hover:bg-white/5 text-muted-foreground"
              aria-label="Lock"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 mx-auto w-full max-w-6xl px-4 md:px-8 py-8 animate-fade-in">
        {children}
      </main>

      <nav className="md:hidden sticky bottom-0 z-40 glass border-t border-border">
        <div className="flex items-center justify-around py-2">
          {[...NAV, { to: "/add", label: "Add", icon: Plus }].map(
            ({ to, label, icon: Icon }) => {
              const active =
                to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            },
          )}
        </div>
      </nav>
    </div>
  );
}
