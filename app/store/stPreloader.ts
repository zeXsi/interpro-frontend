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

const PRELOADER_MAX_DURATION = 5000;

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
    sgPercent.v = 0;
    window.scrollTo(0, 0);

    let interval: NodeJS.Timeout;
    let maxDurationTimeout: NodeJS.Timeout;
    let isFinished = false;

    const finishPreloader = () => {
      if (isFinished) return;
      isFinished = true;

      sgPercent.v = 100;
      if (interval) clearInterval(interval);
      if (maxDurationTimeout) clearTimeout(maxDurationTimeout);

      toHidePreloader();
    };

    const images = document.querySelectorAll('img');
    const videos = document.querySelectorAll('video');
    const allMedia = [...images, ...videos]
      .map((el) => (el as HTMLImageElement | HTMLVideoElement).src)
      .filter(Boolean);

    const mediaToLoad = mediaUrls.length ? [...new Set(mediaUrls)] : [...new Set(allMedia)];

    if (!mediaToLoad.length) {
      finishPreloader();
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
      if (isFinished) return;

      interval = setInterval(() => {
        const next = sgPercent.v + 2;
        if (next >= 100) {
          finishPreloader();
        } else {
          sgPercent.v = next;
        }
      }, delayPercent);
    });

    maxDurationTimeout = setTimeout(() => {
      finishPreloader();
    }, PRELOADER_MAX_DURATION);

    return () => {
      if (interval) clearInterval(interval);
      if (maxDurationTimeout) clearTimeout(maxDurationTimeout);
    };
  }, [...mediaUrls, delayPercent]);

  return { percent, ...props };
};
