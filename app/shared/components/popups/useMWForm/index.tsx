import './styles.css';
import usePopup from '@qtpy/use-popup';
import SVGCross from 'assets/icons/close-popup.svg?react';

import ContactForm from 'shared/components/ContactForm';

import srcDesk from './assets/desk.webp';
import srcTable from './assets/table.webp';
import srcMob from './assets/mob.webp';
import { GlobalScrollLock } from 'shared/components/_helpers/GlobalScrollLock';
import { useWatch } from 'shared/utils/_stm/react/react';
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
  useWatch(() => {
    if (sgIsHide.v && !isShowed.v) {
      setTimeout(() => {
        if (isShowed.v) return;
        props.toOpenPopup();
      }, 1000 * 10);
    }
  });

  return Popup.Memo(
    {
      ...props,
      Popup: () => {
        return (
          <>
            <BGLinks/>
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

export function BGLinks() {
  return (
    <>
      <link rel="prefetch" as="image" href={srcDesk} />
      <link rel="prefetch" as="image" href={srcTable} />
      <link rel="prefetch" as="image" href={srcMob} />
    </>
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
