import './styles.css';
import 'swiper/css';
import { useId, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import ArrowIcon from 'assets/icons/arrow.svg?react';
import type { RelatedProject } from 'api/projects/related.api';
import Link from 'shared/components/Link';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

export default function RelatedProjects({ projects }: { projects: RelatedProject[] }) {
  const headingId = useId();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [navigation, setNavigation] = useState({ isBeginning: true, isEnd: projects.length <= 1 });
  const updateNavigation = (swiper: SwiperInstance) => {
    setNavigation({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
  };

  if (!projects.length) return null;

  return (
    <section className="ProjectRelated" aria-labelledby={headingId}>
      <div className="ProjectRelated-header px">
        <h2 className="ProjectRelated-title" id={headingId}>Похожие проекты</h2>
        <div className="ProjectRelated-controls">
          <button
            type="button"
            aria-label="Предыдущий проект"
            disabled={navigation.isBeginning}
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ArrowIcon className="isLeft" />
          </button>
          <button
            type="button"
            aria-label="Следующий проект"
            disabled={navigation.isEnd}
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ArrowIcon />
          </button>
        </div>
      </div>
      <Swiper
        className="ProjectRelated-slider"
        modules={[A11y, Keyboard]}
        keyboard={{ enabled: true, onlyInViewport: true }}
        a11y={{ containerMessage: 'Похожие проекты', slideLabelMessage: 'Проект {{index}} из {{slidesLength}}' }}
        slidesPerView="auto"
        resistanceRatio={0}
        watchOverflow
        breakpoints={{ 0: { spaceBetween: 8 }, 1001: { spaceBetween: 20 } }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          updateNavigation(swiper);
        }}
        onSlideChange={updateNavigation}
        onResize={updateNavigation}
        onReachBeginning={updateNavigation}
        onReachEnd={updateNavigation}
        onFromEdge={updateNavigation}
      >
        {projects.map((project) => (
          <SwiperSlide className="ProjectRelated-slide" key={project.id}>
            <RelatedProjectCard project={project} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function RelatedProjectCard({ project }: { project: RelatedProject }) {
  const title = decodeUnicodeEscapes(project.title);
  return (
    <Link to={`/projects/${project.slug}`} slug={title}>
      <article className="ProjectRelated-card">
        <div className="ProjectRelated-image">
          {project.cover?.url && (
            <img
              src={project.cover.url}
              srcSet={project.cover.srcset || undefined}
              sizes="(max-width: 1000px) 303px, 40vw"
              width={project.cover.width || undefined}
              height={project.cover.height || undefined}
              alt={`Проект ${title}`}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
        <div className="ProjectRelated-info">
          <h3 className="ProjectRelated-cardTitle">{title}</h3>
          <div className="ProjectRelated-tags">
            {project.area > 0 && <span>{project.area} м²</span>}
            {project.exhibition && <span>{project.exhibition}</span>}
          </div>
        </div>
      </article>
    </Link>
  );
}
