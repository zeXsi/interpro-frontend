import './styles.css';

export default function Description({ data, id }: any) {
  const { text_heading, text_body } = data.fields ?? {};

  if (!text_heading && !text_body) return null;

  return (
    <section className="PresentationAbout" id={id}>
      <div className="PresentationAbout__wrapper">
        {text_heading && <p className="PresentationAbout__abovetxt">{text_heading}</p>}
        {text_body && (
          <div
            className="PresentationAbout__text_body"
            dangerouslySetInnerHTML={{ __html: text_body }}
          />
        )}
      </div>
    </section>
  );
}
