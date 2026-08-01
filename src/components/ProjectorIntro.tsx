import { useEffect, useState, type CSSProperties } from "react";

export function ProjectorIntro({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setExiting(true);
    }, 1800);
    const doneTimer = window.setTimeout(onDone, 2300);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  const skip = () => {
    setExiting(true);
    window.setTimeout(onDone, 450);
  };

  return (
    <div
      onClick={skip}
      className={`fixed inset-0 z-[9999] flex cursor-pointer flex-col items-center justify-center ${
        exiting ? "animate-intro-exit" : ""
      }`}
      style={{ background: "#070A12" }}
      role="presentation"
    >
      <div
        className="animate-beam animate-projector absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: "min(720px, 110vw)",
          height: "100%",
          clipPath: "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)",
          background:
            "linear-gradient(to bottom, rgba(232,184,96,0.14) 0%, rgba(232,184,96,0.04) 42%, transparent 74%)",
        }}
      />

      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              background: "rgba(245,241,232,0.62)",
              left: `${38 + ((i * 7) % 24)}%`,
              top: `${10 + ((i * 13) % 70)}%`,
              animation: `dust-drift ${12 + i * 2}s linear ${i * 0.8}s infinite`,
              "--dx": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 5)}px`,
              "--max-op": "0.7",
            } as CSSProperties
          }
        />
      ))}

      <div className="animate-intro-text relative z-10 text-center">
        <div className="mb-4 text-4xl">🎬</div>
        <p
          className="text-sm tracking-[0.35em] text-muted-foreground uppercase"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Rolling tonight's memories...
        </p>
      </div>

      <p className="animate-intro-text absolute bottom-8 text-[10px] tracking-widest text-muted-foreground/30 uppercase">
        Click to skip
      </p>
    </div>
  );
}
