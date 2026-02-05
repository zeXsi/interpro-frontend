import './styles.css';

export default function Stand({ data, id }: any) {
  const image = data.fields?.sv_image;

  if (!image?.full) return null;

  return (
    <section className="Stand" id={id}>
      <img src={image.full} alt="Изображение проекта: детали стенда" />
    </section>
  );
}
