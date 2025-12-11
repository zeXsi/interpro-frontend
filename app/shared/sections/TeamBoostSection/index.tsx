import './styles.css';
import Tabs from 'shared/components/Tabs';
import Button from 'shared/components/Button';
import { memo } from 'react';
import { sgServiceCategories } from 'api/services/services.api';
import Link from 'shared/components/Link';

function TeamBoostSection() {
  return (
    <div className="TeamBoostSection ">
      <Tabs startTrigger="design_0">
        {sgServiceCategories.v?.flatMap((item, index) => [
          <Tabs.Item key={`item-${index}`} trigger={`design_${index}`}>
            {item.payload.name}
          </Tabs.Item>,
          <Tabs.Content key={`content-${index}`} trigger={[`design_${index}`]}>
            <Template
              link={`/services/${item.slug}`}
              tags={item.payload?.posts?.map((_item) => _item.title)}
              title={item.payload.description}
            />
          </Tabs.Content>,
        ])}
      </Tabs>
    </div>
  );
}

export default memo(TeamBoostSection);
interface TemplateProps {
  title: string;
  link: string;
  tags: string[];
}
function Template({ title, tags, link }: TemplateProps) {
  return (
    <div className="Template px">
      <div className="Template_wrapper">
        <div className="Template-title">{title}</div>
        <div className="Template_tags">
          {tags.map((tag, index) => (
            <Button key={index} variant="outline">
              {tag}
            </Button>
          ))}
        </div>
      </div>
      <div className="Template_footer">
        <Link to={link}>
          <Button variant="ghostLink">Узнать больше</Button>
        </Link>
      </div>
    </div>
  );
}
