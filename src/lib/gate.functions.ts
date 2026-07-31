import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        password: z.string().min(1).max(200),
        who: z.enum(["whiskeyy", "matildaa"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getGateSession, passwordMatches } = await import("./session.server");
    const expected = process.env.SITE_PASSWORD;
    if (!expected) throw new Error("SITE_PASSWORD is not set");
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await getGateSession();
    await session.update({ unlocked: true, who: data.who });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { getGateSession } = await import("./session.server");
  const session = await getGateSession();
  await session.clear();
  return { ok: true as const };
});

export const getSessionStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getGateSession } = await import("./session.server");
  const session = await getGateSession();
  return {
    unlocked: !!session.data.unlocked,
    who: session.data.who ?? null,
  };
});
