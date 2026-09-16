// import './styles.css';
import '../ServicePage/styles.css';
import TitlePage from 'shared/components/TitlePage';
import InfoList from 'shared/components/InfoList';
import ContactForm from 'shared/components/ContactForm';
import Button from 'shared/components/Button';
import Subtitle from 'shared/components/Subtitle';

import Link from 'shared/components/Link';
import { useNavigate } from 'shared/components/NavigationTracker';
import { useLayoutEffect, useRef } from 'react';
import { lenisManager } from 'shared/utils/lenis';
import {
  getServiceCategories,
  getServiceCategoriesById,
  getServiceWithNextItem,
} from 'api/services/services.api';
import type { Service, ServiceCategory } from 'api/services/services.types';
import { Route } from './+types';
import { redirect } from 'react-router';

import Accordion from 'shared/components/Accordion';
import CrossIcon from 'assets/icons/cross.svg?react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import DocOverview from 'shared/sections/DocOverview';
import MarqueeCarousel from 'shared/components/MarqueeCarousel';
import ArrowIcon from 'assets/icons/arrow.svg?react';
import ExampleProjects from 'shared/components/ExampleProjects';

import svgCompanies from 'assets/companies';
import FAQSection from 'shared/sections/FAQSection';

import JsonLd from 'shared/seo/JsonLd';
import {
  getFaqSchema,
  getReviewSchemas,
  getServiceCategoryPageSchema,
} from 'shared/seo/schemas';
import { getOpenGraphMeta } from 'shared/seo/meta';
import { ServicePageContent } from '../ServicePage';

const DEFAULT_SERVICE_CATEGORY_DESCRIPTION =
  'Этот проект был реализован компанией Interpro с применением современных решений и экспертизы.';

type CategoryRouteData =
  | { kind: 'category'; data: ServiceCategory }
  | { kind: 'service'; data: Service; categorySlug: string };

export async function loader({ params }: Route.LoaderArgs): Promise<CategoryRouteData> {
  const categories = await getServiceCategories();

  if (categories?.length === 1) {
    const category = categories[0];

    if (params.slug === category.slug) {
      throw redirect('/services', { status: 301 });
    }

    const service = await getServiceWithNextItem(params.slug);
    const belongsToCategory =
      service?.service_category?.includes(category.id) ||
      service?.payload?.category?.slug === category.slug;

    if (!service || !belongsToCategory) {
      throw new Response('Not found', { status: 404 });
    }

    return {
      kind: 'service',
      data: service,
      categorySlug: category.slug,
    };
  }

  const data = await getServiceCategoriesById({ slug: params.slug });

  if (!data) {
    throw new Response('Not found', { status: 404 });
  }

  return { kind: 'category', data };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  if (loaderData?.kind === 'service') {
    const titlePart = loaderData.data.payload?.title || '';
    const description =
      loaderData.data.payload?.description || DEFAULT_SERVICE_CATEGORY_DESCRIPTION;

    return getOpenGraphMeta({
      title: `Interpro: услуга ${titlePart}`,
      description,
      pathname: location.pathname,
      image: loaderData.data.payload?.cover,
    });
  }

  const titlePart = loaderData?.data?.name || '';
  const description = loaderData?.data?.description || DEFAULT_SERVICE_CATEGORY_DESCRIPTION;

  return getOpenGraphMeta({
    title: `Interpro: категория услуги ${titlePart}`,
    description,
    pathname: location.pathname,
    image: loaderData?.data?.payload?.cover,
  });
}

export default function ServiceCategoryPage({ loaderData, params }: Route.ComponentProps) {
  if (loaderData.kind === 'service') {
    return (
      <ServicePageContent
        data={loaderData.data}
        categorySlug={loaderData.categorySlug}
        serviceSlug={params.slug}
        isDirectPath
      />
    );
  }

  return <ServiceCategoryContent data={loaderData.data} categorySlug={params.slug} />;
}

interface ServiceCategoryContentProps {
  data: ServiceCategory;
  categorySlug: string;
  title?: string;
  setCategoryCrumb?: boolean;
  includePageSchema?: boolean;
  directServiceLinks?: boolean;
}

export function ServiceCategoryContent({
  data,
  categorySlug,
  title,
  setCategoryCrumb = true,
  includePageSchema = true,
  directServiceLinks = false,
}: ServiceCategoryContentProps) {
  const clIsImg = !!data?.payload.cover ? 'with-img' : '';
  const { goTo, setCrumbs } = useNavigate();
  const contactFormRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const path = `/services/${categorySlug}`;
    if (setCategoryCrumb && data?.payload?.name) {
      setCrumbs(path, data?.payload?.name);
    }
  }, [categorySlug, data?.payload?.name, setCategoryCrumb]);

  return (
    <div className="InteractiveExhibit service">
      <JsonLd
        data={
          includePageSchema
            ? getServiceCategoryPageSchema({
                slug: categorySlug,
                title: `Interpro: категория услуги ${data.name || data.payload.name}`,
                description: data.description || DEFAULT_SERVICE_CATEGORY_DESCRIPTION,
                name: data.payload.name || data.name,
                serviceDescription:
                  data.payload.description ||
                  data.description ||
                  DEFAULT_SERVICE_CATEGORY_DESCRIPTION,
              })
            : null
        }
      />
      <JsonLd data={getFaqSchema(data?.payload?.faq)} />
      <JsonLd data={getReviewSchemas(data?.payload?.reviews)} />
      
      <div className="wrap-first-wrap px">
        <div className="wrap-first-title">
          <TitlePage title={title ?? data?.payload.name!} />
          {data?.payload.description || (data?.payload.accordion?.length ?? 0) > 0 ? (
            <div className="wrap-desc">
              {data?.payload.description && (
                <p className="InteractiveExhibit-desc">{data?.payload.description}</p>
              )}
              {(data?.payload.accordion?.length ?? 0) > 0 &&
                data?.payload.accordion?.map((item, index) => (
                  <Accordion key={index}>
                    <Accordion.Header>
                      <span className="Accordion_header-title">{item.title}</span>
                      <CrossIcon className="Accordion_header-icon" />
                    </Accordion.Header>
                    <Accordion.Content>
                      <div
                        className="Accordion_content-description"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </Accordion.Content>
                  </Accordion>
                ))}
            </div>
          ) : (
            ''
          )}
        </div>

        {data?.payload?.posts?.length > 0 && (
          <InfoList
            variant={'custom'}
            underline={'center-right'}
            title={`( что делаем )`}
            className='moreServices'
            onClick={(index) => {
              const post = data?.payload?.posts[index];
              if (!post) return;

              const path = directServiceLinks
                ? `/services/${post.slug}`
                : `/services/${categorySlug}/${post.slug}`;

              goTo(
                path,
                ...(directServiceLinks ? [post.title] : [data?.payload.name, post.title])
              );
            }}
            items={data?.payload?.posts?.map(({ title }) => [title, '']) || []}
          />
        )}

        {data?.payload.content_blocks?.map((item, index) => {
          const processedContent = item.content?.replace(/&nbsp;/g, '<br/>');

          return (
            <div className="contentBlock" key={`${index}_${item?.title}`}>
              {index + 1 === (data?.payload.content_blocks?.length ?? 0) && data?.payload.price ? (
                <div className="price">
                  <p>( стоимость )</p>
                  <button />
                  <Button.Arrow
                    className="btn-send"
                    onClick={() => {
                      const el = contactFormRef.current;
                      if (!el) return;
                      const lenis = lenisManager.state.v;
                      if (lenis) {
                        lenis.scrollTo(el, { offset: -200, duration: 2 });
                      } else {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    direction="right"
                    variant="link"
                  >
                    {data?.payload.price}
                  </Button.Arrow>
                </div>
              ) : null}
              {item?.title && <h2 className="title">{item.title}</h2>}
              {item?.content && (
                <div
                  className="desc"
                  dangerouslySetInnerHTML={{ __html: processedContent ?? '' }}
                />
              )}
            </div>
          );
        })}

        <div ref={contactFormRef} className="wrap-ContactForm">
          <ContactForm type="mini-normal" title="Заказать звонок" subtitle="" serviceName={data?.payload?.name} />
        </div>

        {data?.nextItem?.slug && data.nextItem.slug !== data?.slug && (
          <div className="wrap-next-page">
            <Subtitle>( следующая услуга )</Subtitle>
            <Link
              to={`/services/${data.nextItem.slug}`}
              slug={data.nextItem.title}
            >
              <Button.Arrow variant="link" direction="right" className="ItemService_btn">
                {data.nextItem.title}
              </Button.Arrow>
            </Link>
          </div>
        )}
      </div>

      <ExampleProjects projects={data?.payload.projects} goTo={goTo} />

      {(data?.payload.reviews?.length ?? 0) > 0 && (
        <DocOverview
          subtitle="( Отзывы )"
          items={
            data?.payload?.reviews?.map((r) => ({
              company: r.title,
              text: r.content_plain || r.content,
              pdfUrl: r.pdf?.url ?? '',
            })) ?? []
          }
        />
      )}

      <div className="wrap-clients">
        <p className="px">Наши клиенты</p>
        <MarqueeCarousel>
          {svgCompanies.map((Svg, index) => {
            return <Svg key={index} />;
          })}
        </MarqueeCarousel>
      </div>

      {(data?.payload.faq?.length ?? 0) > 0 && (
        <FAQSection
          items={
            data?.payload?.faq?.map((f) => ({
              question: f.question,
              answer: f.answer,
            })) ?? []
          }
        />
      )}

      {(data?.payload.news?.length ?? 0) > 0 && (
        <div className="news-wrap">
          <div className="wrap-head-news px">
            <div className="wrap-head-news-title">
              <p className="news-title">Статьи</p>
              <p className="news-desc">Самые актуальные новости</p>
            </div>
            {(data?.payload.news?.length ?? 0) > 1 && (
              <div className="wrap-nav-news">
                <div className="swiper-btn-news-prev">
                  <ArrowIcon />
                </div>
                <div className="swiper-btn-news-next">
                  <ArrowIcon />
                </div>
              </div>
            )}
          </div>

          <Swiper
            slidesPerView="auto"
            spaceBetween={20}
            navigation={{
              prevEl: '.swiper-btn-news-prev',
              nextEl: '.swiper-btn-news-next',
            }}
            modules={[Navigation]}
            className="News__swiper"
          >
            {data?.payload.news?.map((item) => (
              <SwiperSlide
                key={item.id}
                onClick={() =>
                  goTo(
                    `/${item?.permalink.indexOf('blog') < 0 ? 'news' : 'blog'}/${item.slug}`,
                    item.title
                  )
                }
              >
                {item.full_image?.url && (
                  <img src={item.full_image?.url} alt={`Новость: ${item.name}`} />
                )}
                {item.name && <p className="title-news">{item.name}</p>}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      <ContactForm className="px" />
    </div>
  );
}
