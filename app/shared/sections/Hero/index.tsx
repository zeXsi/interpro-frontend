import './styles.css';
import HeroTileSvg from 'assets/icons/heroTitle.svg?react';
import srcVideo from 'assets/videos/hero.mp4';
import srcCover from 'assets/imgs/hero.png';
import { memo } from 'react';
import { Preloader } from 'shared/components/Preloader';
import VideoPlayer from 'shared/components/VideoPlayer';
import { useHidePreloader } from 'store/stPreloader';


function Hero() {
  const { clIsHidePreload } = useHidePreloader();
 
  return (
    <div className={`Hero px ${clIsHidePreload}`}>
      <HeroTileSvg className="Hero-icon" />
      <div className="Hero-wrapper">
        <Preloader />
        <VideoPlayer
          className="Hero-bg"
          cover={srcCover}
          videoSources={[{ src: srcVideo, type: 'video/mp4' }]}
        />
      </div>
    </div>
  );
}

export default memo(Hero);
