import type { MetaDescriptor } from 'react-router';

import defaultOgImage from 'assets/imgs/hero.webp';
import { COMPANY, SITE_URL } from './company';

interface OpenGraphMetaOptions {
  title: string;
  description: string;
  pathname?: string;
  image?: string | null;
  type?: string;
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, `${baseUrl}/`).toString();
  } catch {
    return value;
  }
}

export function getOpenGraphMeta({
  title,
  description,
  pathname = '/',
  image,
  type = 'website',
}: OpenGraphMetaOptions): MetaDescriptor[] {
  const siteUrl = (import.meta.env.VITE_ORIGINAL_URL || SITE_URL).replace(/\/$/, '');
  const url = toAbsoluteUrl(pathname, siteUrl);
  const imageUrl = toAbsoluteUrl(image || defaultOgImage, siteUrl);

  return [
    { title },
    { name: 'description', content: description },

    { property: 'og:type', content: type },
    { property: 'og:site_name', content: COMPANY.name },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
  ];
}
