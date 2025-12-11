import Tag from 'shared/components/Tag';
import Text from 'shared/components/Text';

import './styles.css';
import IsNot from 'shared/components/IsNot';
import Link from 'shared/components/Link';

interface Props {
  title: string;
  description: string;
  image: string;
  typeStand: string;
  year: number | string;
  nameExhibition: string;
  link: string;
  id: string | number;
  slug: string | number;
  nextItem: { id?: number | string; title?: string };
}

export default function ProjectCardList(props: Props) {
  return (
    <Link to={`/projects/${props.slug}`} slug={[props?.title]}>
      <div className="ProjectCardList">
        <div className="ProjectCardList-title">{props.title}</div>
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
    </Link>
  );
}
