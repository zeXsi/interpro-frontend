import './styles.css';
import React, { useState, useMemo, ReactElement, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as TSwiper } from 'swiper';
import 'swiper/swiper-bundle.css';
import { Mousewheel } from 'swiper/modules';

interface PropsTab {
  className?: string;
  children:
    | ReactElement<PropsTabs>
    | ReactElement<PropsTabs>[]
    | ReactElement<PropsContent>
    | ReactElement<PropsContent>[];
  startTrigger?: string | number;
}

export default function Tabs({ children, startTrigger, className = '' }: PropsTab) {
  const [activeTrigger, setActiveTrigger] = useState<string | number | null>(startTrigger || null);
  const swiperRef = useRef<TSwiper>(null);

  useEffect(() => {
    setActiveTrigger(startTrigger || null);
  }, [startTrigger]);

  useEffect(() => {
    if (activeTrigger !== null && swiperRef.current) {
      const activeIndex = tabs.findIndex((tab) => tab.props.trigger === activeTrigger);
      if (activeIndex !== -1) {
        swiperRef.current?.slideTo(activeIndex, 300);
      }
    }
  }, [activeTrigger]);

  const { tabs, activeContent } = useMemo(() => {
    const childrenArray = React.Children.toArray(children);

    const tabs = childrenArray.filter((child): child is ReactElement<PropsTabs> => {
      return React.isValidElement<PropsTabs>(child) && child.type === Tabs.Item;
    });

    const activeContent = childrenArray.find((child) => {
      if (!React.isValidElement<PropsContent>(child) || child.type !== Tabs.Content) return false;
      const contentTrigger = child.props.trigger;
      if (Array.isArray(contentTrigger)) {
        return contentTrigger.includes(activeTrigger as string);
      }
      return contentTrigger === activeTrigger;
    });

    return { tabs, activeContent };
  }, [children, activeTrigger]);

  return (
    <>
      <div className={`Tabs ${className}`}>
        <Swiper
          className="Tabs-inner "
          direction="horizontal"
          slidesPerView={'auto'}
          resistanceRatio={0}
          freeMode={true}
          grabCursor={true}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          } }
          modules={[Mousewheel]}
          mousewheel={{
            invert: false,
            forceToAxis: true,
            thresholdDelta: 2000,
            releaseOnEdges: false, 
          }}
   
 
          breakpoints={ {
            375: {
              spaceBetween: 48,
              slidesOffsetAfter: 8,
              slidesOffsetBefore: 8,
            },
            768: {
              spaceBetween: 48,
              slidesOffsetAfter: 16,
              slidesOffsetBefore: 16
            },
            1920: {
              spaceBetween: 78,
              slidesOffsetAfter: 40,
              slidesOffsetBefore: 40
            },
          } }
        >
          {tabs.map((child, index) => (
            <SwiperSlide key={index} style={{ width: 'auto' }}>
              {React.cloneElement(child, {
                onClick: (trigger) => {
                  setActiveTrigger(child.props.trigger);
                  child.props.onClick?.(trigger);
                },
                isActive: activeTrigger === child.props.trigger,
              })}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {activeContent}
    </>
  );
}

interface PropsTabs {
  children: React.ReactNode;
  onClick?: (trigger: string | number) => void;
  isActive?: boolean;
  trigger: string | number;
}

interface PropsContent {
  children: React.ReactNode;
  trigger: string | Array<string>;
  isWrapper?: boolean;
}

Tabs.Item = function Tab({ children, trigger, onClick, isActive = false }: PropsTabs) {
  return (
    <div className={`Tabs-item ${isActive ? 'active' : ''}`} onClick={() => onClick?.(trigger)}>
      {children}
    </div>
  );
};

Tabs.Content = function Content({ children, trigger, isWrapper = false }: PropsContent) {
  return isWrapper ? <div className={`Tabs_${trigger}`}>{children}</div> : children;
};
