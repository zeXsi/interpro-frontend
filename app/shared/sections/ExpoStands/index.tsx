import svgCompanies from 'assets/companies';
import './styles.css';
import React, { memo } from 'react';

import MarqueeCarousel from 'shared/components/MarqueeCarousel';
import SectionHeader from 'shared/components/SectionHeader';

interface Props extends React.HTMLAttributes<HTMLElement> {
  ref?: React.RefObject<HTMLDivElement>;
}

function ExpoStands(props: Props) {
  return (
    <div {...props} className="ExpoStands">
      <SectionHeader
        subtitle="( мы )"
        title="Более 9 лет проектируем и строим выставочные стенды под ключ: от разработки концепции до производства и монтажа. За годы работы построили более 350 стендов общей площадью свыше 27 500 м². Собственное производство площадью 3 500 м² позволяет контролировать качество и ключевые этапы реализации проектов."
      />
      <MarqueeCarousel>
        {svgCompanies.map((src, index) => (
          <img
            key={index}
            src={src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        ))}
      </MarqueeCarousel>
    </div>
  );
}

export default memo(ExpoStands);
