import { useState } from 'react';
import './styles.css';
import AnimatedLabel from 'shared/components/AnimatedLabel';

import UserInfo from '../UserInfo';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import { DocOverviewProps, ReviewItem } from '..';
import IsNot from 'shared/components/IsNot';
import { sgFeedbacks } from 'api/feedbacks/feedbacks.api';

function feedbacksToItems(isNotPage?: boolean): ReviewItem[] {
  return sgFeedbacks.v.slice(0, !isNotPage ? Infinity : 4).map(({ payload }) => ({
    company: payload.company,
    text: payload.text,
    pdfUrl: payload.pdf,
    personName: payload.person?.name,
    personPosition: payload.person?.position,
  }));
}

export default function DesktopTemplate({ isNotPage, items }: DocOverviewProps) {
  const [activeClient, setActiveClient] = useState<number>(0);

  const list = items ?? feedbacksToItems(isNotPage);
  const active = list[activeClient];

  return (
    <div className="DesktopTemplate">
      <div className="wrapper">
        <div className="DesktopTemplate_left">
          {list.map((item, index) => (
            <AnimatedLabel
              key={index}
              isActive={index === activeClient}
              title={item.company}
              onClick={() => setActiveClient(index)}
            />
          ))}

          <IsNot value={isNotPage}>
            <Link to="/about-us/feedbacks">
              <Button className="btn-allFeedbacks" variant="ghostLink" children="Все отзывы" />
            </Link>
          </IsNot>
          <br />
        </div>
        {active && (
          <div className="wrapUserInfo">
            <UserInfo
              docName={active.company}
              docLink={active.pdfUrl}
              userName={active.personName ?? ''}
              userStatus={active.personPosition ?? ''}
              docDescription={active.text}
            />
          </div>
        )}
      </div>
    </div>
  );
}
