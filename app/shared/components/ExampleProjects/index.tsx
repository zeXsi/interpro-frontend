import './styles.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ArrowIcon from 'assets/icons/arrow.svg?react';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

type ProjectItem = {
  id: number;
  slug: string;
  name?: string;
  title?: string;
  full_image?: { url: string } | null;
};

interface ExampleProjectsProps {
  projects?: ProjectItem[];
  goTo: (path: string, ...customNames: string[]) => void;
}

export default function ExampleProjects({ projects = [], goTo }: ExampleProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="wrap-example-project px">
      <p className="head-title-project">
        РџСЂРёРјРµСЂС‹ <br /> РІС‹РїРѕР»РЅРµРЅРЅС‹С… СЂР°Р±РѕС‚
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
          {projects.map((item) => {
            const projectName = decodeUnicodeEscapes(item.name ?? item.title ?? '');

            return (
              <SwiperSlide key={item.id} onClick={() => goTo(`/projects/${item.slug}`, projectName)}>
                {projectName && <p className="title-project">{projectName}</p>}
                {item.full_image?.url && (
                  <img src={item.full_image.url} alt={`РџСЂРѕРµРєС‚ ${projectName}`} />
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
        {projects.length > 1 && (
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
  );
}
