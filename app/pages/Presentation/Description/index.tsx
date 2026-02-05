import './styles.css';

export default function Description({ data, id }: any) {
  const { text_heading, text_body } = data.fields;

  if (!text_heading && !text_body) return null;

  return (
    <section className="About" id={id}>
      <div className="About__wrapper">
        {text_heading && <p className="About__abovetxt">{text_heading}</p>}
      </div>

      {text_body && (
        <div className="About__text_body" dangerouslySetInnerHTML={{ __html: text_body }} />
      )}
    </section>
  );
}
