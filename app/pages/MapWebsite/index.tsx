import './styles.css';
import InfoList from 'shared/components/InfoList';
import ContactForm from 'shared/components/ContactForm';

import { sgProjects } from 'api/projects/projects.api';
import { sgServiceCategories } from 'api/services/services.api';
import { sgFeedBlogs, sgFeedNews } from 'api/feed/feed.api';
import StartPage from 'shared/components/StartPage';

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
              items={sgProjects.v?.map((item) => [item.payload.title, `/projects/${item.slug}`])}
            />
            <InfoList
              title="услуги:"
              isModeSlug={true}
              items={sgServiceCategories.v?.flatMap((item) =>
                item.payload?.posts?.map(
                  (_item) =>
                    [
                      [item.payload.name, _item.title] as any,
                      `/services/${item.slug}/${_item.slug}`,
                    ] as [string, string]
                )
              )}
            />
          </div>

          <div className="MapWebsite_footer-right">
            <InfoList
              title="Категории услуг:"
              isModeSlug={true}
              items={sgServiceCategories.v?.map((item) => [
                item.payload.name,
                `/services/${item.slug}`,
              ])}
            />
            <InfoList
              title="новости:"
              isModeSlug={true}
              items={sgFeedNews.v.articles?.map((item) => [
                item.payload.title,
                `/news/${item.slug}`,
              ])}
            />
            <InfoList
              title="блог:"
              isModeSlug={true}
              items={sgFeedBlogs.v.articles?.map((item) => [
                item.payload.title,
                `/blog/${item.slug}`,
              ])}
            />
          </div>
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}
