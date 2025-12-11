import './styles.css';
import DesktopTemplate from './DesktopTemplate';
import TableTemplate from './TableTemplate';
import Subtitle from 'shared/components/Subtitle';

export interface DocOverviewProps { 
  isNotPage?: boolean
}
function DocOverview({ isNotPage = true }: DocOverviewProps) {

  return (
    <div className="DocOverview px" id="DocOverview">
      <Subtitle>( Что говорят клиенты )</Subtitle>
      <DesktopTemplate {...{isNotPage}}/>
      <TableTemplate {...{isNotPage}}/>
    </div>
  );
}

export default DocOverview


