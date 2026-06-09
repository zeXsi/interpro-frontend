import './styles.css';
import TitlePage from 'shared/components/TitlePage';
import ContactForm from 'shared/components/ContactForm';

import { useLayoutEffect, useRef } from 'react';
import { lenisManager } from 'shared/utils/lenis';

import { useNavigate } from 'shared/components/NavigationTracker';

import { getServiceById, getServiceCategoriesById } from 'api/services/services.api';
import type { Service } from 'api/services/services.types';
import { Route } from './+types';
import Accordion from 'shared/components/Accordion';
import CrossIcon from 'assets/icons/cross.svg?react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import DocOverview from 'shared/sections/DocOverview';
import MarqueeCarousel from 'shared/components/MarqueeCarousel';
import ArrowIcon from 'assets/icons/arrow.svg?react';

import svgCompanies from 'assets/companies';
import FAQSection from 'shared/sections/FAQSection';
import Button from 'shared/components/Button';
import Subtitle from 'shared/components/Subtitle';
import Link from 'shared/components/Link';
import ExampleProjects from 'shared/components/ExampleProjects';

import JsonLd from 'shared/seo/JsonLd';
import { getFaqSchema, getReviewSchemas } from 'shared/seo/schemas';
import { getOpenGraphMeta } from 'shared/seo/meta';

export async function loader({ params }: Route.LoaderArgs): Promise<Service> {
  const data = await getServiceById({ slug: params.slugService });

  if (!data) {
    throw new Response('Not found', { status: 404 });
  }

  const categorySlug = data.payload?.category?.slug;
  if (categorySlug) {
    const category = await getServiceCategoriesById({ slug: categorySlug });
    const posts = category?.payload?.posts ?? [];

    if (posts.length > 1) {
      const currentIndex = posts.findIndex((post) => post.slug === data.slug);

      if (currentIndex >= 0) {
        const nextPost = posts[(currentIndex + 1) % posts.length];

        if (nextPost && nextPost.slug !== data.slug) {
          data.nextItem = {
            id: nextPost.id,
            slug: nextPost.slug,
            title: nextPost.title,
            categorySlug,
          };
        }
      }
    }
  }

  return data;
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const titlePart = loaderData?.payload?.title || '';
  const description =
    loaderData?.payload?.description ||
    'Этот проект был реализован компанией Interpro с применением современных решений и экспертизы.';

  const title = `Interpro: услуга ${titlePart}`;

  return getOpenGraphMeta({
    title,
    description,
    pathname: location.pathname,
    image: loaderData?.payload?.cover,
  });
}

export default function ServicePage({ loaderData: data, params }: Route.ComponentProps) {
  const { setCrumbs, goTo } = useNavigate();
  const contactFormRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const path = `/services/${params?.slug}/${params?.slugService}`;
    if (data?.payload.category.name && data?.payload.title) {
      setCrumbs(path, data?.payload.category.name, data?.payload.title);
    }
  }, [data, params?.slug, params?.slugService, setCrumbs]);

  return (
    <div className="InteractiveExhibit service">
      <JsonLd data={getFaqSchema(data?.payload?.faq)} />
      <JsonLd data={getReviewSchemas(data?.payload?.reviews)} />
      
      <div className="wrap-first-wrap px">
        <div className="wrap-first-title">
          <TitlePage title={data?.payload.title ?? ''} />
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
          <ContactForm type="mini-normal" title="Заказать звонок" subtitle="" serviceName={data?.payload?.title} />
        </div>

        {data?.nextItem?.slug && data.nextItem.slug !== data?.slug && (
          <div className="wrap-next-page">
            <Subtitle>( следующая услуга )</Subtitle>
            <Link
              to={`/services/${data.nextItem.categorySlug ?? params?.slug}/${data.nextItem.slug}`}
              slug={[data?.payload.category.name ?? '', data.nextItem.title ?? '']}
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
