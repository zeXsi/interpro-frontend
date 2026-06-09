'use server';
import './styles.css';
import './detailInfo.css';
import TeamBoostSection from 'shared/sections/TeamBoostSection';
import ExpoStands from 'shared/sections/ExpoStands';
import FAQSection from 'shared/sections/FAQSection';
import WorkflowSection from 'shared/sections/WorkflowSection';
import DocOverview from 'shared/sections/DocOverview';
import Hero from 'shared/sections/Hero';
import Projects from 'shared/sections/ProjectsSection';
import AboutUsMedia from 'shared/sections/AboutUsMedia';
import ContactForm from 'shared/components/ContactForm';

import MediaSection from 'shared/sections/MediaSection';
import Footer from 'shared/sections/Footer';
import { useInView } from 'motion/react';
import { type ComponentProps, useRef, useState } from 'react';
import useBreakpoints from '@qtpy/use-breakpoints';

import ParallaxFooter from 'shared/components/ParallaxFooter';

import srcVideo2Cover from 'assets/videos/video_2/cover.jpg';
import srcVideo3Cover from 'assets/videos/video_3/cover.jpg';
import srcVideo4Cover from 'assets/videos/video_4/cover.jpg';
import srcVideo2CoverMobile from 'assets/videos/video_2/cover_mobile.jpg';
import srcVideo4CoverMobile from 'assets/videos/video_4/cover_mobile.jpg';
import StartPage from 'shared/components/StartPage';
import Subtitle from 'shared/components/Subtitle';
import Button from 'shared/components/Button';

import JsonLd from 'shared/seo/JsonLd';
import { getFaqSchema, getFeedbackReviewSchemas } from 'shared/seo/schemas';
import { sgFaqs } from 'api/faq/faq.api';
import { sgFeedbacks } from 'api/feedbacks/feedbacks.api';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { getOpenGraphMeta } from 'shared/seo/meta';

// HLS видео пути
const srcVideo2 = '/videos/video_2/hls/video.m3u8';
const srcVideo3 = '/videos/video_3/hls/video.m3u8';
const srcVideo4 = '/videos/video_4/hls/video.m3u8';
const srcVideo2Mobile = '/videos/video_2/hls/video_mobile.m3u8';
const srcVideo4Mobile = srcVideo4;
// video_3: мобилка использует те же видео и обложку что десктоп
const srcVideo3Mobile = srcVideo3;

export function meta() {
  const title =
    'Выставочные стенды под ключ в Москве | Заказать стенд для выставки в компании Interpro';
  const description =
    'Стенды для выставки на заказ от компании Interpro в Москве. Широкий спектр услуг для бизнеса и частных клиентов. Проектируем и строим выставочные стенды любого масштаба!';

  return getOpenGraphMeta({ title, description });
}

const DETAIL_INFO_SEO_CONTENT_ID = 'detail-info-seo-content';

const DetailInfoSeoPreview = (props: ComponentProps<'p'>) => {
  return (
    <p {...props}>
      <span>
        <b>Выставочный стенд</b> — инструмент коммуникации бренда, который за секунды должен
        привлечь внимание, выделить компанию среди конкурентов и создать условия для переговоров.
      </span>
    </p>
  );
};

const DetailInfoSeoIntro = (props: ComponentProps<'p'>) => {
  return (
    <p {...props}>
      <span>
        На крупной выставке посетитель проходит мимо десятков стендов — важно не просто остановить
        взгляд, но и заинтересовать настолько, чтобы человек зашел, задал вопросы, оставил контакты.
        Шаблонные решения не работают — каждый продукт, каждая отрасль требует индивидуального
        подхода.
      </span>
      <span>
        Interpro проектирует и производит выставочные стенды под ключ для российских и международных
        выставок от концепции до демонтажа. Команда работает с компаниями из разных отраслей:
        промышленность, технологии, медицина, строительство, товары народного потребления.
        Собственное производство в Москве позволяет контролировать качество на каждом этапе и
        соблюдать сроки даже для сложных эксклюзивных проектов с нестандартными конструкциями.
      </span>
    </p>
  );
};

const DetailInfoSeoContent = () => {
  return (
    <>
      <p></p>

      <p>
        <span>
          <h2>Выставочные стенды нашего производства</h2>
          Выбор конфигурации зависит от расположения, бюджета и задач. Каждый формат имеет
          преимущества в видимости и возможностях зонирования.
        </span>
        <ul>
          <li aria-level={1}>
            <span>
              <b>Линейные стенды.</b> Решение для участия с ограниченным бюджетом. Располагаются
              вдоль стены, открыты спереди. Профессиональное проектирование выставочных стендов
              позволяет организовать зону демонстрации, переговорную, место для хранения.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Угловые стенды.</b> Открыты с двух сторон, что увеличивает видимость и привлекает
              два потока посетителей. Можно создать две зоны: презентация продукта и переговоры.
              Занимают стандартное рядное место.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Стенды-полуострова.</b> Открыты с трех сторон. Идеальны для демонстрации
              крупногабаритной продукции, оборудования — посетители рассматривают с разных ракурсов.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Островные стенды.</b> Открыты со всех сторон, располагаются в центре зала.
              Максимальная видимость и статус. Позволяют реализовать сложные решения: многоуровневые
              конструкции, интерактивные зоны, сцену.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Двухэтажные стенды.</b> Для компаний, которым нужна большая площадь. Первый уровень
              для демонстрации, второй — для VIP-переговоров. Требует расчета несущих конструкций.
            </span>
          </li>
        </ul>
        <span>Interpro проектирует стенды любой конфигурации с учетом специфики отрасли.</span>
      </p>

      <p>
        <span>
          <h2>Стандартные стенды</h2>
          <b>Стандартные выставочные стенды</b> — готовые типовые решения на основе модульных
          систем, адаптированные под фирменный стиль.
        </span>
        <p></p>
        <span>
          Стандартная застройка подходит для качественного стенда в сжатые сроки с ограниченным
          бюджетом. Модульная система позволяет быстро собрать конструкцию и использовать повторно
          на других выставках.
        </span>
        <p></p>
        <b>Преимущества:</b>{' '}
        <ul>
          <li aria-level={1}>
            <span>Фиксированная стоимость — точный бюджет без скрытых доплат.</span>
          </li>
          <li aria-level={1}>
            <span>Короткие сроки — от 5 рабочих дней.</span>
          </li>
          <li aria-level={1}>
            <span>Многократное использование в течение нескольких лет.</span>
          </li>
          <li aria-level={1}>
            <span>Простая логистика и сборка за 4-6 часов.</span>
          </li>
          <li aria-level={1}>
            <span>Адаптация под фирменный стиль.</span>
          </li>
        </ul>
        <span>Стандартные стенды Interpro — баланс цены и качества для эффективного участия.</span>
      </p>

      <p>
        <span>
          <h2>Эксклюзивные выставочные стенды</h2>
          Эксклюзивные выставочные стенды проектируются индивидуально под каждого клиента с учетом
          специфики продукции, позиционирования бренда и особенностей площадки.
        </span>
        <p></p>
        <span>
          Эксклюзивная застройка — возможность реализовать уникальную концепцию, которая отражает
          философию бренда, выделиться среди конкурентов, создать запоминающееся пространство. Такой
          стенд становится максимально эффективным маркетинговым инструментом.
        </span>
        <p></p>
        <b>Разработка эксклюзивного стенда включает:</b>{' '}
        <ul>
          <li aria-level={1}>
            <span>
              <b>Концепция и дизайн-проект.</b> Наша команда изучает бренд, продукцию, целевую
              аудиторию, конкурентов на выставке. Создается визуальная идея, архитектурное решение,
              продумывается зонирование пространства, разрабатываются сценарии взаимодействия с
              посетителями. Дизайнеры создают 3D-визуализацию проекта, которая позволяет клиенту
              увидеть будущий стенд до начала производства.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Техническая документация.</b> Проект переводится в рабочую документацию: чертежи
              конструкций с размерами, спецификация материалов, схемы электрики, расчеты нагрузок.
              Документация согласовывается с организатором и проходит аккредитацию.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Производство.</b> Изготовление стендов для выставки на собственном производстве с
              использованием профессиональных материалов: металлические каркасы, панели МДФ и
              фанеры, натуральное дерево, стекло, пластик, текстиль. Для сложных форм применяется
              фрезеровка ЧПУ, лазерная резка, гибка металла. Контроль качества каждого элемента.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Индивидуальные решения.</b> Подвесные конструкции, объемные инсталляции,
              интерактивные зоны с сенсорными панелями, светодинамические системы, проекционный
              маппинг, AR/VR-технологии для виртуальной демонстрации.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Материалы и отделка.</b> Для премиальных брендов: натуральное дерево ценных пород,
              металл с порошковым покрытием, стекло, камень. Для технологичных компаний: современные
              панели МДФ, пластик, LED-панели. Отделка включает покраску с колеровкой,
              ламинирование, полноцветную печать.
            </span>
          </li>
        </ul>
        <span>
          Эксклюзивные стенды — инвестиция в имидж и долгосрочный маркетинговый инструмент.
        </span>
      </p>

      <p>
        <span>
          <h2>Этапы производства выставочных стендов под ключ</h2>
          Профессиональное производство стендов — это управляемый процесс, где каждый этап
          контролируется, чтобы стенд был готов точно к открытию выставки и полностью соответствовал
          утвержденному проекту.
        </span>
        <ol>
          <li aria-level={1}>
            <span>
              <b>Бриф и анализ.</b> Обсуждение целей участия, бюджета, сроков. Изучение продукции,
              фирменного стиля, конкурентного окружения. Анализ технического регламента площадки.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Концепция и дизайн.</b> Разработка визуальной концепции: архитектура, зонирование,
              материалы, цветовая гамма. Создание 3D-визуализации для оценки будущего стенда.
              Презентация клиенту, внесение корректировок.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Техническая документация.</b> Рабочие чертежи конструкций, спецификации материалов,
              схемы электрики. Расчет нагрузок на несущие элементы. Согласование с организатором
              выставки, получение аккредитации.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Производство.</b> Изготовление выставочных стендов на собственном производстве:
              раскрой материалов, сборка каркасов, обшивка панелями, покраска. Производство мебели,
              витрин, стоек. Подготовка графики и брендирование.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Предмонтажная сборка.</b> Контрольная сборка на производстве для проверки
              соответствия проекту и тестирования креплений.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Логистика.</b> Упаковка элементов с маркировкой. Доставка на площадку. Оформление
              пропусков.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Монтаж.</b> Застройка выставочных стендов бригадой Interpro: разметка, сборка
              каркаса, установка панелей, монтаж потолков, расстановка мебели. Подключение
              электрики, освещения, мультимедиа. Финишная отделка.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Сдача.</b> Приемка работ, проверка систем. Инструктаж команды клиента.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Сопровождение.</b> Техподдержка в течение выставки.
            </span>
          </li>
        </ol>
      </p>

      <p>
        <span>
          <h2>Цены на изготовление выставочных стендов на заказ</h2>
          Стоимость изготовления выставочных стендов на заказ формируется индивидуально для каждого
          проекта и зависит от типа конструкции, площади, сложности архитектурного решения,
          выбранных материалов и оснащения.&nbsp;
        </span>
        <p></p>
        <span>
          Выбор материалов влияет на стоимость на 30-50%: панели МДФ и ламинированные плиты
          значительно дешевле натурального дерева, стекла или металла с порошковым покрытием.
        </span>
        <p></p>
        <span>
          На итоговую цену также влияют архитектурная сложность (радиусные формы дороже прямых),
          мультимедийное оборудование (LED-экраны, интерактивные панели), изготовление мебели по
          индивидуальному проекту, система освещения (базовое или светодинамика), срочность
          реализации и логистика.
        </span>
        <p></p>
        <span>
          Interpro предоставляет детальную смету с прозрачной разбивкой по всем статьям — клиент
          понимает структуру затрат и может оптимизировать проект под бюджет.
        </span>
      </p>

      <p>
        <h2>Преимущества заказа стендов в Interpro</h2>
        <ul>
          <li aria-level={1}>
            <span>
              <b>Бесплатный дизайн-проект.</b> Interpro разрабатывает дизайн-проект без предоплаты.
              Клиент оплачивает только реализацию: производство, доставку и монтаж. Это снимает
              финансовые барьеры на этапе планирования и позволяет увидеть архитектурное решение до
              принятия решения о реализации.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Собственное производство.</b> Полный цикл производства стендов для выставки на
              собственных площадях в Москве. Контроль качества на каждом этапе.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Опыт сложных проектов.</b> Стенды любой сложности: от компактных линейных до
              островных 500+ м². Работа с ведущими брендами.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Комплексный подход.</b> Не только застройка стендов для выставок, но и полный
              спектр: проектирование, контент, организация участия, event-сервисы.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Индивидуальное проектирование.</b> Каждый стенд разрабатывается с учетом специфики
              бренда и задач участия.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Соблюдение сроков.</b> Производство с учетом жестких дедлайнов. Своевременная
              поставка, монтаж в срок.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Техническая экспертиза.</b> Знание регламентов ведущих площадок России и зарубежья.
              Проекты проходят согласование без задержек.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Работа с любыми материалами.</b> Металл, дерево, МДФ, фанера, стекло, пластик,
              текстиль. Фрезеровка, лазерная резка, гибка.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Мультимедийные решения.</b> LED-экраны, интерактивные панели, проекционное
              оборудование, VR/AR-зоны. Создание контента.
            </span>
          </li>
          <li aria-level={1}>
            <span>
              <b>Прозрачность.</b> Детализированная смета, четкие сроки, регулярные отчеты.
            </span>
          </li>
        </ul>
        <span>
          Interpro создает выставочные стенды под ключ, которые работают на бизнес-задачи:
          привлекают посетителей, создают условия для переговоров, усиливают присутствие бренда.
          Заказать стенд для выставки можно, связавшись с нами — обсудим проект и предложим решение.
        </span>
      </p>
    </>
  );
};

const DetailInfoSeo = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="DetailInfo-text">
      <DetailInfoSeoPreview className="DetailInfo-textIntro" />
      <noindex>
        <Button
          className="btn-openclose"
          variant="ghostLink"
          type="button"
          aria-expanded={isExpanded}
          aria-controls={DETAIL_INFO_SEO_CONTENT_ID}
          onClick={() => setIsExpanded((value) => !value)}
          children={isExpanded ? 'Свернуть' : 'Читать далее'}
        />
      </noindex>
      {isExpanded ? (
        <div className="DetailInfo-textExpanded" id={DETAIL_INFO_SEO_CONTENT_ID}>
          <DetailInfoSeoIntro className="DetailInfo-textIntro" />
          <DetailInfoSeoContent />
        </div>
      ) : null}
    </div>
  );
};

export default function Home() {
  useSignalValue(sgFaqs);
  useSignalValue(sgFeedbacks);

  const refProjects = useRef<HTMLDivElement>(null);
  const refFAQSection = useRef<HTMLDivElement>(null);

  const isInViewFAQSection = useInView(refFAQSection, {
    margin: '-33% 0px -33% 0px',
  });

  const isInViewProjects = useInView(refProjects, {
    margin: '-33% 0px -33% 0px',
  });

  const configMedia = useBreakpoints(
    {
      500: {
        srcVideo2,
        srcVideo3,
        srcVideo4,
        srcVideo2Cover,
        srcVideo3Cover,
        srcVideo4Cover,
        aspectRatio: '1920/1080',
      },
      0: {
        srcVideo2: srcVideo2Mobile,
        srcVideo3: srcVideo3Mobile,
        srcVideo4: srcVideo4Mobile,
        srcVideo2Cover: srcVideo2CoverMobile,
        srcVideo3Cover: srcVideo3Cover, // video_3: та же обложка что десктоп
        srcVideo4Cover: srcVideo4Cover,
        aspectRatio: '375/940',
      },
    },
    1000
  );

  return (
    <StartPage>
      <JsonLd
        data={getFaqSchema(
          sgFaqs.v.slice(0, 4).map(({ payload }) => ({
            question: payload.question,
            answer: payload.answer,
          }))
        )}
      />
      <JsonLd data={getFeedbackReviewSchemas(sgFeedbacks.v)} />
      
      <div className="Home">
        {/* <h1 className="Home-title" style={{ opacity: 0 }}>
          Interpro - производство выставочных стендов в Москве
        </h1> */}

        <Hero />
        <div
          className="motion-main"
          style={{ background: isInViewProjects || isInViewFAQSection ? '#EBEBEB' : '#FFF' }}
        >
          <ExpoStands />
          <MediaSection
            className="SECTION_1"
            aspectRation={configMedia.aspectRatio}
            source={{
              src: configMedia.srcVideo4,
              cover: configMedia.srcVideo4Cover,
              type: 'application/x-mpegURL',
            }}
          />
          <div ref={refProjects}>
            <Projects />
          </div>
          <WorkflowSection />

          <MediaSection
            className="SECTION_2"
            subtitle="( Собственное производство )"
            title={
              <>
                Исключаем посредников, упрощаем логистику <br /> и помогаем оптимизировать затраты
              </>
            }
            aspectRation={configMedia.aspectRatio}
            source={{
              src: configMedia.srcVideo2,
              cover: configMedia.srcVideo2Cover,
              type: 'application/x-mpegURL',
            }}
          />
          <TeamBoostSection />
          <DocOverview />
          <AboutUsMedia />
          <div ref={refFAQSection}>
            <FAQSection qntyPreview={4} />
          </div>

          <div className="DetailInfo px">
            <h1 className="DetailInfo-title">
              Interpro - производство выставочных стендов в Москве
            </h1>
            <DetailInfoSeo />
          </div>

          <ParallaxFooter Element={Footer} PreElement={ContactF} />
        </div>
      </div>
    </StartPage>
  );
}

const ContactF = () => <ContactForm className="px" />;
