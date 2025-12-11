import './styles.css';
import React, { PropsWithChildren, useRef, useState, useLayoutEffect, useMemo } from 'react';
import ArrowIcon from 'assets/icons/arrow.svg?react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as TSwiper } from 'swiper';
import Subtitle from 'shared/components/Subtitle';

import Tag from 'shared/components/Tag';
import ContactForm from 'shared/components/ContactForm';
import Button from 'shared/components/Button';
import { useNavigate } from 'shared/components/NavigationTracker';
import Degree from 'shared/components/Degree';

import IsNot from 'shared/components/IsNot';
import Text from 'shared/components/Text';
import useMWImage, { WithDataMWImage } from 'shared/components/popups/useMWImage';
import toFormatNames from 'shared/utils/toFormatNames';

import Link from 'shared/components/Link';
import { Route } from './+types';
import { getProjectsById } from 'api/projects/projects.api';
import { Project } from 'api/projects/projects.types';
import StartPage from 'shared/components/StartPage';

export async function clientLoader({ params }: Route.LoaderArgs) {
  const project = await getProjectsById({ id: params.slug });

  if (!project) {
    throw new Response("Not found", { status: 404 });
  }

  return project;
}
export function meta({ data }: Route.MetaArgs) {
  const project = data as Awaited<ReturnType<typeof clientLoader>> | undefined;

  const title = project?.payload?.seo?.title;
  const description =
    project?.payload?.seo?.description ||
    'Этот проект был реализован компанией Interpro с применением современных решений и экспертизы.';

  return [
    { title: `Interpro: проект ${title || ''}` },
    { name: 'description', content: description },
    { property: 'og:title', content: `Interpro: проект ${title || ''}` },
    { property: 'og:description', content: description },
  ];
}


export default function ProjectPage({ loaderData: data, params }: Route.ComponentProps) {
  const { setCrumbs } = useNavigate();
  const { Popup, showWithData } = useMWImage();

  useLayoutEffect(() => {
    try {
      const path = `/projects/${params.slug}`;
      setCrumbs(path, data!.payload?.title);
    } catch (error) {}
  }, []);

  const allImages = useMemo(() => {
    return [
      data?.payload?.cover,
      ...(data?.payload?.blocks?.intro?.photos || []),
      data?.payload?.blocks?.viz3d?.image,
      ...(data?.payload?.blocks?.drawings || []),
      ...(data?.payload?.blocks?.details?.flatMap((b) => b.photos || []) || []),
    ].filter(Boolean);
  }, [data]);

  const openAllImages = (currentSrc?: string) => {
    if (!currentSrc) return;
    const index = allImages.findIndex((src) => src === currentSrc);
    showWithData([index >= 0 ? index : 0, allImages as any]);
  };

  function VideoOrImg(props?: Project | null) {
    return props?.payload?.video ?? props?.payload?.cover;
  }

  return (
    <StartPage>
      <div className="ProjectPage">
        <Popup />
        {/* <link rel="canonical" href={window.location.href} /> */}
        <h1 className="ProjectPage_title px">{data?.payload?.title}</h1>

        <TagsDesktop
          year={data?.payload?.meta?.year.name}
          typeStand={toFormatNames(data?.payload?.meta?.type_tax)}
          exhibition={toFormatNames(data?.payload?.meta?.exhibition)}
          desc={data?.payload?.about ?? ''}
          square={data?.payload?.meta.area ?? ''}
        />

        {/* ---- Intro ---- */}
        <ImgWithText
          toOpenImg={(w) => openAllImages(w[1][w[0]])}
          isLastText={true}
          imgs={[VideoOrImg(data)]}
          className="block_1 __intro"
        >
          {!!data?.payload?.blocks?.intro?.title && (
            <Tag
              className="ProjectPage-description"
              subTitle="О проекте"
              title={data?.payload?.blocks?.intro?.title}
            />
          )}
        </ImgWithText>

        {/* ---- Intro Photos ---- */}
        <ImgWithText
          isLastText={true}
          imgs={data?.payload?.blocks?.intro?.photos ?? []}
          className="__intro_second"
          toOpenImg={(w) => openAllImages(w[1][w[0]])}
        >
          {data?.payload?.blocks?.intro?.title}
        </ImgWithText>

        {/* ---- 3D Scheme ---- */}
        <Scheme3D
          toOpenImg={() => openAllImages(data?.payload?.blocks?.viz3d?.image)}
          src={data?.payload?.blocks?.viz3d?.image}
          size={data?.payload?.blocks?.viz3d?.size}
          square={data?.payload?.blocks?.viz3d?.area}
        />

        {/* ---- Drawings ---- */}
        <SwiperScheme
          imgs={data?.payload?.blocks?.drawings ?? []}
          toOpenImg={(w) => openAllImages(w[1][w[0]])}
          title={'Чертёж проекта'}
          description="Каждая деталь в проекте — результат точной работы конструкторов."
        />

        {/* ---- Details ---- */}
        {data?.payload?.blocks?.details.map(({ photos, title }, index) => (
          <ImgWithText
            toOpenImg={(w) => openAllImages(w[1][w[0]])}
            imgs={photos}
            className="block_3"
            key={index}
          >
            {title}
          </ImgWithText>
        ))}

        <div className="__nextItem">
          <Subtitle>(Следующий проект)</Subtitle>
          <Link to={`/projects/${data?.nextItem?.slug}`} slug={[data?.nextItem?.title!]}>
            <Button.Arrow variant="link" direction="right">
              {data?.nextItem?.title}
            </Button.Arrow>
          </Link>
        </div>
        <ContactForm className="px" />
      </div>
    </StartPage>
  );
}

function checkIsVideo(url?: string) {
  if (!url) return;
  return /^(?:(?:https?:\/\/)?(?:www\.)?(?:rutube\.ru|youtube\.com|youtu\.be|vimeo\.com)\/[\w\-\/]+(?:\?.*)?$)/i.test(
    url
  );
}
interface TagsProps {
  exhibition?: string;
  typeStand?: string;
  year?: string | number;
  desc: string;
  square: number | string;
}
function TagsDesktop(props: TagsProps) {
  const clIsDesc = props.desc ? 'isDesc' : '';
  return (
    <div className={`ProjectPage_tags __desktop px ${clIsDesc}`}>
      <IsNot
        value={props.exhibition}
        children={
          <Tag
            className="__exhibition"
            subTitle="Выставка"
            title={<Text>{props.exhibition}</Text>}
          />
        }
      />
      <div className="ProjectPage_tags-container">
        <div className="ProjectPage_tag">
          <IsNot
            value={props.typeStand}
            children={
              <Tag
                className="__typeStand"
                subTitle="Тип стенда"
                title={<Text>{props.typeStand}</Text>}
              />
            }
          />
          <IsNot
            value={props.square}
            children={
              <Tag
                className="__square"
                subTitle="Площадь"
                title={<Degree text={`${props.square} м`} degree={2} />}
              />
            }
          />
          <IsNot
            value={props.year}
            children={<Tag className="__year" subTitle="Год" title={props.year!} />}
          />
        </div>
        <IsNot value={props.desc}>
          <Tag className="ProjectPage-description" subTitle="О проекте" title={props.desc} />
        </IsNot>
      </div>
    </div>
  );
}

function Paragraph({
  children,
  className = '',
}: PropsWithChildren & React.HTMLAttributes<HTMLElement>) {
  return (
    //prettier-ignore
    typeof children === 'string'
      ? <Text className={ `Paragraph ${className}` }>{ children }</Text>
      : <div className={ `Paragraph ${className}` }>{ children }</div>
  );
}

interface ImgWithTextProps extends PropsWithChildren {
  imgs: (string | undefined)[];
  className?: string;
  isLastText?: boolean;
  toOpenImg?: (values: WithDataMWImage) => void;
}
function ImgWithText({
  toOpenImg,
  isLastText = false,
  className = '',
  imgs,
  children,
}: ImgWithTextProps) {
  const clIsLastText = isLastText ? 'isLastText' : '';
  const clIsSecondImgs = imgs.length > 1 ? 'isSecondImgs' : '';
  return (
    !!imgs?.[0] && (
      <div className={`ImgWithText px ${className}  ${clIsLastText}`}>
        {children && (
          <Paragraph className={`ImgWithText-text ${clIsSecondImgs}`}>{children}</Paragraph>
        )}
        <div className={`ImgWithText_imgs  ${clIsSecondImgs}`}>
          {imgs.map((src, index, arr) => {
            const isVideo = checkIsVideo(src);
            return isVideo ? (
              <VideoPlayer key={index} url={src} />
            ) : (
              <img
                className="ImgWithText-img"
                src={src}
                alt={`Изображение проекта: детали стенда`}
                key={index}
                onClick={() => toOpenImg?.([index, arr as any])}
              />
            );
          })}
        </div>
      </div>
    )
  );
}

interface Scheme3DProps {
  title?: string;
  description?: string;
  src?: string;
  size?: string;
  square?: string | number;
  toOpenImg?: (values: WithDataMWImage) => void;
}

function Scheme3D({
  title = '3D визуализация проекта',
  description = 'Продумано до мелочей —  ещё до старта стройки',
  size,
  square,
  src,
  toOpenImg,
}: Scheme3DProps) {
  return (
    !!src && (
      <div className="Scheme3D px">
        <div className="Scheme3D_head">
          <div className="Scheme3D_text">
            <div className="Scheme3D_text-title">{title}</div>
            <p className="Scheme3D_text-description">{description}</p>
          </div>
          <div className="Scheme3D_tags">
            <IsNot
              value={size}
              children={
                <Tag
                  className="__size"
                  subTitle="РАзмер"
                  title={<Degree text={size ? `${size} м` : '0'} degree={2} />}
                />
              }
            />
            <IsNot
              value={square}
              children={
                <Tag
                  className="__square"
                  subTitle="Площадь"
                  title={<Degree text={square ? `${square} м` : '0'} degree={2} />}
                />
              }
            />
          </div>
        </div>
        <div className="Scheme3D_container">
          <img src={src} alt="3D визуализация" onClick={() => toOpenImg?.([0, [src]])} />
        </div>
      </div>
    )
  );
}

interface SwiperScheme {
  title?: string;
  description?: string;
  imgs: (string | undefined)[];
  toOpenImg?: (src: WithDataMWImage) => void;
}

function SwiperScheme({
  title = '3D визуализация проекта',
  description = 'Продумано до мелочей —  ещё до старта стройки',
  imgs = [],
  toOpenImg,
}: SwiperScheme) {
  const swiperRef = useRef<TSwiper>(null);
  const [currIndex, setCurrIndex] = useState(0);

  const handlePrev = (isSwipe = true) => {
    if (swiperRef.current) {
      const swiper = swiperRef.current;
      isSwipe && swiper.slidePrev();
      setCurrIndex(swiper.realIndex);
    }
  };

  const handleNext = (isSwipe = true) => {
    if (swiperRef.current) {
      const swiper = swiperRef.current;
      isSwipe && swiper.slideNext();
      setCurrIndex(swiper.realIndex);
    }
  };

  return (
    !!imgs?.[0] && (
      <div className="SwiperScheme ">
        <div className="SwiperScheme_text px">
          <div className="SwiperScheme_text-title">{title}</div>
          <p className="SwiperScheme_text-description">{description}</p>
        </div>
        <Swiper
          className="SwiperScheme_swiper"
          loop={true}
          grabCursor={true}
          observer={false}
          observeParents={false}
          onSlideNextTransitionStart={() => handleNext(false)}
          onSlidePrevTransitionStart={() => handlePrev(false)}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {imgs.map((src, index) => {
            return (
              <SwiperSlide className="SwiperScheme_swiper-item" key={index}>
                <img
                  src={src}
                  alt={`Чертёж проекта — слайд ${index + 1}`}
                  onClick={() => toOpenImg?.([index, imgs as any])}
                />
              </SwiperSlide>
            );
          })}
          <button onClick={() => handlePrev()} className="SwiperScheme_swiper-prev mx">
            <ArrowIcon />
          </button>
          <button onClick={() => handleNext()} className="SwiperScheme_swiper-next mx">
            <ArrowIcon />
          </button>
          <div className="SwiperScheme_swiper-pagination">
            {imgs.map((_, index) => {
              const clIsActive = currIndex === index ? 'active' : '';
              return <span key={index} className={clIsActive}></span>;
            })}
          </div>
        </Swiper>
      </div>
    )
  );
}

interface VideoPlayerProps {
  url?: string;
}
const VideoPlayer = ({ url }: VideoPlayerProps) => {
  return (
    !!url && (
      <div className="VideoPlayer">
        <iframe
          className="VideoPlayer-iframe"
          src={url}
          frameBorder="0"
          allow="clipboard-write; autoplay"
          // webkitAllowFullScreen
          // mozallowfullscreen
          allowFullScreen
        />
      </div>
    )
  );
};
