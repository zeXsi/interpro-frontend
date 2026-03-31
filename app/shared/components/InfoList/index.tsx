import './styles.css';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';

interface InfoListItemOptions {
  disableMailtoCopy?: boolean;
}

interface Props {
  title: string;
  items: Array<
    [
      title: string | string[],
      link?: string | string[],
      typeLink?: 'external' | 'internal',
      options?: InfoListItemOptions,
    ]
  >;
  subtitle?: React.ReactNode;
  className?: string;
  variant?: 'paragraph' | 'link' | 'custom';
  underline?: 'left-right' | 'center-right';
  mode?: 'text' | 'button' | 'text_underline';
  onClick?: (index: number) => void;
  isModeSlug?: boolean;
  disableMailtoCopy?: boolean;
}

export default function InfoList({
  title,
  items,
  subtitle = "",
  variant = 'link',
  underline = 'left-right',
  mode = 'button',
  className = '',
  onClick,
  isModeSlug,
  disableMailtoCopy = false,
}: Props) {
  const clIsMode = mode === 'text' ? '__mode-text' : '';
  const clIsModeUnderline = mode === 'text_underline' ? '__mode-underline' : '';

  const renderLabel = (label: string | string[]) =>
    typeof label === 'object' ? label[1] ?? label[0] : label;

  const renderItem = (
    label: any,
    index: number,
    src?: any,
    typeLink?: any,
    itemOptions?: InfoListItemOptions
  ) => {
    const slugArr = isModeSlug
      ? Array.isArray(label)
        ? label
        : [label]
      : [];

    const button = (
      <Button variant="link" className="InfoList-item" underline={underline}>
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
        disableMailtoCopy={disableMailtoCopy || itemOptions?.disableMailtoCopy}
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
        {items.map(([label, src, typeLink, itemOptions], index) =>
          renderItem(label, index, src, typeLink, itemOptions)
        )}
        {subtitle && (
          <p className='subtitle'>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
