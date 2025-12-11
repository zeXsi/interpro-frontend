import './styles.css';
import Subtitle from 'shared/components/Subtitle';
import Button from 'shared/components/Button';

import srcImg1 from 'assets/imgs/AboutUsMedia/1.png';
import srcImg2 from 'assets/imgs/AboutUsMedia/2.png';

import Link from 'shared/components/Link';

export default function AboutUsMedia() {
  return (
    <div className="AboutUsMedia px">
      <Subtitle>( медиа )</Subtitle>
      <div className="AboutUsMedia-title">
        Узнать о нас ближе и подгдядеть за внутрянкой нашей работы
      </div>
      <div className="AboutUsMedia-networks ">
        <Link to={import.meta.env.VITE_TELEGRAM_URL_2} typeLink="external">
          <Button subTitle="Новости и проекты" variant="outline">
            Telegram—канал
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_TELEGRAM_URL_3} typeLink="external">
          <Button subTitle="Жизнь компании" variant="outline">
            Telegram—live
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_YOUTUBE_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Youtube
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_INSTAGRAM_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Instagram
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_VK_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            VK
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_BEHANCE_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Behance
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_PINTEREST_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Pinterest
          </Button>
        </Link>
      </div>
      <div className="AboutUsMedia-container">
        <Link to={import.meta.env.VITE_TELEGRAM_URL_1} typeLink="external">
          <MediaItem
            srcImg={srcImg1}
            title="Telegram—канал"
            subTitle="Рассказываем о тонкостях сферы"
          />
        </Link>
        <Link to={import.meta.env.VITE_YOUTUBE_URL} typeLink="external">
          <MediaItem srcImg={srcImg2} title="Youtube" subTitle="Показываем внутреннюю кухню" />
        </Link>
      </div>
    </div>
  );
}

interface MediaItemProps {
  title: string;
  subTitle: string;
  srcImg: string;
}
function MediaItem({ title, subTitle, srcImg }: MediaItemProps) {
  return (
    <div className="MediaItem">
      <div className="MediaItem_text">
        <div className="MediaItem_text-title">{title}</div>
        <div className="MediaItem_text-subtitle">{subTitle}</div>
      </div>
      <img src={srcImg} alt={`Иллюстрация к разделу: ${title} — ${subTitle}`} />
    </div>
  );
}
