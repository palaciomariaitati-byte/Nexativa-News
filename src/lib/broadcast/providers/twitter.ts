import { BroadcastTaskWithArticle } from '../queue';

export async function broadcastToTwitter(task: BroadcastTaskWithArticle): Promise<void> {
  // Para V2 API de X/Twitter (usualmente se necesita OAuth 1.0a para crear tweets, 
  // o OAuth2.0 con PKCE. Asumimos un Bearer o Token de App para el MVP).
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('Twitter credentials missing (TWITTER_BEARER_TOKEN)');
  }

  const text = `📰 Nueva Noticia: ${task.article.title}\n\n#NexativaNews #Noticias`;

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Twitter API Error: ${errorData}`);
  }
}
