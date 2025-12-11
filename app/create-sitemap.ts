// create-sitemap.ts
import fs from "fs";
import path from "path";

import { getProjects, sgProjects } from "api/projects/projects.api";
import { getServiceCategories, sgServiceCategories } from "api/services/services.api";
import { getFeedNews, getFeedBlog, sgFeedNews, sgFeedBlogs } from "api/feed/feed.api";

const __dirname = import.meta.dirname;

let schedulerStarted = false;

function resolveSitemapPath() {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    return path.resolve(__dirname, "../client/sitemap.xml");
  }

  return path.resolve(process.cwd(), "public/sitemap.xml");
}

async function buildSitemap() {
  const BASE = process.env.VITE_ORIGINAL_URL;
  const lastmod = new Date().toISOString();

  await Promise.all([
    getProjects(),
    getServiceCategories(),
    getFeedNews.fetch({}),
    getFeedBlog.fetch({}),
  ]);

  const projects = sgProjects.v ?? [];
  const categories = sgServiceCategories.v ?? [];
  const news = sgFeedNews.v?.articles ?? [];
  const blogs = sgFeedBlogs.v?.articles ?? [];

  const staticUrls = [
    ["/", "daily", 1.0],
    ["/projects", "weekly", 0.7],
    ["/blog", "weekly", 0.6],
    ["/news", "weekly", 0.6],
    ["/services", "weekly", 0.8],
    ["/about-us", "monthly", 0.5],
    ["/about-us/clients", "monthly", 0.4],
    ["/about-us/feedbacks", "monthly", 0.4],
    ["/about-us/certificates", "monthly", 0.4],
    ["/faq", "monthly", 0.4],
    ["/contacts", "monthly", 0.3],
    ["/mapping", "monthly", 0.3],
    ["/privacy", "yearly", 0.2],
  ];

  const projectUrls = projects.map((p) => [`/projects/${p.slug}`, "weekly", 0.6, lastmod]);
  const catUrls = categories.map((c) => [`/services/${c.slug}`, "weekly", 0.6, lastmod]);

  const serviceUrls = categories.flatMap((c) =>
    c.payload?.posts?.map((srv) => [
      `/services/${c.slug}/${srv.slug}`,
      "weekly",
      0.5,
      lastmod,
    ])
  );

  const newsUrls = news.map((n) => [`/news/${n.slug}`, "daily", 0.5, lastmod]);
  const blogUrls = blogs.map((b) => [`/blog/${b.slug}`, "daily", 0.5, lastmod]);

  const allUrls = [
    ...staticUrls,
    ...projectUrls,
    ...catUrls,
    ...serviceUrls,
    ...newsUrls,
    ...blogUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(([loc, freq, priority, updated]) => {
    return `  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${updated}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  const sitemapPath = resolveSitemapPath();
  console.log(sitemapPath)
  // 💥 Создаём папку, если не существует
  fs.mkdirSync(path.dirname(sitemapPath), { recursive: true });

  fs.writeFileSync(sitemapPath, xml);

  console.log("[Sitemap] Updated:", sitemapPath);
}

export async function startSitemapScheduler() {
  if (typeof window !== "undefined") return;
  if (schedulerStarted) return;

  schedulerStarted = true;

  console.log("[Sitemap] Scheduler started");

  await buildSitemap();
  setInterval(buildSitemap, 4 * 60 * 60 * 1000);
}
