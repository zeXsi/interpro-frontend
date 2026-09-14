import './styles.css';

import ArrowIcon from 'assets/icons/arrow.svg?react';
import CheckmarkIcon from 'assets/icons/checkmark.svg?react';
import { sendLead } from 'api/form';
import { getProjectsBySlugs } from 'api/projects/projects.api';
import type { Project } from 'api/projects/projects.types';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import StartPage from 'shared/components/StartPage';
import VideoPlayer from 'shared/components/VideoPlayer';
import FAQSection from 'shared/sections/FAQSection';
import { scrollToContactForm } from 'shared/utils/scrollToSection';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';
import { getOpenGraphMeta } from 'shared/seo/meta';
import { useCycleLineMarker, useStickyStepCycle } from 'shared/hooks/useStickyStepCycle';
import ContactForm from 'shared/components/ContactForm';
import ProjectShowcase, { type ShowcaseProject } from 'shared/components/ProjectShowcase';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import {
  BoxIcon,
  CalendarIcon,
  CertificateIcon,
  ChartIcon,
  CycleIcon,
  RussiaIcon,
} from '../MuseumSpaces';
import type { Route } from './+types';

const projectTerms = ['до 1 месяца', '1-3 месяца', 'от 3 месяцев', 'пока не определены'];

const whyCards = [
  {
    title: 'Собственное производство',
    description:
      'Ведём работы своими силами: от демонтажа и черновых этапов до мебели, света и финальной отделки.',
  },
  {
    title: 'Все специалисты в штате',
    description:
      'Дизайнеры, инженеры, строители, прорабы и монтажники работают в одной команде.',
  },
  {
    title: 'Смета не меняется',
    description:
      'Фиксируем стоимость до старта и заранее согласовываем все позиции до выхода на объект.',
  },
  {
    title: 'Сроки в договоре',
    description:
      'Прописываем даты этапов. Вы понимаете, когда офис будет готов к работе.',
  },
];

const cycleSteps = [
  {
    title: 'Концепция',
    description: 'Разрабатываем идею пространства, планировку и сценарий будущей работы офиса',
  },
  {
    title: 'Дизайн',
    description: 'Создаём визуальную концепцию, подбираем материалы, мебель и свет',
  },
  {
    title: 'Проектирование',
    description: 'Готовим чертежи, спецификации и инженерные решения для стройки',
  },
  {
    title: 'Ремонт',
    description: 'Выполняем черновые и чистовые работы, контролируем качество на каждом этапе',
  },
  {
    title: 'Комплектация',
    description: 'Производим и поставляем мебель, навигацию, свет и элементы интерьера',
  },
  {
    title: 'Сдача',
    description: 'Проверяем готовность, устраняем замечания и передаём офис к работе',
  },
];

const competenceCards = [
  {
    title: 'Собственное производство на ВДНХ',
    description:
      'Проектируем, производим и собираем элементы пространства на собственной производственной базе.',
    Icon: BoxIcon,
  },
  {
    title: 'Работаем с 2017 года',
    description:
      'Реализуем сложные проекты офисных, выставочных и брендовых пространств.',
    Icon: CalendarIcon,
  },
  {
    title: 'Член союза выставочных застройщиков',
    description:
      'Работаем по профессиональным стандартам отрасли и требованиям ведущих площадок.',
    Icon: ChartIcon,
  },
  {
    title: 'Сертификат ISO 9001',
    description:
      'Система менеджмента качества сертифицирована по международному стандарту.',
    Icon: CertificateIcon,
  },
  {
    title: 'Полный цикл',
    description: 'От разработки концепции до монтажа и сопровождения пространства.',
    Icon: CycleIcon,
  },
  {
    title: 'По всей России',
    description:
      'Проектируем, производим и реализуем проекты в регионах России любой сложности.',
    Icon: RussiaIcon,
  },
];

const faqItems = [
  {
    question: 'Сколько стоит создание пространства?',
    answer:
      'Стоимость зависит от площади, состояния помещения, состава работ, материалов и сроков. После брифа мы готовим предварительную оценку и предлагаем несколько вариантов реализации.',
  },
  {
    question: 'Как долго длится проект?',
    answer:
      'Небольшой офис можно подготовить за 1-3 месяца. Более сложные проекты с проектированием, производством мебели и инженерными работами обычно занимают от 3 месяцев.',
  },
  {
    question: 'Можно ли заказать только концепцию без реализации?',
    answer:
      'Да, мы можем разработать концепцию, планировку, дизайн и техническое задание отдельно. При необходимости после этого подключаем производство и ремонт.',
  },
  {
    question: 'Делаете ли вы мультимедиа?',
    answer:
      'Да, проектируем мультимедийные зоны, интегрируем экраны, интерактивные панели, звук, свет и контентные сценарии.',
  },
  {
    question: 'Работаете ли вы с нестандартными помещениями?',
    answer:
      'Да, работаем с помещениями сложной формы, ограничениями по инженерии, действующими офисами и объектами с особыми требованиями к срокам.',
  },
  {
    question: 'Работаете ли вы с государственными заказчиками?',
    answer:
      'Да, у нас есть опыт работы с крупными организациями и проектами, где важны документация, согласования, сроки и прозрачность процессов.',
  },
  {
    question: 'Где вы работаете?',
    answer:
      'Работаем по всей России. Производство находится в Москве, а монтажные команды выезжают на площадки в регионах.',
  },
];

type OfficeProject = {
  title: string;
  description: string;
  exhibition: string;
  type: string;
  year: string;
  cover: string;
  href: string;
};

const officeProjectSlugs = ['kontrastnyj-open-space', 'mnogozonal-nyj-ofis'] as const;

export async function loader() {
  // Оба проекта помечены «Приватный», поэтому в общем списке их нет. Тянем по
  // слагам одним запросом: так WP отдаёт их независимо от галочки, и страница
  // не зависит от того, снимут её потом или нет.
  const projects = await getProjectsBySlugs(officeProjectSlugs);

  return {
    projects: projects ?? [],
  };
}

export function meta() {
  return getOpenGraphMeta({
    title: 'Interpro: Ремонт офисов под ключ',
    description:
      'Ремонт офисов под ключ без задержек и скрытых расходов: проектирование, производство, стройка и комплектация.',
  });
}

export default function OfficeRenovation({ loaderData }: Route.ComponentProps) {
  const selectedProjects = getOfficeProjects(loaderData.projects);

  return (
    <StartPage>
      <main className="OfficeRenovation">
        <section className="OfficeRenovation-hero">
          <VideoPlayer
            videoClassName="OfficeRenovation-heroImage"
            cover="/images/office-renovation/hero-preview.png"
            videoSources={[
              {
                src: '/videos/office-renovation/hls/hero.m3u8',
                type: 'application/x-mpegURL',
              },
            ]}
          />
        </section>

        <section className="OfficeRenovation-intro OfficeRenovation-grid px">
          <div className="OfficeRenovation-introContent">
            <h1 className="OfficeRenovation-introTitle">
              Ремонт офиса под ключ —
              <br />
              в срок, без задержек
              <br />
              и скрытых расходов
            </h1>
            <p className="OfficeRenovation-introText">
              Проектируем и делаем ремонт офисных помещений собственными силами. Собственное
              производство, штатные специалисты и точный договор помогают сдать объект в срок и
              сохранить бюджет.
            </p>
          </div>
          <Button.Arrow
            className="OfficeRenovation-orderButton"
            direction="right"
            variant="link"
            onClick={scrollToContactForm}
          >
            Обсудить стоимость
          </Button.Arrow>
        </section>

        <WhyFasterSection />
        <ProjectsSection projects={selectedProjects} />
        <CycleSection />
        <CompetenciesSection />

        <section className="OfficeRenovation-faqWrap">
          <FAQSection items={faqItems} />
        </section>

        <ContactForm
          type="service-landing"
          landingPrefix="OfficeRenovation"
          includeArea
        />
      </main>
    </StartPage>
  );
}

function WhyFasterSection() {
  return (
    <section className="OfficeRenovation-why OfficeRenovation-grid px">
      <h2>
        Почему с нами
        <br />
        быстрее
      </h2>
      <div className="OfficeRenovation-whyCards">
        {whyCards.map((card) => (
          <article className="OfficeRenovation-whyCard" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CycleSection() {
  const refCycleWrap = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = cycleSteps[activeIndex];
  const { lineRef, markerRef, numbersRef } = useCycleLineMarker(activeIndex, cycleSteps.length);

  useStickyStepCycle(refCycleWrap, cycleSteps.length, setActiveIndex);

  return (
    <section className="OfficeRenovation-cycleWrap" ref={refCycleWrap}>
      <div className="OfficeRenovation-cycle" data-cycle-sticky-panel>
        <div className="OfficeRenovation-cycleLeft">
          <div className="OfficeRenovation-cycleIntro">
            <h2>Полный цикл ремонта офисного пространства</h2>
            <p>
              Мы не просто делаем отделку. Мы создаём рабочее пространство, где архитектура,
              инженерия, мебель и бренд собираются в единую систему.
            </p>
          </div>
        </div>
        <div className="OfficeRenovation-cycleRightWrap" data-cycle-scroll-track>
          <div className="OfficeRenovation-cycleRight" data-cycle-sticky-panel>
            <div className="OfficeRenovation-cycleContent">
              <div className="OfficeRenovation-cycleStepper">
                <div
                  className="OfficeRenovation-cycleLine"
                  ref={lineRef}
                >
                  <span ref={markerRef} />
                </div>
                <div className="OfficeRenovation-cycleNumbers" ref={numbersRef}>
                  {cycleSteps.map((_, index) => (
                    <span className={activeIndex === index ? 'active' : ''} key={index}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="OfficeRenovation-cycleText" key={activeStep.title}>
                <h3>{activeStep.title}</h3>
                <p>{activeStep.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({ projects }: { projects: OfficeProject[] }) {
  return (
    <section className="OfficeRenovation-projects px">
      <h2 className="OfficeRenovation-sectionTitle">Наши проекты</h2>
      <ProjectShowcase projects={toOfficeShowcaseProjects(projects)} />
    </section>
  );
}

function OfficeProjectMobileCard({ project }: { project: OfficeProject }) {
  return (
    <article className="OfficeRenovation-mobileProjectCard">
      <h3>{project.title}</h3>
      <div className="OfficeRenovation-projectMeta">
        <ProjectMetaItem title="выставка" value={project.exhibition} />
        <ProjectMetaItem title="Тип стенда" value={project.type} />
        <ProjectMetaItem title="Год" value={project.year} />
      </div>
      <Link to={project.href} slug={project.title}>
        <OfficeProjectImage project={project} />
      </Link>
    </article>
  );
}

function OfficeProjectImage({ project }: { project: OfficeProject }) {
  return (
    <div className="OfficeRenovation-projectImage">
      <img
        src={project.cover}
        alt={`Проект ${project.title}`}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = '/images/office-renovation/rzd-project.png';
        }}
      />
    </div>
  );
}

function ProjectMetaItem({ title, value }: { title: string; value: string }) {
  return (
    <div
      className={`OfficeRenovation-projectMetaItem ${title === 'Тип стенда' ? 'isType' : ''} ${title === 'Год' ? 'isYear' : ''}`}
    >
      <span>{title}</span>
      <p>{value}</p>
    </div>
  );
}

function CompetenciesSection() {
  return (
    <section className="OfficeRenovation-competencies px">
      <h2>Компетенции, подтверждённые опытом</h2>
      <div className="OfficeRenovation-competenceCards">
        {competenceCards.map(({ title, description, Icon }) => (
          <article className="OfficeRenovation-competenceCard" key={title}>
            <Icon />
            <div className="OfficeRenovation-competenceText">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
      <Swiper
        className="OfficeRenovation-competenceSwiper"
        slidesPerView="auto"
        spaceBetween={8}
        resistanceRatio={0}
      >
        {competenceCards.map(({ title, description, Icon }) => (
          <SwiperSlide className="OfficeRenovation-competenceSlide" key={title}>
            <article className="OfficeRenovation-competenceCard">
              <Icon />
              <div className="OfficeRenovation-competenceText">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function RequestForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const selectTerm = (term: string) => {
    setSelectedTerm(term);
    setIsOpen(false);
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const area = Number.parseInt(String(formData.get('area') ?? ''), 10);

    await sendLead({
      name: String(formData.get('name') ?? ''),
      company: String(formData.get('company') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      consent: isAgreementChecked,
      extraInfo: String(formData.get('project') ?? ''),
      terms: selectedTerm,
      ...(Number.isFinite(area) ? { area } : {}),
    });
  };

  return (
    <section className="OfficeRenovation-request px" id="ContactForm">
      <div className="OfficeRenovation-requestHead">
        <span>( есть идеи? )</span>
        <h2>
          Обсудим
          <br />
          ваш проект
        </h2>
        <p>Расскажите о задаче — мы свяжемся и предложим решение</p>
      </div>
      <form className="OfficeRenovation-requestForm" onSubmit={submitRequest}>
        <div className="OfficeRenovation-requestLeft">
          <Field label="Ваше имя*" name="name" />
          <Field label="Название компании*" name="company" />
          <Field label="Номер телефона*" name="phone" type="tel" />
          <Field label="Email*" name="email" type="email" />
        </div>

        <div className="OfficeRenovation-requestRight">
          <Field className="OfficeRenovation-areaField" label="Площадь помещения, м²" name="area" />

          <div
            className={`OfficeRenovation-dropdown ${isOpen ? 'active' : ''}`}
            ref={dropdownRef}
          >
            <button type="button" onClick={() => setIsOpen((value) => !value)}>
              <span>{selectedTerm || 'Примерные сроки'}</span>
              <ChevronIcon />
            </button>
            <div className="OfficeRenovation-dropdownMenu">
              {projectTerms.map((term) => (
                <button
                  className={selectedTerm === term ? 'selected' : ''}
                  type="button"
                  onClick={() => selectTerm(term)}
                  key={term}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <label className="OfficeRenovation-field OfficeRenovation-fieldProject">
            <span>Кратко опишите проект</span>
            <textarea name="project" placeholder=" " />
          </label>
        </div>

        <div className="OfficeRenovation-requestFooter">
          <Button.Arrow className="OfficeRenovation-submit" direction="right" variant="link">
            Отправить заявку
          </Button.Arrow>
          <label className={`OfficeRenovation-checkbox ${isAgreementChecked ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={isAgreementChecked}
              onChange={(event) => setIsAgreementChecked(event.target.checked)}
            />
            <span className="OfficeRenovation-checkboxBox" aria-hidden="true">
              <CheckmarkIcon className="OfficeRenovation-checkboxIcon" />
            </span>
            <span className="OfficeRenovation-checkboxText">
              Отправляя данные, Вы соглашаетесь с политикой конфиденциальности и даёте согласие
              на обработку персональных данных.
            </span>
          </label>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = 'text',
  className = '',
}: {
  label: string;
  name: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`OfficeRenovation-field ${className}`}>
      <span>{label}</span>
      <input type={type} name={name} placeholder=" " />
    </label>
  );
}

function ChevronIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.5">
        <path fillRule="evenodd" clipRule="evenodd" d="M4 9L12 17L20 9L18 7L12 13L6 7L4 9Z" fill="black" />
      </g>
    </svg>
  );
}

function getOfficeProjects(projects: Project[]): OfficeProject[] {
  const openSpace = projects.find((project) => project.slug === 'kontrastnyj-open-space');
  const multiZone = projects.find((project) => project.slug === 'mnogozonal-nyj-ofis');

  return [
    projectToOfficeCard(openSpace) ?? {
      title: 'Контрастный Open Space',
      description: '',
      exhibition: '',
      type: '',
      year: '',
      cover: 'https://api.interpro.pro/wp-content/uploads/2026/07/oblozka-1.jpeg.webp',
      href: '/projects/kontrastnyj-open-space',
    },
    projectToOfficeCard(multiZone) ?? {
      title: 'Многозональный офис',
      description: '',
      exhibition: '',
      type: '',
      year: '',
      cover: 'https://api.interpro.pro/wp-content/uploads/2026/07/oblozka.jpeg.webp',
      href: '/projects/mnogozonal-nyj-ofis',
    },
  ];
}

function toOfficeShowcaseProjects(projects: OfficeProject[]): ShowcaseProject[] {
  return projects.map((project, index) => ({
    id: index + 1,
    slug: project.href.split('/').filter(Boolean).at(-1) ?? project.title,
    title: project.title,
    description: project.description,
    image: project.cover,
    typeStand: project.type,
    year: project.year,
    nameExhibition: project.exhibition,
    link: project.href,
    // Описание сейчас не выводим — карточка как на главной. Вариант оставлен:
    // достаточно вернуть true, чтобы вместо тегов снова показывалось описание.
    descriptionOnly: false,
  }));
}

function projectToOfficeCard(project?: Project): OfficeProject | null {
  if (!project) return null;

  // Офисные проекты не привязаны к выставке: у них нет ни выставки, ни типа
  // стенда, ни года. Подставлять сюда заглушки нельзя — карточка показала бы
  // чужие данные, поэтому отдаём пустое, а ProjectCard сам скроет такие теги.
  return {
    title: cleanText(project.payload.title),
    description: cleanText(project.payload.about),
    exhibition: project.payload.meta.exhibition?.map(({ name }) => name).join(', ') ?? '',
    type: project.payload.meta.type_tax?.map(({ name }) => name).join(', ') ?? '',
    year: project.payload.meta.year?.name ?? '',
    cover: project.payload.cover || '/images/office-renovation/rzd-project.png',
    href: `/projects/${project.slug}`,
  };
}

function cleanText(value = '') {
  // \u041c\u044f\u0433\u043a\u0438\u0439 \u043f\u0435\u0440\u0435\u043d\u043e\u0441 (U+00AD) \u043d\u0435 \u0432\u044b\u0440\u0435\u0437\u0430\u0435\u043c: \u0432 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f\u0445 \u043f\u0440\u043e\u0435\u043a\u0442\u043e\u0432 \u043e\u043d \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u043b\u0435\u043d
  // \u0432\u0440\u0443\u0447\u043d\u0443\u044e, \u0447\u0442\u043e\u0431\u044b \u0434\u043b\u0438\u043d\u043d\u043e\u0435 \u0441\u043b\u043e\u0432\u043e \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u0438\u043b\u043e\u0441\u044c \u0432 \u043d\u0443\u0436\u043d\u043e\u043c \u043c\u0435\u0441\u0442\u0435. \u0421\u0438\u043c\u0432\u043e\u043b \u043d\u0435\u0432\u0438\u0434\u0438\u043c,
  // \u043f\u043e\u043a\u0430 \u043f\u0435\u0440\u0435\u043d\u043e\u0441 \u043d\u0435 \u043f\u043e\u043d\u0430\u0434\u043e\u0431\u0438\u0442\u0441\u044f \u2014 \u0442\u0430\u043a \u0436\u0435 \u044d\u0442\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u043d\u0430 /projects.
  return decodeUnicodeEscapes(value).trim();
}
