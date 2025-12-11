import './styles.css';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';

interface Props {
  title: string;
  items: Array<
    [title: string | string[], link?: string | string[], typeLink?: 'external' | 'internal']
  >;
  className?: string;
  variant?: 'paragraph' | 'link' | 'custom';
  mode?: 'text' | 'button' | 'text_underline';
  onClick?: (index: number) => void;
  isModeSlug?: boolean;
}

export default function InfoList({
  title,
  items,
  variant = 'link',
  mode = 'button',
  className = '',
  onClick,
  isModeSlug,
}: Props) {
  const clIsMode = mode === 'text' ? '__mode-text' : '';
  const clIsModeUnderline = mode === 'text_underline' ? '__mode-underline' : '';

  const renderLabel = (label: string | string[]) =>
    typeof label === 'object' ? label[1] ?? label[0] : label;

  const renderItem = (label: any, index: number, src?: any, typeLink?: any) => {
    const slugArr = isModeSlug
      ? Array.isArray(label)
        ? label
        : [label]
      : [];

    const button = (
      <Button variant="link" className="InfoList-item" underline="left-right">
        {renderLabel(label)}
      </Button>
    );


    if (variant === 'paragraph') {
      return (
        <p className="InfoList-item" key={index}>
          {renderLabel(label)}
        </p>
      );
    }

    if (variant === 'custom') {
      return (
        <div key={index} onClick={() => onClick?.(index)}>
          {button}
        </div>
      );
    }

    if (!src) {
      return (
        <div key={index} onClick={() => onClick?.(index)}>
          {button}
        </div>
      );
    }


    return (
      <Link
        key={index}
        to={src}
        slug={slugArr}
        typeLink={typeLink}
        onClick={() => onClick?.(index)}
      >
        {button}
      </Link>
    );
  };

  return (
    <div className={`InfoList ${className} ${clIsMode} ${clIsModeUnderline}`}>
      <span className="InfoList-title">{title}</span>
      <div className="InfoList-container">
        {items.map(([label, src, typeLink], index) =>
          renderItem(label, index, src, typeLink)
        )}
      </div>
    </div>
  );
}
