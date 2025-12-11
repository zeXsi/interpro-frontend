import { useEffect } from 'react';
import { useNavigate } from 'shared/components/NavigationTracker';
import { signal } from 'shared/utils/_stm';
import { useSignalValue } from 'shared/utils/_stm/react/react';

type StPreloader = {
  isHide: boolean;
  percent: number;
  delayPercent: number;
};

/* =============== Сигналы вместо createReactStore =============== */

export const sgIsHide = signal<StPreloader['isHide']>(false);
export const sgPercent = signal<StPreloader['percent']>(0);
export const sgDelayPercent = signal<StPreloader['delayPercent']>(10);

/* =============== API =============== */

export const toHidePreloader = () => {
  sgIsHide.v = true;
};

export const toShowPreloader = () => {
  sgIsHide.v = false;
};

/* =============== useHidePreloader =============== */

export const useHidePreloader = () => {
  const { currentPath } = useNavigate();
  const isHidePreload = useSignalValue(sgIsHide);

  const clIsHidePreload = !isHidePreload
    ? currentPath === '/' && 'showPreloader'
    : 'hidePreloader';

  return { isHidePreload, clIsHidePreload };
};

/* =============== usePreloader =============== */

export const usePreloader = (mediaUrls: string[] = []) => {
  const percent = useSignalValue(sgPercent);
  const delayPercent = useSignalValue(sgDelayPercent);
  const props = useHidePreloader();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    let interval: NodeJS.Timeout;

    const images = document.querySelectorAll('img');
    const videos = document.querySelectorAll('video');
    const allMedia = [...images, ...videos]
      .map((el) => (el as HTMLImageElement | HTMLVideoElement).src)
      .filter(Boolean);

    const mediaToLoad = [...new Set([...mediaUrls, ...allMedia])];

    if (!mediaToLoad.length) {
      toHidePreloader();
      document.documentElement.style.overflow = '';
      return;
    }

    const loadPromises = mediaToLoad.map(
      (url) =>
        new Promise<void>((resolve) => {
          if (url.match(/\.(mp4|webm|ogg)$/i)) {
            const video = document.createElement('video');
            video.src = url;
            video.onloadeddata = () => resolve();
            video.onerror = () => resolve();
          } else {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    );

    Promise.all(loadPromises).then(() => {
      interval = setInterval(() => {
        const next = sgPercent.v + 2;
        if (next >= 100) {
          sgPercent.v = 100;
          clearInterval(interval!);
          toHidePreloader();
          setTimeout(() => {
            document.documentElement.style.overflow = '';
          }, 1000);
        } else {
          sgPercent.v = next;
        }
      }, delayPercent);
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [...mediaUrls, delayPercent]);

  return { percent, ...props };
};
