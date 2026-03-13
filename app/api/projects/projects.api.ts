import { createQuery } from 'shared/utils/querySignal';
import type { Project } from './projects.types';
import { addNextItem } from 'shared/utils/addNextItem';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

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
  initial: [],
  middleware: (data) => {
    const normalizedData = data.map((project) => normalizeProject(project) as Project);
    addNextItem(normalizedData as any);
    return normalizedData;
  },
});

export const sgProjects = qProjects.sg;
export const getProjects = (): Promise<Project[] | null> => qProjects.fetch({});

const qProjectById = createQuery<Project | undefined, { id: string }, Project[]>({
  endpoint: '/projects',
  parent: sgProjects,
  findInParent: (projects, params) => projects?.find((p) => p.slug === params.id),
  takeFirst: true,
  initial: undefined,
  middleware: (project) => normalizeProject(project),
});

export const sgCurrProject = qProjectById.sg;
export const getProjectsById = (params: { id: string }): Promise<Project | undefined> =>
  qProjectById.fetch(params);
