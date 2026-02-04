import './styles.css';

import useMWImage from 'shared/components/popups/useMWImage';
import Text from 'shared/components/Text';

export default function Idea({ data, id }: any) {
  const { Popup, showWithData } = useMWImage();

  const isEmpty = !data.fields.pt_images.length && !data.fields?.pt_heading;

  const openAllImages = (currentSrc?: string) => {
    if (!currentSrc) return;
    const index = data.fields.pt_images.findIndex((src: any) => src.full === currentSrc);
    const images = data.fields.pt_images.map((item: any) => item.full);
    showWithData([index >= 0 ? index : 0, images as any]);
  };

  return (
    <section className={`Idea ${isEmpty ? 'empty' : ''}`} id={id}>
      <Popup />
      <div className="Idea__content">
        <div className="Idea__content-desc">
          {data.fields?.pt_heading && <Text>{data.fields.pt_heading}</Text>}
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
