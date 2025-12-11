import './styles.css';

export default function Subtitle({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={ `Subtitle ${className}` } { ...props }/>;
}
