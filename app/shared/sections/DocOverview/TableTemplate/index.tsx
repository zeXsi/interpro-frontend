import './styles.css';
import Accordion from 'shared/components/Accordion';
import AnimatedLabel, { RefAnimatedLabel } from 'shared/components/AnimatedLabel';
import UserInfo from '../UserInfo';
import useRefMap from '@qtpy/use-ref-map';

import { useState } from 'react';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import IsNot from 'shared/components/IsNot';
import { DocOverviewProps } from '..';
import feedbacksToItems from '../feedbacksToItems';

export default function TableTemplate({ isNotPage, items }: DocOverviewProps) {
  const { getRef } = useRefMap<RefAnimatedLabel>();

  const [activated, setActive] = useState(-1);

  const handleActive = (v: boolean, index: number) => {
    setActive(activated === index ? -index : index);
    getRef(`feedback_${index}`).current?.setIsActive?.(v);
  };

  const list = items ?? feedbacksToItems(isNotPage);

  return (
    <div className="TableTemplate">
      {list.map((item, index) => {
        const isActive = activated === index;
        return (
          <Accordion isActive={isActive} key={index} onClick={(v) => handleActive(v, index)}>
            <Accordion.Header>
              <AnimatedLabel
                isActive={isActive}
                isFull={true}
                ref={getRef(`feedback_${index}`)}
                title={item.company}
              />
            </Accordion.Header>
            <Accordion.Content>
              <UserInfo
                docName={item.company}
                docLink={item.pdfUrl}
                userName={item.personName ?? ''}
                userStatus={item.personPosition ?? ''}
                docDescription={item.text}
              />
            </Accordion.Content>
          </Accordion>
        );
      })}
      <IsNot value={isNotPage && !items}>
        <Link to="/about-us/feedbacks">
          <Button className="btn-allFeedbacks" variant="ghostLink" children="Все отзывы" />
        </Link>
      </IsNot>
    </div>
  );
}
