import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import './styles.css';

import toFilterChildrenByType from 'shared/utils/toFilterChildrenByType';

interface Props {
  onClick?: (val: boolean, el:HTMLDivElement|null) => void;
  children: [
    React.ReactElement<typeof Accordion.Header>,
    React.ReactElement<typeof Accordion.Content>
  ];
  className?: string;
  isActive?: boolean;
}
export default function Accordion({ isActive = false, className = '', onClick, children }: Props) {
  const refContainer = useRef<HTMLDivElement>(null);
  const [Header, Content] = toFilterChildrenByType(children, [Accordion.Header, Accordion.Content]);
  const [isOpen, setIsOpen] = useState(isActive);
  const clIsActive = isOpen ? 'active' : '';
  const toToggle = () => {
    setIsOpen(!isOpen);
    onClick?.(!isOpen, refContainer.current);
  };
  useEffect(() => setIsOpen(isActive), [isActive]);
  return (
    <div ref={refContainer} className={`Accordion ${clIsActive} ${className}`}>
      <div className="Accordion_header" onClick={toToggle} children={Header} />
      <div className="Accordion_content">
        <div className="wrap-children">{Content}</div>
      </div>
    </div>
  );
}

Accordion.Header = function ({ children }: PropsWithChildren) {
  return <>{children}</>;
};

Accordion.Content = function ({ children }: PropsWithChildren) {
  return <>{children}</>;
};
