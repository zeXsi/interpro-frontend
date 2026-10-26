import './styles.css';
import useBreakpoints from '@qtpy/use-breakpoints';
import StartPage from 'shared/components/StartPage';

import { useEffect, useRef, useState } from 'react';
import { useLoaderData } from 'react-router';

import ProjectCard, { ProjectCardProps } from './ProjectCard';
import useEvent from '@qtpy/use-event';
import useRefMap from '@qtpy/use-ref-map';

import GridIcon from 'assets/icons/grid.svg?react';
import ListIcon from 'assets/icons/list.svg?react';

import ProjectCardList from './ProjectCardList';
import ModeSwitcher from './ModeSwitcher';
import FilterProject, { FilterItem, FilterProps } from 'shared/components/FilterProject';
import ContactForm from 'shared/components/ContactForm';

import ProjectCardTable from './ProjectCardTable';

import toFormatNames from 'shared/utils/toFormatNames';

import Link from 'shared/components/Link';
import { signal } from 'shared/utils/_stm';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { toFilterData, toggleFilter, UserFilter } from 'store/stGlobal';
import { sgProjects } from 'api/projects/projects.api';
import type { Project } from 'api/projects/projects.types';

import { getFilters } from 'api/filters';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';
import JsonLd from 'shared/seo/JsonLd';
import { getProjectsPageSchema } from 'shared/seo/schemas';

type ViewMode = 'grid' | 'list';
export const hoveredProject = signal(-Infinity);

export async function loader() {
  return getFilters();
}


const PROJECTS_TITLE = 'Interpro: проекты';
const PROJECTS_DESCRIPTION =
  'Посмотрите проекты Interpro: реальные кейсы успешных решений для бизнеса, которые демонстрируют наш опыт и профессионализм.';

export function meta() {
  return [
    { title: PROJECTS_TITLE },
    {
      name: 'description',
      content: PROJECTS_DESCRIPTION,
    },
    {
      property: 'og:title',
      content: PROJECTS_TITLE,
    },
    {
      property: 'og:description',
      content: PROJECTS_DESCRIPTION,
    },
  ];
}
export default function ProjectsPage() {
  const filters = useLoaderData<typeof loader>();
  useSignalValue(sgProjects);

  const [switchMode, setSwitchMode] = useState<ViewMode>('grid');
  const [isHydrated, setIsHydrated] = useState(false);
  const refContainer = useRef<HTMLDivElement>(null);
  const refImg = useRef<HTMLDivElement>(null);

  const cardRefs = useRefMap<HTMLDivElement>();

  const prevScrollY = useRef(0);
  const deltaY = useRef(0);
  const filteredData = toFilterData(sgProjects.v);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeProject = filteredData[activeIndex] ?? filteredData[0];
  const breakpoint = useBreakpoints<'desktop' | 'mobile'>(
    {
      1024: 'desktop',
      0: 'mobile',
    },
    500
  );
  // Match the server's mobile layout until hydration has completed.
  const mode = `${isHydrated ? breakpoint : 'mobile'}_${switchMode}` as SwitchModeDesktopProps['mode'];
  useEvent(
    'scroll',
    () => {
      if (mode !== 'desktop_grid') return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      deltaY.current = scrollTop - prevScrollY.current;
      prevScrollY.current = scrollTop;

      for (let i = 0; i < filteredData.length; i++) {
        const key = `project_${i}`;
        const el = cardRefs.getRef(key).current;
        if (!el) return;
        const offset = (n: number) => el.offsetTop - el.offsetHeight * n;
        const isLast = i === filteredData.length - 1;

        if (deltaY.current > 0) {
          if (isLast && offset(1.2) <= scrollTop) {
            setActiveIndex(i);
            return;
          }
          if (offset(0.9) <= scrollTop) {
            setActiveIndex(i);
          }
        } else if (offset(1.4) <= scrollTop) {
          setActiveIndex(i);
        }
      }
    },
    {}
  );

  useEffect(() => {
    setIsHydrated(true);
    toggleFilter.toClear();
  }, []);

  const onClick: FilterProps['onClick'] = (tagName, id, isClearAll) => {
    setActiveIndex(0);
    if (isClearAll) return toggleFilter.toClear();
    toggleFilter(tagName as keyof UserFilter, Number(id));
  };
  return (
    <StartPage>
      <JsonLd
        data={getProjectsPageSchema({
          description: PROJECTS_DESCRIPTION,
          projects: sgProjects.v.map((project) => ({
            slug: project.slug,
            name: project.payload?.title || project.title?.rendered,
          })),
        })}
      />
      <div className="ProjectPage px">
        <div className="ProjectPage-title">
          <h1>Проекты</h1>
          <span>( {filteredData.length} )</span>
        </div>

        <div className="ProjectPage_filter-ModeSwitcher ">
          <FilterProject onClick={onClick} items={mapFiltersToFilterProject(filters, sgProjects.v)} />

          <ModeSwitcher<ViewMode>
            startVal="grid"
            onClick={setSwitchMode}
            list={[
              ['grid', 'Карточки', GridIcon],
              ['list', 'Список', ListIcon],
            ]}
          />
        </div>

        <div className={`ProjectPage_container __${mode}`} ref={refContainer}>
          <div className="ProjectPage_container-left">
            {filteredData.map(({ id, slug, payload, link }, index, arr) => {
              const nextItem = arr[index + 1];

              return (
                <div ref={cardRefs.getRef(`project_${index}`) as any} key={id}>
                  <SwitchModeDesktop
                    keyName={`project_${index}`}
                    key={`project_${id}`}
                    id={id}
                    slug={slug}
                    nextItem={{ id: nextItem?.id, title: nextItem?.payload.title }}
                    mode={mode as any}
                    title={payload.title}
                    description={payload.about}
                    image={payload.cover}
                    year={payload.meta.year?.name ?? ''}
                    typeStand={toFormatNames(payload.meta.type_tax)}
                    nameExhibition={toFormatNames(payload.meta.exhibition)}
                    link={link}
                  />
                </div>
              );
            })}
          </div>
          <div className={`ProjectPage_container-right __${mode}`} ref={refImg}>
            {activeProject && (
              <Img
                key={activeProject.id}
                title={activeProject.payload.title}
                cover={activeProject.payload.cover}
                slug={activeProject.slug}
                id={activeProject.id}
              />
            )}
          </div>
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}

interface ImgProps {
  title: string;
  cover: string;
  slug: string;
  id: number;
}

function Img({ title, cover, id, slug }: ImgProps) {
  const projectTitle = decodeUnicodeEscapes(title);

  const clIsHover = hoveredProject.v == id ? 'isHover' : '';

  return (
    <Link to={`/projects/${slug}`} slug={projectTitle}>
      <div className={`ProjectCardImg ${clIsHover}`}>
        <img
          onMouseEnter={() => (hoveredProject.v = id)}
          onMouseLeave={() => (hoveredProject.v = -id)}
          src={cover}
          alt={`Обложка проекта: ${projectTitle}`}
        />
      </div>
    </Link>
  );
}

interface SwitchModeDesktopProps extends ProjectCardProps {
  mode: 'mobile_list' | 'desktop_list' | 'mobile_grid' | 'desktop_grid';
  keyName: string;
}
function SwitchModeDesktop(props: SwitchModeDesktopProps) {
  switch (props.mode) {
    case 'desktop_grid':
      return <ProjectCard {...props} />;
    case 'desktop_list':
      return <ProjectCardList {...props} />;
    case 'mobile_grid':
      return <ProjectCard {...props} />;
    case 'mobile_list':
      return <ProjectCardTable {...props} />;
  }
}

interface ExhibitionStandItem {
  id: number;
  slug: string;
  name: string;
  count: number;
}

type ExhibitionStandField =
  | ExhibitionStandItem[]
  | Record<string, ExhibitionStandItem>
  | undefined
  | null;

interface ExhibitionStand {
  exhibition_stand?: ExhibitionStandField;
  type_stand?: ExhibitionStandField;
  year_stand?: ExhibitionStandField;
}

function normalizeField(
  field: ExhibitionStandField,
  projectTerms: { id: number; name: string }[]
): { id: number; name: string }[] {
  const items = new Map(
    Object.values(field ?? {}).map(({ id, name }) => [id, { id, name }])
  );
  // A stale or incomplete facets response must not hide terms of available projects.
  for (const term of projectTerms) {
    if (!items.has(term.id)) items.set(term.id, { id: term.id, name: term.name });
  }
  return [...items.values()];
}

function mapFiltersToFilterProject(data: ExhibitionStand, projects: Project[]): FilterItem[] {
  return [
    {
      filterName: 'Выставка',
      filterType: 'exhibition_stand',
      items: normalizeField(
        data.exhibition_stand,
        projects.flatMap((project) => project.payload.meta.exhibition)
      ),
    },
    {
      filterName: 'Тип стенда',
      filterType: 'type_stand',
      items: normalizeField(
        data.type_stand,
        projects.flatMap((project) => project.payload.meta.type_tax)
      ),
    },
    {
      filterName: 'Год',
      filterType: 'year_stand',
      items: normalizeField(
        data.year_stand,
        projects.flatMap((project) => project.payload.meta.year ? [project.payload.meta.year] : [])
      ).sort((a, b) => Number(b.name) - Number(a.name)),
    },
  ];
}
