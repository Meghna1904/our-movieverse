import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

const PETALS = ["#F6B7C8", "#E8B860", "#C3A6E8", "#FFDF8A", "#A8D8B9", "#F29D7E"];

interface Props {
  watchedCount: number;
}

function seeded(index: number) {
  const x = Math.sin(index * 999.73) * 10000;
  return x - Math.floor(x);
}

export function CinemaGarden({ watchedCount }: Props) {
  const [freshIndex, setFreshIndex] = useState<number | null>(null);
  const previous = useRef(watchedCount);
  const visibleCount = Math.min(watchedCount, 56);

  useEffect(() => {
    if (watchedCount > previous.current && watchedCount > 0) {
      setFreshIndex(Math.min(watchedCount, 56) - 1);
      const t = window.setTimeout(() => setFreshIndex(null), 1800);
      previous.current = watchedCount;
      return () => window.clearTimeout(t);
    }
    previous.current = watchedCount;
  }, [watchedCount]);

  const flowers = useMemo(
    () =>
      Array.from({ length: visibleCount }, (_, i) => {
        const angle = i * 2.399;
        const spread = 8 + seeded(i + 2) * 34;
        const layer = i / Math.max(visibleCount, 1);
        return {
          id: i,
          left: 50 + Math.cos(angle) * spread * (0.45 + layer * 0.45),
          bottom: 16 + seeded(i + 9) * 18 + layer * 12,
          tilt: -18 + seeded(i + 4) * 36,
          size: 0.68 + seeded(i + 12) * 0.46,
          stem: 44 + seeded(i + 18) * 56,
          color: PETALS[i % PETALS.length],
          center: i % 3 === 0 ? "#6B422A" : "#4F3728",
          delay: `${Math.min(i * 0.025, 0.9)}s`,
        };
      }),
    [visibleCount],
  );

  const nextBloom = watchedCount < 10 ? 10 : watchedCount < 25 ? 25 : watchedCount < 50 ? 50 : 100;
  const progress = Math.min((watchedCount / nextBloom) * 100, 100);

  return (
    <div className="cinema-bouquet-scene">
      <div className="bouquet-sky" />
      <div className="bouquet-stars" />
      <div className="bouquet-moon" />
      <div className="bouquet-table" />

      <div className="absolute left-4 top-4 z-20">
        <p className="page-kicker">Cinema bouquet</p>
        <p className="mt-1 font-serif text-2xl text-foreground">
          {watchedCount} {watchedCount === 1 ? "flower" : "flowers"}
        </p>
        <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">
          Every watched movie adds one bloom.
        </p>
      </div>

      <div className="absolute right-4 top-4 z-20 text-right">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Next full bloom
        </p>
        <p className="mt-1 text-xs text-primary">{nextBloom} watched movies</p>
        <div className="ml-auto mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bouquet-wrap" aria-label={`${watchedCount} movie flowers in the bouquet`}>
        <div className="bouquet-vase">
          <div className="vase-shine" />
        </div>

        {flowers.map((f) => (
          <div
            key={f.id}
            className={`bouquet-flower ${freshIndex === f.id ? "bouquet-flower-fresh" : ""}`}
            style={
              {
                "--flower-left": `${f.left}%`,
                "--flower-bottom": `${f.bottom}%`,
                "--flower-tilt": `${f.tilt}deg`,
                "--flower-size": f.size,
                "--flower-stem": `${f.stem}px`,
                "--flower-color": f.color,
                "--flower-center": f.center,
                "--flower-delay": f.delay,
              } as CSSProperties
            }
          >
            <span className="flower-stem" />
            <span className="flower-head">
              <span className="flower-petal flower-petal-one" />
              <span className="flower-petal flower-petal-two" />
              <span className="flower-petal flower-petal-three" />
              <span className="flower-petal flower-petal-four" />
              <span className="flower-center" />
            </span>
          </div>
        ))}

        {watchedCount === 0 && (
          <div className="empty-bouquet-note">
            <p className="font-serif text-xl">No blooms yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mark the first movie watched and the bouquet starts growing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
