import { getStore } from "@netlify/blobs";
const api = (m, b) => fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
export default async (req) => {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) return new Response("", { status: 401 });
  const q = (await req.json()).callback_query;
  if (!q || String(q.from.id) !== String(process.env.TELEGRAM_CHAT_ID)) return new Response("ok");
  const [act, id] = String(q.data || "").split(":");
  if (!/^[ar]$/.test(act) || !/^[a-f0-9]{16}$/.test(id || "")) return new Response("ok");
  const s = getStore("reviews"), meta = await s.get("r_" + id, { type: "json" });
  let msg;
  if (!meta) msg = "Отзыв не найден";
  else if (act === "a") { meta.status = "approved"; await s.setJSON("r_" + id, meta); msg = "✅ Опубликовано"; }
  else { await s.delete("r_" + id); await getStore("review-photos").delete(id); msg = "❌ Отклонено и удалено"; }
  await api("answerCallbackQuery", { callback_query_id: q.id, text: msg });
  await api("editMessageReplyMarkup", { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[{ text: msg, callback_data: "x" }]] } });
  return new Response("ok");
};
