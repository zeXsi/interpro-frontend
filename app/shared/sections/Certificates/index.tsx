import ISOCard from 'shared/components/ISOCard';
import './styles.css';
import { sgLicenses } from 'api/licenses/license.api';

interface Props {
  qntyPreview?: number;
}
function Certificates({ qntyPreview = Infinity }: Props) {
  return (
    <div className="Certificates">
      {sgLicenses.v.slice(0, qntyPreview).map(({ payload }, index) => {
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
