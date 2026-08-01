import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite, getSessionStatus } from "@/lib/gate.functions";
import { Film, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/unlock")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const s = await getSessionStatus();
      if (s.unlocked) throw redirect({ to: "/" });
    } catch (e) {
      if ((e as { to?: string })?.to) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: "Unlock - Our Movieverse" },
      { name: "description", content: "A private movie room for two." },
    ],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const unlock = useServerFn(unlockSite);
  const [who, setWho] = useState<"whiskeyy" | "matildaa">("whiskeyy");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="unlock-room min-h-screen px-4">
      <div className="relative z-10 grid min-h-screen place-items-center">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#D89B3D] shadow-[var(--shadow-glow)]">
              <Film className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="page-kicker justify-center">Private screening room</p>
            <h1 className="mt-2 font-serif text-4xl">Our Movieverse</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A warm little corner for Whiskeyy + matildaa.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(false);
              const { ok } = await unlock({ data: { password, who } });
              setBusy(false);
              if (ok) {
                window.location.href = "/";
              } else {
                setError(true);
              }
            }}
            className="room-panel space-y-5 p-6 shadow-[var(--shadow-soft)]"
          >
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Who is walking in?
              </label>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-full border border-border bg-background/60 p-1">
                {(["whiskeyy", "matildaa"] as const).map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={() => setWho(w)}
                    className={cn(
                      "rounded-full py-2 text-sm capitalize transition",
                      who === w
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Passcode
              </label>
              <div className="relative mt-2">
                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className={cn(
                    "h-12 w-full rounded-2xl border bg-background/60 pl-11 pr-4 outline-none transition focus:border-primary",
                    error ? "border-destructive" : "border-border",
                  )}
                  placeholder="Passcode"
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-destructive">
                  That is not it. Try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || !password}
              className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Opening..." : "Open the room"}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Made for Whiskeyy + matildaa, with love.
          </p>
        </div>
      </div>
    </div>
  );
}
