import type { FeedCategory, FeedItem } from 'api/feed/feed.types';

export type FeedCard = Pick<FeedItem, 'id' | 'slug'> & {
  payload: Pick<FeedItem['payload'], 'title' | 'subtitle' | 'date'> & {
    cover: Pick<FeedItem['payload']['cover'], 'url'> | null;
  };
};

export type FeedCategoryOption = Pick<FeedCategory, 'id' | 'slug' | 'name'>;
export type FeedCards = { articles: FeedCard[]; totalPage: number };
export type QParams = Partial<Record<'news_category' | 'blog_category', number>> & {
  per_page: number;
  page: number;
};

export type FeedPageData = {
  feed: FeedCards;
  category: FeedCategoryOption[];
  qparams: QParams;
};
