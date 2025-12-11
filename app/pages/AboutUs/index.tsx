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


export function meta() {
  const title = "Interpro: о компании и нашей миссии";
  const description =
    "Узнайте больше о компании Interpro: наша миссия, ценности, команда и опыт реализации успешных проектов для бизнеса.";

  return [
    { title },

    { name: "description", content: description },

    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
}


export default function AboutUs() {
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
      <div className="AboutUs px" style={{ background: isInViewProjects ? '#EBEBEB' : '#FFF' }}>
        <TitlePage title={'О компании'} className="title-1" />
        <ServicesDesc title="что делаем">
          Проектируем и строим выставочные стенды любого масштаба — от лаконичных решений до сложных
          архитектурных объектов
        </ServicesDesc>
        {/* <div className="AboutUs-info">
        <TagCounter title={ '37' } subTitle="лет на рынке" />
        <TagCounter title={ '48' } subTitle="специалистов" />
        <TagCounter title={ '200+' } subTitle="проектов" />
        <TagCounter title={ '50+' } subTitle="выставок охвачено" />
      </div> */}

        <MediaSection
          className="AboutUs-mediaSection"
          aspectRation={configMedia.aspectRatio}
          source={{
            src: configMedia.srcVideo2,
            cover: configMedia.srcVideo2Cover,
            type: 'video/mp4',
          }}
        />
        <TitlePage title={'Наши клиенты'} className="title-2" />
        <div className="AboutUs_companies">
          <CompaniesGrid items={svgCompanies.slice(0, 10)} />
          <Link to={'/about-us/clients'}>
            <Button.Arrow className="AboutUs_companies-btn" direction="right">
              Ещё {svgCompanies.length - 10}+ клиентов
            </Button.Arrow>
          </Link>
        </div>
        <DocOverview />
        <div ref={refISO}>
          <div className="AboutUs_iso">
            <div className="AboutUs_iso-head">
              <TitlePage title={'Лицензии и сертификаты'} className="title-3" />
              <Link to={'/about-us/certificates'}>
                <Button.Arrow className="AboutUs_companies-btn __top" direction="right">
                  Все сертификаты
                </Button.Arrow>
              </Link>
            </div>

            <Certificates qntyPreview={2} />
            <Link to={'/about-us/certificates'}>
              <Button.Arrow className="AboutUs_companies-btn __bottom" direction="right">
                Все сертификаты
              </Button.Arrow>
            </Link>
          </div>
        </div>
        <FAQSection qntyPreview={4} />
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
