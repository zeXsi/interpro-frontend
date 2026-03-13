import './styles.css';

import useMWImage from 'shared/components/popups/useMWImage';
import Text from 'shared/components/Text';
import PresentationImage from '../PresentationImage';
import useIsPdfExport from '../useIsPdfExport';

export default function Idea({ data, id }: any) {
  const { Popup, showWithData } = useMWImage();
  const isPdfExport = useIsPdfExport();

  const images = data.fields?.pt_images ?? [];
  const heading = data.fields?.pt_heading?.trim();

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
      {images.length > 0 && !isPdfExport && <Popup />}

      <div
        className={`Idea__content ${layout} ${heading !== '' ? 'heading' : 'no-heading'} ${
          images.length === 0 ? 'no-img' : ''
        }`}
      >
        {heading && (
          <div className="Idea__content-desc">
            <Text>{heading}</Text>
          </div>
        )}

        {images.length > 0 && (
          <div className={`Idea__content-slides ${layout}`}>
            {images.map((item: any) => (
              <PresentationImage
                key={item.id}
                src={item.full}
                alt="Идея и концепция"
                onClick={isPdfExport ? undefined : () => openAllImages(item.full)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
