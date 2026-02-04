import './styles.css';

export default function Stand({ data, id }: any) {
  return (
    <section className="Stand" id={id}>
      <img
        src={data.fields.sv_image.full}
        alt="Изображение проекта: детали стенда"
        key={data.fields.sv_image.id}
      />
    </section>
  );
}
