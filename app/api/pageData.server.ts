import { getHomeData } from './home/home.api';
import { getProjects } from './projects/projects.api';
import type { Project } from './projects/projects.types';
import type { ProjectCard, ShellData } from './pageData.types';

export async function getShellData(): Promise<ShellData> {
  const home = await getHomeData();
  return {
    projectCount: home.projects.total,
    servicesNavigation: home.services_navigation,
  };
}

export function toProjectCard(project: Project): ProjectCard {
  return {
    id: project.id,
    slug: project.slug,
    link: project.link,
    title: project.title,
    'type-stand': project['type-stand'],
    'year-stand': project['year-stand'],
    'exhibition-stand': project['exhibition-stand'],
    payload: {
      title: project.payload.title,
      about: project.payload.about,
      cover: project.payload.cover,
      meta: project.payload.meta,
    },
  };
}

export async function getProjectCards(): Promise<ProjectCard[]> {
  const projects = await getProjects();
  return (projects ?? []).map(toProjectCard);
}
