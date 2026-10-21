import './styles.css';
import usePopup from '@qtpy/use-popup';
import { useEffect } from 'react';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import { sgIsOpenMWCookies } from 'store/stGlobal';

import { useHidePreloader } from 'store/stPreloader';

export default function useCookies() {
  const { Popup, ...props } = usePopup(0.4);
  const toClosePopup = () => {
    try {
      window.localStorage.setItem('cookies', 'saved');
    } catch {
      // При недоступном хранилище закрываем уведомление только в текущем сеансе.
    }
    props.toClosePopup();
    sgIsOpenMWCookies.v = false;
  };

  useEffect(() => {
    let isSaved = false;
    try {
      isSaved = window.localStorage.getItem('cookies') === 'saved';
    } catch {
      // Недоступная настройка равнозначна отсутствующей: показываем уведомление.
    }
    if (!isSaved) {
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
              <Link to="/privacy">
                <span>Политикой конфиденциальности</span>
              </Link>
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
