import { createQuery } from 'shared/utils/querySignal';
import type { Project } from './projects.types';
import { addNextItem } from 'shared/utils/addNextItem';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';
import { QUERY_FAMILIES } from 'api/queryFamilies';

function normalizeProject(project?: Project): Project | undefined {
  if (!project) return project;

  return {
    ...project,
    title: {
      ...project.title,
      rendered: decodeUnicodeEscapes(project.title?.rendered),
    },
    payload: {
      ...project.payload,
      title: decodeUnicodeEscapes(project.payload?.title),
      seo: {
        ...project.payload.seo,
        title: decodeUnicodeEscapes(project.payload.seo?.title),
      },
    },
  };
}

const qProjects = createQuery<Project[]>({
  endpoint: '/projects',
  family: QUERY_FAMILIES.projects,
  initial: [],
  middleware: (data) => {
    const normalizedData = data.map((project) => normalizeProject(project) as Project);
    addNextItem(normalizedData as any);
    return normalizedData;
  },
});

export const sgProjects = qProjects.sg;
export const getProjects = (): Promise<Project[] | null> => qProjects.fetch({});
export const primeProjects = (force = false, updateSignal = false) =>
  qProjects.prime({}, { force, updateSignal });

/**
 * Точечная выборка по списку слагов — одним запросом. Нужна лендингам, которые
 * показывают конкретные проекты: WP отдаёт их по slug даже с галочкой
 * «Приватный», хотя в общем списке (sgProjects) таких проектов нет.
 */
const qProjectsBySlugs = createQuery<Project[], { slug: string[] }>({
  endpoint: '/projects',
  family: QUERY_FAMILIES.projects,
  stateKey: 'projects-by-slugs',
  initial: [],
  middleware: (data) => data.map((project) => normalizeProject(project) as Project),
});

export const getProjectsBySlugs = (slugs: readonly string[]): Promise<Project[] | null> =>
  qProjectsBySlugs.fetch({ slug: [...slugs] });
export const primeProjectsBySlugs = (
  slugs: readonly string[],
  force = false,
  updateSignal = false
) => qProjectsBySlugs.prime({ slug: [...slugs] }, { force, updateSignal });

const qProjectById = createQuery<Project | undefined, { slug: string }, Project[]>({
  endpoint: '/projects',
  family: QUERY_FAMILIES.projects,
  parent: sgProjects,
  findInParent: (projects, params) => projects?.find((p) => p.slug === params.slug),
  takeFirst: true,
  initial: undefined,
  middleware: (project) => normalizeProject(project),
});

export const sgCurrProject = qProjectById.sg;
export const getProjectsById = (params: { slug: string }): Promise<Project | undefined> =>
  qProjectById.fetch(params);
