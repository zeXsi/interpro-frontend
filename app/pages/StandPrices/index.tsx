import './styles.css';

import CrossIcon from 'assets/icons/cross.svg?react';
import AreaIcon from 'assets/icons/stand-prices/area.svg?react';
import HammerIcon from 'assets/icons/stand-prices/hammer.svg?react';
import MediaIcon from 'assets/icons/stand-prices/media.svg?react';
import PlanIcon from 'assets/icons/stand-prices/plan.svg?react';
import TimerIcon from 'assets/icons/stand-prices/timer.svg?react';
import { getHomeData } from 'api/home/home.api';
import { getProjectsBySlugs } from 'api/projects/projects.api';
import type { HomeProject } from 'api/home/home.types';
import { useLayoutEffect, useRef, useState } from 'react';
import Accordion from 'shared/components/Accordion';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import StartPage from 'shared/components/StartPage';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';
import { getOpenGraphMeta } from 'shared/seo/meta';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';

import useBriefPopup from './Brief';
import type { Route } from './+types';

const PROJECT_DESCRIPTION_MAX_PARAGRAPHS = 2;

const priceFactors = [
  { title: 'Площадь и конфигурация (линейный, угловой, островной, с подвесом)', Icon: AreaIcon },
  { title: 'Уровень исполнения материалов и отделки', Icon: HammerIcon },
  { title: 'Состав функциональных зон (переговорная, ресепшн, демозона, кухня)', Icon: PlanIcon },
  { title: 'Мультимедиа и интерактивные элементы', Icon: MediaIcon },
  { title: 'Сроки — стандартные или срочные', Icon: TimerIcon },
];

const priceFaqItems = [
  {
    question: 'Сколько стоит выставочный стенд под ключ?',
    answer:
      'Стоимость начинается от\u00a045\u00a0000\u00a0₽ за\u00a0м² для стандартных конструкций. Итоговая цена зависит от\u00a0площади, конфигурации, уровня материалов и\u00a0состава функциональных зон. После заполнения брифа мы\u00a0подготовим точный расчёт.',
  },
  {
    question: 'Что входит в стоимость стенда?',
    answer:
      'В\u00a0стоимость включены: дизайн-проект, производство конструкций на\u00a0собственном производстве, доставка, монтаж и\u00a0демонтаж.',
  },
  {
    question: 'Почему нельзя назвать точную цену сразу?',
    answer:
      'Стенд\u00a0— индивидуальный продукт. Два стенда одной площади могут отличаться в\u00a0цене в\u00a03\u00a0раза в\u00a0зависимости от\u00a0материалов, зон и\u00a0оборудования. Заполните бриф\u00a0— мы\u00a0рассчитаем стоимость под вашу задачу.',
  },
  {
    question: 'Как быстро вы сделаете расчёт?',
    answer:
      'После получения брифа\u00a0— в\u00a0течение 7\u00a0рабочих дней. Вместе с\u00a0расчётом пришлём предварительную концепцию стенда.',
  },
  {
    question: 'Можно ли заказать только дизайн-проект?',
    answer: 'Да. Мы\u00a0разрабатываем дизайн-проекты без дальнейшего производства. Стоимость и\u00a0сроки уточняем индивидуально.',
  },
  {
    question: 'Есть ли скидки при повторном заказе?',
    answer: 'Да. Постоянным клиентам предоставляем индивидуальные условия. Обсудим при работе над проектом.',
  },
  {
    question: 'Работаете ли вы в регионах?',
    answer: 'Да. Производим стенды на\u00a0собственном производстве в\u00a0Москве и\u00a0реализуем проекты по\u00a0всей России.',
  },
];

// Те же проекты, что в подборке на главной (эндпоинт /home, тот же порядок).
// В /home нет описания — берём «О проекте (кратко)» из /projects по тем же slug'ам.
export async function loader() {
  const home = await getHomeData();
  const projects = home?.projects?.items ?? [];
  const details = projects.length ? await getProjectsBySlugs(projects.map(({ slug }) => slug)) : [];

  return {
    projects: projects.map((project) => ({
      ...project,
      about: details?.find(({ slug }) => slug === project.slug)?.payload.about ?? '',
    })),
  };
}

export function meta() {
  return getOpenGraphMeta({
    title: 'Interpro: Цены на выставочные стенды',
    description:
      'Стоимость застройки выставочного стенда — от 45 000 до 150 000 ₽/м². Итоговая цена формируется после брифа.',
  });
}

export default function StandPrices({ loaderData }: Route.ComponentProps) {
  const brief = useBriefPopup();

  return (
    <StartPage>
      <main className="StandPrices">
        <div className="StandPrices-heading px">
          <h1 className="StandPrices-title">
            Цены на выставочные
            <br />
            стенды
          </h1>
        </div>
        <HeroSection onBrief={brief.open} />
        <PriceFactorsSection />
        <ProjectsSection projects={toStandProjects(loaderData.projects)} />
        <PriceFaqSection />
        <BriefSection onBrief={brief.open} />
      </main>
      {brief.popup}
    </StartPage>
  );
}

function HeroSection({ onBrief }: { onBrief: () => void }) {
  return (
    <section className="StandPrices-hero">
      <div className="StandPrices-heroLeft">
        <div className="StandPrices-heroContent">
          <div className="StandPrices-heroHead">
            <span className="StandPrices-heroLabel">( Ориентиры по стоимости )</span>
            <div className="StandPrices-heroTitleWrap">
              <h2 className="StandPrices-heroTitle">
                от 45 000
                <br />
                до 150 000 ₽/м²
              </h2>
              <p className="StandPrices-heroSubtitle">
                Мы застраиваем эксклюзивные выставочные стенды,{' '}
                <br className="StandPrices-mobileBreak" />
                поэтому итоговая цена всегда индивидуальна
              </p>
            </div>
          </div>
          <div className="StandPrices-heroBody">
            <p className="StandPrices-heroText">
              Диапазон отражает реальный разброс&nbsp;— от&nbsp;компактных стендов с&nbsp;базовой
              отделкой до&nbsp;архитектурных решений с&nbsp;мультимедиа и&nbsp;нестандартными
              конструкциями. Внутри диапазона цена зависит от&nbsp;площади, уровня материалов,
              состава функциональных зон и&nbsp;сроков изготовления
            </p>
            <BriefButton variant="ghostLink" onClick={onBrief} />
          </div>
        </div>
        <p className="StandPrices-heroNote">
          * Итоговая стоимость формируется после заполнения брифа&nbsp;— мы учитываем все параметры
          и&nbsp;предлагаем оптимальное решение в&nbsp;вашем бюджете
        </p>
      </div>
      <div className="StandPrices-heroRight">
        <img
          className="StandPrices-heroImage"
          src="/images/stand-prices/hero.png"
          alt="Схема выставочного стенда в разобранном виде"
          width={431}
          height={520}
        />
      </div>
    </section>
  );
}

function BriefButton({
  className = '',
  variant = 'link',
  onClick,
}: {
  className?: string;
  variant?: 'link' | 'ghostLink';
  onClick: () => void;
}) {
  return (
    <button className={`StandPrices-briefButton ${className}`} type="button" onClick={onClick}>
      <Button.Arrow as="span" direction="right" variant={variant}>
        Заполнить бриф
      </Button.Arrow>
    </button>
  );
}

function PriceFactorsSection() {
  return (
    <section className="StandPrices-factors">
      <div className="StandPrices-factorsHead px">
        <div className="StandPrices-sectionTitle">Почему нельзя назвать точную цену сразу</div>
        <p className="StandPrices-factorsText">
          Стенд&nbsp;— не&nbsp;типовой продукт. Два стенда одной площади могут отличаться в&nbsp;цене
          в&nbsp;3&nbsp;раза: один&nbsp;— базовая конструкция с&nbsp;печатью, другой&nbsp;—
          двухэтажный остров с&nbsp;мультимедиа и&nbsp;индивидуальной мебелью. Точная стоимость
          складывается из&nbsp;нескольких параметров:
        </p>
      </div>
      <Swiper
        className="StandPrices-factorsSwiper"
        slidesPerView="auto"
        resistanceRatio={0}
        breakpoints={{ 0: { spaceBetween: 8 }, 1001: { spaceBetween: 20 } }}
      >
        {priceFactors.map(({ title, Icon }) => (
          <SwiperSlide className="StandPrices-factorSlide" key={title}>
            <article className="StandPrices-factorCard">
              <Icon />
              <p>{title}</p>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

interface StandProject {
  id: number;
  slug: string;
  title: string;
  area: number;
  description: string;
  cover: HomeProject['cover'];
}

function ProjectsSection({ projects }: { projects: StandProject[] }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [navigation, setNavigation] = useState({ isBeginning: true, isEnd: false });
  const [pagePadding, setPagePadding] = useState(0);

  const updateNavigation = (swiper: SwiperInstance) => {
    setNavigation({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
  };

  useLayoutEffect(() => {
    const updatePagePadding = () => {
      const head = document.querySelector<HTMLElement>('.StandPrices-projectsHead');
      setPagePadding(head ? Number.parseFloat(window.getComputedStyle(head).paddingLeft) : 0);
      requestAnimationFrame(() => swiperRef.current?.update());
    };

    updatePagePadding();
    window.addEventListener('resize', updatePagePadding);
    return () => window.removeEventListener('resize', updatePagePadding);
  }, []);

  if (projects.length === 0) return null;

  return (
    <section className="StandPrices-projects">
      <div className="StandPrices-projectsHead px">
        <div className="StandPrices-sectionTitle">
          Реализованные
          <br />
          проекты
        </div>
        <div className="StandPrices-projectsControls">
          <button
            type="button"
            aria-label="Предыдущий проект"
            disabled={navigation.isBeginning}
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ArrowRightIcon className="isLeft" />
          </button>
          <button
            type="button"
            aria-label="Следующий проект"
            disabled={navigation.isEnd}
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <Swiper
        className="StandPrices-projectsSwiper"
        slidesPerView="auto"
        slidesOffsetBefore={pagePadding}
        slidesOffsetAfter={pagePadding}
        resistanceRatio={0}
        breakpoints={{ 0: { spaceBetween: 8 }, 1001: { spaceBetween: 20 } }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          updateNavigation(swiper);
        }}
        onSlideChange={updateNavigation}
        onReachBeginning={updateNavigation}
        onReachEnd={updateNavigation}
        onFromEdge={updateNavigation}
      >
        {projects.map((project) => (
          <SwiperSlide className="StandPrices-projectSlide" key={project.id}>
            <ProjectCard project={project} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function ProjectCard({ project }: { project: StandProject }) {
  return (
    <article className="StandPrices-projectCard">
      <Link to={`/projects/${project.slug}`} slug={project.title}>
        <div className="StandPrices-projectImage">
          <img
            src={project.cover?.url}
            srcSet={project.cover?.srcset || undefined}
            sizes={project.cover?.sizes || undefined}
            alt={`Проект ${project.title}`}
            loading="lazy"
          />
        </div>
      </Link>
      <div className="StandPrices-projectInfo">
        <div className="StandPrices-projectMeta">
          <div className="StandPrices-projectTitle">{project.title}</div>
          <div className="StandPrices-projectTags">
            {project.area > 0 && <span>{project.area} м²</span>}
          </div>
        </div>
        {project.description && (
          <p className="StandPrices-projectDescription">{project.description}</p>
        )}
      </div>
    </article>
  );
}

function PriceFaqSection() {
  return (
    <section className="StandPrices-faq px">
      <div className="StandPrices-faqTitle">
        Вопросы <br className="StandPrices-desktopBreak" />
        о стоимости
      </div>
      <div className="StandPrices-faqItems">
        {priceFaqItems.map((item) => (
          <Accordion key={item.question}>
            <Accordion.Header>
              <span className="Accordion_header-title">{item.question}</span>
              <CrossIcon className="Accordion_header-icon" />
            </Accordion.Header>
            <Accordion.Content>
              <p
                className="Accordion_content-description"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </Accordion.Content>
          </Accordion>
        ))}
      </div>
    </section>
  );
}

function BriefSection({ onBrief }: { onBrief: () => void }) {
  return (
    <section className="StandPrices-brief px">
      <div className="StandPrices-sectionTitle">
        Получите бесплатный <span className="StandPrices-nowrap">дизайн-проект</span> и&nbsp;расчёт
      </div>
      <div className="StandPrices-briefBody">
        <p className="StandPrices-briefText">
          Заполните короткий бриф&nbsp;— 7&nbsp;вопросов, 3&nbsp;минуты. Этого достаточно чтобы наш
          дизайнер подготовил предварительную концепцию и&nbsp;точный расчёт стоимости
        </p>
        <BriefButton className="StandPrices-briefCta" onClick={onBrief} />
      </div>
    </section>
  );
}

function toStandProjects(projects: (HomeProject & { about: string })[]): StandProject[] {
  return projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: decodeUnicodeEscapes(project.title).trim(),
    area: project.area,
    description: toProjectDescription(project.about),
    cover: project.cover,
  }));
}

function toProjectDescription(value = '') {
  return decodeUnicodeEscapes(value)
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, PROJECT_DESCRIPTION_MAX_PARAGRAPHS)
    .join('\n');
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.9348 6.2162C15.2544 5.89668 15.7723 5.89668 16.0918 6.2162L21.2987 11.4231C21.6182 11.7426 21.6182 12.2605 21.2987 12.58L16.0918 17.7869C15.7723 18.1064 15.2544 18.1064 14.9348 17.7869C14.6153 17.4674 14.6153 16.9494 14.9348 16.6299L18.745 12.8197H3.26562V11.1834H18.745L14.9348 7.37316C14.6153 7.05364 14.6153 6.53572 14.9348 6.2162Z"
        fill="black"
      />
    </svg>
  );
}
