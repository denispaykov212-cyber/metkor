import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
const tg = (m, b) => fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/${m}`, b);
export default async (req) => {
  if (req.method !== "POST") return new Response("", { status: 405 });
  let d; try { d = await req.json(); } catch { return new Response("bad", { status: 400 }); }
  if (d.web) return new Response("ok");
  const name = String(d.name || "").trim().slice(0, 60), text = String(d.text || "").trim().slice(0, 800), rating = Math.round(+d.rating);
  if (!name || text.length < 5 || !(rating >= 1 && rating <= 5)) return new Response("bad", { status: 400 });
  let photo = null;
  if (d.photo) {
    const m = /^data:image\/jpeg;base64,(.+)$/.exec(String(d.photo));
    if (!m || m[1].length > 1200000) return new Response("bad", { status: 400 });
    photo = Buffer.from(m[1], "base64");
    if (photo[0] !== 0xff || photo[1] !== 0xd8) return new Response("bad", { status: 400 });
  }
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  await getStore("reviews").setJSON("r_" + id, { id, name, text, rating, photo: !!photo, ts: Date.now(), status: "pending" });
  if (photo) await getStore("review-photos").set(id, new Blob([photo]));
  const caption = `⭐ Новый отзыв (${rating}/5)\n👤 ${name}\n\n${text}`.slice(0, 1000);
  const kb = { inline_keyboard: [[{ text: "✅ Одобрить", callback_data: "a:" + id }, { text: "❌ Отклонить", callback_data: "r:" + id }]] };
  if (photo) {
    const f = new FormData();
    f.append("chat_id", process.env.TELEGRAM_CHAT_ID); f.append("caption", caption);
    f.append("reply_markup", JSON.stringify(kb)); f.append("photo", new Blob([photo], { type: "image/jpeg" }), "review.jpg");
    await tg("sendPhoto", { method: "POST", body: f });
  } else {
    await tg("sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: caption, reply_markup: kb }) });
  }
  return new Response("ok");
};
