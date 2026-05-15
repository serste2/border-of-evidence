import { validateNewsArticle } from './geminiValidator.js';
import { saveEvidenceEntry } from './archiveService.js';
import { dispatchPulseEvent } from '../routes/events.js';

const DEFAULT_FEEDS = [
  'https://www.eea.europa.eu/en/newsroom/news.xml',
  'https://www.fao.org/news/rss-feed/en/',
  'https://www.euractiv.com/sections/agriculture-food/feed/',
  'https://www.euractiv.com/sections/energy-environment/feed/',
];

const seenArticles = new Map();
let pollTimer = null;
let pollInProgress = false;
let lastPollAt = null;
let lastPollSummary = {
  fetched: 0,
  skipped: 0,
  validated: 0,
  archived: 0,
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
  pruneSeenArticles();

  return {
    enabled: process.env.SERAPHINA_NEWS_POLLING_ENABLED === 'true',
    running: Boolean(pollTimer),
    lastPollAt,
    lastPollSummary,
    seen: seenArticles.size,
    dedupeTtlHours: getDedupeTtlMs() / 3600000,
  };
}

export async function pollTerritorialNews(options = {}) {
  if (pollInProgress) {
    return { ok: false, reason: 'poll_already_in_progress', ...lastPollSummary };
  }

  pollInProgress = true;
  lastPollAt = new Date().toISOString();
  pruneSeenArticles();

  const feeds = getFeedList(options.feeds);
  const minScore = Number(process.env.SERAPHINA_MIN_EVIDENCE_SCORE || 0.6);
  const maxArticles = Number(options.maxArticles || process.env.SERAPHINA_MAX_ARTICLES_PER_POLL || 12);

  const summary = {
    fetched: 0,
    skipped: 0,
    validated: 0,
    archived: 0,
    dispatched: 0,
    errors: [],
  };

  try {
    const articles = await fetchLatestArticles(feeds, maxArticles);
    summary.fetched = articles.length;

    for (const article of articles) {
      const key = buildArticleKey(article);
      if (seenArticles.has(key)) {
        summary.skipped += 1;
        continue;
      }
      seenArticles.set(key, Date.now());

      try {
        const validation = await validateNewsArticle(article);
        summary.validated += 1;

        if (validation.relevant && validation.evidenceScore >= minScore) {
          const archiveResult = await saveEvidenceEntry({
            article,
            validation,
            source: 'seraphina_news_ingestion',
          });

          if (archiveResult.ok) summary.archived += 1;

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
              archived: archiveResult.ok,
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
  const fetchErrors = [];

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
      fetchErrors.push({ feed: feedUrl, error: error.message });
    }

    if (articles.length >= maxArticles) break;
  }

  if (fetchErrors.length) {
    lastPollSummary = {
      ...lastPollSummary,
      errors: [...(lastPollSummary.errors || []), ...fetchErrors].slice(-20),
    };
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

  return chunks.map((chunk) => normalizeArticle(chunk, sourceUrl)).filter((article) => article.title);
}

function normalizeArticle(chunk, sourceUrl) {
  const title = decodeXml(readTag(chunk, 'title'));
  const summary = decodeXml(readTag(chunk, 'description') || readTag(chunk, 'summary') || readTag(chunk, 'content'));
  const content = decodeXml(readTag(chunk, 'content:encoded') || readTag(chunk, 'content') || readTag(chunk, 'description'));
  const url = normalizeUrl(decodeXml(readTag(chunk, 'link')) || readAtomLink(chunk));
  const publishedAt = normalizeDate(decodeXml(readTag(chunk, 'pubDate') || readTag(chunk, 'published') || readTag(chunk, 'updated')));

  return {
    title,
    summary,
    content,
    url,
    published_at: publishedAt,
    source: sourceUrl,
  };
}

function buildArticleKey(article) {
  const stableValue = article.url || `${article.source}:${article.title}:${article.published_at || ''}`;
  return simpleHash(stableValue.toLowerCase().trim());
}

function simpleHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return String(hash);
}

function pruneSeenArticles() {
  const ttlMs = getDedupeTtlMs();
  const now = Date.now();

  for (const [key, seenAt] of seenArticles.entries()) {
    if (now - seenAt > ttlMs) {
      seenArticles.delete(key);
    }
  }
}

function getDedupeTtlMs() {
  const ttlHours = Number(process.env.SERAPHINA_DEDUPE_TTL_HOURS || 48);
  return ttlHours * 60 * 60 * 1000;
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

function normalizeUrl(url = '') {
  return url.trim();
}

function normalizeDate(value = '') {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
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
