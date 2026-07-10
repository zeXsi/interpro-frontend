import './styles.css';

import ArrowIcon from 'assets/icons/arrow.svg?react';
import CheckmarkIcon from 'assets/icons/checkmark.svg?react';
import { sendLead } from 'api/form';
import { getProjects } from 'api/projects/projects.api';
import type { Project } from 'api/projects/projects.types';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type RefObject,
} from 'react';
import { getOpenGraphMeta } from 'shared/seo/meta';
import StartPage from 'shared/components/StartPage';
import Link from 'shared/components/Link';
import Button from 'shared/components/Button';
import FAQSection from 'shared/sections/FAQSection';
import { lenisManager } from 'shared/utils/lenis';
import toFormatNames from 'shared/utils/toFormatNames';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';
import useEvent from '@qtpy/use-event';
import useRefMap from '@qtpy/use-ref-map';
import { useDebouncedUpdate } from 'shared/hooks/useDebouncedUpdate';
import { useStickyStepCycle } from 'shared/hooks/useStickyStepCycle';

import type { Route } from './+types';

const MUSEUM_PROJECT_LINKS = [
  '/projects/imperia-klimata',
  '/projects/futuruss',
  '/projects/novatek',
];

const PROJECT_DESCRIPTION_MAX_PARAGRAPHS = 4;

const cycleSteps = [
  {
    title: 'Концепция',
    description: 'Разрабатываем идею пространства, сценарий посещения и структуру экспозиции',
  },
  {
    title: 'Дизайн',
    description: 'Создаём архитектуру, навигацию и визуальную концепцию',
  },
  {
    title: 'Проектирование',
    description: 'Готовим чертежи, спецификации и инженерные решения для производства',
  },
  {
    title: 'Производство',
    description: 'Изготавливаем конструкции, витрины, мебель и мультимедийные элементы',
  },
  {
    title: 'Монтаж',
    description: 'Собираем пространство на площадке и подключаем все системы',
  },
  {
    title: 'Запуск',
    description: 'Проверяем сценарии работы, сдаём проект и сопровождаем открытие',
  },
];

const competenceCards = [
  {
    title: 'Собственное производство на ЦК',
    description:
      'Проектируем, производим и собираем элементы пространства на собственной производственной базе.',
    Icon: BoxIcon,
  },
  {
    title: 'Работаем с 2017 года',
    description:
      'Накопили опыт в выставочных, музейных и брендовых пространствах разного масштаба.',
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
      'Контролируем качество процессов проектирования, производства и монтажа.',
    Icon: CertificateIcon,
  },
  {
    title: 'Полный цикл',
    description:
      'Берём на себя концепцию, дизайн, производство, мультимедиа, логистику и монтаж.',
    Icon: CycleIcon,
  },
  {
    title: 'По всей России',
    description:
      'Проектируем и реализуем музейные пространства в Москве, регионах и на выездных площадках.',
    Icon: RussiaIcon,
  },
];

const museumFaqItems = [
  {
    question: 'Сколько стоит создание пространства?',
    answer:
      'Стоимость зависит от площади, сценария, состава мультимедиа, количества конструкций и сроков. После брифа мы готовим предварительную оценку и предлагаем несколько вариантов реализации.',
  },
  {
    question: 'Как долго длится проект?',
    answer:
      'Небольшое пространство можно подготовить за 1-3 месяца. Более сложные музейные проекты с производством, мультимедиа и монтажом обычно занимают от 3 месяцев.',
  },
  {
    question: 'Можно ли заказать только концепцию без реализации?',
    answer:
      'Да, мы можем разработать концепцию, сценарий, дизайн и техническое задание отдельно. При необходимости после этого подключаем производство и монтаж.',
  },
  {
    question: 'Делаете ли вы мультимедиа?',
    answer:
      'Да, проектируем мультимедийные зоны, интегрируем экраны, интерактивные панели, звук, свет и контентные сценарии.',
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

const projectTerms = ['до 1 месяца', '1-3 месяца', 'от 3 месяцев', 'пока не определены'];

const creationCards = [
  {
    title: 'Корпоративный музей',
    description: 'История бренда, предприятия или организации в виде постоянной экспозиции',
  },
  {
    title: 'Центр посетителей',
    description: 'Пространство для демонстрации технологий, продуктов и достижений клиентам и партнёрам.',
  },
  {
    title: 'Образовательная среда',
    description: 'Экспозиции для учебных центров, университетов и научных институтов',
  },
  {
    title: 'Арт-выставка',
    description: 'Временные и постоянные выставки современного искусства и авторских проектов',
  },
  {
    title: 'Иммерсивное шоу',
    description: 'Пространства для фантазии, сказочных и событийных иммерсивных форматов',
  },
  {
    title: 'Брендовое пространство',
    description: 'Интерьер как медиа — для шоурумов, флагманских точек и флоатинг-форматов',
  },
];

export async function loader() {
  const projects = await getProjects();
  return {
    projects: projects ?? [],
  };
}

export function meta() {
  return getOpenGraphMeta({
    title: 'Interpro: музейные пространства',
    description:
      'Проектируем и создаём музейные пространства под ключ: от концепции до монтажа собственными силами.',
  });
}

export default function MuseumSpaces({ loaderData }: Route.ComponentProps) {
  const selectedProjects = getSelectedProjects(loaderData.projects);
  const creationScrollRef = useRef<HTMLDivElement>(null);
  const [creationScrollState, setCreationScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const scrollToContactForm = () => {
    if (typeof document === 'undefined') return;

    const element = document.querySelector<HTMLElement>('#ContactForm');

    const lenis = lenisManager.state.v;
    if (lenis) {
      lenis.scrollTo(element ?? document.body.scrollHeight, { offset: -120, duration: 2 });
      return;
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const scrollCreationCards = (direction: 'left' | 'right') => {
    creationScrollRef.current?.scrollBy({
      left: direction === 'left' ? -372 : 372,
      behavior: 'smooth',
    });
  };

  const updateCreationScrollState = () => {
    const element = creationScrollRef.current;
    if (!element) return;

    const maxScrollLeft = element.scrollWidth - element.clientWidth;

    setCreationScrollState({
      canScrollLeft: element.scrollLeft > 0,
      canScrollRight: element.scrollLeft < maxScrollLeft - 1,
    });
  };

  useEffect(() => {
    const element = creationScrollRef.current;
    if (!element) return;

    updateCreationScrollState();
    element.addEventListener('scroll', updateCreationScrollState, { passive: true });
    window.addEventListener('resize', updateCreationScrollState);

    return () => {
      element.removeEventListener('scroll', updateCreationScrollState);
      window.removeEventListener('resize', updateCreationScrollState);
    };
  }, []);

  return (
    <StartPage>
      <main className="MuseumSpaces">
        <section className="MuseumSpaces-hero">
          <video
            className="MuseumSpaces-heroVideo"
            src="/videos/museum-spaces/hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Музейное пространство Interpro"
          />
        </section>

        <section className="MuseumSpaces-intro MuseumSpaces-grid px">
          <div className="MuseumSpaces-introLeft">
            <h1 className="MuseumSpaces-introTitle">
              Проектируем и создаём музейные пространства под ключ
            </h1>
            <button className="MuseumSpaces-orderButton" type="button" onClick={scrollToContactForm}>
              <span>обсудить проект</span>
              <ArrowIcon />
            </button>
          </div>
          <p className="MuseumSpaces-introText">
            Создаём пространства, в&nbsp;которых история, идеи и&nbsp;образы становятся частью
            живого опыта посетителя. От&nbsp;концепции до&nbsp;монтажа&nbsp;— собственными силами
          </p>
        </section>

        <section className="MuseumSpaces-create">
          <div className="MuseumSpaces-createHead px">
            <h2 className="MuseumSpaces-createTitle">( Что мы создаём )</h2>
            <div className="MuseumSpaces-createControls">
              <button
                type="button"
                aria-label="Предыдущие карточки"
                disabled={!creationScrollState.canScrollLeft}
                onClick={() => scrollCreationCards('left')}
              >
                <CreationArrowIcon direction="left" />
              </button>
              <button
                type="button"
                aria-label="Следующие карточки"
                disabled={!creationScrollState.canScrollRight}
                onClick={() => scrollCreationCards('right')}
              >
                <CreationArrowIcon direction="right" />
              </button>
            </div>
          </div>
          <div className="MuseumSpaces-createScroll horizon-scroll" ref={creationScrollRef}>
            <div className="MuseumSpaces-createCards">
              {creationCards.map((card, index) => (
              <article className="MuseumSpaces-createCard" key={card.title}>
                <CreationCardIcon index={index} />
                <div className="MuseumSpaces-createCardText">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </article>
              ))}
            </div>
          </div>
        </section>

        <section className="MuseumSpaces-projects px">
          <h2 className="MuseumSpaces-sectionTitle">Наши проекты</h2>
          <MuseumProjectsList projects={selectedProjects} />
        </section>

        <MuseumCycleSection />

        <MuseumCompetenciesSection />

        <section className="MuseumSpaces-faqWrap">
          <FAQSection items={museumFaqItems} />
        </section>

        <MuseumRequestForm />
      </main>
    </StartPage>
  );
}

function CreationCardIcon({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M3.359 12.952h41.27L23.994 3 3.36 12.952ZM45 15.14H3v3.38h42v-3.38ZM45 41.617H3v3.378h42v-3.378ZM13.329 20.617H6.664v18.991h6.665V20.617ZM27.384 20.617h-6.665v18.991h6.665V20.617ZM41.345 20.617H34.68v18.991h6.665V20.617Z" fill="black" /></svg>;
    case 1:
      return <svg width="48" height="48" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M5.861 27.807c10.812-1.495 21.572-1.491 32.282 0v11.352h-3.572v-5.387a1.97 1.97 0 0 0-3.938 0v5.387h-3.128v-5.387a1.97 1.97 0 0 0-3.938 0v5.387h-3.128v-5.387a1.97 1.97 0 0 0-3.938 0v5.387h-3.128v-5.387a1.97 1.97 0 0 0-3.938 0v5.387H5.863V27.807ZM3.906 40.408h36.19v1.842H3.907v-1.842ZM5.861 2.862c5.568-.77 11.124-1.143 16.665-1.119l1.883 11.249c-1.323-.026-2.648-.031-3.972-.013V8.827a1.97 1.97 0 0 0-3.938 0v4.269c-1.043.048-2.086.112-3.128.187V8.827a1.97 1.97 0 0 0-3.938 0v4.811c-1.191.127-2.382.271-3.572.435V2.863ZM5.861 15.334c10.812-1.495 21.572-1.491 32.282 0v11.21c-1.208-.166-2.417-.313-3.626-.443v-4.76a1.97 1.97 0 0 0-3.938 0v4.407a77.45 77.45 0 0 0-3.128-.186v-4.22a1.97 1.97 0 0 0-3.938 0v4.106c-1.043-.013-2.085-.012-3.128.002v-4.109a1.97 1.97 0 0 0-3.938 0v4.229c-1.043.049-2.086.113-3.128.19v-4.419a1.97 1.97 0 0 0-3.938 0v4.774a75.848 75.848 0 0 0-3.52.429V15.334Z" fill="black" /></svg>;
    case 2:
      return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M27.18 11.19V5.952A.95.95 0 0 0 26.237 5h-7.551a.95.95 0 0 0-.944.952v5.238h9.438ZM17.742 13.095V32.62h9.438V13.095h-9.438Zm2.36 15.238a.95.95 0 0 1 .944-.952h2.36a.95.95 0 1 1 0 1.905h-2.36a.95.95 0 0 1-.944-.952ZM17.742 34.524h9.438v3.81a.95.95 0 0 1-.944.952h-7.551a.95.95 0 0 1-.944-.952v-3.81ZM15.854 34.524v3.81a.95.95 0 0 1-.944.952H9.247a.95.95 0 0 1-.944-.952v-3.81h7.551ZM15.854 32.62v-4.762H8.303v4.762h7.551ZM15.854 25.952V12.143a.95.95 0 0 0-.944-.952H9.247a.95.95 0 0 0-.944.952v13.81h7.551ZM39.142 21.745l.816 4.674-7.437 1.322-.817-4.672 7.438-1.324ZM40.286 28.295l-7.437 1.322 1.437 8.226a.95.95 0 0 0 1.095.774l5.576-.993a.95.95 0 0 0 .766-1.102l-1.437-8.227ZM38.814 19.869l-7.438 1.324-1.597-9.143a.95.95 0 0 1 .767-1.102l5.575-.993a.95.95 0 0 1 1.095.774l1.598 9.14ZM5.944 41.19a.95.95 0 0 0-.944.953V43a.95.95 0 0 0 .944.952h37.112A.95.95 0 0 0 44 43v-.857a.95.95 0 0 0-.944-.952H5.944Z" fill="black" /></svg>;
    case 3:
      return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M9.835 17.32a6.39 6.39 0 0 1 11.082.003l4.824 8.283 3.343-5.758a6.39 6.39 0 0 1 11.081 0l4.085 7.027V5.732A2.74 2.74 0 0 0 41.5 3H5.75A2.74 2.74 0 0 0 3 5.732v23.335l4.835-11.747ZM26.375 7.439a3.781 3.781 0 1 1 0 7.562 3.781 3.781 0 0 1 0-7.562Zm0 5.463a1.719 1.719 0 1 0 0-3.438 1.719 1.719 0 0 0 0 3.438ZM43.357 29.436l-4.978-8.564a4.47 4.47 0 0 0-7.509 0l-3.941 6.788 2.84 4.876c.095.162.123.338.122.513H41.5a2.74 2.74 0 0 0 2.75-2.732v-.369a1 1 0 0 0-.893-.512ZM24.85 28.18a2.114 2.114 0 0 1-.054-.107l-5.666-9.728a4.47 4.47 0 0 0-7.508-.002L3.976 31.486a1.087 1.087 0 0 1-.47.401 2.744 2.744 0 0 0 2.244 1.162h21.936L24.85 28.18ZM17.3 35.098l-2.296 9.123a1.033 1.033 0 0 1-2.008-.492l2.173-8.631H17.3ZM33.498 44.973a1.03 1.03 0 0 1-1.252-.752l-2.296-9.123h2.131l2.173 8.631a1.03 1.03 0 0 1-.756 1.244ZM31.875 39.537h-16.5a1.025 1.025 0 1 1 0-2.05h16.5a1.025 1.025 0 1 1 0 2.05Z" fill="black" /></svg>;
    case 4:
      return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M33.53 17.52S21.73 16.756 20.059 3.75C18.387 16.755 6.59 17.52 6.59 17.52s11.798.763 13.47 13.77c1.67-13.007 13.47-13.77 13.47-13.77ZM19.38 35.495s-7.501-.486-8.565-8.755c-1.062 8.269-8.565 8.755-8.565 8.755s7.501.486 8.565 8.755c1.063-8.269 8.565-8.755 8.565-8.755ZM45 29.989s-7.503-.486-8.565-8.755c-1.063 8.269-8.565 8.755-8.565 8.755s7.501.486 8.565 8.755C37.497 30.475 45 29.989 45 29.989Z" fill="black" /></svg>;
    default:
      return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 27.749 42.772 35.298l.152.051H43L24 43 5 35.349h.127l.101-.051L24 27.75ZM24 30.452l-12.185 4.897L24 40.246l12.185-4.897L24 30.452ZM23.367 5v21.423l.025.153v.05l-5.725 2.296V18.797c0-.454-.112-.9-.327-1.3a2.742 2.742 0 0 0-2.16-1.42 2.744 2.744 0 0 0-1.313.22 5.733 5.733 0 0 0-3.775 5.381l-.025.46v9.844L5 34.023V12.396L23.367 5ZM24.633 5 43 12.396v21.627l-18.392-7.396.025-.102V5ZM29.7 14.946v7.651l7.6 3.188v-7.651l-7.6-3.188ZM15.133 21.96c.71 0 1.267.56 1.267 1.275 0 .714-.557 1.275-1.267 1.275s-1.266-.561-1.266-1.275c0-.714.557-1.275 1.266-1.275Z" fill="black" /><path d="M24 30.452 11.815 35.349 24 40.246l12.185-4.897L24 30.452Z" fill="black" /></svg>;
  }
}

function CreationArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  const path = direction === 'left'
    ? 'M13.164 8.288a1.091 1.091 0 0 0-1.543 0L4.68 15.23a1.091 1.091 0 0 0 0 1.543l6.942 6.943a1.091 1.091 0 0 0 1.543-1.543l-5.08-5.08h20.638V14.91H8.083l5.08-5.08a1.091 1.091 0 0 0 0-1.543Z'
    : 'M19.918 8.288a1.091 1.091 0 0 1 1.543 0l6.942 6.943a1.091 1.091 0 0 1 0 1.543l-6.942 6.943a1.091 1.091 0 0 1-1.543-1.543l5.08-5.08H4.36V14.91h20.639l-5.08-5.08a1.091 1.091 0 0 1 0-1.543Z';

  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path opacity="0.5" d={path} fill="black" /></svg>;
}

function MuseumCompetenciesSection() {
  return (
    <section className="MuseumSpaces-competencies px">
      <h2>Компетенции, подтверждённые опытом</h2>
      <div className="MuseumSpaces-competenceScroll horizon-scroll">
        <div className="MuseumSpaces-competenceCards">
          {competenceCards.map(({ title, description, Icon }) => (
            <article className="MuseumSpaces-competenceCard" key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MuseumRequestForm() {
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

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const selectTerm = (term: string) => {
    setSelectedTerm(term);
    setIsOpen(false);
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await sendLead({
      name: String(formData.get('name') ?? ''),
      company: String(formData.get('company') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      consent: isAgreementChecked,
      extraInfo: String(formData.get('project') ?? ''),
      terms: selectedTerm,
    });
  };

  return (
    <section className="MuseumSpaces-request px" id="ContactForm">
      <div className="MuseumSpaces-requestHead">
        <span>( есть идеи? )</span>
        <h2>
          Обсудим
          <br />
          ваш проект
        </h2>
        <p>Расскажите о задаче — мы свяжемся и предложим решение</p>
      </div>
      <form className="MuseumSpaces-requestForm" onSubmit={submitRequest}>
        <div className="MuseumSpaces-requestLeft">
          <label className="MuseumSpaces-field">
            <span>Ваше имя*</span>
            <input type="text" name="name" placeholder=" " />
          </label>
          <label className="MuseumSpaces-field">
            <span>Название компании*</span>
            <input type="text" name="company" placeholder=" " />
          </label>
          <label className="MuseumSpaces-field">
            <span>Номер телефона*</span>
            <input type="tel" name="phone" placeholder=" " />
          </label>
          <label className="MuseumSpaces-field">
            <span>Email*</span>
            <input type="email" name="email" placeholder=" " />
          </label>
        </div>

        <div className="MuseumSpaces-requestRight">
          <div className={`MuseumSpaces-dropdown ${isOpen ? 'active' : ''}`} ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen((value) => !value)}>
              <span>{selectedTerm || 'Примерные сроки'}</span>
              <ChevronIcon />
            </button>
            <div className="MuseumSpaces-dropdownMenu">
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

          <label className="MuseumSpaces-field MuseumSpaces-fieldProject">
            <span>Кратко опишите проект</span>
            <textarea name="project" placeholder=" " />
          </label>
        </div>

        <div className="MuseumSpaces-requestFooter">
          <Button.Arrow className="MuseumSpaces-submit" direction="right" variant="link">
            Отправить заявку
          </Button.Arrow>
          <label className={`MuseumSpaces-checkbox ${isAgreementChecked ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={isAgreementChecked}
              onChange={(event) => setIsAgreementChecked(event.target.checked)}
            />
            <span className="MuseumSpaces-checkboxBox" aria-hidden="true">
              <CheckmarkIcon className="MuseumSpaces-checkboxIcon" />
            </span>
            <span className="MuseumSpaces-checkboxText">
              Отправляя данные, Вы соглашаетесь с политикой конфиденциальности и даёте
              согласие на обработку персональных данных.
            </span>
          </label>
        </div>
      </form>
    </section>
  );
}

function MuseumCycleSection() {
  const refCycleSteps = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = cycleSteps[activeIndex];

  useStickyStepCycle(refCycleSteps, cycleSteps.length, setActiveIndex);

  return (
    <section className="MuseumSpaces-cycleWrap">
      <div className="MuseumSpaces-cycle">
        <div className="MuseumSpaces-cycleLeft">
          <div className="MuseumSpaces-cycleIntro">
            <h2>Полный цикл создания музейного пространства</h2>
            <p>
              Мы&nbsp;не&nbsp;поставляем витрины и&nbsp;конструкции. Мы&nbsp;создаём
              пространство, которое передаёт смысл. Объединяем архитектуру, производство,
              мультимедиа и&nbsp;инженерные решения в&nbsp;единое пространство
            </p>
          </div>
        </div>
        <div className="MuseumSpaces-cycleRightWrap" ref={refCycleSteps}>
          <div className="MuseumSpaces-cycleRight">
            <div className="MuseumSpaces-cycleContent">
              <div className="MuseumSpaces-cycleStepper">
                <div
                  className="MuseumSpaces-cycleLine"
                  style={
                    {
                      '--activeStep': activeIndex,
                      '--stepsCount': cycleSteps.length,
                    } as CSSProperties
                  }
                >
                  <span />
                </div>
                <div className="MuseumSpaces-cycleNumbers">
                  {cycleSteps.map((_, index) => (
                    <span className={activeIndex === index ? 'active' : ''} key={index}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="MuseumSpaces-cycleText" key={activeStep.title}>
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

function MuseumProjectsList({ projects }: { projects: Project[] }) {
  return (
    <>
      <div className="MuseumSpaces-projectsBoard">
        <MuseumProjectInfos projects={projects} />
        <div className="MuseumSpaces-projectImages">
          {projects.map((project) => (
            <MuseumProjectImage project={project} key={project.slug} />
          ))}
        </div>
      </div>
      <div className="MuseumSpaces-mobileProjectList">
        {projects.map((project) => (
          <MuseumProjectMobileCard project={project} key={project.slug} />
        ))}
      </div>
    </>
  );
}

function MuseumProjectMobileCard({ project }: { project: Project }) {
  const title = cleanText(project.payload.title);
  const exhibition = toFormatNames(project.payload.meta.exhibition);
  const typeStand = toFormatNames(project.payload.meta.type_tax);
  const year = project.payload.meta.year?.name ?? '';

  return (
    <article className="MuseumSpaces-mobileProjectCard">
      <div className="MuseumSpaces-mobileProjectText">
        <h3>{title}</h3>
      </div>
      <div className="MuseumSpaces-mobileProjectMeta">
        <ProjectMetaItem title="выставка" value={exhibition} />
        <ProjectMetaItem title="Тип стенда" value={typeStand} />
        <ProjectMetaItem title="Год" value={year} />
      </div>
      <MuseumProjectImage project={project} />
    </article>
  );
}

function MuseumProjectInfos({ projects }: { projects: Project[] }) {
  const refsInfo = useRefMap<HTMLDivElement | null>();
  const refAccumulatedHeight = useRef(0);

  const recalculateHeights = () => {
    let accumulatedHeight = 0;
    const heights: number[] = [];
    const keys = refsInfo.getAllKeys();
    const countKeys = keys.length;

    keys.forEach((key, index) => {
      const info = refsInfo.getRef(key).current;
      if (!info) return;

      info.style.setProperty('--museumProjectNewHeight', '');
      info.offsetHeight;

      const height = info.firstElementChild?.getBoundingClientRect().height ?? info.offsetHeight;
      info.style.setProperty('--museumProjectAccHeight', `${accumulatedHeight}px`);
      info.style.setProperty('--museumProjectIndex', `${index}`);

      accumulatedHeight += height;
      refAccumulatedHeight.current = accumulatedHeight;
      heights[index] = height;
    });

    let accHBefore = 0;
    keys.forEach((key, index) => {
      const info = refsInfo.getRef(key).current;
      if (!info) return;

      let accH = 0;
      for (let i = index; i < countKeys; i++) {
        accH += heights[i];
      }

      info.style.setProperty('--museumProjectNewHeight', `${accH}px`);
      info.style.setProperty('--museumProjectHeightBefore', `${accHBefore}px`);
      accHBefore = accH;
    });
  };

  const [toUpdate] = useDebouncedUpdate<void>(() => {
    recalculateHeights();
  }, 300);

  useLayoutEffect(() => {
    toUpdate();
    return toUpdate;
  }, [toUpdate]);

  useEvent('resize', () => toUpdate(), false, 'window', [toUpdate]);

  return (
    <div className="MuseumSpaces-projectInfos">
      {projects.map((project, index) => (
        <MuseumProjectInfo
          project={project}
          index={index}
          ref={refsInfo.getRef(`project_${index}`) as any}
          key={project.slug}
        />
      ))}
    </div>
  );
}

interface MuseumProjectInfoProps {
  project: Project;
  index: number;
  ref: RefObject<HTMLDivElement | null>;
}

function MuseumProjectInfo({ project, index, ref }: MuseumProjectInfoProps) {
  const title = cleanText(project.payload.title);
  const description = toProjectDescription(project.payload.about);
  const exhibition = toFormatNames(project.payload.meta.exhibition);
  const typeStand = toFormatNames(project.payload.meta.type_tax);
  const year = project.payload.meta.year?.name ?? '';
  const clIsFirst = index === 0 ? 'isFirst' : '';

  return (
    <div ref={ref} className={`MuseumSpaces-projectInfo ${clIsFirst}`}>
      <div className="MuseumSpaces-projectInfoInner">
        <div className="MuseumSpaces-projectText">
          <h3>{title}</h3>
          {description && <p className="MuseumSpaces-projectDescription">{description}</p>}
        </div>
        <div className="MuseumSpaces-projectBottom">
          <div className="MuseumSpaces-projectMeta">
            <ProjectMetaItem title="выставка" value={exhibition} />
            <ProjectMetaItem title="Тип стенда" value={typeStand} />
            <ProjectMetaItem title="Год" value={year} />
          </div>
          <Link to={`/projects/${project.slug}`} slug={title}>
            <span className="MuseumSpaces-projectLink">Смотреть проект</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MuseumProjectImage({ project }: { project: Project }) {
  const title = cleanText(project.payload.title);

  return (
    <Link to={`/projects/${project.slug}`} slug={title}>
      <div className="MuseumSpaces-projectImage">
        <img src={project.payload.cover} alt={`Проект ${title}`} loading="lazy" />
      </div>
    </Link>
  );
}

function ProjectMetaItem({ title, value }: { title: string; value?: string | number }) {
  if (!value) return null;

  return (
    <div
      className={`MuseumSpaces-projectMetaItem ${title === 'Тип стенда' ? 'isType' : ''} ${title === 'Год' ? 'isYear' : ''}`}
    >
      <span>{title}</span>
      <p>{value}</p>
    </div>
  );
}

function getSelectedProjects(projects: Project[]) {
  const slugs = MUSEUM_PROJECT_LINKS.map((link) => link.split('/').filter(Boolean).at(-1));
  const selected = slugs
    .map((slug) => projects.find((project) => project.slug === slug))
    .filter(Boolean) as Project[];

  return selected.length ? selected : projects.slice(0, 3);
}

function cleanText(value = '') {
  return decodeUnicodeEscapes(value).replace(/\u00ad/g, '').trim();
}

function toProjectDescription(value = '') {
  return cleanText(value)
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, PROJECT_DESCRIPTION_MAX_PARAGRAPHS)
    .join('\n');
}

export function BoxIcon() {
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.0076 34.7994C14.4523 35.0389 14.4523 35.4309 15.0076 35.6704L62.0097 56.2911C62.6523 56.5307 63.3596 56.5307 64.0022 56.2911L76.6646 50.7386L27.6699 29.2469L15.0076 34.7994Z" fill="black" />
      <path d="M97.722 41.4933L111.005 35.6686C111.549 35.4291 111.549 35.0372 111.005 34.7976L64.0028 14.1878C63.3622 13.9374 62.6509 13.9374 62.0103 14.1878L49.3589 19.7404L95.8057 40.1216C96.5295 40.4466 97.181 40.913 97.722 41.4933Z" fill="black" />
      <path d="M15.0047 92.2458L59.8256 111.903C59.9326 111.969 60.056 112.002 60.1812 112C60.3065 111.998 60.4286 111.96 60.5332 111.891C60.6378 111.822 60.7207 111.725 60.7721 111.61C60.8236 111.496 60.8415 111.37 60.8237 111.246V61.6389C60.8082 61.3178 60.7076 61.0066 60.5322 60.7372C60.3568 60.4678 60.113 60.2498 59.8256 60.1056L15.0047 40.448C14.8978 40.3828 14.7744 40.3494 14.6492 40.3516C14.5239 40.3538 14.4018 40.3916 14.2972 40.4605C14.1926 40.5295 14.1097 40.6267 14.0583 40.741C14.0068 40.8552 13.9889 40.9817 14.0066 41.1057V90.7125C14.0222 91.0336 14.1228 91.3448 14.2982 91.6142C14.4736 91.8836 14.7174 92.1016 15.0047 92.2458Z" fill="black" />
      <path d="M110.993 40.4483L99.408 45.5327V70.9548C99.3881 72.1209 99.0392 73.2576 98.4016 74.2342C97.764 75.2107 96.8636 75.9874 95.8041 76.4747L86.9742 80.3397C86.3068 80.6406 85.5831 80.7964 84.851 80.7969C84.1879 80.7955 83.5317 80.6618 82.9209 80.4038C82.31 80.1457 81.7568 79.7684 81.2935 79.294C80.8302 78.8195 80.4661 78.2575 80.2226 77.6406C79.9792 77.0238 79.8611 76.3646 79.8755 75.7017V54.1011L66.1787 60.1109C65.8911 60.2528 65.6467 60.4688 65.4706 60.7368C65.2946 61.0048 65.1932 61.3149 65.1771 61.6351V111.249C65.1606 111.373 65.1795 111.499 65.2316 111.613C65.2838 111.727 65.3671 111.823 65.4719 111.891C65.5767 111.96 65.6986 111.997 65.8237 111.999C65.9488 112.001 66.0719 111.967 66.1787 111.902L110.993 92.2505C111.28 92.1051 111.523 91.8867 111.699 91.6172C111.875 91.3478 111.977 91.0367 111.994 90.7154V41.1016C112.011 40.9776 111.992 40.8515 111.94 40.7378C111.887 40.6241 111.804 40.5275 111.699 40.4591C111.595 40.3908 111.473 40.3535 111.348 40.3516C111.222 40.3496 111.099 40.3832 110.993 40.4483Z" fill="black" />
      <path d="M85.228 76.3538L94.0563 72.4816C94.3428 72.3385 94.5861 72.1217 94.7613 71.8535C94.9365 71.5854 95.0373 71.2755 95.0533 70.9556V45.6314C95.0373 45.3115 94.9365 45.0016 94.7614 44.7335C94.5862 44.4653 94.3429 44.2485 94.0564 44.1053L43.9357 22.1147L33.0914 26.8724L83.2339 48.8632C83.5204 49.0064 83.7637 49.2231 83.9389 49.4913C84.1141 49.7594 84.2149 50.0693 84.2309 50.3892V75.7024C84.2138 75.8261 84.2321 75.952 84.2838 76.0657C84.3355 76.1793 84.4185 76.2759 84.523 76.3442C84.6275 76.4124 84.7493 76.4496 84.8741 76.4513C84.9989 76.453 85.1217 76.4192 85.228 76.3538Z" fill="black" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M104 96C104 102.629 98.6289 108 92 108H34C27.3711 108 22 102.629 22 96V59H104V96Z" fill="black" />
      <path d="M35 33C35 37.418 38.582 41 43 41C47.418 41 51 37.418 51 33V26H75V33C75 37.418 78.582 41 83 41C87.418 41 91 37.418 91 33V26H92C98.6289 26 104 31.3711 104 38V52H22V38C22 31.3711 27.3711 26 34 26H35V33Z" fill="black" />
      <path d="M43 18C45.2109 18 47 19.7891 47 22V33C47 35.2109 45.2109 37 43 37C40.7891 37 39 35.2109 39 33V22C39 19.7891 40.7891 18 43 18Z" fill="black" />
      <path d="M83 18C85.2109 18 87 19.7891 87 22V33C87 35.2109 85.2109 37 83 37C80.7891 37 79 35.2109 79 33V22C79 19.7891 80.7891 18 83 18Z" fill="black" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M94.1729 81.4971H105.823V95H0V81.4971H11.6504V56.4209H43.2031V81.4971H55.3389V0H94.1729V81.4971Z" fill="black" transform="translate(10 15)" />
    </svg>
  );
}

export function CertificateIcon() {
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M63.4018 12.8906L68.9217 18.6631L75.1876 14.8148L78.1713 21.4754L84.8848 19.6992L85.7799 27.5439L93.2393 28.136L91.7474 35.3886L98.1625 37.9048L94.2836 44.7134L99.9527 49.5978L94.4328 54.4822L98.1625 60.2547L90.8523 63.511L92.6425 70.7637L85.3323 71.5037L84.8848 78.3123L77.127 76.8322L74.1433 83.6408L67.8774 79.9405L63.4018 85.2689L58.031 79.3484L51.616 83.1967L48.6322 76.5362L42.0679 78.3123L41.0236 70.4676L33.7134 69.8756L35.2053 62.771L28.7903 60.2547L32.6691 53.2981L27 48.5617L32.5199 43.6773L28.7903 37.9048L35.9513 34.5005L34.3102 27.3959L41.6204 26.5078L42.0679 19.6992L49.8257 21.3274L52.6603 14.5188L59.0753 18.0711L63.4018 12.8906ZM46.9911 79.2004L44.9025 113.095L63.9985 96.8139L84.1388 113.095L80.26 79.4964L77.127 78.9044L74.1433 85.713L67.8774 82.0126L63.4018 87.3411L58.031 81.5686L51.616 85.4169L48.6322 78.7564L46.9911 79.2004Z" fill="black" />
    </svg>
  );
}

export function CycleIcon() {
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M105.997 89.6662L86.4566 98.9201L81.7192 77.8229L88.5325 81.0626C90.8021 76.8407 92.0036 72.0542 92.0036 67.2247C92.0036 59.5389 89.0492 52.275 83.683 46.7782C80.6726 43.6936 77.0894 41.3542 73.1703 39.8594L84.7897 30.5623C87.882 32.4278 90.7589 34.6939 93.3472 37.3433C101.19 45.3824 105.509 55.9932 105.509 67.2294C105.509 74.1311 103.816 80.9725 100.634 87.0561L106 89.6754L105.997 89.6662ZM33.4762 67.2202C33.4762 59.5343 36.4306 52.2705 41.7968 46.7737C47.0209 41.4229 53.9631 38.3167 61.4007 37.985V44.0208L78.2825 30.5104L61.4007 17V24.4617C50.2939 24.802 39.9104 29.3687 32.1321 37.3346C24.5867 45.0678 20.3142 55.1882 20 65.9491L33.7771 71.3343C33.5833 69.9729 33.4762 68.5988 33.4762 67.2202ZM77.3057 92.6164C72.8957 95.1539 67.8611 96.4937 62.736 96.4937C57.6153 96.4937 52.5765 95.1539 48.1662 92.6164C43.9628 90.1952 40.4054 86.7401 37.8472 82.6171L43.7216 79.2267L23.5874 71.3557L20.3315 92.733L26.1542 89.3899C29.8967 95.5592 35.181 100.724 41.434 104.322C47.8898 108.036 55.254 110 62.7346 110C70.0216 110 77.192 108.122 83.527 104.593L80.3788 90.5745C79.4012 91.3155 78.3719 92.0005 77.3038 92.6123L77.3057 92.6164Z" fill="black" />
    </svg>
  );
}

export function RussiaIcon() {
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M118.615 66.5079L118.643 66.4802L116.28 57.884C116.28 57.884 116.209 57.7397 116.155 57.7008L114.72 56.6076C114.72 56.6076 114.579 56.5354 114.514 56.5354C114.433 56.5354 114.346 56.5632 114.291 56.6187L113.927 56.9461L113.286 56.763L112.135 52.9116V52.6564L112.846 50.0426L113.819 48.7329C113.873 48.6497 113.9 48.5498 113.889 48.4499L112.83 42.5951L112.955 42.1845L113.107 42.0402C113.216 41.9403 113.259 41.7849 113.189 41.6406C113.134 41.513 113.009 41.4297 112.868 41.4297H112.852L109.962 41.6018L109.516 41.2632L108.794 37.5672L108.989 37.1122L112.064 35.1366C112.173 35.0644 112.232 34.9368 112.232 34.8091C112.232 34.6815 112.135 34.565 112.026 34.5095L111.401 34.2264L111.135 33.8546L111.092 33.3274C111.092 33.1831 110.983 33.0555 110.853 33.0166C110.809 33.0166 110.782 33 110.744 33C110.646 33 110.548 33.0444 110.478 33.1276L109.799 33.9379C109.799 33.9379 109.717 34.0933 109.717 34.182V35.0034L103.432 38.1277C103.432 38.1277 103.334 38.1999 103.291 38.2387L101.818 40.3974C101.737 40.5251 101.737 40.6805 101.818 40.797L101.96 40.9968C101.96 40.9968 102.014 41.0689 102.057 41.0967L102.682 41.524L102.726 42.1788L99.1781 45.3753L92.0561 48.261L91.0837 48.3165C90.9316 48.3165 90.7904 48.4442 90.7632 48.5995L90.6546 49.21L90.1819 49.5485L88.7478 49.321H88.6935C88.6935 49.321 88.5414 49.3487 88.4871 49.3931C88.4165 49.4486 88.3621 49.5374 88.3458 49.6373L88.0253 52.2678L87.6233 52.6507L86.4119 52.7229C86.4119 52.7229 86.2706 52.7506 86.2163 52.795L85.4666 53.3611C85.4666 53.3611 85.3417 53.5054 85.3254 53.5886L85.2005 54.3544L84.5866 54.6264L80.9849 52.1125C80.9849 52.1125 80.86 52.057 80.7893 52.057C80.7622 52.057 80.7187 52.057 80.6916 52.0737L71.891 54.7874L71.4998 54.2214L73.5153 51.5521C73.5153 51.5521 73.5859 51.4078 73.5859 51.3412V49.8206C73.5859 49.6375 73.4446 49.4821 73.2654 49.4655L71.6247 49.3101L71.3205 49.1547L70.5437 48.1724C70.4731 48.0892 70.3916 48.0448 70.2775 48.0448C70.1797 48.0448 70.0819 48.0892 70.0276 48.1558L69.4409 48.8106L66.9909 50.2756L65.084 50.6308C65.0134 50.6308 64.9428 50.6752 64.9048 50.7307L62.5254 53.2002L62.1777 53.3445L60.5642 53.2169H60.537C60.4393 53.2169 60.3415 53.2613 60.2708 53.3279C60.2002 53.4111 60.1731 53.5276 60.1894 53.6386L61.1781 58.4279L61.0368 58.8552L60.298 59.51L59.657 59.3103L58.891 56.4134C58.8475 56.258 58.7117 56.1414 58.5596 56.1414H58.5162C58.5162 56.1414 58.4075 56.1692 58.364 56.1969L57.5981 56.2968L56.9027 55.1037C56.8484 55.0038 56.7343 54.9316 56.6094 54.9316C56.5007 54.9316 56.3866 54.9871 56.316 55.087L55.2567 56.6908C55.2023 56.7741 55.186 56.8906 55.2132 56.9905L56.5768 61.5521L56.0226 61.7797L55.1045 59.904C55.0611 59.8041 54.9796 59.7319 54.8655 59.7208H54.784C54.784 59.7208 54.6319 59.7486 54.5776 59.793L51.6875 62.0516H51.1606L49.9383 61.0304L50.0361 60.3479L52.0244 59.5543C52.1059 59.5099 52.1928 59.4433 52.2199 59.3545L54.6808 53.0613C54.7351 52.9171 54.6808 52.7506 54.5722 52.6507C54.5178 52.6063 54.4309 52.5785 54.3657 52.5785C54.2951 52.5785 54.2136 52.6063 54.1593 52.6507L52.6437 53.8438C52.6437 53.8438 52.5459 53.9437 52.535 54.0158L51.1443 58.067L50.4653 58.1503L48.2379 54.7817C48.1836 54.6985 48.0858 54.6374 47.9717 54.6263H47.9445C47.8468 54.6263 47.7653 54.6707 47.6946 54.7373L47.1514 55.32L46.4832 55.1202C46.4832 55.1202 46.3854 54.9926 46.3148 54.9649L44.37 54.0991L44.1636 53.916L43.6638 53.0947C43.6095 53.0114 43.5225 52.9504 43.4248 52.9226L38.6985 52.1013L38.4921 51.4076C38.4487 51.2966 38.3672 51.1967 38.2422 51.1634H38.1607C38.0629 51.1634 37.9814 51.2078 37.9108 51.2633H37.8945L37.4654 51.3743L35.2815 50.6196C35.2815 50.6196 35.2109 50.6029 35.1729 50.6029C35.1186 50.6029 35.0751 50.6029 35.0208 50.6307L33.4888 51.3688L32.9346 51.169L32.5707 50.3754C32.5163 50.2644 32.4023 50.1756 32.2773 50.1756H32.2501C32.1415 50.1756 32.0274 50.2311 31.9568 50.331L31.734 50.6696H31.0658L30.6204 49.9426V49.4875L32.9564 44.826L33.3747 44.5818H33.4562L33.8473 44.9203L34.6839 48.3277C34.7111 48.4276 34.7817 48.5108 34.8632 48.5552L35.6672 48.9659C35.6672 48.9659 35.765 49.0103 35.8193 49.0103C35.9008 49.0103 35.9986 48.9659 36.0692 48.9104L36.8352 48.1279C36.8352 48.1279 36.9438 47.9559 36.9329 47.856L36.7374 42.6283C36.7374 42.5007 36.6668 42.3841 36.5581 42.3286L35.4716 41.7293C35.4716 41.7293 35.363 41.6849 35.3032 41.6849C35.2326 41.6849 35.1511 41.7126 35.0968 41.757L27.1002 48.0779L26.7959 48.1611L24.6392 47.9502H24.6121C24.5143 47.9502 24.4165 47.9946 24.3622 48.0612L23.2105 49.3376L22.8628 49.4819L20.152 49.271H20.1248C20.1248 49.271 20.0162 49.271 19.9727 49.3154L18.343 50.17C18.343 50.17 18.2886 50.1978 18.2615 50.2255L17.3597 51.0802C17.2619 51.1634 17.2184 51.3077 17.2619 51.4353L17.5824 52.6285L17.5553 52.9392L15.7897 56.8738L15.2193 57.0736L14.2306 56.563C14.2306 56.563 14.1328 56.5186 14.0785 56.5186C13.997 56.5186 13.9101 56.5464 13.8395 56.6185L13.633 56.8183C13.5081 56.9459 13.4809 57.1568 13.6059 57.3011L14.3555 58.2667L14.4262 58.6774L13.4918 61.6463C13.4918 61.6463 13.4646 61.7573 13.4918 61.8294L14.3827 66.3191L14.2034 66.7741L12.6443 67.8674L12.2694 67.9229L11.4491 67.6676C11.4491 67.6676 11.3785 67.6509 11.3514 67.6509C11.2807 67.6509 11.1992 67.6787 11.1449 67.7231C11.0743 67.7786 11.02 67.8674 11.0037 67.9673L10.6288 68.5666L9.11324 68.6943H8.9883L7.42917 68.2836H7.34768C7.34768 68.2836 7.19558 68.3113 7.14124 68.3557C7.05975 68.4279 7 68.5278 7 68.6388V69.8597C7 69.8597 7 69.9318 7.0163 69.9707L10.5746 80.9087C10.5746 80.9087 10.618 80.992 10.6452 81.0364L11.0092 81.4637C11.0092 81.4637 11.1613 81.5747 11.2591 81.5747C11.3569 81.5747 11.4547 81.5303 11.509 81.4637L12.9703 79.8599C12.9703 79.8599 13.0681 79.6878 13.0681 79.6046C13.0681 79.5047 13.0247 79.4215 12.9432 79.3493L12.8454 78.8221L13.557 77.2739L13.9482 77.0186H16.8003C16.9415 77.0186 17.0665 76.9353 17.1208 76.8077L17.425 76.0419C17.425 76.0419 17.4522 75.9142 17.4522 75.8421L17.1588 74.0662L17.3652 72.7732L17.588 72.4458L19.8804 71.1527L20.3965 71.2249L20.9126 71.7521L21.081 72.1516C21.1245 72.2349 21.1896 72.307 21.2766 72.3348C21.32 72.3514 21.3581 72.3625 21.4015 72.3625C21.4558 72.3625 21.4993 72.3625 21.5536 72.3181L23.0692 71.5634H23.4332L25.5193 72.4458L25.7583 72.69L26.747 75.0207C26.747 75.0207 26.8014 75.1206 26.8448 75.165L31.2398 78.7167C31.2398 78.7167 31.381 78.7888 31.4625 78.7888C31.5168 78.7888 31.5603 78.7888 31.6146 78.7611C31.7396 78.7056 31.8102 78.578 31.8102 78.4337V77.6956L32.0166 77.3127L33.8365 76.175C33.918 76.1306 33.9777 76.0474 33.9886 75.9475L34.0973 75.448L34.5862 75.1373L42.6099 76.9297L42.887 77.1406L44.9568 80.6923C45.0274 80.8033 45.136 80.8643 45.2501 80.8643H47.4068L47.8251 81.1917L49.1181 87.1187C49.1615 87.2741 49.2973 87.4017 49.4494 87.4017L50.172 87.374L50.3947 87.4294L53.0675 88.8667L53.2631 89.0665L53.5401 89.6215C53.5401 89.6215 53.5945 89.7214 53.6488 89.7491L56.0011 91.4973C56.0011 91.4973 56.126 91.5694 56.2075 91.5694H56.2618L62.6884 90.4206L63.009 90.4761L64.7907 91.6415C64.7907 91.6415 64.9157 91.697 64.9863 91.697C65.0678 91.697 65.1547 91.6693 65.2253 91.5971L66.2141 90.6426C66.2141 90.6426 66.2847 90.5594 66.2955 90.515L67.1159 88.384L67.7026 88.1731L70.9294 90.0045C70.9294 90.0045 70.9838 90.0322 71.0272 90.0489L79.6106 92.0245H79.6812C79.6812 92.0245 79.7898 92.0245 79.8333 91.9801L84.0217 89.8768L84.2608 89.8324L86.4717 90.0044H86.4989C86.6075 90.0044 86.7216 89.9489 86.7759 89.8601L87.6125 88.667C87.6125 88.667 87.6669 88.5671 87.6669 88.5227L88.0852 86.0642V85.9088L87.656 84.2884L87.8516 83.8056L89.7963 82.5569L90.0625 82.4848L94.1532 82.6846L94.5552 83.0397L94.8866 84.8877C94.9137 85.0154 94.9952 85.1153 95.1093 85.1597L100.422 87.1464C100.422 87.1464 100.504 87.1741 100.547 87.1741H100.618L102.063 86.8467C102.063 86.8467 102.188 86.7912 102.242 86.7468L103.872 84.9876L104.524 85.1985L105.246 90.1542L105.138 90.5094L104.649 91.0643C104.649 91.0643 104.594 91.1364 104.578 91.1753L104.062 92.596C103.991 92.6792 103.953 92.7958 103.964 92.8957L104.133 93.717C104.16 93.8613 104.285 93.9723 104.426 94H104.47C104.594 94 104.719 93.9279 104.774 93.8002L107.821 90.4761C107.821 90.4761 107.903 90.3318 107.919 90.2652L108.375 83.6891C108.375 83.6891 108.375 83.6058 108.359 83.5614L106.496 77.5957C106.496 77.5957 106.425 77.4514 106.355 77.4126L103.698 75.5924C103.698 75.5924 103.573 75.5369 103.503 75.5369H103.405C103.307 75.5647 103.225 75.6368 103.182 75.7367L102.807 76.5747L102.351 76.8299L100.123 76.447L99.8464 76.2639L99.3032 75.4814L99.2217 75.1429L100.471 66.9463L100.612 66.691L107.327 60.5422C107.327 60.5422 107.436 60.3868 107.436 60.2869C107.436 60.187 107.392 60.0871 107.327 60.0316L107.061 59.7763L106.919 59.5322L106.251 56.3633L106.306 56.0248L107.626 53.9215L108.321 53.8216C108.419 53.8216 108.5 53.7495 108.56 53.6773C108.614 53.6052 108.642 53.5053 108.614 53.4054L108.337 51.8016L108.489 50.6917L109.158 50.5197L110.798 52.795L110.88 53.0059L111.467 57.2956L112.537 61.9961C112.537 61.9961 112.591 62.1404 112.645 62.1792L118.067 66.8686C118.067 66.8686 118.208 66.9518 118.29 66.9518C118.36 66.9518 118.415 66.9352 118.485 66.8963C118.61 66.8131 118.681 66.6522 118.637 66.4968L118.615 66.5079Z" fill="black" />
    </svg>
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
