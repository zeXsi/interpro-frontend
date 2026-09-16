import { createQuery } from 'shared/utils/querySignal';
import type { FeedCategory, FeedItem } from './feed.types';
import { QUERY_FAMILIES } from 'api/queryFamilies';

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
  family: QUERY_FAMILIES.news,
  initial: { articles: [], totalPage: 0 },
  map: (data, resp) => ({
    articles: data ?? [],
    totalPage: Number(resp.headers['x-wp-totalpages'] ?? 0),
  }),
});

export const sgFeedNews = getFeedNews.sg;

export const getFeedNewsCategory = createQuery<FeedCategory[]>({
  endpoint: '/news_category',
  family: QUERY_FAMILIES.news,
  initial: [],
});

export const getFeedBlogCategory = createQuery<FeedCategory[]>({
  endpoint: '/blog_category',
  family: QUERY_FAMILIES.blog,
  initial: [],
});

export const sgFeedCategory = getFeedNewsCategory.sg;

export const getFeedNewsArticle = createQuery<FeedItem | undefined, { slug: string }, FeedList>({
  endpoint: '/news',
  family: QUERY_FAMILIES.news,
  parent: sgFeedNews,
  findInParent: (parent, params) => parent?.articles.find((a) => a.slug === params.slug),

  takeFirst: true,
  initial: undefined,
});
export const sgCurrFeedItemNews = getFeedNewsArticle.sg;

export const getFeedBlog = createQuery<FeedList, Partial<QParams>>({
  endpoint: '/blog',
  family: QUERY_FAMILIES.blog,
  initial: { articles: [], totalPage: 0 },
  map: (data, resp) => ({
    articles: data ?? [],
    totalPage: Number(resp.headers['x-wp-totalpages'] ?? 0),
  }),
});

export const sgFeedBlogs = getFeedBlog.sg;

export const getFeedBlogArticle = createQuery<FeedItem | undefined, { slug: string }, FeedList>({
  endpoint: '/blog',
  family: QUERY_FAMILIES.blog,
  parent: sgFeedBlogs,
  findInParent: (parent, params) => parent?.articles.find((a) => a.slug === params.slug),

  takeFirst: true,
  initial: undefined,
});

export const sgCurrFeedItemBlog = getFeedBlogArticle.sg;

export const primeFeedNews = (
  params: Partial<QParams> = {},
  force = false,
  updateSignal = false
) => getFeedNews.prime(params, { force, updateSignal });
export const primeFeedBlog = (
  params: Partial<QParams> = {},
  force = false,
  updateSignal = false
) => getFeedBlog.prime(params, { force, updateSignal });
export const primeFeedNewsCategories = (force = false, updateSignal = false) =>
  getFeedNewsCategory.prime({}, { force, updateSignal });
export const primeFeedBlogCategories = (force = false, updateSignal = false) =>
  getFeedBlogCategory.prime({}, { force, updateSignal });


