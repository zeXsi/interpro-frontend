import ISOCard from 'shared/components/ISOCard';
import './styles.css';
import type { License } from 'api/licenses/license.types';

interface Props {
  qntyPreview?: number;
  items: License['payload'][];
}
function Certificates({ qntyPreview = Infinity, items }: Props) {
  return (
    <div className="Certificates">
      {items.slice(0, qntyPreview).map((payload, index) => {
        return (
          <ISOCard
            key={index}
            title={payload.title}
            namePdf={payload.file_name}
            urlPdf={payload.file_url}
            urlImg={payload.preview_url}
          />
        );
      })}
    </div>
  );
}

export default Certificates;
