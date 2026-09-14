import { createHash } from 'node:crypto';

import { instance } from 'api/api.config';
import { primeFaqs } from 'api/faq/faq.api';
import { primeFeedbacks } from 'api/feedbacks/feedbacks.api';
import {
  primeFeedBlog,
  primeFeedBlogCategories,
  primeFeedNews,
  primeFeedNewsCategories,
} from 'api/feed/feed.api';
import { primeFilters } from 'api/filters';
import { primeLicenses } from 'api/licenses/license.api';
import {
  primeProjects,
  primeProjectsBySlugs,
} from 'api/projects/projects.api';
import { QUERY_FAMILIES, type QueryFamily } from 'api/queryFamilies';
import {
  primeServiceCategories,
  primeServices,
} from 'api/services/services.api';
import {
  invalidateSsrQueryFamily,
  isSsrQueryCacheEnabled,
  touchSsrQueryFamily,
} from 'shared/utils/querySignal';

const DEFAULT_POLL_INTERVAL_MS = 5 * 60_000;
const POLL_INTERVAL_MS = envMs('SSR_QUERY_POLL_INTERVAL_MS', DEFAULT_POLL_INTERVAL_MS);
const MARKER_TIMEOUT_MS = envMs('SSR_QUERY_MARKER_TIMEOUT_MS', 10_000);

const MUSEUM_PROJECT_SLUGS = [
  'moskovskij-urbanisticeskij-forum',
  'muzej-vtoroj-mirovoj-vojny',
] as const;
const OFFICE_PROJECT_SLUGS = ['kontrastnyj-open-space', 'mnogozonal-nyj-ofis'] as const;

type PollingFamily = {
  family: QueryFamily;
  marker: () => Promise<unknown>;
  prime: () => Promise<unknown>[];
};

type WarmupQuery = {
  name: string;
  prime: () => Promise<unknown>;
};

const startupWarmupQueries: WarmupQuery[] = [
  { name: '/projects', prime: () => primeProjects(false, true) },
  {
    name: '/service_category?per_page=100',
    prime: () => primeServiceCategories(false, true),
  },
  { name: '/service?per_page=100', prime: () => primeServices(false, true) },
  { name: '/news', prime: () => primeFeedNews({}, false, true) },
  { name: '/blog', prime: () => primeFeedBlog({}, false, true) },
  { name: '/licenses', prime: () => primeLicenses(false, true) },
  { name: '/feedbacks?per_page=100', prime: () => primeFeedbacks(false, true) },
  { name: '/faqs', prime: () => primeFaqs(false, true) },
];

const pollingFamilies: PollingFamily[] = [
  {
    family: QUERY_FAMILIES.projects,
    marker: async () => ({
      posts: await postMarker('/projects'),
      facets: await valueMarker('/project-facets'),
    }),
    prime: () => [
      primeProjects(true, true),
      primeFilters(true),
      primeProjectsBySlugs(MUSEUM_PROJECT_SLUGS, true),
      primeProjectsBySlugs(OFFICE_PROJECT_SLUGS, true),
    ],
  },
  {
    family: QUERY_FAMILIES.services,
    marker: async () => ({
      services: await postMarker('/service'),
      categories: await taxonomyMarker('/service_category'),
    }),
    prime: () => [primeServiceCategories(true, true), primeServices(true, true)],
  },
  {
    family: QUERY_FAMILIES.news,
    marker: async () => ({
      posts: await postMarker('/news'),
      categories: await taxonomyMarker('/news_category'),
    }),
    prime: () => [
      primeFeedNews({}, true, true),
      primeFeedNews({ page: 1, per_page: 10 }, true),
      primeFeedNewsCategories(true),
    ],
  },
  {
    family: QUERY_FAMILIES.blog,
    marker: async () => ({
      posts: await postMarker('/blog'),
      categories: await taxonomyMarker('/blog_category'),
    }),
    prime: () => [
      primeFeedBlog({}, true, true),
      primeFeedBlog({ page: 1, per_page: 10 }, true),
      primeFeedBlogCategories(true),
    ],
  },
  {
    family: QUERY_FAMILIES.feedbacks,
    marker: () => postMarker('/feedbacks'),
    prime: () => [primeFeedbacks(true)],
  },
  {
    family: QUERY_FAMILIES.faqs,
    marker: () => postMarker('/faqs'),
    prime: () => [primeFaqs(true)],
  },
  {
    family: QUERY_FAMILIES.licenses,
    marker: () => postMarker('/licenses'),
    prime: () => [primeLicenses(true)],
  },
];

const markerHashes = new Map<QueryFamily, string>();
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let pollerStarted = false;
let pollerDisposed = false;

/** Восемь exact queries из root loader. Этот Promise завершится до production listen. */
export async function warmupSsrQueryCache() {
  if (!isSsrQueryCacheEnabled) {
    console.info('[SSR cache] Warmup skipped because SSR_QUERY_TTL_MS=0');
    return;
  }

  const startedAt = Date.now();
  const results = await Promise.allSettled(startupWarmupQueries.map(({ prime }) => prime()));
  const failed = results.filter((result) => result.status === 'rejected');

  console.info(
    `[SSR cache] Warmup finished in ${Date.now() - startedAt}ms: ${results.length - failed.length}/${results.length}`
  );
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status === 'rejected') {
      console.error(
        `[SSR cache] Warmup request failed (${startupWarmupQueries[index].name}):`,
        errorMessage(result.reason)
      );
    }
  }
}

export async function startSsrQueryCachePoller() {
  if (pollerStarted) return;

  pollerStarted = true;
  pollerDisposed = false;

  if (!isSsrQueryCacheEnabled || POLL_INTERVAL_MS <= 0) {
    await warmupSsrQueryCache();
    return;
  }

  // Baseline до warmup и контрольный poll после него исключают окно, в котором
  // изменившиеся во время запуска данные могли бы считаться актуальными.
  await pollAllFamilies(false);
  await warmupSsrQueryCache();
  await pollAllFamilies(true);
  scheduleNextPoll();
}

async function pollAllFamilies(refreshMissingBaseline = true) {
  const results = await Promise.allSettled(
    pollingFamilies.map((descriptor) => pollFamily(descriptor, refreshMissingBaseline))
  );

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status === 'rejected') {
      console.error(
        `[SSR cache] Poll failed (${pollingFamilies[index].family}):`,
        errorMessage(result.reason)
      );
    }
  }
}

async function pollFamily(descriptor: PollingFamily, refreshMissingBaseline: boolean) {
  const markerHash = hash(await descriptor.marker());
  const previousHash = markerHashes.get(descriptor.family);

  if (previousHash == null) {
    markerHashes.set(descriptor.family, markerHash);
    console.info(`[SSR cache] Poll baseline: ${descriptor.family} ${markerHash.slice(0, 8)}`);
    if (refreshMissingBaseline) await refreshFamily(descriptor, markerHash, 'baseline recovery');
    return;
  }

  if (previousHash === markerHash) {
    touchSsrQueryFamily(descriptor.family);
    return;
  }

  await refreshFamily(descriptor, markerHash, `${previousHash.slice(0, 8)} -> ${markerHash.slice(0, 8)}`);
}

async function refreshFamily(descriptor: PollingFamily, markerHash: string, reason: string) {
  const generation = invalidateSsrQueryFamily(descriptor.family);
  console.info(`[SSR cache] Refreshing ${descriptor.family}: ${reason} (generation ${generation})`);

  const results = await Promise.allSettled(descriptor.prime());
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length > 0) {
    throw new Error(
      `${failed.length}/${results.length} refresh requests failed: ${failed
        .map((result) => errorMessage(result.reason))
        .join('; ')}`
    );
  }

  markerHashes.set(descriptor.family, markerHash);
  console.info(`[SSR cache] Refresh complete: ${descriptor.family} (${results.length} queries)`);
}

function scheduleNextPoll() {
  if (pollerDisposed) return;

  pollTimer = setTimeout(() => {
    void pollAllFamilies().finally(scheduleNextPoll);
  }, POLL_INTERVAL_MS);
  pollTimer.unref();
}

async function postMarker(endpoint: string) {
  return pagedMarker(endpoint, 'id,modified_gmt');
}

async function taxonomyMarker(endpoint: string) {
  // Taxonomy не имеет modified_gmt. payload включён, потому что именно custom
  // поля категорий содержат отображаемый на сайте контент.
  return pagedMarker(endpoint, 'id,slug,name,description,parent,count,payload');
}

async function pagedMarker(endpoint: string, fields: string) {
  const params = {
    _fields: fields,
    order: 'asc',
    orderby: 'id',
    page: 1,
    per_page: 100,
  };
  const first = await instance.get(endpoint, { params, timeout: MARKER_TIMEOUT_MS });
  const totalPages = Math.max(1, Number(first.headers['x-wp-totalpages'] ?? 1));
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      instance.get(endpoint, {
        params: { ...params, page: index + 2 },
        timeout: MARKER_TIMEOUT_MS,
      })
    )
  );

  return [first, ...remaining]
    .flatMap((response) => (Array.isArray(response.data) ? response.data : []))
    .sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0));
}

async function valueMarker(endpoint: string) {
  const response = await instance.get(endpoint, { timeout: MARKER_TIMEOUT_MS });
  return response.data;
}

function hash(value: unknown) {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function envMs(name: string, fallback: number) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`[SSR cache] Invalid ${name}="${raw}", using ${fallback}`);
    return fallback;
  }

  return parsed;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    pollerDisposed = true;
    pollerStarted = false;
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = undefined;
  });
}
