import { validateNewsArticle } from './geminiValidator.js';
import { dispatchPulseEvent } from '../routes/events.js';

const DEFAULT_FEEDS = [
  'https://www.eea.europa.eu/en/newsroom/news.xml',
  'https://www.fao.org/news/rss-feed/en/',
  'https://www.euractiv.com/sections/agriculture-food/feed/',
  'https://www.euractiv.com/sections/energy-environment/feed/',
];

const seenArticleKeys = new Set();
let pollTimer = null;
let pollInProgress = false;
let lastPollAt = null;
let lastPollSummary = {
  fetched: 0,
  validated: 0,
  dispatched: 0,
  errors: [],
};

export function startNewsPolling() {
  if (process.env.SERAPHINA_NEWS_POLLING_ENABLED !== 'true') return false;
  if (pollTimer) return true;

  const intervalMs = Number(process.env.SERAPHINA_NEWS_POLL_INTERVAL_MS || 300000);

  pollTerritorialNews().catch((error) => {
    console.error('[Seraphina] Initial news poll failed:', error);
  });

  pollTimer = setInterval(() => {
    pollTerritorialNews().catch((error) => {
      console.error('[Seraphina] News poll failed:', error);
    });
  }, intervalMs);

  return true;
}

export function stopNewsPolling() {
  if (!pollTimer) return false;
  clearInterval(pollTimer);
  pollTimer = null;
  return true;
}

export function getNewsPollingStatus() {
  return {
    enabled: process.env.SERAPHINA_NEWS_POLLING_ENABLED === 'true',
    running: Boolean(pollTimer),
    lastPollAt,
    lastPollSummary,
    seen: seenArticleKeys.size,
  };
}

export async function pollTerritorialNews(options = {}) {
  if (pollInProgress) {
    return { ok: false, reason: 'poll_already_in_progress', ...lastPollSummary };
  }

  pollInProgress = true;
  lastPollAt = new Date().toISOString();

  const feeds = getFeedList(options.feeds);
  const minScore = Number(process.env.SERAPHINA_MIN_EVIDENCE_SCORE || 0.6);
  const maxArticles = Number(options.maxArticles || process.env.SERAPHINA_MAX_ARTICLES_PER_POLL || 12);

  const summary = {
    fetched: 0,
    validated: 0,
    dispatched: 0,
    errors: [],
  };

  try {
    const articles = await fetchLatestArticles(feeds, maxArticles);
    summary.fetched = articles.length;

    for (const article of articles) {
      const key = article.url || `${article.source}:${article.title}`;
      if (seenArticleKeys.has(key)) continue;
      seenArticleKeys.add(key);

      try {
        const validation = await validateNewsArticle(article);
        summary.validated += 1;

        if (validation.relevant && validation.evidenceScore >= minScore) {
          dispatchPulseEvent({
            element_id: validation.element_id,
            source: 'seraphina_news_ingestion',
            payload: {
              title: article.title,
              url: article.url,
              source: article.source,
              published_at: article.published_at,
              summary: validation.summary,
              reason: validation.reason,
              evidenceScore: validation.evidenceScore,
              domains: validation.domains,
              trigger_type: validation.trigger_type,
            },
          });
          summary.dispatched += 1;
        }
      } catch (error) {
        summary.errors.push({ title: article.title, error: error.message });
      }
    }

    lastPollSummary = summary;
    return { ok: true, ...summary };
  } finally {
    pollInProgress = false;
  }
}

export async function fetchLatestArticles(feeds, maxArticles = 12) {
  const articles = [];

  for (const feedUrl of feeds) {
    try {
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'BorderOfEvidence/0.1 (+https://github.com/serste2/border-of-evidence)',
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed ${response.status}`);
      }

      const text = await response.text();
      articles.push(...parseFeedItems(text, feedUrl));
    } catch (error) {
      lastPollSummary.errors.push({ feed: feedUrl, error: error.message });
    }

    if (articles.length >= maxArticles) break;
  }

  return articles.slice(0, maxArticles);
}

function getFeedList(overrideFeeds) {
  if (Array.isArray(overrideFeeds) && overrideFeeds.length) return overrideFeeds;

  const envFeeds = process.env.SERAPHINA_NEWS_FEEDS;
  if (!envFeeds) return DEFAULT_FEEDS;

  return envFeeds
    .split(',')
    .map((feed) => feed.trim())
    .filter(Boolean);
}

function parseFeedItems(xml, sourceUrl) {
  const itemMatches = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)];
  const atomMatches = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)];
  const chunks = itemMatches.length ? itemMatches.map((match) => match[0]) : atomMatches.map((match) => match[0]);

  return chunks.map((chunk) => ({
    title: decodeXml(readTag(chunk, 'title')),
    summary: decodeXml(readTag(chunk, 'description') || readTag(chunk, 'summary') || readTag(chunk, 'content')),
    content: decodeXml(readTag(chunk, 'content:encoded') || readTag(chunk, 'content') || readTag(chunk, 'description')),
    url: decodeXml(readTag(chunk, 'link')) || readAtomLink(chunk),
    published_at: decodeXml(readTag(chunk, 'pubDate') || readTag(chunk, 'published') || readTag(chunk, 'updated')) || null,
    source: sourceUrl,
  })).filter((article) => article.title);
}

function readTag(chunk, tagName) {
  const escaped = tagName.replace(':', '\\:');
  const regex = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i');
  const match = chunk.match(regex);
  return match?.[1]?.trim() || '';
}

function readAtomLink(chunk) {
  const match = chunk.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return match?.[1] || '';
}

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
