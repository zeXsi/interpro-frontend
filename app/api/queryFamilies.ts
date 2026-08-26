export const QUERY_FAMILIES = {
  projects: 'projects',
  services: 'services',
  news: 'news',
  blog: 'blog',
  feedbacks: 'feedbacks',
  faqs: 'faqs',
  licenses: 'licenses',
} as const;

export type QueryFamily = (typeof QUERY_FAMILIES)[keyof typeof QUERY_FAMILIES];
