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
      { title: "Add a movie - Our Movieverse" },
      { name: "description", content: "Add a movie to the shared jar or archive." },
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
        <p className="page-kicker">New ticket</p>
        <h1 className="mt-1 font-serif text-4xl md:text-5xl">Add to our movie night</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Put something in the jar for later, or save it straight into the archive if
          the memory already happened.
        </p>
      </div>

      <div className="room-panel p-6 md:p-8">
        <MovieForm
          defaults={{ added_by: (who ?? "whiskeyy") as "whiskeyy" | "matildaa" }}
          submitting={busy}
          onSubmit={async (values) => {
            setBusy(true);
            try {
              const m = await add({ data: values });
              const dest = values.status === "watched" ? "/watched" : "/watchlist";
              toast.success(
                values.status === "watched"
                  ? `${m.title} saved to your memories`
                  : `${m.title} added to the jar`,
              );
              if (values.status === "watched") {
                window.dispatchEvent(
                  new CustomEvent("movieverse:garden-bloom", {
                    detail: { title: m.title },
                  }),
                );
              }
              navigate({ to: dest });
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
