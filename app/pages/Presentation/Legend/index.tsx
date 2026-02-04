import './styles.css';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Pagination, EffectFade } from 'swiper/modules';
import slide from 'assets/imgs/Presentation/slide.png';
import stand1 from 'assets/imgs/Presentation/stand1.png';
import stand2 from 'assets/imgs/Presentation/stand2.png';
import Comparison1 from 'assets/imgs/Presentation/Comparison1.png';
import Comparison2 from 'assets/imgs/Presentation/Comparison2.png';

const tabsContent = [
  {
    id: 1,
    title: 'Навес',
    material: 'сталь',
    height: '4 метра',
    image: Comparison1,
    desc: 'Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку супа в произведение искусства. превращал банку супа в произведение искусства.',
  },
  {
    id: 2,
    title: 'второй этаж',
    material: 'сталь',
    height: '4 метра',
    image: Comparison2,
    desc: 'Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку супа в произведение искусства. превращал банку супа в произведение искусства.',
  },
  {
    id: 3,
    title: 'экран',
    material: 'сталь',
    height: '4 метра',
    image: slide,
    desc: 'Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку супа в произведение искусства. превращал банку супа в произведение искусства.',
  },
  {
    id: 4,
    title: 'зона 1',
    material: 'сталь',
    height: '4 метра',
    image: stand1,
    desc: 'Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку супа в произведение искусства. превращал банку супа в произведение искусства.',
  },
  {
    id: 5,
    title: 'зона 2',
    material: 'сталь',
    height: '4 метра',
    image: stand2,
    desc: 'Возвышенным, между утилитарным продуктом и визуальным образом. Уорхол превращал банку супа в произведение искусства. превращал банку супа в произведение искусства.',
  },
];

export default function Legend({ data }: any) {
  const pagination = {
    clickable: true,
    renderBullet: function (index: number, className: string) {
      return (
        '<span class="' + className + '">' + `${data.fields.leg_items[index]?.title}` + '</span>'
      );
    },
  };

  return (
    <section className="Legend">
      <Swiper
        direction={'vertical'}
        slidesPerView={1}
        effect={'fade'}
        spaceBetween={8}
        // mousewheel={true}
        pagination={pagination}
        modules={[EffectFade, Mousewheel, Pagination]}
        className="Legend__swiper"
      >
        {data.fields.leg_items.map((item: any) => (
          <SwiperSlide key={item.id} className="Legend__swiper-slide">
            <img src={item.full} alt={item.title} className="Legend__swiper-image" />
            <div className="Legend__swiper-desc">
              <h3 className="Legend__swiper-title">{item.title}</h3>
              <ul className="Legend__swiper-list">
                {item.attrs.map((attr: any) => (
                  <li className="Legend__swiper-item" key={attr.label}>
                    <span>{attr.label}</span>
                    <p>{attr.value}</p>
                  </li>
                ))}
              </ul>
              <p className="Legend__swiper-txt" dangerouslySetInnerHTML={{ __html: item.text }}></p>
            </div>
          </SwiperSlide>
        ))}
        <div className="swiper-pagination tabs-pagination"></div>
      </Swiper>
      {data.fields.leg_items.map((item: any) => (
        <div className="Legend__content" key={item.image}>
          <h2 className="Legend__content-title">{item.title}</h2>
          <img src={item.full} alt={item.title} className="Legend__content-image" />
          <div className="Legend__content-desc">
            <ul className="Legend__content-list">
              {item.attrs.map((attr: any) => (
                <li className="Legend__content-item">
                  <span>{attr.label}</span>
                  <p>{attr.value}</p>
                </li>
              ))}
            </ul>
            <p className="Legend__content-txt" dangerouslySetInnerHTML={{ __html: item.text }}></p>
          </div>
        </div>
      ))}
    </section>
  );
}
