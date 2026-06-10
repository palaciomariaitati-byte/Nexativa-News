import { BroadcastTaskWithArticle } from '../queue';

export async function broadcastToTelegram(task: BroadcastTaskWithArticle): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    throw new Error('Telegram credentials missing (TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID)');
  }

  // Formatear el mensaje
  const text = `🔥 *Nueva Noticia* 🔥\n\n${task.article.title}\n\n👉 ¡Lee más en nuestra web!`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHANNEL_ID,
      text: text,
      parse_mode: 'Markdown'
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Telegram API Error: ${errorData}`);
  }
}
