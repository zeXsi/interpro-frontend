import './styles.css';

import useMWImage from 'shared/components/popups/useMWImage';
import Text from 'shared/components/Text';

export default function Idea({ data, id }: any) {
  const { Popup, showWithData } = useMWImage();

  const images = data.fields?.pt_images ?? [];
  const heading = data.fields?.pt_heading;

  if (!images.length && !heading) return null;

  const layout =
    images.length === 1
      ? 'single'
      : images.length === 2
        ? 'double'
        : images.length >= 3
          ? 'triple'
          : '';

  const openAllImages = (currentSrc?: string) => {
    if (!currentSrc) return;

    const index = images.findIndex((src: any) => src.full === currentSrc);
    showWithData([index >= 0 ? index : 0, images.map((i: any) => i.full)]);
  };

  return (
    <section className="Idea" id={id}>
      {images.length > 0 && <Popup />}

      <div className="Idea__content">
        {heading && (
          <div className="Idea__content-desc">
            <Text>{heading}</Text>
          </div>
        )}

        {images.length > 0 && (
          <div className={`Idea__content-slides ${layout}`}>
            {images.map((item: any) => (
              <img
                key={item.id}
                src={item.full}
                alt="Идея и концепция"
                onClick={() => openAllImages(item.full)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
