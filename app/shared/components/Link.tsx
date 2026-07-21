import { useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import { useLocation, Link as RouterLink } from 'react-router';
import { useNavigate as useNavTracker } from './NavigationTracker';
import { copyEmailToClipboard, isMailtoHref } from 'shared/utils/copyToClipboard';
import {
  findSection,
  scrollToPageBottom,
  scrollToSection,
} from 'shared/utils/scrollToSection';

interface LinkProps {
  to: string | string[];
  slug?: string[] | string;
  onClick?: () => void;
  typeLink?: 'external' | 'internal';
  disableMailtoCopy?: boolean;
  children: React.ReactNode;
}

const Link = ({ slug = [], ...props }: LinkProps) => {
  const { goTo } = useNavTracker();
  const lenis = useLenis();
  const timerRef = useRef<number | null>(null);
  const pendingHashRef = useRef<string | null>(null);
  const location = useLocation();

  const isHash = (s?: string) => !!s && s.startsWith('#');

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scrollToHash = (
    hash: string,
    attempts = 20,
    interval = 50,
    onFail?: () => void
  ) => {
    clearTimer();

    const tryScroll = () => {
      const el = findSection(hash);
      if (el) {
        scrollToSection(el);
        return;
      }

      if (attempts > 0) {
        timerRef.current = window.setTimeout(
          () => scrollToHash(hash, attempts - 1, interval, onFail),
          interval
        );
      } else {
        onFail?.();
      }
    };

    tryScroll();
  };

  const scrollTop = () => {
    clearTimer();
    if (lenis) {
      lenis.scrollTo(0, { offset: 0, duration: 1 });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const navigateWithCrumbs = (path: string) => {
    const slugArr =
      Array.isArray(slug) ? slug.filter(Boolean) : slug ? [slug] : [];
    goTo(path, ...slugArr);
  };

  useEffect(() => {
    clearTimer();

    const hash = pendingHashRef.current;
    if (hash) {
      pendingHashRef.current = null;
      scrollToHash(hash, 20, 50, scrollToPageBottom);
    }

    return clearTimer;
  }, [location.pathname]);

  const handleClickInternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    props.onClick?.();

    const to = props.to;

    if (Array.isArray(to)) {
      const path = to.find((t) => !isHash(t)) ?? null;
      const hash = to.find((t) => isHash(t)) ?? null;

      // Секция обычно есть в конце текущей страницы — тогда скроллим к ней,
      // а на запасную страницу уходим, только если её здесь нет
      if (hash && findSection(hash)) {
        scrollToHash(hash, 10, 20);
        return;
      }

      const isCurrPage = !path || path === location.pathname;

      if (!isCurrPage) {
        if (hash) pendingHashRef.current = hash;
        if (path) navigateWithCrumbs(path);
        return;
      }

      if (hash) {
        scrollToHash(hash, 10, 20, scrollToPageBottom);
      } else {
        scrollTop();
      }
    } else {
      const singleTo = to as string;

      if (isHash(singleTo)) {
        scrollToHash(singleTo, 10, 20);
      } else {
        pendingHashRef.current = null;
        navigateWithCrumbs(singleTo);
      }
    }
  };

  const href = Array.isArray(props.to)
    ? ((props.to.find((t) => !isHash(t)) ?? props.to[0]) as string)
    : (props.to as string);

  const handleClickExternal = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.();

    if (!isMailtoHref(href) || props.disableMailtoCopy) return;

    e.preventDefault();

    const isCopied = await copyEmailToClipboard(href);
    if (!isCopied) {
      window.location.href = href;
    }
  };

  if (props.typeLink === 'external') {
    return (
      <a
        className="Link"
        href={href}
        onClick={handleClickExternal}
        target="_blank"
        rel="noreferrer noreferrer nofollow"
        style={{ display: 'contents', color: 'unset' }}
      >
        {props.children}
      </a>
    );
  }

  return (
    <RouterLink
      className="Link"
      to={href}
      onClick={handleClickInternal}
      style={{ display: 'contents', color: 'unset' }}
    >
      {props.children}
    </RouterLink>
  );
};

export default Link;
