import fs from 'fs';
import path from 'path';

import { instance } from 'api/api.config';
import { SITE_URL } from 'shared/seo/company';

const SITEMAP_REFRESH_INTERVAL = 4 * 60 * 60 * 1000;
const SITEMAP_REQUEST_TIMEOUT = 15_000;
const SITEMAP_RETRY_INTERVAL = 60 * 1000;
const WP_PAGE_SIZE = 100;

// Update these dates only after a meaningful change to the rendered static page.
const STATIC_PAGE_LASTMOD = {
  '/': '2026-06-09',
  '/projects': '2026-07-17',
  '/blog': '2026-07-17',
  '/news': '2026-07-17',
  '/services': '2026-03-03',
  '/about-us': '2026-06-09',
  '/about-us/clients': '2025-12-11',
  '/about-us/feedbacks': '2026-06-09',
  '/about-us/certificates': '2025-12-11',
  '/faq': '2026-07-17',
  '/contacts': '2026-07-17',
  '/mapping': '2026-03-30',
  '/privacy': '2025-12-11',
  '/advertising-privacy': '2025-12-11',
  '/excursion': '2025-12-11',
  '/museum-spaces': '2026-07-17',
  '/office-renovation': '2026-07-17',
} as const;

type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq: ChangeFrequency;
  priority: number;
};

type WpContentEntry = {
  id: number;
  slug: string;
  date?: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
};

type WpServiceEntry = WpContentEntry & {
  service_category?: number[];
};

let schedulerStarted = false;

function resolveSitemapPath() {
  if (process.env.SITEMAP_PATH) {
    return path.isAbsolute(process.env.SITEMAP_PATH)
      ? process.env.SITEMAP_PATH
      : path.resolve(process.cwd(), process.env.SITEMAP_PATH);
  }

  const isProd = process.env.NODE_ENV === 'production';

  return path.resolve(process.cwd(), isProd ? 'build/client/sitemap.xml' : 'public/sitemap.xml');
}

function getBaseUrl() {
  const configuredUrl =
    process.env.VITE_ORIGINAL_URL?.trim() ||
    import.meta.env.VITE_ORIGINAL_URL?.trim() ||
    SITE_URL;
  const url = new URL(configuredUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported sitemap URL protocol: ${url.protocol}`);
  }

  return url.toString().replace(/\/+$/, '');
}

function toSitemapDate(value?: string) {
  const datePart = value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!datePart) return undefined;

  const parsed = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== datePart) {
    return undefined;
  }

  return datePart;
}

function getContentLastmod(entry: WpContentEntry) {
  return (
    toSitemapDate(entry.modified_gmt) ??
    toSitemapDate(entry.modified) ??
    toSitemapDate(entry.date_gmt) ??
    toSitemapDate(entry.date)
  );
}

function getLatestDate(...dates: Array<string | undefined>) {
  return dates
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
}

function getLatestContentDate(entries: WpContentEntry[]) {
  return getLatestDate(...entries.map(getContentLastmod));
}

function getLatestProjectDate(projects: WpContentEntry[], slugs: string[]) {
  const selectedSlugs = new Set(slugs);
  return getLatestContentDate(projects.filter((project) => selectedSlugs.has(project.slug)));
}

async function fetchAllWpEntries<T extends { id: number }>(
  endpoint: string,
  fields: string[],
  extraParams: Record<string, string | number> = {}
): Promise<T[]> {
  const params = {
    page: 1,
    per_page: WP_PAGE_SIZE,
    order: 'asc',
    orderby: 'id',
    _fields: fields.join(','),
    ...extraParams,
  };
  const firstResponse = await instance.get<T[]>(endpoint, {
    params,
    timeout: SITEMAP_REQUEST_TIMEOUT,
  });
  const totalPages = Math.max(
    1,
    Number(firstResponse.headers['x-wp-totalpages']) || 1
  );

  const remainingResponses =
    totalPages > 1
      ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            instance.get<T[]>(endpoint, {
              timeout: SITEMAP_REQUEST_TIMEOUT,
              params: {
                ...params,
                page: index + 2,
              },
            })
          )
        )
      : [];

  const entries = [
    ...firstResponse.data,
    ...remainingResponses.flatMap((response) => response.data),
  ];

  return Array.from(new Map(entries.map((entry) => [entry.id, entry])).values());
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function renderSitemap(entries: SitemapEntry[], baseUrl: string) {
  const urls = entries
    .map(({ loc, lastmod, changefreq, priority }) => {
      const lastmodXml = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';

      return `  <url>
    <loc>${escapeXml(`${baseUrl}${loc}`)}</loc>${lastmodXml}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export async function buildSitemap() {
  const contentFields = ['id', 'slug', 'date', 'date_gmt', 'modified', 'modified_gmt'];
  const [projects, categories, services, news] = await Promise.all([
    // Приватные проекты скрыты из списков на сайте, но из выдачи не исключаются.
    fetchAllWpEntries<WpContentEntry>('/projects', contentFields, { include_private: 1 }),
    fetchAllWpEntries<WpContentEntry>('/service_category', contentFields),
    fetchAllWpEntries<WpServiceEntry>('/service', [...contentFields, 'service_category']),
    fetchAllWpEntries<WpContentEntry>('/news', contentFields),
  ]);
  const [blogs, faqs, feedbacks, licenses] = await Promise.all([
    fetchAllWpEntries<WpContentEntry>('/blog', contentFields),
    fetchAllWpEntries<WpContentEntry>('/faqs', contentFields),
    fetchAllWpEntries<WpContentEntry>('/feedbacks', contentFields),
    fetchAllWpEntries<WpContentEntry>('/licenses', contentFields),
  ]);

  const latestProjectDate = getLatestContentDate(projects);
  const latestServiceDate = getLatestContentDate(services);
  const latestNewsDate = getLatestContentDate(news);
  const latestBlogDate = getLatestContentDate(blogs);
  const latestFaqDate = getLatestContentDate(faqs);
  const latestFeedbackDate = getLatestContentDate(feedbacks);
  const latestLicenseDate = getLatestContentDate(licenses);

  const staticEntry = (
    loc: keyof typeof STATIC_PAGE_LASTMOD,
    changefreq: ChangeFrequency,
    priority: number,
    ...contentDates: Array<string | undefined>
  ): SitemapEntry => ({
    loc,
    lastmod: getLatestDate(STATIC_PAGE_LASTMOD[loc], ...contentDates),
    changefreq,
    priority,
  });

  const staticUrls: SitemapEntry[] = [
    staticEntry(
      '/',
      'daily',
      1,
      latestProjectDate,
      latestServiceDate,
      latestFaqDate,
      latestFeedbackDate
    ),
    staticEntry('/projects', 'weekly', 0.7, latestProjectDate),
    staticEntry('/blog', 'weekly', 0.6, latestBlogDate),
    staticEntry('/news', 'weekly', 0.6, latestNewsDate),
    staticEntry('/services', 'weekly', 0.8, latestServiceDate),
    staticEntry(
      '/about-us',
      'monthly',
      0.5,
      latestFaqDate,
      latestFeedbackDate,
      latestLicenseDate
    ),
    staticEntry('/about-us/clients', 'monthly', 0.4),
    staticEntry('/about-us/feedbacks', 'monthly', 0.4, latestFeedbackDate),
    staticEntry('/about-us/certificates', 'monthly', 0.4, latestLicenseDate),
    staticEntry('/faq', 'monthly', 0.4, latestFaqDate),
    staticEntry('/contacts', 'monthly', 0.3),
    staticEntry(
      '/mapping',
      'monthly',
      0.3,
      latestProjectDate,
      latestServiceDate,
      latestNewsDate,
      latestBlogDate
    ),
    staticEntry('/privacy', 'yearly', 0.2),
    staticEntry('/advertising-privacy', 'yearly', 0.2),
    staticEntry('/excursion', 'monthly', 0.3),
    staticEntry(
      '/museum-spaces',
      'monthly',
      0.6,
      getLatestProjectDate(projects, ['imperia-klimata', 'futuruss', 'novatek'])
    ),
    staticEntry(
      '/office-renovation',
      'monthly',
      0.6,
      getLatestProjectDate(projects, ['imperia-klimata', 'lidlab'])
    ),
  ];

  const projectUrls: SitemapEntry[] = projects.map((project) => ({
    loc: `/projects/${project.slug}`,
    lastmod: getContentLastmod(project),
    changefreq: 'weekly',
    priority: 0.6,
  }));

  const categoryUrls: SitemapEntry[] = categories.map((category) => ({
    loc: `/services/${category.slug}`,
    lastmod: getLatestDate(
      getContentLastmod(category),
      getLatestContentDate(
        services.filter((service) => service.service_category?.includes(category.id))
      )
    ),
    changefreq: 'weekly',
    priority: 0.6,
  }));

  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const serviceUrls: SitemapEntry[] = services.flatMap((service) =>
    (service.service_category ?? []).flatMap((categoryId) => {
      const category = categoriesById.get(categoryId);
      if (!category) return [];

      return [
        {
          loc: `/services/${category.slug}/${service.slug}`,
          lastmod: getContentLastmod(service),
          changefreq: 'weekly' as const,
          priority: 0.5,
        },
      ];
    })
  );

  const newsUrls: SitemapEntry[] = news.map((article) => ({
    loc: `/news/${article.slug}`,
    lastmod: getContentLastmod(article),
    changefreq: 'daily',
    priority: 0.5,
  }));

  const blogUrls: SitemapEntry[] = blogs.map((article) => ({
    loc: `/blog/${article.slug}`,
    lastmod: getContentLastmod(article),
    changefreq: 'daily',
    priority: 0.5,
  }));

  const xml = renderSitemap(
    [
      ...staticUrls,
      ...projectUrls,
      ...categoryUrls,
      ...serviceUrls,
      ...newsUrls,
      ...blogUrls,
    ],
    getBaseUrl()
  );
  const sitemapPath = resolveSitemapPath();
  const temporaryPath = `${sitemapPath}.tmp`;

  fs.mkdirSync(path.dirname(sitemapPath), { recursive: true });
  fs.writeFileSync(temporaryPath, xml, 'utf8');
  fs.renameSync(temporaryPath, sitemapPath);
}

async function rebuildSitemapSafely() {
  try {
    await buildSitemap();
    return true;
  } catch (error) {
    console.error(
      'Sitemap generation failed:',
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

async function runScheduledSitemapBuild() {
  const succeeded = await rebuildSitemapSafely();
  const timeout = setTimeout(
    runScheduledSitemapBuild,
    succeeded ? SITEMAP_REFRESH_INTERVAL : SITEMAP_RETRY_INTERVAL
  );
  timeout.unref();
}

export function startSitemapScheduler() {
  if (typeof window !== 'undefined' || schedulerStarted) return;

  schedulerStarted = true;
  void runScheduledSitemapBuild();
}
