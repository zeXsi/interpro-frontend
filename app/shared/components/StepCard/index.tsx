import './styles.css';

interface Props {
  title: string;
  description: string;
  index: number;
  isActive?: boolean;
}
export default function StepCard({ isActive = false, title, description, index = 0 }: Props) {
  const clIsActive = isActive ? 'active' : '';
  return (
    <div className={`StepCard ${clIsActive}`}>
      <div className="StepCard_header">
        <div className="StepCard_header-index">{formatWithLeadingZero(index)}</div>
        <div className="StepCard_header-title">{title}</div>
      </div>
      <p className="StepCard_header-description" children={description} />
    </div>
  );
}

function formatWithLeadingZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}
