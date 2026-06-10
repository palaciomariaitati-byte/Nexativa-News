"use client";

import React, { useEffect, useState } from "react";

// Using a free RSS to JSON proxy for client-side fetching without CORS issues
const RSS_PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

// Default feeds (later these will come from the database / admin panel)
const DEFAULT_FEEDS = [
  { name: "La Nación", url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml" },
  { name: "Infobae", url: "https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml" },
];

export default function ExternalNewsCarousel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeeds() {
      try {
        setLoading(true);
        const allNews: NewsItem[] = [];

        // Fetch from all sources
        for (const feed of DEFAULT_FEEDS) {
          const res = await fetch(`${RSS_PROXY}${encodeURIComponent(feed.url)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              // Get top 5 from each to not overwhelm
              data.items.slice(0, 5).forEach((item: {title: string, link: string, pubDate: string}) => {
                allNews.push({
                  title: item.title,
                  link: item.link,
                  pubDate: item.pubDate,
                  source: feed.name,
                });
              });
            }
          }
        }

        // Shuffle or sort by date (sorting by date here)
        allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        setNews(allNews);
      } catch (error) {
        console.error("Error fetching RSS feeds:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeeds();
    
    // Refresh every 15 minutes (900000 ms)
    const interval = setInterval(fetchFeeds, 900000);
    return () => clearInterval(interval);
  }, []);

  if (loading && news.length === 0) {
    return (
      <div className="w-full bg-[var(--color-brand-surface)] text-[var(--color-brand-muted)] py-2 text-center text-sm border-y border-white/10">
        Actualizando últimas noticias...
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="w-full bg-[var(--color-brand-surface)] text-[var(--color-brand-text)] py-2 overflow-hidden whitespace-nowrap border-y border-white/10 flex items-center">
      <div className="bg-[var(--color-brand-accent)] text-black font-bold px-4 py-2 z-10 uppercase tracking-wider text-xs flex-shrink-0 h-full flex items-center">
        Último Momento
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="flex space-x-12 animate-marquee-slow pl-4">
          {news.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-[var(--color-brand-accent)] transition-colors"
            >
              <span className="text-[var(--color-brand-accent)] font-bold text-sm uppercase tracking-wider">
                [{item.source}]
              </span>
              <span className="text-xl font-medium">{item.title}</span>
              <span className="text-white/30 mx-4">•</span>
            </a>
          ))}
          {/* Duplicated for infinite scroll effect */}
          {news.map((item, idx) => (
            <a
              key={`clone-${idx}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-[var(--color-brand-accent)] transition-colors"
            >
              <span className="text-[var(--color-brand-accent)] font-bold text-sm uppercase tracking-wider">
                [{item.source}]
              </span>
              <span className="text-xl font-medium">{item.title}</span>
              <span className="text-white/30 mx-4">•</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
