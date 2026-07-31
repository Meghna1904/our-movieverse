import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite, getSessionStatus } from "@/lib/gate.functions";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/unlock")({
  ssr: false,
  beforeLoad: async () => {
    // If already unlocked, bounce to home.
    try {
      const s = await getSessionStatus();
      if (s.unlocked) throw redirect({ to: "/" });
    } catch (e) {
      if ((e as { to?: string })?.to) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: "Unlock — The Movieverse" },
      { name: "description", content: "A private cinema for two." },
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
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#D89B3D] shadow-[var(--shadow-glow)] mb-4">
            <Film className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-4xl">The Movieverse</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A little cinema for two. Say the magic word.
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
            } else setError(true);
          }}
          className="glass rounded-3xl p-6 space-y-5 shadow-[var(--shadow-soft)]"
        >
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Who's watching tonight?
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1 p-1 bg-background/60 rounded-full border border-border">
              {(["whiskeyy", "matildaa"] as const).map((w) => (
                <button
                  type="button"
                  key={w}
                  onClick={() => setWho(w)}
                  className={cn(
                    "py-2 rounded-full text-sm capitalize transition",
                    who === w
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground",
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
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={cn(
                "mt-2 w-full h-12 rounded-2xl bg-background/60 border px-4 outline-none focus:border-primary transition",
                error ? "border-destructive" : "border-border",
              )}
              placeholder="•••••••"
            />
            {error && (
              <p className="mt-2 text-xs text-destructive">
                That's not it. Try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || !password}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 disabled:opacity-50 transition"
          >
            {busy ? "Unlocking…" : "Enter"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Made for Whiskeyy & matildaa · with love
        </p>
      </div>
    </div>
  );
}
