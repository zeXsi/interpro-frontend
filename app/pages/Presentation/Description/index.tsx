import './styles.css';

export default function Description({ data, id }: any) {
  return (
    <section className="About" id={id}>
      <div className="About__wrapper">
        <p className="About__abovetxt">( задача )</p>
      </div>
      <div
        className="About__text_body"
        dangerouslySetInnerHTML={{ __html: data.fields.text_body }}
      ></div>
    </section>
    // <section className="Description">
    //   <div className="Description__content">
    //     <p className="Description__abovetxt">( задача )</p>
    //     <div className="Description__txt">
    //       Что делает обычный продукт предметом искусства? Почему суповая банка становится экспонатом
    //       музея, а резервуар с газом — культурным символом? Этот проект — отсылка к эстетике Энди
    //       Уорхола, художника, поставившего знак равенства между повседневным
    //     </div>
    //   </div>
    // </section>
  );
}
