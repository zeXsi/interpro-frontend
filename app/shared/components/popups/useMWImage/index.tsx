import usePopup from '@qtpy/use-popup';
import './styles.css';
import { Activity, useImperativeHandle, useRef, useState } from 'react';
import SVGCross from 'assets/icons/close-popup.svg?react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as TSwiper } from 'swiper';
import ArrowIcon from 'assets/icons/arrow.svg?react';

export type WithDataMWImage = [number, string[]];
export default function useMWImage() {
  const { Popup, ...props } = usePopup<WithDataMWImage>(0.015);
  return Popup.Memo({
    ...props,
    Popup: ({ imperativeRef }) => {
      const [photos, setPhotos] = useState<string[]>([]);
      const [currIndex, setCurrIndex] = useState(0);
      const swiperRef = useRef<TSwiper>(null);
      const swiperMapRef = useRef<TSwiper>(null);
      const [loaded, setLoaded] = useState(false);

      const handlePrev = (isSwipe = true) => {
        if (swiperRef.current && swiperMapRef.current) {
          const swiper = swiperRef.current;
          const swiperMap = swiperMapRef.current;
          isSwipe && swiper.slidePrev();
          isSwipe && swiperMap.slidePrev();

          setCurrIndex(swiper.realIndex);
        }
      };

      const handleNext = (isSwipe = true) => {
        if (swiperRef.current && swiperMapRef.current) {
          const swiper = swiperRef.current;
          const swiperMap = swiperMapRef.current;
          isSwipe && swiper.slideNext();
          isSwipe && swiperMap.slideNext();
          setCurrIndex(swiper.realIndex);
        }
      };

      const setCurrentSlide = (index: number) => {
        if (swiperRef.current && swiperMapRef.current) {
          const swiper = swiperRef.current;
          const swiperMap = swiperMapRef.current;
          swiper.slideTo(index);
          swiperMap.slideTo(index);
          setCurrIndex(swiper.realIndex);
        }
      };

      useImperativeHandle(imperativeRef, () => ({
        setData: (data: WithDataMWImage) => {
          setPhotos(data[1]);
          setCurrIndex(data[0]);
          setTimeout(() => {
            const swiper = swiperRef.current;
            const swiperMap = swiperMapRef.current;

            if (swiper && swiperMap) {
              swiper.slideTo(data[0], 0);
              swiperMap.slideTo(data[0], 0);
              setCurrIndex(swiper.realIndex);
            }
          }, 50);
        },
      }));

      return (
        <Popup className="MWImage" isOnCloseBG={false}>
          <div className="MWImage-header">
            <button className="MWImage-close" onClick={props.toClosePopup}>
              <SVGCross />
            </button>
          </div>

          <Swiper
            className="MWImage-container"
            loop={true}
            grabCursor={true}
            onSlideChange={(swiper) => {
              setCurrIndex(swiper.realIndex);
              if (swiperMapRef.current) {
                swiperMapRef.current.slideTo(swiper.realIndex);
              }
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {photos.map((src, index) => (
              <SwiperSlide key={index}>
                <img
                  src={src}
                  className={`fade-in ${loaded ? 'loaded' : ''}`}
                  onLoad={() => setLoaded(true)}
                />
              </SwiperSlide>
            ))}
            <Activity mode={photos.length == 1 ? 'hidden' : 'visible'}>
              <div onClick={() => handlePrev()} className="MWImage-prev btn-controller">
                <button>
                  <ArrowIcon />
                </button>
              </div>
              <div onClick={() => handleNext()} className="MWImage-next btn-controller">
                <button>
                  <ArrowIcon />
                </button>
              </div>
            </Activity>
          </Swiper>

          <Activity mode={photos.length == 1 ? 'hidden' : 'visible'}>
            <Swiper
              spaceBetween={8}
              className="MWImage_swiper"
              direction="horizontal"
              slidesPerView={'auto'}
              resistanceRatio={0}
              freeMode={true}
              grabCursor={true}
              onSwiper={(swiper) => {
                swiperMapRef.current = swiper;
              }}
            >
              {photos?.map((src, index) => {
                const isActive = index === currIndex ? 'active' : '';

                return (
                  <SwiperSlide
                    key={index}
                    style={{ width: 64 }}
                    className={`MWImage_swiper-item ${isActive}`}
                    onClick={() => setCurrentSlide(index)}
                  >
                    <img
                      src={src}
                      className={`fade-in ${loaded ? 'loaded' : ''}`}
                      onLoad={() => setLoaded(true)}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </Activity>
        </Popup>
      );
    },
  });
}
