import './styles.css';

interface Props {
  title: string;
  className?: string;
}
export default function TitlePage({ title, className = '' }: Props) {
  return <h1 className={`TitlePage ${className}`}>{title}</h1>;
}
