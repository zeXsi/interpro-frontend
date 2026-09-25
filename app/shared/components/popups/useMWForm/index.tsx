import './styles.css';
import usePopup from '@qtpy/use-popup';
import SVGCross from 'assets/icons/close-popup.svg?react';

import ContactForm from 'shared/components/ContactForm';

import srcDesk from './assets/desk.webp';
import srcTable from './assets/table.webp';
import srcMob from './assets/mob.webp';
import { GlobalScrollLock } from 'shared/components/_helpers/GlobalScrollLock';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { sgIsHide } from 'store/stPreloader';
import { signal } from 'shared/utils/_stm';
import { useEffect } from 'react';

export const isShowed = signal(false);

export const MWForm = signal({
  toOpenPopup: () => {},
  toClosePopup: () => {},
});

export default function useMWForm() {
  const { Popup, ...props } = usePopup(0.15);

  const origin = props.toOpenPopup;
  props.toOpenPopup = () => {
    origin?.();
    isShowed.v = true;
  };
  useEffect(() => {
    MWForm.v.toOpenPopup = props.toOpenPopup;
    MWForm.v.toClosePopup = props.toClosePopup;
  }, []);
  const isPreloaderHidden = useSignalValue(sgIsHide);
  const hasShown = useSignalValue(isShowed);

  useEffect(() => {
    if (!isPreloaderHidden || hasShown) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let isArmed = false;

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', armAutoPopup);
      window.removeEventListener('keydown', armAutoPopup);
      window.removeEventListener('scroll', armAutoPopup);
    };

    const armAutoPopup = () => {
      if (isArmed || isShowed.v) return;
      isArmed = true;
      removeInteractionListeners();

      timer = setTimeout(() => {
        if (!isShowed.v) {
          MWForm.v.toOpenPopup?.();
        }
      }, 10_000);
    };

    window.addEventListener('pointerdown', armAutoPopup, { passive: true, once: true });
    window.addEventListener('keydown', armAutoPopup, { once: true });
    window.addEventListener('scroll', armAutoPopup, { passive: true, once: true });

    return () => {
      removeInteractionListeners();
      if (timer) clearTimeout(timer);
    };
  }, [isPreloaderHidden, hasShown]);

  return Popup.Memo(
    {
      ...props,
      Popup: () => {
        return (
          <>
            <Popup className="MWForm" isOnCloseBG={true} eventCloseBG="onClick">
              <GlobalScrollLock
                active={true}
                classInner="MWForm-wpinner"
                className="MWForm-inner hideScroll"
              >
                <div className="MWForm_header">
                  <button className="MWImage-close" onClick={props.toClosePopup}>
                    <SVGCross />
                  </button>
                </div>
                <Form onClose={props.toClosePopup}/>
              </GlobalScrollLock>
            </Popup>
          </>
        );
      },
    },
    []
  );
}

interface MWFormPopupContentProps {
  onClose?: () => void;
  type?: 'popup' | 'excursion';
  title?: string;
  subTitle?: string;
} 

export function Form({ onClose, subTitle = 'получите' , title = 'бесплатный дизайн-проект и консультацию', type = 'popup' }: MWFormPopupContentProps) {
  return (
    <div className='wrap-form'>
        <div className='Form'>
        <ContactForm
          onEnd={onClose}
          type={type}
          subtitle={subTitle}
          title={title}
        />

        <picture className="MWForm-bg">
          <source media="(min-width: 1024px)" srcSet={srcDesk} />
          <source media="(min-width: 768px)" srcSet={srcTable} />
          <img src={srcMob} alt="background" />
        </picture>
      </div>
    </div>
  );
}
