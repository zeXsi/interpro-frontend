import './styles.css';

import { useHidePreloader } from 'store/stPreloader';
import useMWNav, { MWNavMode } from '../popups/useMWNav';

import LogoIcon from 'assets/icons/logo.svg?react';
import { useNavigate } from '../NavigationTracker';

import { memo, useEffect, useRef } from 'react';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { sgProjects } from 'api/projects/projects.api';

function Header() {
  const { goTo } = useNavigate();
  const { clIsHidePreload } = useHidePreloader();
  const mode = useSignalValue(MWNavMode);
  const { Popup, toOpenPopup, toClosePopup, showWithData, isShowed } = useMWNav();
  const name = isShowed
    ? '(\u0020\u0437\u0430\u043a\u0440\u044b\u0442\u044c\u0020)'
    : '(\u0020\u043c\u0435\u043d\u044e\u0020)';
  const clIsOpenNav = isShowed ? 'isOpenNav' : '';

  const refHeader = useRef<HTMLUListElement>(null);
  const isMobileMenuOpen = isShowed && mode === 'nav';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 934px)');

    const syncBodyScroll = () => {
      const shouldLockScroll = isMobileMenuOpen && mediaQuery.matches;

      document.documentElement.style.overflow = shouldLockScroll ? 'hidden' : '';
      document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
      document.body.style.touchAction = shouldLockScroll ? 'none' : '';
    };

    syncBodyScroll();
    mediaQuery.addEventListener('change', syncBodyScroll);

    return () => {
      mediaQuery.removeEventListener('change', syncBodyScroll);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  const onMountEnter = () => {
    if (isShowed) return;

    refHeader.current?.classList.add('willOpenNav');
    toOpenPopup?.();
  };

  const onClickMenu = () => {
    if (!isShowed) {
      toOpenPopup?.();
      return;
    }

    toClosePopup?.();
  };

  return (
    <>
      <ul
        ref={refHeader}
        className={`Header px ${clIsOpenNav} ${clIsHidePreload} opacityBeforePreloader`}
      >
        <li className="Header_list-li __logo">
          <LogoIcon className="__logo-dark" onClick={() => goTo('/')} />
        </li>
        <li className="Header_list-li __menu">
          <span
            className="__menu-self"
            onMouseEnter={onMountEnter}
            onClick={onClickMenu}
            children={name}
          />
          <span
            data-qnty={sgProjects.v.length}
            className="__projects"
            onClick={() => goTo('/projects')}
          >
            <span>{'\u041f\u0440\u043e\u0435\u043a\u0442\u044b'}</span>
            <span className="qntyProjects">{sgProjects.v.length}</span>
          </span>
        </li>
        <li
          className="Header_list-li __contacts"
          onMouseEnter={() => showWithData?.('contacts')}
          onClick={() => {
            (window as any).ym?.(99631636, 'reachGoal', 'button_contact');
          }}
        >
          {'\u0441\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f'}
        </li>
      </ul>
      <Popup />
    </>
  );
}

export default memo(Header);
