import './styles.css';

interface Props {
  title: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}
export default function TitlePage({ title, className = '', as: Tag = 'h1' }: Props) {
  return title && (<Tag className={`TitlePage ${className}`}>{title}</Tag>);
}
