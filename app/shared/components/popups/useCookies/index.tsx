import './styles.css';
import usePopup from '@qtpy/use-popup';
import { useEffect } from 'react';
import Button from 'shared/components/Button';
import { useNavigate } from 'shared/components/NavigationTracker';
import { sgIsOpenMWCookies } from 'store/stGlobal';

import { useHidePreloader } from 'store/stPreloader';

export default function useCookies() {
  const { Popup, ...props } = usePopup(0.4);
  const { goTo } = useNavigate();
  const toClosePopup = () => {
    localStorage.setItem('cookies', 'saved');
    props.toClosePopup();
    sgIsOpenMWCookies.v = false;
  };

  useEffect(() => {
    if (localStorage.getItem('cookies') !== 'saved') {
      props.toOpenPopup();
    } else sgIsOpenMWCookies.v = false;
  }, []);
  
  return Popup.Memo(
    {
      ...props,
      Popup: () => {
        const { clIsHidePreload } = useHidePreloader();
        return (
          <Popup className={`Cookies ${clIsHidePreload} opacityBeforePreloader`}>
            <p className="Cookies-text">
              Мы используем cookies. Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
              <span onClick={() => goTo('/privacy')}>Политикой конфиденциальности</span>
            </p>
            <Button onClick={toClosePopup} className="Cookies-btn" variant="secondary">
              Хорошо
            </Button>
          </Popup>
        );
      },
    },
    []
  );
}
