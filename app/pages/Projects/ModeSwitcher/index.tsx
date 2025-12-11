import './styles.css';

import React, { useState } from 'react';

interface Props<T extends string> {
  startVal: T;
  onClick?: (value: T) => void;
  className?: string
  list: [type: T, text: string, Icon: React.ElementType][];
}

export default function ModeSwitcher<T extends string>({ onClick, className = '', list, startVal }: Props<T>) {
  const [selectedItem, setSelectedItem] = useState<T>(startVal);
  const handleOnClick = (mode: T) => {
    setSelectedItem(mode);
    onClick?.(mode);
  };
  return (
    <div className={`ModeSwitcher ${className}`}>
      {list.map(([type, text, Icon], index) => {
        const isActive = type === selectedItem;
        return (
          <ModeSwitcher_item
            isActive={isActive}
            key={index}
            onClick={() => handleOnClick?.(type)}
            text={text as string}
            Icon={Icon as React.ElementType}
          />
        );
      })}
    </div>
  );
}

interface PropsItem extends React.HTMLAttributes<HTMLElement> {
  Icon: React.ElementType;
  text: string;
  isActive?: boolean;
}

function ModeSwitcher_item({ isActive, Icon, text, ...props }: PropsItem) {
  const clIsActive = isActive ? 'active' : '';
  return (
    <div className={`ModeSwitcher_item ${clIsActive}`} {...props}>
      <Icon className="ModeSwitcher_item-icon" />
      <span className="ModeSwitcher_item-text" children={text} />
    </div>
  );
}
