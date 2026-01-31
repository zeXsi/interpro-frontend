import './styles.css';

import slideImg from 'assets/imgs/Presentation/slide.png';
import useMWImage from 'shared/components/popups/useMWImage';

const slides = [slideImg, slideImg];

export default function Idea() {
  const { Popup, showWithData } = useMWImage();
  const openAllImages = (currentSrc?: string) => {
    if (!currentSrc) return;
    const index = slides.findIndex((src) => src === currentSrc);
    showWithData([index >= 0 ? index : 0, slides as any]);
  };
  return (
    <section className="Idea">
      <Popup />
      <div className="Idea__content">
        <div className="Idea__content-desc">
          <p>
            Что делает обычный продукт предметом искусства? Почему суповая банка становится
            экспонатом музея, а резервуар с газом — культурным символом? Этот проект — отсылка
            к эстетике Энди Уорхола, художника, поставившего знак равенства между повседневным
            <br />
            <br />
            Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку
            супа в произведение искусства. превращал банку супа в произведение искусства.
          </p>
        </div>
        <div
          className={`Idea__content-slides ${['single', 'double', 'triple'][slides.length - 1]}`}
        >
          {slides.map((item) => (
            <img src={item} alt="Идея и концепция" key={item} onClick={() => openAllImages(item)} />
          ))}
        </div>
      </div>
    </section>
  );
}
