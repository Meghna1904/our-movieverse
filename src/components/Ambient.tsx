import type { CSSProperties } from "react";

const DUST = [
  { bottom: "8%", left: "12%", dur: "20s", delay: "0s", dx: "40px", op: "0.35" },
  { bottom: "20%", left: "35%", dur: "26s", delay: "4s", dx: "-30px", op: "0.25" },
  { bottom: "5%", left: "58%", dur: "18s", delay: "8s", dx: "20px", op: "0.4" },
  { bottom: "15%", left: "78%", dur: "22s", delay: "2s", dx: "-50px", op: "0.3" },
  { bottom: "30%", left: "90%", dur: "30s", delay: "12s", dx: "60px", op: "0.2" },
  { bottom: "45%", left: "5%", dur: "24s", delay: "6s", dx: "35px", op: "0.3" },
  { bottom: "60%", left: "45%", dur: "28s", delay: "16s", dx: "-25px", op: "0.2" },
  { bottom: "70%", left: "70%", dur: "19s", delay: "3s", dx: "45px", op: "0.25" },
  { bottom: "80%", left: "25%", dur: "23s", delay: "10s", dx: "-40px", op: "0.2" },
  { bottom: "2%", left: "85%", dur: "32s", delay: "18s", dx: "30px", op: "0.3" },
];

export function DustParticles() {
  return (
    <>
      {DUST.map((d, i) => (
        <span
          key={i}
          className="dust-particle"
          style={
            {
              bottom: d.bottom,
              left: d.left,
              "--dur": d.dur,
              "--delay": d.delay,
              "--dx": d.dx,
              "--max-op": d.op,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
