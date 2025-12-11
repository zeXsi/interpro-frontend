import Button from '../Button';
import './styles.css';

interface TagProps {
  title: string | number | React.JSX.Element;
  subTitle: string | number | React.JSX.Element;
  className?: string;
  link?: string
}
export default function Tag({ title, link , subTitle, className = '' }: TagProps) {
  return (
    <div className={ `Tag ${className}` }>
      <div className="Tag-subtitle">{ subTitle }</div>
      { //prettier-ignore
        !link ? <div className="Tag-title">{ title }</div> : (
          <a className="Tag-title" href={ link } rel="noopener noreferrer nofollow" target="_blank">
          <Button variant="ghostLink">{ title }</Button>
        </a>
      )}
    </div>
  );
}
