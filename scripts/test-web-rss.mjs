async function testLiveWebSearch(query) {
  console.log(`Buscando noticias en vivo para: "${query}"...`);
  try {
    const encoded = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=es-419&gl=AR&ceid=AR:es-419`;
    
    const res = await fetch(rssUrl, {
      signal: AbortSignal.timeout(4000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      console.error("RSS fetch error:", res.status);
      return [];
    }

    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const title = match[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')?.trim();
      const link = match[2]?.trim();
      const pubDate = match[3]?.trim();
      if (title) {
        items.push({ title, link, pubDate });
      }
    }

    console.log(`Encontrados ${items.length} resultados en vivo:`);
    items.forEach((it, idx) => console.log(`${idx + 1}. ${it.title} (${it.pubDate})`));
    return items;
  } catch (e) {
    console.error("Error en búsqueda:", e.message);
    return [];
  }
}

testLiveWebSearch("Ituzaingó Corrientes");
