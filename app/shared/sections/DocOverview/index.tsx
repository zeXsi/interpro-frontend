import './styles.css';
import DesktopTemplate from './DesktopTemplate';
import TableTemplate from './TableTemplate';
import Subtitle from 'shared/components/Subtitle';

export interface ReviewItem {
  company: string;
  text: string;
  pdfUrl?: string | null;
  personName?: string;
  personPosition?: string;
}

export interface DocOverviewProps {
  isNotPage?: boolean;
  items?: ReviewItem[];
  subtitle?: string;
}

function DocOverview({ isNotPage = true, items, subtitle = '( Что говорят клиенты )' }: DocOverviewProps) {
  return (
    <div className="DocOverview px" id="DocOverview">
      <Subtitle>{subtitle}</Subtitle>
      <DesktopTemplate isNotPage={isNotPage} items={items} />
      <TableTemplate isNotPage={isNotPage} items={items} />
    </div>
  );
}

export default DocOverview;
