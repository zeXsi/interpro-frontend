import './styles.css';

import { useHidePreloader } from 'store/stPreloader';
import useMWNav, { MWNavMode } from '../popups/useMWNav';

import LogoIcon from 'assets/icons/logo.svg?react';
import { useNavigate } from '../NavigationTracker';

import { memo, useRef } from 'react';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { sgProjects } from 'api/projects/projects.api';

function Header() {
  const { goTo } = useNavigate();
  const { clIsHidePreload } = useHidePreloader();
  const mode = useSignalValue(MWNavMode);
  const { Popup, toOpenPopup, toClosePopup, showWithData, isShowed } = useMWNav();
  const name = !isShowed || mode === 'contacts' ? '( меню )' : '( закрыть )';
  const clIsOpenNav = isShowed ? 'isOpenNav' : '';

  const refHeader = useRef<HTMLUListElement>(null);
  const onMountEnter = () => {
    refHeader.current?.classList.add('willOpenNav');
    if (!isShowed) {
      toOpenPopup();
    } else if (mode === 'contacts') {
      showWithData('nav');
    }
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
            onClick={isShowed ? toClosePopup : toOpenPopup}
            children={name}
          />
          <span
            data-qnty={sgProjects.v.length}
            className="__projects"
            onClick={() => goTo('/projects')}
            // children={'Проекты'}
          >
            <span>Проекты</span>
            <span className="qntyProjects">{sgProjects.v.length}</span>
          </span>
        </li>
        <li className="Header_list-li __contacts" onMouseEnter={() => showWithData('contacts')}>
          связаться
        </li>
      </ul>
      <Popup />
    </>
  );
}

export default memo(Header);
