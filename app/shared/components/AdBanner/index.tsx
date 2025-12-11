import { useRef } from 'react';
import Button, { ImpRef } from '../Button';
import './styles.css';
import { useSignal, useWatch } from 'shared/utils/_stm/react/react';
import { MWForm } from '../popups/useMWForm';

export default function AdBanner() {
  const isHover = useSignal(false);
  const refContainer = useRef<HTMLDivElement>(null);
  const refImp = useRef<Partial<ImpRef>>({});

  useWatch(() => {
    const is = isHover.v;
    refImp.current?.setIsHover?.(is);
    refContainer.current?.classList.toggle('is-hover', is);
  });
  return (
    <div
      className="AdBanner px"
      ref={refContainer}
      onMouseEnter={() => (isHover.v = true)}
      onMouseLeave={() => (isHover.v = false)}
      onTouchStart={() => (isHover.v = true)}
      onTouchEnd={ () => (isHover.v = false) }
      onClick={() => MWForm.v.toOpenPopup?.()}
      style={{"display": "none !important"}}
    >
      <div className="AdBanner_text">
        <span className='AdBanner_text-li'>Получить бесплатный</span>

        <Button.Arrow isListener={false} ref={refContainer} refImp={refImp} size="sm" direction="right" variant="link">
          дизайн-проект
        </Button.Arrow>
      </div>
    </div>
  );
}
