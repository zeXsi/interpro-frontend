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
import { getServiceCategoriesById } from 'api/services/services.api';
import { Route } from './+types';

import Accordion from 'shared/components/Accordion';
import CrossIcon from 'assets/icons/cross.svg?react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import DocOverview from 'shared/sections/DocOverview';
import MarqueeCarousel from 'shared/components/MarqueeCarousel';
import ArrowIcon from 'assets/icons/arrow.svg?react';

import svgCompanies from 'assets/companies';
import FAQSection from 'shared/sections/FAQSection';

export async function loader({ params }: Route.LoaderArgs) {
  const data = await getServiceCategoriesById({ slug: params.slug });

  if (!data) {
    throw new Response('Not found', { status: 404 });
  }

  return data;
}

export function meta({ loaderData }: Route.MetaArgs) {
  const titlePart = loaderData?.name || '';
  const description =
    loaderData?.description ||
    'Этот проект был реализован компанией Interpro с применением современных решений и экспертизы.';

  const title = `Interpro: категория услуги ${titlePart}`;

  return [
    { title },
    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function ServiceCategoryPage({ loaderData: data, params }: Route.ComponentProps) {
  const clIsImg = !!data?.payload.cover ? 'with-img' : '';
  const { goTo, setCrumbs } = useNavigate();
  const contactFormRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const path = `/services/${params?.slug}`;
    if (data?.payload?.name) {
      setCrumbs(path, data?.payload?.name);
    }
  }, [data]);

  return (
    <div className="InteractiveExhibit">
      <div className="wrap-first-wrap px">
        <div className="wrap-first-title">
          <TitlePage title={data?.payload.name!} />
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
            title={`( что делаем )`}
            onClick={(index) => {
              const post = data?.payload?.posts[index];
              if (!post) return;

              goTo(`/services/${params?.slug}/${post.slug}`, data?.payload.name, post.title);
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
              {item?.title && <p className="title">{item.title}</p>}
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
              to={`/services/${data.nextItem.categorySlug ?? params?.slug}/${data.nextItem.slug}`}
              slug={data.nextItem.title}
            >
              <Button.Arrow variant="link" direction="right" className="ItemService_btn">
                {data.nextItem.title}
              </Button.Arrow>
            </Link>
          </div>
        )}
      </div>

      {(data?.payload.projects?.length ?? 0) > 0 && (
        <div className="wrap-example-project px">
          <p className="head-title-project">
            Примеры <br /> выполненных работ
          </p>
          <div className="wrap-slider">
            <Swiper
              slidesPerView="auto"
              spaceBetween={64}
              pagination={{
                el: '.wrap-slider .wrap-dots',
                clickable: true,
              }}
              navigation={{
                prevEl: '.swiper-btn-prev',
                nextEl: '.swiper-btn-next',
              }}
              modules={[Pagination, Navigation]}
              className="Project__swiper"
            >
              {data?.payload.projects?.map((item) => (
                <SwiperSlide
                  key={item.id}
                  onClick={() => goTo(`/projects/${item.slug}`, item.name)}
                >
                  {item.name && <p className="title-project">{item.name}</p>}
                  {item.full_image?.url && (
                    <img src={item.full_image?.url} alt={`Проект ${item.name}`} />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
            {(data?.payload.projects?.length ?? 0) > 1 && (
              <>
                <div className="wrap-dots"></div>
                <div className="swiper-btn-prev">
                  <ArrowIcon />
                </div>
                <div className="swiper-btn-next">
                  <ArrowIcon />
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
