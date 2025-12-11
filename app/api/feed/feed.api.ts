import { createQuery } from 'shared/utils/querySignal';
import type { FeedCategory, FeedItem } from './feed.types';

export interface FeedList {
  articles: FeedItem[];
  totalPage: number;
}

export type QParams = Partial<Record<'news_category' | 'blog_category', number>> & {
  per_page: number;
  page: number;
};

export const getFeedNews = createQuery<FeedList, Partial<QParams>>({
  endpoint: '/news',
  initial: { articles: [], totalPage: 0 },
  map: (data, resp) => ({
    articles: data ?? [],
    totalPage: Number(resp.headers['x-wp-totalpages'] ?? 0),
  }),
});

export const sgFeedNews = getFeedNews.sg;

export const getFeedNewsCategory = createQuery<FeedCategory[]>({
  endpoint: '/news_category',
  initial: [],
});

export const getFeedBlogCategory = createQuery<FeedCategory[]>({
  endpoint: '/blog_category',
  initial: [],
});

export const sgFeedCategory = getFeedNewsCategory.sg;

export const getFeedNewsArticle = createQuery<FeedItem | undefined, { slug: string }, FeedList>({
  endpoint: '/news',
  parent: sgFeedNews,
  findInParent: (parent, params) => parent?.articles.find((a) => a.slug === params.slug),

  takeFirst: true,
  initial: undefined,
});
export const sgCurrFeedItemNews = getFeedNewsArticle.sg;

export const getFeedBlog = createQuery<FeedList, Partial<QParams>>({
  endpoint: '/blog',
  initial: { articles: [], totalPage: 0 },
  map: (data, resp) => ({
    articles: data ?? [],
    totalPage: Number(resp.headers['x-wp-totalpages'] ?? 0),
  }),
});

export const sgFeedBlogs = getFeedBlog.sg;

export const getFeedBlogArticle = createQuery<FeedItem | undefined, { slug: string }, FeedList>({
  endpoint: '/blog',
  parent: sgFeedBlogs,
  findInParent: (parent, params) => parent?.articles.find((a) => a.slug === params.slug),

  takeFirst: true,
  initial: undefined,
});

export const sgCurrFeedItemBlog = getFeedBlogArticle.sg;


