import './styles.css';
import { ButtonHTMLAttributes, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ArrowIcon from 'assets/icons/arrow.svg?react';

export interface ImperativeButton {
  onLeave: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.TouchEvent<HTMLButtonElement>
  ) => void;
}
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghostLink' | 'link';
  underline?: 'center-right' | 'left-right' | '';
  size?: 'sm' | '';
  subTitle?: string;
  isHover?: boolean;
  hoverCallback?: () => void;
  refImp?: React.RefObject<Partial<ImperativeButton>>;
  ref?: React.RefObject<HTMLButtonElement | null>;
}
export default function Button({
  variant = 'primary',
  underline = 'center-right',
  className = '',
  subTitle = '',
  size = '',
  isHover = false,
  children,
  hoverCallback,
  ref,
  ...props
}: Props & ButtonHTMLAttributes<HTMLButtonElement>) {
  const clIsSubTitle = !!subTitle ? 'subtitle' : '';
  const clIsHover = isHover ? 'isHover' : '';
  const onLeave = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.TouchEvent<HTMLButtonElement>
  ) => {
    const button = e.currentTarget;
    if (button.classList.contains('left-right')) {
      button.classList.add('isFeedOut');
      setTimeout(() => {
        button.classList.remove('isFeedOut');
      }, 500);
    }
  };

  return (
    <button
      {...props}
      onMouseLeave={(e) => (onLeave(e), props.onMouseLeave?.(e))}
      onTouchEnd={(e) => (onLeave(e), props.onTouchEnd?.(e))}
      ref={ref}
      className={`Button  ${clIsHover} ${variant} ${className} ${size} ${underline} ${clIsSubTitle}`}
    >
      {subTitle ? (
        <>
          <p>{children}</p>
          <span>{subTitle}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export interface ImpRef {
  setIsHover: (v: boolean) => void;
}
interface ButtonArrowProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  direction?: 'left' | 'right';
  variant?: 'ghostLink' | 'link';
  size?: 'sm' | 'normal';
  underline?: boolean;
  disabled?: boolean;
  refImp?: React.RefObject<Partial<ImpRef>>;
  isListener?: boolean;
}

Button.Arrow = ({
  variant = 'ghostLink',
  children,
  className = '',
  direction = 'left',
  underline = true,
  size = 'normal',
  disabled = false,
  isListener = true,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  refImp,
  ...props
}: ButtonArrowProps) => {
  const isHideUnderline = !underline ? 'isHideUnderline' : '';
  const [isHover, setIsHover] = useState(false);
  const refSvg = useRef<SVGSVGElement>(null);
  const refButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!refSvg?.current || !refButton?.current) return;
    const computedStyle = window.getComputedStyle(refButton.current);
    const pdBottom = computedStyle.paddingBottom;
    refSvg.current.style.marginTop = `-${pdBottom}`;
  }, []);
  useImperativeHandle(refImp, () => ({
    setIsHover: (v) => {
      setIsHover(v);
    },
  }));
  return (
    <span
      {...props}
      className={`ButtonArrow ${isHideUnderline} ${className} ${size} ${direction} ${variant}`}
      onMouseEnter={(e) => {
        isListener && setIsHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        isListener && setIsHover(false);
        onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        isListener && setIsHover(true);
        onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        isListener && setIsHover(false);
        onTouchEnd?.(e);
      }}
    >
      <Button ref={refButton} isHover={isHover} disabled={disabled} variant={variant}>
        {children}
      </Button>

      <ArrowIcon className="ButtonArrow-icon" ref={refSvg} />
    </span>
  );
};
