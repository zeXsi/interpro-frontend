import './styles.css';
import ContactForm from 'shared/components/ContactForm';
import Filter from './Filter';
import Pagination from './Pagination';
import Article from 'shared/components/Article';
import { useSearchParams } from 'react-router';
import Link from 'shared/components/Link';

import IsNot from 'shared/components/IsNot';
import type { FeedPageData, QParams } from './types';

import { useLocation } from 'react-router';
import formatDateToRussian from 'shared/utils/formatDateToRussian';
import StartPage from 'shared/components/StartPage';
import { getOpenGraphMeta } from 'shared/seo/meta';

export type Params = { slug: 'blog' | 'news' };

export const getRouteFeedName = (route: Params['slug']) => {
  return route === 'blog' ? 'блог' : 'новости';
};

const isRoute = (slug: Params['slug'], str: string) => {
  return new RegExp(slug, 'g').test(str);
};

export function _meta(type: Params['slug']) {
  const isBlog = type === 'blog';
  const title = isBlog
    ? 'Interpro: блог о выставочных стендах и событиях'
    : 'Interpro: новости компании и новые проекты';
  const description = isBlog
    ? 'Статьи Interpro о дизайне, проектировании и строительстве выставочных стендов, отраслевых событиях и практических решениях.'
    : 'Новости Interpro: новые выставочные проекты, события компании, достижения команды и актуальные обновления.';

  return getOpenGraphMeta({ title, description, pathname: `/${type}` });
}


export type Props = FeedPageData;

export default function FeedPage({ data }: { data: Props }) {
  const { feed, category, qparams } = data;
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const typeFeed = isRoute('blog', pathname) ? 'blog' : 'news';

  const currPage = qparams.page;
  const categoryId = qparams.blog_category ?? qparams.news_category;
  const selectedCategory = category.find((item) => item.id === categoryId)?.name ?? 'все';

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
      per_page: qparams.per_page,
      category: categoryId,
    });
  };

  return (
    <StartPage>
      <div className="FeedPage px">
        <div className="FeedPage-title">
          {typeFeed === 'news' ? (
            <h1>Новости</h1>
          ) : (
            <Link to="/news">
              <span>Новости</span>
            </Link>
          )}
          {typeFeed === 'blog' ? (
            <h1>Блог</h1>
          ) : (
            <Link to="/blog">
              <span>Блог</span>
            </Link>
          )}
        </div>

        <IsNot value={(category?.length || 0) >= 2}>
          <Filter
            startItem={selectedCategory}
            items={['все', ...(category?.map((item) => item?.name) || [])]}
            onClick={(value) => {
              if (value === 'все') {
                setParams({ page: 1, per_page: qparams.per_page });
                return;
              }

              const item = category.find((item) => item.name === value);
              if (!item?.slug) return;

              setParams({
                category: item.id,
                page: 1,
                per_page: qparams.per_page,
              });
            }}
          />
        </IsNot>

        <div className="FeedPage_container">
          {feed?.articles.map(({ id, payload, slug }) => (
            <Article
              key={id}
              srcImg={payload.cover?.url ?? ''}
              date={formatDateToRussian(payload.date)}
              title={payload.title}
              desc={payload.subtitle}
              to={`/${typeFeed}/${slug}`}
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
