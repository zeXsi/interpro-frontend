import './styles.css';
import SectionHeader from 'shared/components/SectionHeader';
import StepCard from 'shared/components/StepCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Scrollbar } from 'swiper/modules';

export default function WorkflowSection() {
  return (
    <div className="WorkflowSection ">
      <SectionHeader
        subtitle={'( процессы )'}
        width="1080px"
        title="Мы работаем по чёткой стратегии, это видно на каждом этапе"
      />
      <Swiper
        modules={[Mousewheel, Scrollbar]}
        className="WorkflowSection_container"
        direction="horizontal"
        slidesPerView={'auto'}
        resistanceRatio={0}
        freeMode={true}
        grabCursor={true}
        mousewheel={{
          invert: false,
          forceToAxis: true,
          thresholdDelta: 2000,
        }}
        spaceBetween={8}
        breakpoints={{
          1440: {
            spaceBetween: 0,
          },
        }}
      >
        {data.map((props, i) => {
          return (
            <SwiperSlide key={i} style={{ width: 'clamp(17rem, calc(-1rem + 20vw), 23rem)' }}>
              <StepCard {...props} index={i + 1} />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

const data = [
  {
    title: 'Аналитика',
    description:
      'Изучаем вашу цель размещения и нишу на предмет новых решений и их адаптаций',
  },
  {
    title: 'менеджмент',
    description:
      'Сопровождаем каждый шаг реализации от первой встречи до демонтажа стенда',
  },
  {
    title: 'Дизайн',
    description: 'Создаем для вас уникальные 3D-концепции с учетом всех технических требований',
  },
  {
    title: 'Производство',
    description: 'Создаем ваш будущий стенд на нашем производстве в 530м²',
  },
  {
    title: 'Монтаж',
    description: 'Отвечаем за логистику, монтаж и демонтаж всего стенда под ключ',
  },
];
