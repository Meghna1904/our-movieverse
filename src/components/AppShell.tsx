import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { lockSite } from "@/lib/gate.functions";
import { Film, Home, Bookmark, BarChart3, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/watched", label: "Watched", icon: Film },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const lock = useServerFn(lockSite);

  return (
    <div className="min-h-screen flex flex-col">
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

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-8 py-8 animate-fade-in">
        {children}
      </main>

      <nav className="md:hidden sticky bottom-0 glass border-t border-border">
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
