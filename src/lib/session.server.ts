import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

export type GateSession = { unlocked?: boolean; who?: "whiskeyy" | "matildaa" };

export function getSessionConfig() {
  return {
    password: process.env.SESSION_SECRET!,
    name: "movieverse-gate",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function getGateSession() {
  return useSession<GateSession>(getSessionConfig());
}

export async function requireUnlocked() {
  const session = await getGateSession();
  if (!session.data.unlocked) throw redirect({ to: "/unlock" });
  return session;
}
