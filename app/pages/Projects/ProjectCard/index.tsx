import Button from 'shared/components/Button';
import Tag from '../../../shared/components/Tag';
import './styles.css';

import IsNot from 'shared/components/IsNot';
import { hoveredProject } from '..';
import { useRef } from 'react';
import Text from 'shared/components/Text';
import Link from 'shared/components/Link';
import { useWatch } from 'shared/utils/_stm/react/react';

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
}

export default function ProjectCard(props: ProjectCardProps) {

  const refButton = useRef<HTMLButtonElement | null>(null);
  useWatch(() => { 
   const button = refButton.current;
    if (!button) return;

    if (hoveredProject.v < 0 && button.classList.contains('left-right')) {
      button.classList.add('isFeedOut');
      return;
    }
    if (Math.abs(props.id) === hoveredProject.v) {
      button.classList.remove('isFeedOut');
    }
  })


  return (
    <div className="ProjectCard">
      <div className="ProjectCard-title_" data-title={props.title}>
        <Link to={`/projects/${props.slug}`} slug={[props?.title]}>
          <Button
            variant="link"
            underline="left-right"
            className={`ProjectCard-title `}
            // onClick={navigateTo}
            isHover={props.id === hoveredProject.v}
            onMouseEnter={() => hoveredProject.v = props.id}
            onMouseLeave={() => hoveredProject.v = -props.id}
            ref={refButton}
          >
            {props.title}
          </Button>
        </Link>
      </div>

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
      <Link to={`/projects/${props.slug}`} slug={[props?.title]}>
        <div className="ProjectCard-img">
          <img
            src={props.image}
            alt={`Проект: ${props.title}, выставка ${props.nameExhibition}, ${props.year} год`}
          />
        </div>
      </Link>
      <Link to={`/projects/${props.slug}`} slug={[props?.title]}>
        <Button className="ProjectCard-btn" variant="ghostLink">
          Смотреть проект
        </Button>
      </Link>
    </div>
  );
}
