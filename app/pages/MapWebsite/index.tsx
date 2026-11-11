import './styles.css';
import InfoList from 'shared/components/InfoList';
import ContactForm from 'shared/components/ContactForm';

import { getProjectCards } from 'api/pageData.server';
import { getServiceCategories } from 'api/services/services.api';
import { getFeedBlog, getFeedNews } from 'api/feed/feed.api';
import { useLoaderData } from 'react-router';
import StartPage from 'shared/components/StartPage';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

export async function loader() {
  const [projects, categories, news, blogs] = await Promise.all([
    getProjectCards(),
    getServiceCategories(),
    getFeedNews.fetch({ per_page: 100 }),
    getFeedBlog.fetch({ per_page: 100 }),
  ]);
  const hasSingleServiceCategory = categories.length === 1;

  return {
    projects: projects.map((item): [string, string] => [
      decodeUnicodeEscapes(item.payload.title), `/projects/${item.slug}`,
    ]),
    services: categories.flatMap((item) =>
      (item.payload?.posts ?? []).map((post): [string[], string] => [
        [item.payload.name, post.title],
        hasSingleServiceCategory
          ? `/services/${post.slug}`
          : `/services/${item.slug}/${post.slug}`,
      ])
    ),
    serviceCategories: categories.map((item): [string, string] => [
      item.payload.name,
      hasSingleServiceCategory ? '/services' : `/services/${item.slug}`,
    ]),
    news: news.articles.map((item): [string, string] => [
      item.payload.title, `/news/${item.slug}`,
    ]),
    blogs: blogs.articles.map((item): [string, string] => [
      item.payload.title, `/blog/${item.slug}`,
    ]),
  };
}

export function meta() {
  const title = 'Interpro: карта сайта';
  const description =
    'Полная карта сайта Interpro: быстрый доступ ко всем разделам, услугам и информации о компании.';

  return [
    { title },
    {
      name: 'description',
      content: description,
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: description,
    },
  ];
}

export default function MapWebsite() {
  const data = useLoaderData<typeof loader>();

  return (
    <StartPage>
      <div className="MapWebsite px">
        <h1 className="MapWebsite-title">Карта сайта</h1>
        <div className="MapWebsite_footer">
          <div className="MapWebsite_footer-left">
            <InfoList
              title="навигация:"
              items={[
                ['Проекты', '/projects'],
                ['блог', '/blog'],
                ['о нас', '/about-us'],
                ['контакты', '/contacts'],

                ['отзывы', '/about-us/clients'],
                ['клиенты', '/about-us/clients'],
                ['частые вопросы', '/faq'],
              ]}
            />
            <InfoList
              title="проекты:"
              isModeSlug={true}
              items={data.projects}
            />
            <InfoList
              title="услуги:"
              isModeSlug={true}
              items={data.services}
            />
          </div>

          <div className="MapWebsite_footer-right">
            <InfoList
              title="Категории услуг:"
              isModeSlug={true}
              items={data.serviceCategories}
            />
            <InfoList
              title="новости:"
              isModeSlug={true}
              items={data.news}
            />
            <InfoList
              title="блог:"
              isModeSlug={true}
              items={data.blogs}
            />
          </div>
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}
