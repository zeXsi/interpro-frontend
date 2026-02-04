import './styles.css';

import useMWImage from 'shared/components/popups/useMWImage';
import Text from 'shared/components/Text';

export default function Idea({ data, id }: any) {
  const { Popup, showWithData } = useMWImage();
  const openAllImages = (currentSrc?: string) => {
    if (!currentSrc) return;
    const index = data.fields.pt_images.findIndex((src: any) => src.full === currentSrc);
    const images = data.fields.pt_images.map((item: any) => item.full);
    showWithData([index >= 0 ? index : 0, images as any]);
  };

  return (
    <section className={`Idea ${!data.fields.pt_images.length && !data.fields?.pt_heading && 'empty'}`} id={id}>
      <Popup />
      <div className="Idea__content">
        <div className="Idea__content-desc">
          {data.fields?.pt_heading && <Text>{data.fields.pt_heading}</Text>}
          {/* <p>
            Что делает обычный продукт предметом искусства? Почему суповая банка становится
            экспонатом музея, а резервуар с газом — культурным символом? Этот проект — отсылка
            к эстетике Энди Уорхола, художника, поставившего знак равенства между повседневным
            <br />
            <br />
            Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку
            супа в произведение искусства. превращал банку супа в произведение искусства.
          </p> */}
        </div>
        {data.fields?.pt_images && (
          <div
            className={`Idea__content-slides ${['single', 'double', 'triple'][data.fields.pt_images.length - 1]}`}
          >
            {data.fields.pt_images.map((item: any) => (
              <img
                src={item.full}
                alt="Идея и концепция"
                key={item.id}
                onClick={() => openAllImages(item.full)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
