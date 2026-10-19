import './styles.css';
import { ButtonHTMLAttributes, HTMLAttributes, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
}
type ElementProps =
  | ({ as?: 'button'; ref?: React.RefObject<HTMLButtonElement | null> } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'span'; ref?: React.RefObject<HTMLSpanElement | null> } & HTMLAttributes<HTMLSpanElement>);

export default function Button({
  variant = 'primary',
  underline = 'center-right',
  className = '',
  subTitle = '',
  size = '',
  isHover = false,
  children,
  hoverCallback,
  ...props
}: Props & ElementProps) {
  const clIsSubTitle = !!subTitle ? 'subtitle' : '';
  const clIsHover = isHover ? 'isHover' : '';
  const onLeave = (
    e: React.MouseEvent<HTMLElement, MouseEvent> | React.TouchEvent<HTMLElement>
  ) => {
    const button = e.currentTarget;
    if (button.classList.contains('left-right')) {
      button.classList.add('isFeedOut');
      setTimeout(() => {
        button.classList.remove('isFeedOut');
      }, 500);
    }
  };

  const content = subTitle ? (
        <>
          {props.as === 'span' ? <span className="Button-title">{children}</span> : <p>{children}</p>}
          <span>{subTitle}</span>
        </>
      ) : (
        children
      );
  const classes = `Button  ${clIsHover} ${variant} ${className} ${size} ${underline} ${clIsSubTitle}`;

  if (props.as === 'span') {
    const { as, ...spanProps } = props;
    return (
      <span
        {...spanProps}
        onMouseLeave={(e) => (onLeave(e), spanProps.onMouseLeave?.(e))}
        onTouchEnd={(e) => (onLeave(e), spanProps.onTouchEnd?.(e))}
        className={classes}
      >
        {content}
      </span>
    );
  }

  const { as, ...buttonProps } = props;
  return (
    <button
      {...buttonProps}
      onMouseLeave={(e) => (onLeave(e), buttonProps.onMouseLeave?.(e))}
      onTouchEnd={(e) => (onLeave(e), buttonProps.onTouchEnd?.(e))}
      className={classes}
    >
      {content}
    </button>
  );
}

export interface ImpRef {
  setIsHover: (v: boolean) => void;
}
interface ButtonArrowProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  as?: 'button' | 'span';
  direction?: 'left' | 'right';
  variant?: 'ghostLink' | 'link';
  size?: 'sm' | 'normal';
  underline?: boolean;
  disabled?: boolean;
  refImp?: React.RefObject<Partial<ImpRef>>;
  isListener?: boolean;
}

Button.Arrow = ({
  as = 'button',
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
  const refLabel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const label = as === 'span' ? refLabel.current : refButton.current;
    if (!refSvg.current || !label) return;
    const computedStyle = window.getComputedStyle(label);
    const pdBottom = computedStyle.paddingBottom;
    refSvg.current.style.marginTop = `-${pdBottom}`;
  }, [as]);
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
      {as === 'span' ? (
        <Button as="span" ref={refLabel} isHover={isHover} variant={variant}>
          {children}
        </Button>
      ) : (
        <Button ref={refButton} isHover={isHover} disabled={disabled} variant={variant}>
          {children}
        </Button>
      )}

      <ArrowIcon className="ButtonArrow-icon" ref={refSvg} />
    </span>
  );
};
