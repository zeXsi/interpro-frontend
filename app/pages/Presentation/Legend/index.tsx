import { useEffect, useRef, useState } from 'react';
import './styles.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useLocation } from 'react-router';

export default function Legend({ data, id }: any) {
  const items = data.fields?.leg_items ?? [];
  const swiperRef = useRef<SwiperType | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [swiperReady, setSwiperReady] = useState(false);

  const location = useLocation();
  const isPdfExport = new URLSearchParams(location.search).get('export') === 'pdf';

  useEffect(() => {
    if (isPdfExport) return;
    const section = sectionRef.current;
    const swiper = swiperRef.current;
    if (!section || !swiper || !items.length) return;

    const handleScroll = () => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const scrollY = window.scrollY;
      const hSlide = sectionHeight / items.length;
      const delaySliderSwipe = 0.3;
      const scrollProgress = Math.max(0, Math.min(scrollY - sectionTop, sectionHeight));

      const targetIndex = Math.floor(scrollProgress / hSlide + delaySliderSwipe);
      const clampedIndex = Math.min(targetIndex, items.length - 1);

      if (clampedIndex !== swiper.activeIndex) {
        swiper.slideTo(clampedIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items.length, swiperReady]);

  if (isPdfExport) {
    return (
      <section
        ref={sectionRef}
        className="Legend"
        id={id}
        style={{ '--count-slides': items.length } as React.CSSProperties}
      >
        <div className="Legend__swiper">
          {items.map((item: any, index: number) => (
            <div
              key={`print-slide-${index}-${item.id ?? 'no-id'}`}
              className="Legend__swiper-slide"
            >
              <img src={item.full} alt={item.title} className="Legend__swiper-image" />

              <div className="Legend__swiper-desc">
                <h3 className="Legend__swiper-title">{item.title}</h3>

                <ul className="Legend__swiper-list">
                  {item.attrs.map((attr: any) => (
                    <li key={attr.label} className="Legend__swiper-item">
                      <span>{attr.label}</span>
                      <p>{attr.value}</p>
                    </li>
                  ))}
                </ul>

                <p className="Legend__swiper-txt" dangerouslySetInnerHTML={{ __html: item.text }} />
              </div>

              <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-vertical">
                {items.map((paginationItem: any, index2: number) => (
                  <span
                    key={`print-bullet-${index2}-${paginationItem.id ?? 'no-id'}`}
                    className={`swiper-pagination-bullet ${index === index2 ? 'swiper-pagination-bullet-active' : ''}`}
                  >
                    {items[index2]?.title ?? ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  const pagination = {
    clickable: true,
    renderBullet: (index: number, className: string) =>
      `<span class="${className}">${items[index]?.title ?? ''}</span>`,
  };

  return (
    <section
      ref={sectionRef}
      className="Legend"
      id={id}
      style={{ '--count-slides': items.length } as React.CSSProperties}
    >
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setSwiperReady(true);
        }}
        direction="vertical"
        slidesPerView={1}
        effect="fade"
        spaceBetween={8}
        pagination={pagination}
        modules={[EffectFade, Pagination]}
        allowTouchMove={false}
        className="Legend__swiper"
      >
        {items.map((item: any, index: number) => (
          <SwiperSlide
            key={`swiper-slide-${index}-${item.id ?? 'no-id'}`}
            className="Legend__swiper-slide"
          >
            <img src={item.full} alt={item.title} className="Legend__swiper-image" />

            <div className="Legend__swiper-desc">
              <h3 className="Legend__swiper-title">{item.title}</h3>

              <ul className="Legend__swiper-list">
                {item.attrs.map((attr: any) => (
                  <li key={attr.label} className="Legend__swiper-item">
                    <span>{attr.label}</span>
                    <p>{attr.value}</p>
                  </li>
                ))}
              </ul>

              <p className="Legend__swiper-txt" dangerouslySetInnerHTML={{ __html: item.text }} />
            </div>
          </SwiperSlide>
        ))}

        <div className="swiper-pagination tabs-pagination" />
      </Swiper>

      {items.map((item: any, index: number) => (
        <div className="Legend__content" key={`legend-content-${index}-${item.id ?? 'no-id'}`}>
          <h2 className="Legend__content-title">{item.title}</h2>
          <img src={item.full} alt={item.title} className="Legend__content-image" />

          <div className="Legend__content-desc">
            <ul className="Legend__content-list">
              {item.attrs.map((attr: any) => (
                <li key={attr.label} className="Legend__content-item">
                  <span>{attr.label}</span>
                  <p>{attr.value}</p>
                </li>
              ))}
            </ul>

            <p className="Legend__content-txt" dangerouslySetInnerHTML={{ __html: item.text }} />
          </div>
        </div>
      ))}
    </section>
  );
}
