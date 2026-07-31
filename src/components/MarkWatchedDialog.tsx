import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MOODS } from "@/lib/format";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  watched_date: z.string().min(1, "Pick a date"),
  my_rating: z.coerce.number().min(0).max(10).optional(),
  his_rating: z.coerce.number().min(0).max(10).optional(),
  favorite_scene: z.string().max(2000).optional(),
  funny_memory: z.string().max(2000).optional(),
  recommended_by: z.string().max(60).optional(),
  favorite_quote: z.string().max(500).optional(),
  notes: z.string().max(4000).optional(),
  mood_afterwards: z.string().max(60).optional(),
});
export type WatchedValues = z.infer<typeof schema>;

function RatingStars({
  value,
  onChange,
  color = "gold",
}: {
  value?: number;
  onChange: (v: number) => void;
  color?: "gold" | "lavender";
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => {
        const v = i + 1;
        const active = value != null && v <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(v)}
            className="p-0.5 transition-transform hover:scale-125"
          >
            <Star
              className={cn(
                "w-4 h-4",
                active
                  ? color === "gold"
                    ? "fill-primary text-primary"
                    : "fill-lavender text-lavender"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
      {value != null && (
        <span className="ml-2 font-mono text-sm text-muted-foreground">{value}/10</span>
      )}
    </div>
  );
}

export function MarkWatchedDialog({
  open,
  onOpenChange,
  onSave,
  title,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: WatchedValues) => void | Promise<void>;
  title: string;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WatchedValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      watched_date: new Date().toISOString().slice(0, 10),
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            You watched <span className="text-primary">{title}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            A little scrapbook page just for us.
          </p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSave)}
          className="grid gap-5 pt-2"
        >
          <div>
            <Label>Watched on</Label>
            <Input
              type="date"
              {...register("watched_date")}
              className="mt-1 bg-input border-border"
            />
            {errors.watched_date && (
              <p className="text-xs text-destructive mt-1">{errors.watched_date.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-background/50 border border-border">
            <div>
              <Label className="text-primary">Whiskeyy's rating</Label>
              <Controller
                control={control}
                name="my_rating"
                render={({ field }) => (
                  <div className="mt-2">
                    <RatingStars value={field.value} onChange={field.onChange} />
                  </div>
                )}
              />
            </div>
            <div>
              <Label className="text-lavender">matildaa's rating</Label>
              <Controller
                control={control}
                name="his_rating"
                render={({ field }) => (
                  <div className="mt-2">
                    <RatingStars value={field.value} onChange={field.onChange} color="lavender" />
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <Label>Favorite scene</Label>
            <Textarea
              {...register("favorite_scene")}
              rows={2}
              placeholder="The one that made us both gasp…"
              className="mt-1 bg-input border-border resize-none"
            />
          </div>

          <div>
            <Label>Funny memory / inside joke</Label>
            <Textarea
              {...register("funny_memory")}
              rows={2}
              placeholder="What we'll remember about tonight…"
              className="mt-1 bg-input border-border resize-none"
            />
          </div>

          <div>
            <Label>Favorite quote from the movie</Label>
            <Input
              {...register("favorite_quote")}
              placeholder="“…”"
              className="mt-1 bg-input border-border"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Who recommended it?</Label>
              <Input
                {...register("recommended_by")}
                placeholder="A friend, Reddit, our own idea…"
                className="mt-1 bg-input border-border"
              />
            </div>
            <div>
              <Label>Mood afterwards</Label>
              <Controller
                control={control}
                name="mood_afterwards"
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value ?? ""}
                    className="mt-1 w-full h-9 rounded-md bg-input border border-border px-3 text-sm"
                  >
                    <option value="">—</option>
                    {MOODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              {...register("notes")}
              rows={3}
              placeholder="Anything else — what we ate, weather, mood…"
              className="mt-1 bg-input border-border resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full h-11 px-6 bg-primary text-primary-foreground hover:brightness-110"
            >
              {submitting ? "Saving…" : "Save this memory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
