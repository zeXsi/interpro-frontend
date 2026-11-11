import {
  getFeedBlog,
  getFeedBlogCategory,
  getFeedNews,
  getFeedNewsCategory,
} from 'api/feed/feed.api';
import type { FeedItem } from 'api/feed/feed.types';
import type { FeedCard, FeedPageData, QParams } from './types';

export function toFeedCard({ id, slug, payload }: FeedItem): FeedCard {
  return {
    id,
    slug,
    payload: {
      title: payload.title,
      subtitle: payload.subtitle,
      date: payload.date,
      cover: payload.cover?.url ? { url: payload.cover.url } : null,
    },
  };
}

function positiveInteger(value: string | null, fallback: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.min(max, Math.max(1, Math.floor(number)))
    : fallback;
}

export function getFeedQuery(url: URL): QParams {
  const categoryKey = url.pathname.split('/')[1] === 'blog' ? 'blog_category' : 'news_category';
  const category = positiveInteger(url.searchParams.get(categoryKey), 0, Number.MAX_SAFE_INTEGER);
  return {
    page: positiveInteger(url.searchParams.get('page'), 1, 10000),
    per_page: positiveInteger(url.searchParams.get('per_page'), 10, 100),
    ...(category ? { [categoryKey]: category } : {}),
  };
}

export async function _loader(_url: string): Promise<FeedPageData> {
  const url = new URL(_url);
  const isBlog = url.pathname.split('/')[1] === 'blog';
  const qparams = getFeedQuery(url);
  const [feed, category] = await Promise.all([
    (isBlog ? getFeedBlog : getFeedNews).fetch(qparams),
    (isBlog ? getFeedBlogCategory : getFeedNewsCategory).fetch(),
  ]);
  return {
    feed: { articles: feed.articles.map(toFeedCard), totalPage: feed.totalPage },
    category: category.map(({ id, slug, name }) => ({ id, slug, name })),
    qparams,
  };
}
