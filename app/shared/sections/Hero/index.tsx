import './styles.css';
import HeroTileSvg from 'assets/icons/heroTitle.svg?react';
import srcCover from 'assets/imgs/hero.webp';
import { memo } from 'react';
import { Preloader } from 'shared/components/Preloader';
import VideoPlayer from 'shared/components/VideoPlayer';
import { useHidePreloader } from 'store/stPreloader';
import { toCdnMediaUrl } from 'shared/utils/toCdnMediaUrl';

function Hero() {
  const { clIsHidePreload } = useHidePreloader();

  return (
    <div className={`Hero px ${clIsHidePreload}`}>
      <HeroTileSvg className="Hero-icon" />
      <div className="Hero-wrapper">
        <Preloader mediaUrls={[srcCover]} />
        <VideoPlayer
          className="Hero-bg"
          cover={srcCover}
          videoSources={[
            { src: toCdnMediaUrl('/videos/hls/hero.m3u8'), type: 'application/x-mpegURL' },
          ]}
        />
      </div>
    </div>
  );
}

export default memo(Hero);
