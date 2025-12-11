import { useLocation, useNavigate as _useNavigate } from 'react-router';
import './styles.css';

import React, { useEffect, useImperativeHandle, useRef } from 'react';

import { signal } from 'shared/utils/_stm';
import { Active } from 'shared/utils/_stm/react/Active';
import { sgIsErrorPage } from 'store/stGlobal';
import { useSignalValue } from 'shared/utils/_stm/react/react';

interface State {
  dynamicPath: string | null;
  routesName: Record<string, string>;
}

const initRoutes: State['routesName'] = {
  '/': 'главная',
  '/projects': 'проекты',
  '/cats': 'коты',
  '/thankyou': 'ваша заявка у нас',

  '/mapping': 'карта сайта',
  '/services': 'услуги',
  '/advertising-privacy': 'Политика рекламных материалов',
  '/excursion': 'экскурсия',
  '/blog': 'блог',
  '/news': 'новости',

  '/about-us': 'о компании',
  '/faq': 'частые вопросы',
  '/contacts': 'контакты',
  '/about-us/clients': 'клиенты',
  '/about-us/feedbacks': 'отзывы',
  '/about-us/certificates': 'лицензии и сертификаты',
};

const sgDynamicPath = signal<string | null>(null);
const sgRoutesName = signal<Record<string, string>>(initRoutes);
const isCrumbs = signal<null | boolean>(null);
export function useNavigate() {
  const location = useLocation();
  const navigate = _useNavigate();

  useEffect(() => {
    const currPath = sgDynamicPath.v;
    if (!currPath || !new RegExp(location.pathname).test(currPath)) {
      sgDynamicPath.v = location.pathname.match(/[^/]+$/)?.[0] || '';
    } else if (location.pathname !== currPath) {
      sgDynamicPath.v = location.pathname;
    }
  }, [location.pathname]);

  const currentPath = sgDynamicPath.v || location.pathname;

  const func = (path: string, ...customNames: string[]) => {
    const currPath = sgDynamicPath.v;
    if (currPath !== path) {
      const prevRoutes = sgRoutesName.v;
      const newRoutes: Record<string, string> = {};
      for (const key in prevRoutes) {
        if (key in initRoutes || !key.startsWith(path + '/')) {
          newRoutes[key] = prevRoutes[key];
        }
      }
      sgRoutesName.v = newRoutes;

      isCrumbs.v === false && navigate(path);
      sgDynamicPath.v = path;

      if (customNames.length) {
        sgRoutesName.v = {
          ...sgRoutesName.v,
          ...collectLinks(path, ...customNames),
        };
      }
    }
  };
  const setCrumbs = (path: string, ...customNames: string[]) => {
    isCrumbs.v = true;
    func(path, ...customNames);
  };

  const goTo = (path: string, ...customNames: string[]) => {
    isCrumbs.v = false;
    func(path, ...customNames);
  };

  function collectLinks(path: string, ...customNames: string[]): Record<string, string> {
    const parts = path.split('/').filter(Boolean);
    const result: Record<string, string> = {};

    const serviceIndex = parts.indexOf(parts[0]);
    if (serviceIndex === -1) return result;

    let currentPath = `/${parts[0]}`;
    let nameIndex = 0;

    for (let i = serviceIndex + 1; i < parts.length; i++) {
      currentPath += '/' + parts[i];

      if (customNames[nameIndex]) {
        result[currentPath] = customNames[nameIndex];
        nameIndex++;
      }
    }

    return result;
  }

  const getRouteName = (path: string | null) => {
    if (!path) return path;
    const routes = sgRoutesName.v;
    const name = routes[path];
    if (name === ':false') return null;
    return name || path;
  };

  const reloadPage = () => {
    sgDynamicPath.v = location.pathname;
    window.location.reload();
  };

  return {
    reloadPage,
    currentPath,
    goTo,
    setCrumbs,
    getRouteName,
  };
}

export interface ImpRefNav {
  refNavContainer: React.RefObject<HTMLDivElement | null>;
}

interface Props {
  ref?: React.RefObject<Partial<ImpRefNav>>;
}

export default function NavigationTracker({ ref }: Props) {
  useSignalValue(isCrumbs);
  const location = useLocation();
  const { goTo, getRouteName } = useNavigate();

  const pathnames = location.pathname.split('/').filter(Boolean);
  const refNv = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    refNavContainer: refNv,
  }));

  return (
    <Active sg={sgIsErrorPage} is={false}>
      <div className="NavigationTracker pt-header px" ref={refNv}>
        {['', ...pathnames].map((_, index) => {
          const { to, isLastItem } = getPathInfo(index, pathnames);
          const label = getRouteName(to);
          if (!label || isDynamicAndNotLoaded(to, label, pathnames, index)) {
            return null;
          }

          const isActive = location.pathname === to;
          const shouldRenderLineResult = shouldRenderLine(index, pathnames, getRouteName);
          return (
            <React.Fragment key={to}>
              <span
                onClick={isLastItem ? () => goTo(to) : undefined}
                className={`NavigationTracker-item ${isActive ? 'active' : ''}`}
                children={label}
              />
              {isLastItem && shouldRenderLineResult && (
                <span className="NavigationTracker-line line">-</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Active>
  );
}

const getPathInfo = (index: number, pathnames: string[]) => {
  const to = index === 0 ? '/' : `/${pathnames.slice(0, index).join('/')}`;
  const isLastItem = index !== pathnames.length;
  return { to, isLastItem };
};

const isDynamicAndNotLoaded = (to: string, label: string, pathnames: string[], index: number) => {
  const isDynamicPath = pathnames.length > 1 && index === pathnames.length;
  const isRouteNameLoaded = label !== to;
  return isDynamicPath && !isRouteNameLoaded;
};

const shouldRenderLine = (
  index: number,
  pathnames: string[],
  getRouteName: (path: string | null) => string | null
) => {
  const nextIndex = index + 1;
  const nextTo =
    nextIndex <= pathnames.length ? `/${pathnames.slice(0, nextIndex).join('/')}` : null;
  const nextLabel = nextTo ? getRouteName(nextTo) || pathnames[nextIndex - 1] : null;
  const isNextDynamicPath = nextIndex === pathnames.length && pathnames.length > 1;
  const isNextRouteNameLoaded = nextLabel !== nextTo;
  return !(isNextDynamicPath && !isNextRouteNameLoaded);
};
