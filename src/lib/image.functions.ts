import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Fetches any external image URL server-side (bypassing CORS / hotlink protection)
 * and uploads it to the Supabase Storage `posters` bucket.
 * Returns the stable public URL from Supabase Storage.
 *
 * Requires a public bucket named "posters" in your Supabase project.
 */
export const proxyImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ url: z.string().url().max(2000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./session.server");
    await requireUnlocked();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch the image from the external URL
    const res = await fetch(data.url, {
      headers: {
        // Pretend to be a browser to avoid basic bot-blockers
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    // Derive a unique filename from a hash of the URL + timestamp
    const hash = btoa(data.url).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const filename = `${hash}_${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("posters")
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("posters")
      .getPublicUrl(filename);

    return { publicUrl: publicData.publicUrl };
  });
