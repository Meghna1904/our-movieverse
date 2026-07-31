import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MovieForm } from "@/components/MovieForm";
import { getSessionStatus } from "@/lib/gate.functions";
import { addMovie } from "@/lib/movies.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  ssr: false,
  beforeLoad: async () => {
    const s = await getSessionStatus();
    if (!s.unlocked) throw redirect({ to: "/unlock" });
    return { who: s.who };
  },
  head: () => ({
    meta: [
      { title: "Add a movie — The Movieverse" },
      { name: "description", content: "Add a movie to your shared watchlist." },
    ],
  }),
  component: AddPage,
});

function AddPage() {
  const { who } = Route.useRouteContext();
  const navigate = useNavigate();
  const add = useServerFn(addMovie);
  const [busy, setBusy] = useState(false);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          New entry
        </p>
        <h1 className="font-serif text-4xl mt-1">Add a movie</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Fill this out and it lands in your watchlist. When you actually watch it, mark
          it watched and it becomes part of your memory book forever.
        </p>
      </div>

      <div className="rounded-3xl bg-card border border-border p-6 md:p-8">
        <MovieForm
          defaults={{ added_by: (who ?? "whiskeyy") as "whiskeyy" | "matildaa" }}
          submitting={busy}
          onSubmit={async (values) => {
            setBusy(true);
            try {
              const m = await add({ data: values });
              toast.success(`${m.title} added to your watchlist`);
              navigate({ to: "/watchlist" });
            } catch (e) {
              toast.error((e as Error).message);
              setBusy(false);
            }
          }}
        />
      </div>
    </AppShell>
  );
}
