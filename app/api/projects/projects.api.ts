import { createQuery } from 'shared/utils/querySignal';
import type { Project } from './projects.types';
import { addNextItem } from 'shared/utils/addNextItem';

const qProjects = createQuery<Project[]>({
  endpoint: '/projects',
  initial: [],
  middleware: (data) => {
    addNextItem(data as any);
    return data;
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
});

export const sgCurrProject = qProjectById.sg;
export const getProjectsById = (params: { id: string }): Promise<Project | undefined> =>
  qProjectById.fetch(params);
