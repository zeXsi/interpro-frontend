import Button from 'shared/components/Button';
import Tag from '../../../shared/components/Tag';
import './styles.css';

import IsNot from 'shared/components/IsNot';
import { hoveredProject } from '..';
import { useRef } from 'react';
import Text from 'shared/components/Text';
import Link from 'shared/components/Link';
import { useWatch } from 'shared/utils/_stm/react/react';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

export interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  typeStand: string;
  year: number | string;
  nameExhibition: string;
  link: string;
  slug: string | number;
  id: number;
  nextItem: { id?: string | number; title?: string };
  /**
   * Карточка без тегов выставки/типа/года: вместо них выводим короткое
   * описание. Нужен офисным проектам — у них этих полей нет.
   */
  descriptionOnly?: boolean;
}

export default function ProjectCard(props: ProjectCardProps) {
  const projectTitle = decodeUnicodeEscapes(props.title);

  const refButton = useRef<HTMLButtonElement | null>(null);
  useWatch(() => {
    const button = refButton.current;
    if (!button) return;

    const isHovered = props.id === hoveredProject.v;
    button.classList.toggle('isHover', isHovered);

    if (isHovered) {
      button.classList.remove('isFeedOut');
      return;
    }

    if (hoveredProject.v < 0 && button.classList.contains('left-right')) {
      button.classList.add('isFeedOut');
    }
  });


  return (
    <div className="ProjectCard">
      <div className="ProjectCard-title_" data-title={projectTitle}>
        <Link to={`/projects/${props.slug}`} slug={[projectTitle]}>
          <Button
            variant="link"
            underline="left-right"
            className={`ProjectCard-title `}
            // onClick={navigateTo}
            isHover={props.id === hoveredProject.v}
            onMouseEnter={() => (hoveredProject.v = props.id)}
            onMouseLeave={() => (hoveredProject.v = -props.id)}
            ref={refButton}
          >
            {projectTitle}
          </Button>
        </Link>
      </div>

      {props.descriptionOnly ? (
        // Обёртка .Tag обязательна: в Tag/styles.css правила заданы как
        // `.Tag .Tag-title`, без родителя типографика не применится.
        <div className="ProjectCard-descriptionTag Tag">
          <p className="Tag-title">{props.description}</p>
        </div>
      ) : (
        <>
          <p className="ProjectCard-description">{/* { props.description } */}</p>
          <div className="ProjectCard_footer">
            <IsNot
              value={props.nameExhibition}
              children={
                <Tag
                  className="__exhibition"
                  subTitle="Выставка"
                  title={<Text>{props.nameExhibition}</Text>}
                />
              }
            />
            <IsNot
              value={props.typeStand}
              children={
                <Tag
                  className="__typeStand"
                  subTitle="Тип стенда"
                  title={<Text>{props.typeStand}</Text>}
                />
              }
            />
            <IsNot
              value={props.year}
              children={<Tag className="__year" subTitle="Год" title={props.year} />}
            />
          </div>
        </>
      )}
      <Link to={`/projects/${props.slug}`} slug={[projectTitle]}>
        <div className="ProjectCard-img">
          <img
            src={props.image}
            // У офисных проектов нет выставки и года — пустые части не подставляем,
            // иначе в alt остаётся «выставка , год».
            alt={[
              `Проект: ${projectTitle}`,
              props.nameExhibition && `выставка ${props.nameExhibition}`,
              props.year && `${props.year} год`,
            ]
              .filter(Boolean)
              .join(', ')}
          />
        </div>
      </Link>
      <Link to={`/projects/${props.slug}`} slug={[projectTitle]}>
        <Button className="ProjectCard-btn" variant="ghostLink">
          Смотреть проект
        </Button>
      </Link>
    </div>
  );
}
