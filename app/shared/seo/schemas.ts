import { COMPANY, SITE_URL } from './company';

type PageSchemaOptions = {
  title: string;
  description: string;
};

type ServiceCategorySchemaOptions = PageSchemaOptions & {
  slug: string;
  name: string;
  serviceDescription: string;
};

type ProjectListItem = {
  slug: string;
  name: string;
};

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

function getOrganizationNode() {
  return {
    '@type': 'Organization',
    '@id': organizationId,
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: COMPANY.url,
    logo: {
      '@type': 'ImageObject',
      url: COMPANY.logo,
    },
    telephone: COMPANY.phone,
    email: COMPANY.email,
    taxID: COMPANY.taxId,
    identifier: [
      {
        '@type': 'PropertyValue',
        propertyID: 'ОГРН',
        value: COMPANY.ogrn,
      },
      {
        '@type': 'PropertyValue',
        propertyID: 'КПП',
        value: COMPANY.kpp,
      },
    ],
    address: {
      '@type': 'PostalAddress',
      postalCode: COMPANY.address.postalCode,
      addressCountry: COMPANY.address.country,
      addressLocality: COMPANY.address.city,
      streetAddress: COMPANY.address.street,
    },
  };
}

export function getHomePageSchema({ title, description }: PageSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationNode(),
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: COMPANY.url,
        name: COMPANY.name,
        publisher: {
          '@id': organizationId,
        },
        inLanguage: 'ru-RU',
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: COMPANY.url,
        name: title,
        description,
        isPartOf: {
          '@id': websiteId,
        },
        about: {
          '@id': organizationId,
        },
        inLanguage: 'ru-RU',
      },
    ],
  };
}

export function getContactsPageSchema() {
  return {
    '@context': 'http://schema.org',
    '@type': 'LocalBusiness',
    name: COMPANY.legalName,
    telephone: COMPANY.displayPhone,
    email: '',
    address: {
      '@type': 'PostalAddress',
      streetAddress:
        '129226, г. Москва, ул. Сельскохозяйственная, д. 4, стр. 16, эт.1, пом. II , ком. 3',
    },
  };
}

export function getServiceCategoryPageSchema({
  slug,
  title,
  description,
  name,
  serviceDescription,
}: ServiceCategorySchemaOptions) {
  const canonicalUrl = `${SITE_URL}/services/${slug}`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const serviceId = `${canonicalUrl}#service`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        isPartOf: {
          '@id': websiteId,
        },
        breadcrumb: {
          '@id': breadcrumbId,
        },
        mainEntity: {
          '@id': serviceId,
        },
        inLanguage: 'ru-RU',
      },
      {
        '@type': 'Service',
        '@id': serviceId,
        name,
        serviceType: name,
        description: serviceDescription,
        url: canonicalUrl,
        provider: {
          '@id': organizationId,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Главная',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Услуги',
            item: `${SITE_URL}/services`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
}

export function getProjectsPageSchema({
  description,
  projects,
}: {
  description: string;
  projects: ProjectListItem[];
}) {
  const canonicalUrl = `${SITE_URL}/projects`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const projectsListId = `${canonicalUrl}#projects-list`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: 'Проекты',
        description,
        breadcrumb: {
          '@id': breadcrumbId,
        },
        mainEntity: {
          '@id': projectsListId,
        },
        isPartOf: {
          '@id': websiteId,
        },
        inLanguage: 'ru-RU',
      },
      {
        '@type': 'ItemList',
        '@id': projectsListId,
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: project.name,
          url: `${canonicalUrl}/${project.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Главная',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Проекты',
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: COMPANY.url,
    logo: COMPANY.logo,
    image: COMPANY.image,
    telephone: COMPANY.phone,
    email: COMPANY.email || undefined,
    sameAs: COMPANY.sameAs.length ? COMPANY.sameAs : undefined,
  };
}

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: COMPANY.name,
    url: COMPANY.url,
    image: COMPANY.image,
    logo: COMPANY.logo,
    telephone: COMPANY.phone,
    email: COMPANY.email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: COMPANY.address.country,
      addressLocality: COMPANY.address.city,
      streetAddress: COMPANY.address.street || undefined,
      postalCode: COMPANY.address.postalCode || undefined,
    },
  };
}

export function getBreadcrumbSchema(pathname: string) {
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '');

  if (!cleanPath || cleanPath === '/') {
    return null;
  }

  const parts = cleanPath.split('/').filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: SITE_URL,
      },
      ...parts.map((part, index) => {
        const url = `${SITE_URL}/${parts.slice(0, index + 1).join('/')}`;

        return {
          '@type': 'ListItem',
          position: index + 2,
          name: decodeURIComponent(part)
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          item: url,
        };
      }),
    ],
  };
}

type FaqItem = {
  question?: string;
  answer?: string;
};

type ReviewItem = {
  title?: string;
  content?: string;
  content_plain?: string;
};

export function getFaqSchema(items?: FaqItem[]) {
  const preparedItems = items?.filter((item) => item.question && item.answer) ?? [];

  if (!preparedItems.length) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preparedItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function getReviewSchemas(items?: ReviewItem[]) {
  const preparedItems =
    items?.filter((item) => item.title && (item.content_plain || item.content)) ?? [];

  if (!preparedItems.length) {
    return null;
  }

  return preparedItems.map((item) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Organization',
      name: COMPANY.name,
      url: SITE_URL,
    },
    author: {
      '@type': 'Person',
      name: item.title,
    },
    reviewBody: item.content_plain || item.content,
  }));
}

type ArticleSchemaItem = {
  slug?: 'news' | 'blog';
  article?: {
    slug?: string;
    date?: string;
    modified?: string;
    link?: string;
    payload?: {
      title?: string;
      subtitle?: string;
      date?: string;
      cover?:
        | {
            url?: string;
          }
        | string
        | null;
      blocks?: Array<{
        title?: string;
        descriptions?: string[];
      }>;
    };
  };
};

function toPlainText(value?: string) {
  return value
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getArticleSchema(data?: ArticleSchemaItem) {
  if (data?.slug !== 'blog') {
    return null;
  }

  const article = data.article;

  if (!article?.payload?.title) {
    return null;
  }

  const payload = article.payload;
  const cover = payload.cover;
  const image = typeof cover === 'string' ? cover : cover?.url;
  const description = payload.subtitle || '';
  const pathname = article.slug ? `/blog/${article.slug}` : '';
  const articleBody = [
    payload.subtitle,
    ...(payload.blocks?.flatMap((block) => [block.title, ...(block.descriptions ?? [])]) ?? []),
  ]
    .map(toPlainText)
    .filter(Boolean)
    .join('\n\n');

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: payload.title,
    description,
    articleBody: articleBody || undefined,
    image: image || undefined,
    datePublished: payload.date || article.date || undefined,
    dateModified: article.modified || payload.date || article.date || undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${pathname}`,
    },
    author: {
      '@type': 'Organization',
      name: COMPANY.name,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      logo: {
        '@type': 'ImageObject',
        url: COMPANY.logo,
      },
    },
  };
}

type FeedbackReviewItem = {
  payload?: {
    title?: string;
    company?: string;
    person?: {
      name?: string;
      position?: string;
    };
    text?: string;
    date?: string;
  };
};

export function getFeedbackReviewSchemas(items?: FeedbackReviewItem[]) {
  const preparedItems =
    items?.filter(
      (item) => item.payload?.text && (item.payload?.person?.name || item.payload?.title)
    ) ?? [];

  if (!preparedItems.length) {
    return null;
  }

  return preparedItems.map((item) => {
    const payload = item.payload;

    return {
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Organization',
        name: COMPANY.name,
        url: SITE_URL,
      },
      author: {
        '@type': 'Person',
        name: payload?.person?.name || payload?.title,
      },
      reviewBody: payload?.text,
      datePublished: payload?.date || undefined,
    };
  });
}
