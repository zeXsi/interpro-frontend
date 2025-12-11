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
import { sgFeedbacks } from 'api/feedbacks/feedbacks.api';

export default function TableTemplate({ isNotPage }: DocOverviewProps) {
  const { getRef } = useRefMap<RefAnimatedLabel>();

  const [activated, setActive] = useState(-1);

  const handleActive = (v: boolean, index: number) => {
    setActive(activated === index ? -index : index);
    getRef(`feedback_${index}`).current?.setIsActive?.(v);
  };

  return (
    <div className="TableTemplate">
      {sgFeedbacks.v.map(({ payload }, index) => {
        const isActive = activated === index;
        return (
          <Accordion isActive={isActive} key={index} onClick={(v) => handleActive(v, index)}>
            <Accordion.Header>
              <AnimatedLabel
                isActive={isActive}
                isFull={true}
                ref={getRef(`feedback_${index}`)}
                title={payload.company}
              />
            </Accordion.Header>
            <Accordion.Content>
              <UserInfo
                docName={payload.company}
                docLink={payload.pdf}
                userName={payload.person.name}
                userStatus={payload.person.position}
                docDescription={payload.text}
              />
            </Accordion.Content>
          </Accordion>
        );
      })}
      <IsNot value={isNotPage}>
        <Link to="/about-us/feedbacks">
          <Button className="btn-allFeedbacks" variant="ghostLink" children="Все отзывы" />
        </Link>
      </IsNot>
    </div>
  );
}
