import './styles.css';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Pagination, EffectFade } from 'swiper/modules';

export default function Legend({ data, id }: any) {
  const pagination = {
    clickable: true,
    renderBullet: function (index: number, className: string) {
      return (
        '<span class="' + className + '">' + `${data.fields.leg_items[index]?.title}` + '</span>'
      );
    },
  };

  return (
    data.fields.leg_items.length > 0 && (
      <section className="Legend" id={id}>
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
                <p
                  className="Legend__swiper-txt"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                ></p>
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
                  <li className="Legend__content-item" key={attr.label}>
                    <span>{attr.label}</span>
                    <p>{attr.value}</p>
                  </li>
                ))}
              </ul>
              <p
                className="Legend__content-txt"
                dangerouslySetInnerHTML={{ __html: item.text }}
              ></p>
            </div>
          </div>
        ))}
      </section>
    )
  );
}
