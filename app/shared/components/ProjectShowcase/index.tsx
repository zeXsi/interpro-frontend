import './styles.css';

import useEvent from '@qtpy/use-event';
import useRefMap from '@qtpy/use-ref-map';
import { useRef, useState } from 'react';
import { hoveredProject } from 'pages/Projects';
import ProjectCard, { type ProjectCardProps } from 'pages/Projects/ProjectCard';
import Link from 'shared/components/Link';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

export type ShowcaseProject = Omit<ProjectCardProps, 'nextItem'>;

export default function ProjectShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const cardRefs = useRefMap<HTMLDivElement>();
  const prevScrollY = useRef(0);
  const deltaY = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const mode = 'desktop_grid' as const;

  useEvent(
    'scroll',
    () => {
      if (window.innerWidth <= 1024) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      deltaY.current = scrollTop - prevScrollY.current;
      prevScrollY.current = scrollTop;

      for (let index = 0; index < projects.length; index++) {
        const element = cardRefs.getRef(`project_${index}`).current;
        if (!element) continue;

        const offset = (factor: number) => element.offsetTop - element.offsetHeight * factor;
        const isLast = index === projects.length - 1;

        if (deltaY.current > 0) {
          if ((isLast && offset(1.2) <= scrollTop) || offset(0.9) <= scrollTop) {
            setActiveIndex(index);
          }
        } else if (offset(1.4) <= scrollTop) {
          setActiveIndex(index);
        }
      }
    },
    {}
  );

  return (
    <div className={`ProjectShowcase __${mode}`}>
      <div className="ProjectShowcase-left">
        {projects.map((project, index) => (
          <div ref={cardRefs.getRef(`project_${index}`) as any} key={project.id}>
            <ProjectCard {...project} nextItem={{}} />
          </div>
        ))}
      </div>
      <div className={`ProjectShowcase-right __${mode}`}>
        {projects[activeIndex] && <ProjectImage project={projects[activeIndex]} />}
      </div>
    </div>
  );
}

function ProjectImage({ project }: { project: ShowcaseProject }) {
  const title = decodeUnicodeEscapes(project.title);
  const isHover = hoveredProject.v === project.id ? 'isHover' : '';

  return (
    <Link to={`/projects/${project.slug}`} slug={title}>
      <div className={`ProjectShowcase-image ${isHover}`}>
        <img
          src={project.image}
          alt={`Обложка проекта: ${title}`}
          onMouseEnter={() => (hoveredProject.v = project.id)}
          onMouseLeave={() => (hoveredProject.v = -project.id)}
        />
      </div>
    </Link>
  );
}
