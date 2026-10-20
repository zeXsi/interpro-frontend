import './styles.css';

export default function Content({ data, id }: any) {
  const { hd_title, hd_text } = data.fields ?? {};

  if (!hd_title && !hd_text) return null;

  return (
    <section className="PresentationContent" id={id}>
      <div className="PresentationContent__wrapper">
        {hd_title && <h2 className="PresentationContent__title">{hd_title}</h2>}
        {hd_text && (
          <p className="PresentationContent__txt" dangerouslySetInnerHTML={{ __html: hd_text }}></p>
        )}
      </div>
    </section>
  );
}
