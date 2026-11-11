import './styles.css';
import Button from 'shared/components/Button';
import ContactForm from 'shared/components/ContactForm';
import ServicesDesc from 'shared/components/ServicesDesc';
import TitlePage from 'shared/components/TitlePage';
import Link from 'shared/components/Link';
import { getServiceCategories } from 'api/services/services.api';
import StartPage from 'shared/components/StartPage';
import { ServiceCategoryContent } from './pages/ServiceCategory';
import type { ServiceCategoryDisplay } from './pages/ServiceCategory';
import type { Route } from './+types';

export async function loader() {
  const categories = await getServiceCategories();
  return { categories: categories.map((category): ServiceCategoryDisplay => {
    const { payload } = category;
    const isSingleCategory = categories.length === 1;
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      nextItem: isSingleCategory && category.nextItem ? {
        slug: category.nextItem.slug,
        title: category.nextItem.title,
      } : undefined,
      payload: {
        id: payload.id,
        slug: payload.slug,
        name: payload.name,
        parent: payload.parent,
        description: payload.description,
        cover: isSingleCategory ? payload.cover : null,
        order: payload.order,
        count: payload.count,
        tags: [],
        children: [],
        posts: isSingleCategory ? payload.posts.map(({ id, slug, title }) => ({ id, slug, title })) : [],
        accordion: isSingleCategory ? payload.accordion?.map(({ title, content }) => ({ title, content })) : undefined,
        content_blocks: isSingleCategory ? payload.content_blocks?.map(({ title, content }) => ({ title, content })) : undefined,
        price: isSingleCategory ? payload.price : undefined,
        projects: isSingleCategory ? payload.projects?.map(({ id, slug, name, full_image }) => ({
          id, slug, name, full_image: full_image ? { url: full_image.url } : full_image,
        })) : undefined,
        reviews: isSingleCategory ? payload.reviews?.map(({ title, content_plain, content, pdf }) => ({
          title, content_plain, content, pdf: pdf ? { url: pdf.url } : pdf,
        })) : undefined,
        faq: isSingleCategory ? payload.faq?.map(({ question, answer }) => ({ question, answer })) : undefined,
        news: isSingleCategory ? payload.news?.map(({ id, slug, title, name, permalink, full_image }) => ({
          id, slug, title, name, permalink, full_image: full_image ? { url: full_image.url } : full_image,
        })) : undefined,
      },
    };
  }) };
}

export function meta() {
  const title = 'Interpro: услуги';
  const description =
    'Interpro предлагает широкий спектр услуг для бизнеса и частных клиентов. Узнайте больше о наших сервисах, получите консультацию и обратную связь через удобные формы на сайте.';

  return [
    { title },

    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function ServiceCategories({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;

  if (categories.length === 1) {
    const category = categories[0];

    return (
      <StartPage>
        <ServiceCategoryContent
          data={category}
          categorySlug={category.slug}
          title="Услуги"
          setCategoryCrumb={false}
          includePageSchema={false}
          directServiceLinks
        />
      </StartPage>
    );
  }

  return (
    <StartPage>
      <div className="ServiceCategories px">
        <TitlePage title="Услуги" />
        <ServicesDesc title="подход">
          Проектируем, строим, поддерживаем выставочные стенды, которые работают на бренд
        </ServicesDesc>

        <div className="ServiceCategories_container">
          {categories.map(({ payload, slug, name }, index) => {
            return (
              <ItemService
                key={index}
                title={payload.name}
                desc={payload.description}
                index={index + 1}
                link={`/services/${slug}`}
                nameSlag={name}
              />
            );
          })}
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}

interface ItemServiceProps {
  index: number;
  title: string;
  desc: string;
  link: string;
  nameSlag: string;
}

function ItemService({ nameSlag, index, title, desc, link }: ItemServiceProps) {
  return (
    <div className="ItemService">
      <span className="ItemService_index">( {formatNumber(index)} )</span>
      <div className="ItemService_inner">
        <div className="ItemService-title">{title}</div>
        <div className="ItemService_container">
          <p className="ItemService_desc">{desc}</p>
          <Link to={link} slug={[nameSlag]}>
            <Button.Arrow as="span" direction="right" className="ItemService_btn">
              узнать больше
            </Button.Arrow>
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number) {
  return num < 10 ? '0' + num : String(num);
}
