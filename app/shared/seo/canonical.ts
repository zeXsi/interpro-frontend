import { SITE_URL } from './company';

const TRACKING_PARAM_NAMES = new Set([
  '_openstat',
  'fbclid',
  'gclid',
  'yclid',
]);

function lowercasePathText(pathname: string) {
  return pathname.replace(/%[0-9a-f]{2}|[^%]+|%/gi, (part) =>
    /^%[0-9a-f]{2}$/i.test(part) ? part.toUpperCase() : part.toLocaleLowerCase('ru-RU')
  );
}

/**
 * Единый вид адресов сайта: нижний регистр, без повторных и завершающих слешей.
 */
export function normalizeCanonicalPathname(pathname: string) {
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  const withoutTrailingSlash = collapsed === '/' ? collapsed : collapsed.replace(/\/+$/, '');
  return lowercasePathText(withoutTrailingSlash || '/');
}

/** Убирает только рекламные параметры; параметры, меняющие содержимое, сохраняются. */
export function normalizeCanonicalSearch(search = '') {
  const params = new URLSearchParams(search);

  for (const key of [...params.keys()]) {
    const normalizedKey = key.toLocaleLowerCase('en-US');
    if (normalizedKey.startsWith('utm_') || TRACKING_PARAM_NAMES.has(normalizedKey)) {
      params.delete(key);
    }
  }

  params.sort();
  const normalized = params.toString();
  return normalized ? `?${normalized}` : '';
}

export function getCanonicalUrl(pathname: string, search = '') {
  return `${SITE_URL}${normalizeCanonicalPathname(pathname)}${normalizeCanonicalSearch(search)}`;
}

/** Нормализует только внутренние ссылки и не затрагивает внешние адреса. */
export function normalizeInternalHref(href: string) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;

  const match = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return href;

  const [, pathname, search = '', hash = ''] = match;
  return `${normalizeCanonicalPathname(pathname)}${normalizeCanonicalSearch(search)}${hash}`;
}
