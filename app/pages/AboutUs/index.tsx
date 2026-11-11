import './styles.css';
import ServicesDesc from 'shared/components/ServicesDesc';
import TitlePage from 'shared/components/TitlePage';

import srcVideo2 from 'assets/videos/video_2/video.mp4';
import srcVideo2Mobile from 'assets/videos/video_2/video_mobile.mp4';
import srcVideo2Cover from 'assets/videos/video_2/cover.jpg';
import srcVideo2CoverMobile from 'assets/videos/video_2/cover_mobile.jpg';
import useBreakpoints from '@qtpy/use-breakpoints';
import MediaSection from 'shared/sections/MediaSection';
import svgCompanies from 'assets/companies';
import DocOverview from 'shared/sections/DocOverview';
import CompaniesGrid from 'shared/components/CompaniesGrid';
import Button from 'shared/components/Button';
import { useRef } from 'react';
import { useInView } from 'motion/react';

import FAQSection from 'shared/sections/FAQSection';
import ContactForm from 'shared/components/ContactForm';
import Certificates from 'shared/sections/Certificates';
import Link from 'shared/components/Link';
import StartPage from 'shared/components/StartPage';

import JsonLd from 'shared/seo/JsonLd';
import { getFaqSchema, getFeedbackReviewSchemas } from 'shared/seo/schemas';
import { getFaqs } from 'api/faq/faq.api';
import { getFeedbacks } from 'api/feedbacks/feedbacks.api';
import { getLicenses } from 'api/licenses/license.api';
import feedbacksToItems from 'shared/sections/DocOverview/feedbacksToItems';
import type { Route } from './+types';
import { getOpenGraphMeta } from 'shared/seo/meta';

export async function loader() {
  const [faqs, feedbacks, licenses] = await Promise.all([getFaqs(), getFeedbacks(), getLicenses()]);
  return {
    faqs: faqs.slice(0, 4).map(({ payload }) => ({ question: payload.question, answer: payload.answer })),
    feedbacks: feedbacks.slice(0, 4).map(({ payload }) => ({ payload: {
      title: payload.title,
      company: payload.company,
      person: payload.person ? { name: payload.person.name, position: payload.person.position } : payload.person,
      text: payload.text,
      pdf: payload.pdf,
      date: payload.date,
    } })),
    licenses: licenses.slice(0, 2).map(({ payload }) => ({
      title: payload.title,
      file_name: payload.file_name,
      file_url: payload.file_url,
      preview_url: payload.preview_url,
    })),
  };
}

export function meta() {
  const title = 'Interpro: о компании и нашей миссии';
  const description =
    'Узнайте больше о компании Interpro: наша миссия, ценности, команда и опыт реализации успешных проектов для бизнеса.';

  return getOpenGraphMeta({ title, description, pathname: '/about-us' });
}

export default function AboutUs({ loaderData }: Route.ComponentProps) {
  const configMedia = useBreakpoints(
    {
      500: { srcVideo2, srcVideo2Cover, aspectRatio: '1920/1080' },
      0: {
        srcVideo2: srcVideo2Mobile,
        srcVideo2Cover: srcVideo2CoverMobile,
        aspectRatio: '375/940',
      },
    },
    1000
  );

  const refISO = useRef<HTMLDivElement>(null);

  const isInViewProjects = useInView(refISO, {
    margin: '-33% 0px -33% 0px',
  });

  return (
    <StartPage>
      <JsonLd
        data={getFaqSchema(loaderData.faqs)}
      />
      <JsonLd data={getFeedbackReviewSchemas(loaderData.feedbacks)} />

      <div className="AboutUs px" style={{ background: isInViewProjects ? '#EBEBEB' : '#FFF' }}>
        <TitlePage title={'О компании'} className="title-1" />
        <ServicesDesc title="что делаем">
          Более 9 лет проектируем и строим выставочные стенды под ключ: от разработки концепции до
          производства и монтажа. За годы работы построили более 1000 стендов общей площадью свыше
          75 500 м². Собственное производство площадью 3 500 м² позволяет контролировать качество и
          ключевые этапы реализации проектов
        </ServicesDesc>
        <div className="AboutUs-info">
          <TagCounter title={'9'} subTitle="лет на рынке" />
          <TagCounter title={'1000+'} subTitle="стендов построено" />
          <TagCounter title={'75 500 м²'} subTitle=" застроено" />
          <TagCounter title={'3 500 м²'} subTitle="собственного производство" />
        </div>

        <MediaSection
          className="AboutUs-mediaSection"
          aspectRation={configMedia.aspectRatio}
          source={{
            src: configMedia.srcVideo2,
            cover: configMedia.srcVideo2Cover,
            type: 'video/mp4',
          }}
        />
        <TitlePage title={'Наши клиенты'} className="title-2" as="h2" />
        <div className="AboutUs_companies">
          <CompaniesGrid items={svgCompanies.slice(0, 10)} />
          <Link to={'/about-us/clients'}>
            <Button.Arrow as="span" className="AboutUs_companies-btn" direction="right">
              Ещё {svgCompanies.length - 10}+ клиентов
            </Button.Arrow>
          </Link>
        </div>
        <DocOverview items={feedbacksToItems(loaderData.feedbacks)} showAllLink />
        <div ref={refISO}>
          <div className="AboutUs_iso">
            <div className="AboutUs_iso-head">
              <TitlePage title={'Лицензии и сертификаты'} className="title-3" as="h2" />
              <Link to={'/about-us/certificates'}>
                <Button.Arrow as="span" className="AboutUs_companies-btn __top" direction="right">
                  Все сертификаты
                </Button.Arrow>
              </Link>
            </div>

            <Certificates items={loaderData.licenses} qntyPreview={2} />
            <Link to={'/about-us/certificates'}>
              <Button.Arrow as="span" className="AboutUs_companies-btn __bottom" direction="right">
                Все сертификаты
              </Button.Arrow>
            </Link>
          </div>
        </div>
        <FAQSection items={loaderData.faqs} qntyPreview={4} showAllLink />
        <ContactForm />
      </div>
    </StartPage>
  );
}

interface Props {
  title: string;
  subTitle: string;
}

export function TagCounter({ title, subTitle }: Props) {
  return (
    <div className="TagCounter">
      <span className="TagCounter-title">{title}</span>
      <span className="TagCounter-subtitle">{subTitle}</span>
    </div>
  );
}
