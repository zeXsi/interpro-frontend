import './styles.css'
import Tag from "../Tag";
import useMWImage from '../popups/useMWImage';
import GalleryImage from '../GalleryImage';

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
        <Tag link={ urlPdf } title={ namePdf } subTitle={ 'Скачать:' } className='subtitle' />
      </div>
      <div className="ISOCard_img">
        <GalleryImage src={ urlImg } onClick={ () => showWithData([0, [urlImg]])}/>
      </div>
    </div>
  );
}
