import Subtitle from 'shared/components/Subtitle';
import './styles.css';
interface Props {
  title: string;
  subtitle: string;
  width?: string;
  className?: string;
}
export default function SectionHeader({ className = '', title, subtitle, width = '1468px' }: Props) {
  return (
    <div className={`SectionHeader ${className}`} style={{ '--maxWidth': width } as React.CSSProperties}>
      <Subtitle>{subtitle}</Subtitle>
      <div className="SectionHeader-title">{title}</div>
    </div>
  );
}
