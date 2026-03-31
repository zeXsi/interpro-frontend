import { usePreloader } from 'store/stPreloader';
import './styles.css';
import { memo } from 'react';

interface Props {
  mediaUrls?: string[];
}

export const Preloader = memo(({ mediaUrls = [] }: Props) => {
  const { percent, clIsHidePreload } = usePreloader(mediaUrls);
  return (
    <div className={ `Preloader ${clIsHidePreload} `}>
      <span>{ percent }%</span>
    </div>
  );
})


