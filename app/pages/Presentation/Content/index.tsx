import './styles.css';

export default function Content({ data, id }: any) {
  return (
    data.fields?.hd_title ||
    data.fields?.hd_text && (
      <section className="Content" id={id}>
        <div className="Content__wrapper">
          {data.fields?.hd_title && <h2 className="Content__title">{data.fields.hd_title}</h2>}
          {data.fields?.hd_text && <p className="Content__txt">{data.fields?.hd_text}</p>}
        </div>
      </section>
    )
  );
}
