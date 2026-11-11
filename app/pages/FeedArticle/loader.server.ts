import {
  getFeedNews,
  getFeedNewsArticle,
  getFeedBlog,
  getFeedBlogArticle,
} from 'api/feed/feed.api';
import { toFeedCard } from '../FeedPage/loader.server';
import type { ArticleData } from './index';

export async function _loader(_url: string): Promise<ArticleData> {
  const url = new URL(_url);
  const [section, id] = url.pathname.split('/').filter(Boolean);
  const slug = section === 'blog' ? 'blog' : 'news';
  const article = await (slug === 'blog' ? getFeedBlogArticle : getFeedNewsArticle).fetch({ slug: id });
  if (!article) throw new Response('Not found', { status: 404 });

  // One extra candidate leaves three previews when the current article is in the list.
  const feed = await (slug === 'blog' ? getFeedBlog : getFeedNews).fetch({ page: 1, per_page: 4 });
  return {
    slug,
    article,
    articles: feed.articles
      .filter((item) => item.id !== article.id && item.slug !== article.slug)
      .slice(0, 3)
      .map(toFeedCard),
  };
}
