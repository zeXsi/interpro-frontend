import './styles.css';
import { useEffect, useImperativeHandle, useState } from 'react';
import ArrowIcon from 'assets/icons/arrow.svg?react';

export interface RefAnimatedLabel {
  setIsActive: (val: boolean) => void;
}

interface Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  title: string;
  className?: string;
  isHover?: boolean;
  isFull?: boolean;
  onClick?: () => boolean | void;
  ref?: React.RefObject<Partial<RefAnimatedLabel>>;
  isActive?: boolean;
}

export default function AnimatedLabel({
  isHover = false,
  isFull = false,
  className = '',
  isActive = false,
  onClick,
  title,
  ref,
  ...props
}: Props) {
  const [_isActive, setIsActive] = useState(false);
  const clIsHover = isHover ? 'isHover' : '';
  const clIsFull = isFull ? 'isFull' : '';
  const clIsActive = _isActive ? 'isActive' : '';

  const config: RefAnimatedLabel = {
    setIsActive: (val) => setIsActive(val),
  };

  useImperativeHandle(ref, () => config);
  useEffect(() => setIsActive(isActive), [isActive]);

  const handleOnClick = () => {
    const res = onClick?.();
    if (res !== undefined) {
      setIsActive(res);
    }
  };
  return (
    <div
      {...props}
      onClick={handleOnClick}
      className={`AnimatedLabel ${className} ${clIsHover} ${clIsActive} ${clIsFull}`}
    >
      <ArrowIcon className="AnimatedLabel-icon" />
      <span className="AnimatedLabel-title">{title}</span>
      <ArrowIcon className="AnimatedLabel-icon-second" />
    </div>
  );
}
