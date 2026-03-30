import './styles.css';
import Tag from 'shared/components/Tag';
import ArrowSvg from 'assets/icons/arrow.svg?react';
import { ProjectCardProps } from '../ProjectCard';

import Text from 'shared/components/Text';
import Link from 'shared/components/Link';
import { decodeUnicodeEscapes } from 'shared/utils/decodeUnicodeEscapes';

export default function ProjectCardTable(props: ProjectCardProps) {
  const projectTitle = decodeUnicodeEscapes(props.title);

  return (
    <Link to={`/projects/${props.slug}`} slug={[projectTitle]}>
      <div className="ProjectCardTable">
        <div className="ProjectCardTable_head">
          <span className="ProjectCardTable_head-title">{projectTitle}</span>
          <ArrowSvg className="ProjectCardTable_head-svg" />
        </div>
        {(props.nameExhibition && props.year) ?? (
          <div className="ProjectCardTable_main">
            {props.nameExhibition ?? (
              <Tag title={<Text>{props.nameExhibition}</Text>} subTitle={'выставка'} />
            )}
            {props.year ?? <Tag title={props.year} subTitle={'Год'} />}
          </div>
        )}
      </div>
    </Link>
  );
}
