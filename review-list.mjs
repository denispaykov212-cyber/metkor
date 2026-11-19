import { getStore } from "@netlify/blobs";
export default async () => {
  const s = getStore("reviews");
  const { blobs } = await s.list({ prefix: "r_" });
  const all = (await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })))).filter((v) => v && v.status === "approved");
  all.sort((a, b) => b.ts - a.ts);
  const out = all.slice(0, 50).map(({ id, name, text, rating, photo }) => ({ id, name, text, rating, photo }));
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });
};
