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
        title="Проектируем и строим выставочные стенды любого масштаба — от лаконичных решений до сложных архитектурных объектов"
      />
      <MarqueeCarousel>
        {svgCompanies.map((Svg, index) => {
          return <Svg key={index} />;
        })}
      </MarqueeCarousel>
    </div>
  );
}

export default memo(ExpoStands);
