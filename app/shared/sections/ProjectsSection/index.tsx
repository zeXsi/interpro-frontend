import './styles.css';
import Subtitle from 'shared/components/Subtitle';

import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import useEvent from '@qtpy/use-event';
import { useDebouncedUpdate } from 'shared/hooks/useDebouncedUpdate';
import Button from 'shared/components/Button';

import useRefMap from '@qtpy/use-ref-map';
import { useNavigate } from 'shared/components/NavigationTracker';

import Degree from 'shared/components/Degree';

import IsNot from 'shared/components/IsNot';

import { sgProjects } from 'api/projects/projects.api';
import { signal } from 'shared/utils/_stm';
import { useSignalValue, useWatch } from 'shared/utils/_stm/react/react';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';
import type { HomeProject } from 'api/home/home.types';

export const hoveredProject = signal(-Infinity);

interface ProjectsSectionProps {
  items?: HomeProject[];
  total?: number;
}

export default function ProjectsSection({ items, total }: ProjectsSectionProps) {
  const { goTo } = useNavigate();
  const refsProjects = useRefMap<ProjectRef>();

  const dataMax: ProjectPreview[] = items ?? sgProjects.v.slice(0, 5).map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.payload.title,
    exhibition: project.payload.meta?.exhibition[0]?.name ?? null,
    year: project.payload.meta?.year?.name ?? null,
    area: project.payload.meta?.area ?? 0,
    cover: project.payload.cover ? { url: project.payload.cover } : null,
  }));

  return (
    <div className="ProjectsSection px">
      <Subtitle className="Projects_subtitle">( проекты )</Subtitle>
      <div className="ProjectsSection-container">
        <ProjectTitles projects={dataMax} />
        <div className="ProjectsSection-container-items">
          {dataMax.map(({ title, exhibition, year, area, cover, slug, id }, index) => {
            return (
              <ProjectItem
                key={index}
                title={title}
                slug={slug}
                id={id}
                ref={refsProjects.getRef(`project_${index}`)}
                nameCompany={exhibition || 'нет'}
                year={year || 'нет'}
                square={<Degree text={`${area} м`} degree={2} />}
                cover={cover}
              />
            );
          })}
        </div>
      </div>
      <div className="Projects_footer">
        <Button variant="link" onClick={() => goTo('/projects')}>
          Все проекты
        </Button>
        <Button variant="link" className="Projects_footer-qty" onClick={() => goTo('/projects')}>
          {total ?? sgProjects.v.length}
        </Button>
      </div>
    </div>
  );
}

interface ProjectProps {
  nameCompany: string;
  year: number | string;
  square: string | React.JSX.Element;
  cover: HomeProject['cover'];
  title: string;
  slug: string;
  id: number;
  ref: React.RefObject<ProjectRef>;
}

interface ProjectRef {
  refProject: React.RefObject<HTMLDivElement | null>;
  title: string;
  slug: string;
}

type ProjectPreview = Pick<HomeProject, 'id' | 'slug' | 'title' | 'exhibition' | 'year' | 'area' | 'cover'>;

function ProjectItem({ ref, id, slug, title, nameCompany, year, square, cover }: ProjectProps) {
  useSignalValue(hoveredProject);
  const refProject = useRef<HTMLDivElement>(null);
  const projectTitle = decodeUnicodeEscapes(title);

  const clIsHover = hoveredProject.v == id ? 'isHover' : '';

  const { goTo } = useNavigate();

  useImperativeHandle(ref, () => ({
    refProject,
    title: projectTitle,
    slug,
  }));

  return (
    <div ref={refProject} className="Project">
      <div className="Project-title">{projectTitle}</div>
      <div className="Project_container">
        <div className="Project_header">
          <IsNot
            value={nameCompany}
            children={<span className="header-company">{nameCompany}</span>}
          />
          <div className="wrap-header-y-s">
            <IsNot value={year} children={<span className="header-year">{year}</span>} />
            <IsNot value={square} children={<span className="header-square">{square}</span>} />
          </div>
        </div>
        <div
          className={`Project_img ${clIsHover}`}
          onMouseEnter={() => hoveredProject.v = id}
          onMouseLeave={() => hoveredProject.v = -id}
          onClick={() => goTo(`/projects/${slug}`, projectTitle)}
        >
          <img
            src={cover?.url}
            srcSet={cover?.srcset || undefined}
            sizes={cover?.sizes || undefined}
            width={cover?.width || undefined}
            height={cover?.height || undefined}
            alt={`Проект: ${projectTitle}, выставка ${nameCompany}, ${year} год`}
          />
        </div>
      </div>
    </div>
  );
}

interface ProjectTitlesProps {
  projects: ProjectPreview[];
}

export function ProjectTitles({ projects }: ProjectTitlesProps) {
  const refContainer = useRef<HTMLDivElement>(null);
  const refsH1 = useRefMap<HTMLParagraphElement | null>();

  const refAccumulatedHeight = useRef(0);

  const recalculateHeights = () => {
    let accumulatedHeight = 0;
    let heightArr: number[] = [];
    const keys = refsH1.getAllKeys();
    const countKeys = keys.length;
    keys.forEach((key, index) => {
      const h1 = refsH1.getRef(key).current;
      if (h1) {
        h1.style.setProperty('--newHeight', '');
        h1.offsetHeight;
        const height = h1.offsetHeight;

        h1.style.setProperty('--accHeightTitle', `${accumulatedHeight}px`);
        h1.style.setProperty('--indexProject', `${index}`);

        accumulatedHeight += height;
        refAccumulatedHeight.current = accumulatedHeight;
        heightArr[index] = height;
      }
    });

    let accHBefore = 0;
    keys.forEach((key, index) => {
      const h1 = refsH1.getRef(key).current;
      if (h1) {
        let accH = 0;
        for (let i = index; i < countKeys; i++) {
          accH += heightArr[i];
        }

        h1.style.setProperty('--newHeight', `${accH}px`);
        h1.style.setProperty('--heightBefore', `${accHBefore}px`);
        accHBefore = accH;
      }
    });
  };

  const [toUpdate] = useDebouncedUpdate<void>(() => {
    recalculateHeights();
  }, 300);

  useLayoutEffect(() => {
    toUpdate();
    return toUpdate;
  }, [toUpdate]);

  useEvent('resize', () => toUpdate(), false, 'window', [toUpdate]);

  return (
    <div
      ref={refContainer}
      className="ProjectsSection-container-titles"
      style={{ position: 'relative' }}
    >
      {projects.map((props, index, arr) => {
        const isLast = index >= arr.length - 1 ? 'isLast' : '';
        return (
          <p
            key={index}
            ref={refsH1.getRef(`project_${index}`) as any}
            className={`Project-title-animate ${isLast}`}
            children={<ButtonWrap slug={props.slug} id={props.id} title={props.title} />}
          />
        );
      })}
    </div>
  );
}

interface Props {
  slug: string;
  title: string;
  id: number;
}
function ButtonWrap({ slug, id, title }: Props) {
  useSignalValue(hoveredProject);
  const refButton = useRef<HTMLButtonElement | null>(null);
  const projectTitle = decodeUnicodeEscapes(title);

  const { goTo } = useNavigate();

  useWatch(() => { 
   const button = refButton.current;
    if (!button) return;
    if (hoveredProject.v < 0 && button.classList.contains('left-right')) {
      button.classList.add('isFeedOut');
      return;
    }
    if (Math.abs(id) === hoveredProject.v) {
      button.classList.remove('isFeedOut');
    }
  })


  return (
    <Button
      variant="link"
      underline="left-right"
      className={`Project-title-button`}
      onClick={() => {
        goTo(`/projects/${slug}`, projectTitle);
      }}
      isHover={id === hoveredProject.v}
      onMouseEnter={() => hoveredProject.v = id}
      onMouseLeave={() => hoveredProject.v = -id}
      ref={refButton}
    >
      {projectTitle}
    </Button>
  );
}
