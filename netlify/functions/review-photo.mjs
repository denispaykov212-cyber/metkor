import { getStore } from "@netlify/blobs";
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response("", { status: 404 });
  const meta = await getStore("reviews").get("r_" + id, { type: "json" });
  if (!meta || meta.status !== "approved") return new Response("", { status: 404 });
  const img = await getStore("review-photos").get(id, { type: "arrayBuffer" });
  if (!img) return new Response("", { status: 404 });
  return new Response(img, { headers: { "Content-Type": "image/jpeg", "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=86400" } });
};
