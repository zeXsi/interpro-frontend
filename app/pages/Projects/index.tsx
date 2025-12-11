import './styles.css';
import useBreakpoints from '@qtpy/use-breakpoints';
import StartPage from 'shared/components/StartPage';

import { useEffect, useRef, useState } from 'react';

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

import { useNavigate } from 'shared/components/NavigationTracker';
import toFormatNames from 'shared/utils/toFormatNames';

import Link from 'shared/components/Link';
import { signal } from 'shared/utils/_stm';
import { toFilterData, toggleFilter, UserFilter } from 'store/stGlobal';
import { sgProjects } from 'api/projects/projects.api';

import { getFilters, sgFilters } from 'api/filters';

type ViewMode = 'grid' | 'list';
export const hoveredProject = signal(-Infinity);

export async function clientLoader() {
  await getFilters();
}


export function meta() {
  const title = 'Interpro: проекты';
  const description =
    'Посмотрите проекты Interpro: реальные кейсы успешных решений для бизнеса, которые демонстрируют наш опыт и профессионализм.';

  return [
    { title },
    {
      name: 'description',
      content: description,
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: description,
    },
  ];
}
export default function ProjectsPage() {
  const [switchMode, setSwitchMode] = useState<ViewMode>('grid');
  const refContainer = useRef<HTMLDivElement>(null);
  const refImg = useRef<HTMLDivElement>(null);

  const cardRefs = useRefMap<HTMLDivElement>();

  const prevScrollY = useRef(0);
  const deltaY = useRef(0);
  const filteredData = toFilterData(sgProjects.v);

  const [activeIndex, setActiveIndex] = useState(0);
  let mode = useBreakpoints<'desktop' | 'mobile'>(
    {
      1024: 'desktop',
      0: 'mobile',
    },
    500
  );
  mode = `${mode}_${switchMode}` as any;
  useEvent(
    'scroll',
    (_, remove) => {
      if (mode === 'mobile') return remove();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      deltaY.current = scrollTop - prevScrollY.current;
      prevScrollY.current = scrollTop;

      for (let i = 0; i < filteredData.length; i++) {
        const key = `project_${i}`;
        const el = cardRefs.getRef(key).current;
        if (!el) return;
        const offset = (n: number) => el.offsetTop - el.offsetHeight * n;
        const isLast = i === sgProjects.v.length - 1;

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

  useEffect(() => toggleFilter.toClear, []);

  const onClick: FilterProps['onClick'] = (tagName, id, isClearAll) => {
    if (isClearAll) return toggleFilter.toClear();
    toggleFilter(tagName as keyof UserFilter, Number(id));
  };
  return (
    <StartPage>
      <div className="ProjectPage px">
        <h1 className="ProjectPage-title">
          <span>Проекты</span> <span>( {filteredData.length} )</span>
        </h1>

        <div className="ProjectPage_filter-ModeSwitcher ">
          <FilterProject onClick={onClick} items={mapFiltersToFilterProject(sgFilters.v)} />

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
                <div ref={cardRefs.getRef(`project_${index}`) as any} key={index}>
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
                    year={payload.meta.year.name}
                    typeStand={toFormatNames(payload.meta.type_tax)}
                    nameExhibition={toFormatNames(payload.meta.exhibition)}
                    link={link}
                  />
                </div>
              );
            })}
          </div>
          <div className={`ProjectPage_container-right __${mode}`} ref={refImg}>
            {filteredData.map(({ payload, id, slug }, index) => {
              return (
                //prettier-ignore
                index === activeIndex && (
                <Img
                  key={ index }
                  title={ payload.title }
                  cover={ payload.cover }
                  slug={ slug }
                  id={ id } />
              )
              );
            })}
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
  const { goTo } = useNavigate();

  const clIsHover = hoveredProject.v == id ? 'isHover' : '';

  return (
    <Link to={`/projects/${slug}`} slug={title}>
      <div className={`ProjectCardImg ${clIsHover}`}>
        <img
          onMouseEnter={() => (hoveredProject.v = id)}
          onMouseLeave={() => (hoveredProject.v = -id)}
          src={cover}
          onClick={() => goTo(`/projects/${slug}`, title)}
          alt={`Обложка проекта: ${title}`}
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

function normalizeField(field: ExhibitionStandField): ExhibitionStandItem[] {
  if (!field) return []; // если null, undefined или {}
  if (Array.isArray(field)) return field;
  if (typeof field === 'object' && Object.keys(field).length > 0) {
    return Object.values(field);
  }
  return [];
}

function mapFiltersToFilterProject(data: ExhibitionStand): FilterItem[] {
  return [
    {
      filterName: 'Выставка',
      filterType: 'exhibition_stand',
      items: normalizeField(data.exhibition_stand).map((item) => ({
        name: item.name,
        id: item.id,
      })),
    },
    {
      filterName: 'Тип стенда',
      filterType: 'type_stand',
      items: normalizeField(data.type_stand).map((item) => ({
        name: item.name,
        id: item.id,
      })),
    },
    {
      filterName: 'Год',
      filterType: 'year_stand',
      items: normalizeField(data.year_stand)
        .map((item) => ({
          name: item.name,
          id: item.id,
        }))
        .sort((a, b) => Number(b.name) - Number(a.name)),
    },
  ];
}
