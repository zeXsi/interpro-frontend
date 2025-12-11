import './styles.css';
import ContactForm from 'shared/components/ContactForm';
import Filter from './Filter';
import Pagination from './Pagination';
import Article from 'shared/components/Article';
import { useSearchParams } from 'react-router-dom';
import Link from 'shared/components/Link';

import { useRef, useState } from 'react';

import { useNavigate } from 'shared/components/NavigationTracker';
import IsNot from 'shared/components/IsNot';

import { FeedCategory, FeedItem } from 'api/feed/feed.types';
import {
  FeedList,
  getFeedBlog,
  getFeedBlogCategory,
  getFeedNews,
  getFeedNewsCategory,
} from 'api/feed/feed.api';

import { useLocation } from 'react-router';
import formatDateToRussian from 'shared/utils/formatDateToRussian';
import StartPage from 'shared/components/StartPage';

export type Params = { slug: 'blog' | 'news' };
export type QParams = Partial<Record<'news_category' | 'blog_category', number>> & {
  per_page: number;
  page: number;
};
export type FeedData = {
  category: FeedCategory[];
  feed: {
    articles: FeedItem[];
    totalPage: number;
  };
};

export const getRouteFeedName = (route: Params['slug']) => {
  return route === 'blog' ? 'блог' : 'новости';
};

const isRoute = (slug: Params['slug'], str: string) => {
  return new RegExp(slug, 'g').test(str);
};

const isActive = (slug: Params['slug'], str: string) => {
  return isRoute(slug, str) ? 'active' : '';
};

export async function _loader(_url: string) {
  const url = new URL(_url);
  const search = url.searchParams;

  const page = Number(search.get('page') ?? '1');
  const per_page = Number(search.get('per_page') ?? '10');

  const isBlog = isRoute('blog', _url);
  const categoryKey: 'blog_category' | 'news_category' = isBlog ? 'blog_category' : 'news_category';

  const categoryId = search.get(categoryKey);

  const qparams: QParams = {
    page,
    per_page,
    ...(categoryId ? { [categoryKey]: Number(categoryId) } : {}),
  };

  if (isBlog) {
    const [feed, category] = await Promise.all([
      getFeedBlog.fetch(qparams),
      getFeedBlogCategory.fetch(),
    ]);

    return {
      feed,
      category,
      qparams,
    };
  } else {
    const [feed, category] = await Promise.all([
      getFeedNews.fetch(qparams),
      getFeedNewsCategory.fetch(),
    ]);
    
    return {
      feed,
      category,
      qparams,
    };
  }
}

export function _meta() {
  const title = 'Interpro: последние новости и обновления';
  const description =
    'Следите за новостями Interpro: новые проекты, события компании и актуальные обновления в сфере бизнес-решений.';

  return [
    { title },

    { name: "description", content: description },

    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
}


export type Props = {
  feed: FeedList;
  category: FeedCategory[];
  qparams: QParams;
};

export default function FeedPage({ data }: { data: Props }) {
  const { feed, category, qparams } = data;
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const typeFeed = isRoute('blog', pathname) ? 'blog' : 'news';

  const [currPage, setPage] = useState(qparams.page ?? 1);
  const refItemId = useRef(qparams.blog_category ?? 0);
  const { goTo } = useNavigate();

  const setParams = (qparams: QParams & { category?: number }) => {
    const next = new URLSearchParams(searchParams);

    if (qparams.page != null) next.set('page', String(qparams.page));
    if (qparams.per_page != null) next.set('per_page', String(qparams.per_page));

    if (qparams.category) {
      next.set(`${typeFeed}_category`, String(qparams.category));
    } else {
      next.delete(`${typeFeed}_category`);
    }

    setSearchParams(next);
  };

  const onChangePage = (index: number) => {
    setParams({
      page: index,
      per_page: 10,
      category: refItemId.current || undefined,
    });
    setPage(index);
  };

  return (
    <StartPage>
      <div className="FeedPage px">
        <h1 className="FeedPage-title">
          <Link to="/news">
            <span className={isActive('news', pathname)}>Новости</span>
          </Link>
          <Link to="/blog">
            <span className={isActive('blog', pathname)}> Блог</span>
          </Link>
        </h1>

        <IsNot value={(category?.length || 0) >= 2}>
          <Filter
            startItem="все"
            items={['все', ...(category?.map((item) => item?.name) || [])]}
            onClick={(value) => {
              if (value === 'все') {
                refItemId.current = 0;
                setParams({ page: currPage, per_page: 10 });
                return;
              }

              const item = category.find((item) => item.name === value);
              if (!item?.slug) return;

              refItemId.current = item.id;
              setParams({
                category: item.id,
                page: currPage,
                per_page: 10,
              });
            }}
          />
        </IsNot>

        <div className="FeedPage_container">
          {feed?.articles.map(({ payload, slug }, index) => (
            <Article
              key={index}
              srcImg={payload.cover.url}
              date={formatDateToRussian(payload.date)}
              title={payload.title}
              desc={payload.subtitle}
              onClick={() => goTo(`/${typeFeed}/${slug}`, payload.title)}
            />
          ))}
        </div>

        {(feed?.totalPage || 0) > 1 && (
          <Pagination
            onChange={onChangePage}
            currentPage={currPage}
            countPages={feed?.totalPage || 0}
          />
        )}

        <ContactForm />
      </div>
    </StartPage>
  );
}
