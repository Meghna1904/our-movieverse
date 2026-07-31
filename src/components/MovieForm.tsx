import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GENRES, MOODS, PLATFORMS } from "@/lib/format";
import type { MovieInput } from "@/lib/movies.functions";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  year: z.coerce.number().int().min(1888).max(2100).optional().or(z.literal("")),
  runtime: z.coerce.number().int().min(1).max(1000).optional().or(z.literal("")),
  poster_url: z.string().trim().max(2000).optional(),
  overview: z.string().max(4000).optional(),
  genre: z.array(z.string()),
  added_by: z.enum(["whiskeyy", "matildaa"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  streaming_platform: z.string().optional(),
  expected_mood: z.string().optional(),
});

export type MovieFormValues = z.infer<typeof schema>;

export function MovieForm({
  defaults,
  submitLabel = "Add to watchlist",
  onSubmit,
  submitting,
}: {
  defaults?: Partial<MovieFormValues>;
  submitLabel?: string;
  onSubmit: (values: MovieInput) => void | Promise<void>;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      genre: [],
      added_by: "whiskeyy",
      priority: "medium",
      ...defaults,
    },
  });

  const posterUrl = watch("poster_url");

  return (
    <form
      onSubmit={handleSubmit((v) =>
        onSubmit({
          title: v.title,
          year: v.year === "" || v.year == null ? null : Number(v.year),
          runtime: v.runtime === "" || v.runtime == null ? null : Number(v.runtime),
          poster_url: v.poster_url?.trim() || null,
          overview: v.overview?.trim() || null,
          genre: v.genre ?? [],
          added_by: v.added_by,
          priority: v.priority ?? null,
          streaming_platform: v.streaming_platform?.trim() || null,
          expected_mood: v.expected_mood?.trim() || null,
          status: "watchlist",
        }),
      )}
      className="grid gap-6 md:grid-cols-[180px_1fr]"
    >
      {/* Poster preview */}
      <div className="space-y-2">
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary border border-border">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs text-muted-foreground px-3 text-center">
              Poster preview appears here
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs">Poster image URL</Label>
          <Input
            {...register("poster_url")}
            placeholder="https://…jpg"
            className="mt-1 bg-input border-border"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Right-click any poster on Google Images → “Copy image address”.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <Label>Title *</Label>
          <Input
            {...register("title")}
            placeholder="e.g. Interstellar"
            className="mt-1 bg-input border-border"
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              {...register("year")}
              placeholder="2014"
              className="mt-1 bg-input border-border"
            />
          </div>
          <div>
            <Label>Runtime (min)</Label>
            <Input
              type="number"
              {...register("runtime")}
              placeholder="169"
              className="mt-1 bg-input border-border"
            />
          </div>
        </div>

        <div>
          <Label>Genres</Label>
          <Controller
            control={control}
            name="genre"
            render={({ field }) => (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GENRES.map((g) => {
                  const on = field.value?.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() =>
                        field.onChange(
                          on
                            ? field.value.filter((x: string) => x !== g)
                            : [...(field.value ?? []), g],
                        )
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition",
                        on
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <div>
          <Label>Overview / synopsis</Label>
          <Textarea
            {...register("overview")}
            rows={3}
            className="mt-1 bg-input border-border resize-none"
            placeholder="A short summary…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Added by</Label>
            <Controller
              control={control}
              name="added_by"
              render={({ field }) => (
                <div className="mt-1 grid grid-cols-2 gap-1 p-1 bg-input rounded-full border border-border">
                  {(["whiskeyy", "matildaa"] as const).map((who) => (
                    <button
                      type="button"
                      key={who}
                      onClick={() => field.onChange(who)}
                      className={cn(
                        "py-1.5 rounded-full text-xs capitalize transition",
                        field.value === who
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {who}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <div className="mt-1 grid grid-cols-3 gap-1 p-1 bg-input rounded-full border border-border">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => field.onChange(p)}
                      className={cn(
                        "py-1.5 rounded-full text-xs capitalize transition",
                        field.value === p
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Where to watch</Label>
            <Controller
              control={control}
              name="streaming_platform"
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value ?? ""}
                  className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm"
                >
                  <option value="">—</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <Label>Expected mood</Label>
            <Controller
              control={control}
              name="expected_mood"
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value ?? ""}
                  className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm"
                >
                  <option value="">—</option>
                  {MOODS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full h-11 px-6 bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
