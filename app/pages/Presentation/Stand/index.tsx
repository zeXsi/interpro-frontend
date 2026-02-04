import './styles.css';

// import standImg1 from 'assets/imgs/Presentation/stand1.png';
// import standImg2 from 'assets/imgs/Presentation/stand2.png';

// const standImages = [standImg1, standImg2];

export default function Stand({ data }: any) {
  return (
    <section className="Stand">
      <img
        src={data.fields.sv_image.full}
        alt="Изображение проекта: детали стенда"
        key={data.fields.sv_image.id}
      />
    </section>
  );
}
