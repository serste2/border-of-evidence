const RANGE_TO_MS = {
  '1_month': 30 * 24 * 60 * 60 * 1000,
  '3_months': 90 * 24 * 60 * 60 * 1000,
  '6_months': 180 * 24 * 60 * 60 * 1000,
  '12_months': 365 * 24 * 60 * 60 * 1000,
  '24_months': 730 * 24 * 60 * 60 * 1000,
  '10_years': 3650 * 24 * 60 * 60 * 1000,
};

const RANGE_ALIASES = {
  '1m': '1_month',
  '3m': '3_months',
  '6m': '6_months',
  '12m': '12_months',
  '24m': '24_months',
  '10y': '10_years',
};

const TABLE_NAME = process.env.SUPABASE_EVIDENCE_TABLE || 'boe_evidence_entries';

export async function saveEvidenceEntry({ article, validation, source = 'seraphina' }) {
  if (!isSupabaseConfigured()) {
    return { ok: false, skipped: true, reason: 'supabase_not_configured' };
  }

  const entry = normalizeEvidenceEntry({ article, validation, source });
  const url = `${getSupabaseUrl()}/rest/v1/${TABLE_NAME}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders({ prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase archive write failed: ${response.status} ${text}`);
  }

  const rows = await response.json();
  return { ok: true, entry: rows?.[0] || entry };
}

export async function getEvidenceByTimeRange(rangeInput = '1_month') {
  const range = normalizeRange(rangeInput);
  const dateRange = getDateRange(range);

  if (!isSupabaseConfigured()) {
    return buildArrangement({
      range,
      dateRange,
      entries: [],
      warning: 'supabase_not_configured',
    });
  }

  const params = new URLSearchParams({
    select: '*',
    published_at: `gte.${dateRange.from}`,
    order: 'published_at.desc',
    limit: String(Number(process.env.SERAPHINA_ARCHIVE_LIMIT || 500)),
  });

  const url = `${getSupabaseUrl()}/rest/v1/${TABLE_NAME}?${params.toString()}`;
  const response = await fetch(url, {
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase archive read failed: ${response.status} ${text}`);
  }

  const rows = await response.json();
  return buildArrangement({ range, dateRange, entries: rows });
}

export function normalizeRange(rangeInput = '1_month') {
  const normalized = String(rangeInput).toLowerCase();
  const canonical = RANGE_ALIASES[normalized] || normalized;

  if (!RANGE_TO_MS[canonical]) {
    const error = new Error(`Unsupported range: ${rangeInput}`);
    error.status = 400;
    throw error;
  }

  return canonical;
}

function buildArrangement({ range, dateRange, entries, warning = null }) {
  const elementCounts = entries.reduce((counts, entry) => {
    counts[entry.element_id] = (counts[entry.element_id] || 0) + 1;
    return counts;
  }, {});

  const activeElements = Object.keys(elementCounts);
  const clusters = activeElements
    .map((elementId) => ({
      id: `cluster-${elementId}`,
      element_id: elementId,
      count: elementCounts[elementId],
      entries: entries.filter((entry) => entry.element_id === elementId).map((entry) => entry.id),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    range,
    generatedAt: new Date().toISOString(),
    date_range: dateRange,
    summary: {
      entries: entries.length,
      active_elements: activeElements.length,
      warning,
    },
    elements: activeElements.map((elementId) => ({
      element_id: elementId,
      count: elementCounts[elementId],
      scraped_links: entries
        .filter((entry) => entry.element_id === elementId)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          url: entry.url,
          source: entry.source,
          published_at: entry.published_at,
          evidenceScore: entry.evidence_score,
          trigger_type: entry.trigger_type,
          summary: entry.summary,
          reason: entry.reason,
          domains: entry.domains || [],
        })),
    })),
    entries,
    element_counts: elementCounts,
    active_elements: activeElements,
    clusters,
    scene_state: {
      active_elements: activeElements,
      density_by_element: elementCounts,
      generated_at: new Date().toISOString(),
    },
  };
}

function normalizeEvidenceEntry({ article, validation, source }) {
  const url = article.url || '';
  const id = simpleHash(`${url}:${validation.element_id}:${article.published_at || article.title}`);

  return {
    id,
    element_id: validation.element_id,
    title: article.title || '',
    url,
    source: article.source || source,
    published_at: normalizeDate(article.published_at) || new Date().toISOString(),
    collected_at: new Date().toISOString(),
    summary: validation.summary,
    reason: validation.reason,
    evidence_score: validation.evidenceScore,
    domains: validation.domains || [],
    trigger_type: validation.trigger_type,
    raw: {
      article,
      validation,
      source,
    },
  };
}

function getDateRange(range) {
  const to = new Date();
  const from = new Date(to.getTime() - RANGE_TO_MS[range]);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL?.replace(/\/$/, '');
}

function getSupabaseHeaders({ prefer } = {}) {
  const headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (prefer) headers.Prefer = prefer;
  return headers;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function simpleHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return `e_${Math.abs(hash)}`;
}
