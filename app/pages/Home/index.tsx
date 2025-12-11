'use server';
import './styles.css';
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
import { useRef } from 'react';
import useBreakpoints from '@qtpy/use-breakpoints';

import ParallaxFooter from 'shared/components/ParallaxFooter';

import srcVideo2 from 'assets/videos/video_2/video.mp4';
import srcVideo2Mobile from 'assets/videos/video_2/video_mobile.mp4';
import srcVideo2Cover from 'assets/videos/video_2/cover.jpg';
import srcVideo2CoverMobile from 'assets/videos/video_2/cover_mobile.jpg';

import srcVideo3 from 'assets/videos/video_3/video.mp4';
import srcVideo3Mobile from 'assets/videos/video_3/video_mobile.mp4';
import srcVideo3Cover from 'assets/videos/video_3/cover.jpg';
import srcVideo3CoverMobile from 'assets/videos/video_3/cover_mobile.jpg';
import StartPage from 'shared/components/StartPage';

export function meta() {
  const title = 'Interpro: главная';
  const description =
    'Проектируем и строим выставочные стенды любого масштаба — от лаконичных решений до сложных архитектурных объектов';

  return [
    { title },

    {
      name: 'description',
      content: description,
    },

    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: description,
    },
  ];
}

export default function Home() {
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
      500: { srcVideo2, srcVideo3, srcVideo2Cover, srcVideo3Cover, aspectRatio: '1920/1080' },
      0: {
        srcVideo2: srcVideo2Mobile,
        srcVideo3: srcVideo3Mobile,
        srcVideo2Cover: srcVideo2CoverMobile,
        srcVideo3Cover: srcVideo3CoverMobile,
        aspectRatio: '375/940',
      },
    },
    1000
  );

  return (
    <StartPage>
      <div className="Home">
        <h1 className="Home-title" style={{ opacity: 0 }}>
          Interpro - производство выставочных стендов в Москве
        </h1>

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
              src: configMedia.srcVideo2,
              cover: configMedia.srcVideo2Cover,
              type: 'video/mp4',
            }}
          />
          <TeamBoostSection />
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
              src: configMedia.srcVideo3,
              cover: configMedia.srcVideo3Cover,
              type: 'video/mp4',
            }}
          />
          <DocOverview />
          <AboutUsMedia />
          <div ref={refFAQSection}>
            <FAQSection qntyPreview={4} />
          </div>

          <ParallaxFooter Element={Footer} PreElement={ContactF} />
        </div>
      </div>
    </StartPage>
  );
}

const ContactF = () => <ContactForm className="px" />;
