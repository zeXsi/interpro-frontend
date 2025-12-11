import './styles.css';
import Tag from 'shared/components/Tag';
import ArrowSvg from 'assets/icons/arrow.svg?react';
import { ProjectCardProps } from '../ProjectCard';

import Text from 'shared/components/Text';
import Link from 'shared/components/Link';

export default function ProjectCardTable(props: ProjectCardProps) {
  return (
    <Link to={`/projects/${props.slug}`} slug={[props?.title]}>
      <div className="ProjectCardTable">
        <div className="ProjectCardTable_head">
          <span className="ProjectCardTable_head-title">{props.title}</span>
          <ArrowSvg className="ProjectCardTable_head-svg" />
        </div>
        <div className="ProjectCardTable_main">
          <Tag title={<Text>{props.nameExhibition}</Text>} subTitle={'выставка'} />
          <Tag title={props.year} subTitle={props.year} />
        </div>
      </div>
    </Link>
  );
}
