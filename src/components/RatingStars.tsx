import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  onChange,
  color = "gold",
  disabled = false,
  size = "md",
}: {
  value?: number | null;
  onChange?: (value: number) => void;
  color?: "gold" | "lavender";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const activeClass = color === "gold" ? "fill-primary text-primary" : "fill-lavender text-lavender";

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {Array.from({ length: 10 }).map((_, index) => {
        const starValue = index + 1;
        const fill = Math.max(0, Math.min(1, (value ?? 0) - index));

        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            aria-label={`Choose ${starValue - 0.5} or ${starValue} out of 10`}
            title={`${starValue - 0.5} or ${starValue} out of 10`}
            onClick={(event) => {
              if (disabled || !onChange) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const isHalf = event.clientX < bounds.left + bounds.width / 2;
              onChange(starValue - (isHalf ? 0.5 : 0));
            }}
            className={cn(
              "relative p-0.5",
              size === "sm" ? "h-5 w-5" : "h-6 w-6",
              !disabled && "cursor-pointer transition-transform hover:scale-125",
              disabled && "cursor-default",
            )}
          >
            <Star className={cn("h-full w-full text-muted-foreground/30")} />
            {fill > 0 && (
              <span
                className="pointer-events-none absolute inset-0 overflow-hidden p-0.5"
                style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
                aria-hidden="true"
              >
                <Star className={cn("h-full w-full", activeClass)} />
              </span>
            )}
          </button>
        );
      })}
      {value != null && (
        <span className="ml-2 font-mono text-sm text-muted-foreground">{value}/10</span>
      )}
    </div>
  );
}
