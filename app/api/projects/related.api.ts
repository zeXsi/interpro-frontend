import type { HomeProject } from 'api/home/home.types';
import { QUERY_FAMILIES } from 'api/queryFamilies';
import { createQuery } from 'shared/utils/querySignal';

export type RelatedProject = Omit<HomeProject, 'year'>;

const relatedProjects = createQuery<RelatedProject[], { id: number }>({
  endpoint: '/project-related',
  family: QUERY_FAMILIES.projects,
  stateKey: 'project-related',
  initial: [],
  // Случайную выборку получаем в loader, затем одинаково рендерим на сервере и клиенте.
  ttlMs: 0,
});

export const getRelatedProjects = (id: number) => relatedProjects.fetch({ id });
