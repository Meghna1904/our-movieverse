import { createFileRoute, redirect } from "@tanstack/react-router";
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
      { title: "Polaroid Wall - The Movieverse" },
      { name: "description", content: "Every movie we watched together, pinned to our wall." },
    ],
  }),
  component: SkyPage,
});

function SkyPage() {
  const q = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => listMovies({ data: { status: "watched" } }),
  });

  return (
    <AppShell>
      <div className="relative left-1/2 -mt-8 -ml-[50vw] w-screen">
        {q.isLoading ? (
          <div className="h-[calc(100svh-4.25rem)] w-full skeleton" />
        ) : (
          <StarField movies={q.data ?? []} />
        )}
      </div>
    </AppShell>
  );
}
