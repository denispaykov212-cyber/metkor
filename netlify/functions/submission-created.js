exports.handler = async (event) => {
  const { payload } = JSON.parse(event.body);
  if (payload.form_name !== "request") return { statusCode: 200, body: "skip" };

  const d = payload.data || {};
  const text =
    "🆕 Новая заявка Metkor\n\n" +
    "👤 Имя: " + (d.name || "-") + "\n" +
    "📞 Телефон: " + (d.phone || "-") + "\n" +
    "✉️ Email: " + (d.email || "-") + "\n\n" +
    "💬 Проблема:\n" + (d.message || "-") + "\n\n" +
    "📎 Фото/видео (если есть) смотрите в панели Netlify → Forms";

  const res = await fetch(
    "https://api.telegram.org/bot" + process.env.TELEGRAM_TOKEN + "/sendMessage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    }
  );
  return { statusCode: res.ok ? 200 : 500, body: res.ok ? "ok" : "telegram error" };
};
