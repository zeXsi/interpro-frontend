import './styles.css';

export default function Content({ data, id }: any) {
  const { hd_title, hd_text } = data.fields ?? {};

  if (!hd_title && !hd_text) return null;

  return (
    <section className="Content" id={id}>
      <div className="Content__wrapper">
        {hd_title && <h2 className="Content__title">{hd_title}</h2>}
        {hd_text && <p className="Content__txt" dangerouslySetInnerHTML={{ __html: hd_text }}></p>}
      </div>
    </section>
  );
}
