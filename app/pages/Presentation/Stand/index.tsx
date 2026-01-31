import './styles.css';

import standImg1 from 'assets/imgs/Presentation/stand1.png';
import standImg2 from 'assets/imgs/Presentation/stand2.png';

const standImages = [standImg1, standImg2];

export default function Stand() {
  return (
    <section className="Stand">
      {standImages.map((item) => (
        <img src={item} alt="Изображение проекта: детали стенда" key={item} />
      ))}
    </section>
  );
}
