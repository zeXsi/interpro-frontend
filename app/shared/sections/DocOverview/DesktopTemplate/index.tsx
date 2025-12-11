import { useState } from 'react';
import './styles.css';
import AnimatedLabel from 'shared/components/AnimatedLabel';

import UserInfo from '../UserInfo';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import { DocOverviewProps } from '..';
import IsNot from 'shared/components/IsNot';
import { sgFeedbacks } from 'api/feedbacks/feedbacks.api';

export default function DesktopTemplate({ isNotPage }: DocOverviewProps) {
  const [activeClient, setActiveClient] = useState<number>(0);

  const handleClick = (clientKey: number) => {
    setActiveClient(clientKey);
  };

  const userData = sgFeedbacks.v[activeClient];

  return (
    <div className="DesktopTemplate">
      <div className="wrapper">
        <div classNaProjectPage_container-rightme="DesktopTemplate_left">
          {sgFeedbacks.v.slice(0, !isNotPage ? Infinity : 4).map(({ payload }, index) => {
            return (
              <AnimatedLabel
                key={index}
                isActive={index === activeClient}
                title={payload?.company}
                onClick={() => handleClick(index)}
              />
            );
          })}
        
          <IsNot value={isNotPage}>
            <Link to="/about-us/feedbacks">
              <Button className="btn-allFeedbacks" variant="ghostLink" children="Все отзывы" />
            </Link>
          </IsNot>
          <br />
        </div>
        {!!userData?.payload && (
          <div className="wrapUserInfo">
            <UserInfo
              docName={`${userData.payload.company}`}
              docLink={userData.payload.pdf}
              userName={userData.payload?.person?.name}
              userStatus={userData.payload?.person?.position}
              docDescription={userData.payload.text}
            />
          </div>
        )}
      </div>
    </div>
  );
}
