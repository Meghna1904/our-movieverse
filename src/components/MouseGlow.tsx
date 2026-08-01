import { useEffect, useState, type CSSProperties } from "react";

export function MouseGlow() {
  const [pos, setPos] = useState({ x: -300, y: -300 });

  useEffect(() => {
    const move = (event: MouseEvent) => {
      setPos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-0 transition-transform duration-75"
      style={
        {
          left: pos.x - 210,
          top: pos.y - 210,
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,184,96,0.05) 0%, rgba(195,166,232,0.025) 38%, transparent 72%)",
          transform: "translate3d(0,0,0)",
        } as CSSProperties
      }
    />
  );
}
