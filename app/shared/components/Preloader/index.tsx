import { usePreloader } from 'store/stPreloader';
import './styles.css';
import { memo } from 'react';


export const Preloader = memo(() => {
  const { percent, clIsHidePreload } = usePreloader();
  return (
    <div className={ `Preloader ${clIsHidePreload} `}>
      <span>{ percent }%</span>
    </div>
  );
})


