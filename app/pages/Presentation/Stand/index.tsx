import './styles.css';
import PresentationImage from '../PresentationImage';

export default function Stand({ data, id }: any) {
  const images = data.fields?.sv_images ?? [];

  if (images.length === 0) return null;

  return (
    <section className="Stand" id={id}>
      {images.map((item: any) => (
        <PresentationImage
          key={item.id ?? item.full}
          src={item.full}
          alt="Изображение проекта: детали стенда"
        />
      ))}
    </section>
  );
}
