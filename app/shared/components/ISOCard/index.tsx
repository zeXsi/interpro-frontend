import './styles.css'
import Tag from "../Tag";
import useMWImage from '../popups/useMWImage';

interface ISOCardProps {
  title: string;
  namePdf: string;
  urlPdf: string;
  urlImg: string;
}
export default function ISOCard({ title, namePdf, urlPdf, urlImg }: ISOCardProps) {
  const { Popup , showWithData} = useMWImage();
  return (
    <div className="ISOCard">
      <Popup/>
      <div className="ISOCard_head">
        <Tag title={ title } subTitle={ 'Сертификат' } />
        <Tag link={ urlPdf } title={ namePdf } subTitle={ 'Скачать:' } />
      </div>
      <div className="ISOCard_img">
        <img src={ urlImg } onClick={ () => showWithData(urlImg)}/>
      </div>
    </div>
  );
}
