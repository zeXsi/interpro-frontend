const SITE_ORIGIN = 'https://interpro.pro';
const WORDPRESS_ORIGIN = 'https://api.interpro.pro';

function configuredCdnOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function hasInvalidUrlText(value: string) {
  return /[\u0000-\u001f\u007f\\]/.test(value) || /%(?![0-9a-f]{2})/i.test(value);
}

function eligibleSuffix(value: string): string | null {
  if (hasInvalidUrlText(value) || value.startsWith('//')) return null;

  if (value.startsWith('/')) {
    try {
      const url = new URL(value, SITE_ORIGIN);
      return url.pathname.startsWith('/videos/') ? value : null;
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;

    const isVideo = url.origin === SITE_ORIGIN && url.pathname.startsWith('/videos/');
    const isWordPressUpload =
      url.origin === WORDPRESS_ORIGIN && url.pathname.startsWith('/wp-content/uploads/');

    if (!isVideo && !isWordPressUpload) return null;

    const suffix = value.match(/^[a-z][a-z\d+.-]*:\/\/[^/?#]+(\/.*)$/i)?.[1];
    return suffix ?? null;
  } catch {
    return null;
  }
}

export function toCdnMediaUrl(value: string, cdnOrigin?: unknown): string;
export function toCdnMediaUrl<T>(value: T, cdnOrigin?: unknown): T;
export function toCdnMediaUrl(
  value: any,
  cdnOrigin: unknown = import.meta.env?.VITE_CDN_ORIGIN
): any {
  if (typeof value !== 'string') return value;

  const origin = configuredCdnOrigin(cdnOrigin);
  if (!origin) return value;

  const suffix = eligibleSuffix(value);
  return suffix ? `${origin}${suffix}` : value;
}

export function toCdnMediaUrls<T>(value: T, cdnOrigin = import.meta.env?.VITE_CDN_ORIGIN): T {
  if (typeof value === 'string') return toCdnMediaUrl(value, cdnOrigin) as T;

  if (Array.isArray(value)) {
    return value.map((item) => toCdnMediaUrls(item, cdnOrigin)) as T;
  }

  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return value;

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toCdnMediaUrls(item, cdnOrigin)])
    ) as T;
  }

  return value;
}
