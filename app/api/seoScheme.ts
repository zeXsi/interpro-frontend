import { Project } from "./projects/projects.types";

export default function seoScheme(projects: Project[]) {
  const scheme = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Наши проекты',
    url: 'https://interpro.pro/',
    itemListElement: projects.map((project, index) => ({
      '@type': 'CreativeWork',
      position: index + 1,
      name: project.title?.rendered || project.payload?.title || 'Без названия',
      url: project.link || '#',
      description: project.payload?.seo?.description || project.payload?.about || '',
      datePublished: project.date || undefined,
      dateModified: project.modified || undefined,
      image: project.payload?.cover || undefined,
      about: {
        '@type': 'Thing',
        name: project.payload?.meta?.exhibition?.map((ex) => ex.name).join(', ') || 'Не указано',
      },
      keywords: [
        ...(project.payload?.meta?.type_tax?.map((type) => type.name) || []),
        project.payload?.meta?.year?.name || '',
      ]
        .filter(Boolean)
        .join(', '),
    })),
  };

  return JSON.stringify(scheme);
}