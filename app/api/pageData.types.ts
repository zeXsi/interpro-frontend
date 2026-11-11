import type { HomeServiceNavigationNode } from './home/home.types';
import type { Project } from './projects/projects.types';

export interface ShellData {
  projectCount: number;
  servicesNavigation: HomeServiceNavigationNode[];
}

export type ProjectCard = Pick<
  Project,
  'id' | 'slug' | 'link' | 'title' | 'type-stand' | 'year-stand' | 'exhibition-stand'
> & {
  payload: Pick<Project['payload'], 'title' | 'about' | 'cover' | 'meta'>;
};
