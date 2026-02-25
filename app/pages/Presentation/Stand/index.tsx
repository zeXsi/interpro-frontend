import './styles.css';

export default function Stand({ data, id }: any) {
  const images = data.fields?.sv_images;

  if (images?.length === 0) return null;

  return (
    <section className="Stand" id={id}>
      {images.map((item) => (
        <img src={item.full} alt="Изображение проекта: детали стенда" />
      ))}
    </section>
  );
}
