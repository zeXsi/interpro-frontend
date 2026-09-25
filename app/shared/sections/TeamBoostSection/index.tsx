import './styles.css';
import Tabs from 'shared/components/Tabs';
import Button from 'shared/components/Button';
import { memo } from 'react';
import { sgServiceCategories } from 'api/services/services.api';
import Link from 'shared/components/Link';
import type { HomeServiceNavigationNode } from 'api/home/home.types';

interface TeamBoostSectionProps {
  items?: HomeServiceNavigationNode[];
}

function TeamBoostSection({ items }: TeamBoostSectionProps) {
  const categories = items ?? sgServiceCategories.v.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.payload.name,
    description: item.payload.description,
    children: [],
    posts: item.payload.posts,
  }));
  const hasSingleCategory = categories.length === 1;

  return (
    <div className="TeamBoostSection ">
      <Tabs startTrigger="design_0">
        {categories.flatMap((item, index) => [
          <Tabs.Item key={`item-${index}`} trigger={`design_${index}`}>
            {item.name}
          </Tabs.Item>,
          <Tabs.Content key={`content-${index}`} trigger={[`design_${index}`]}>
            <Template
              link={hasSingleCategory ? '/services' : `/services/${item.slug}`}
              tags={item.posts.map((_item) => _item.title)}
              title={item.description || item.name}
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
  const visibleTags =
    tags.length > 5 ? [...tags.slice(0, 4), 'и другие'] : tags.slice(0, 5);

  return (
    <div className="Template px">
      <div className="">
        <noindex className="Template_wrapper">
          <div className="Template-title" data-nosnippet>
            {title}
          </div>
          <div className="Template_tags" data-nosnippet>
            {visibleTags.map((tag, index) => (
              <Button key={index} variant="outline">
                {tag}
              </Button>
            ))}
          </div>
        </noindex>
      </div>
      <div className="Template_footer">
        <Link to={link}>
          <Button variant="ghostLink">Узнать больше</Button>
        </Link>
      </div>
    </div>
  );
}
