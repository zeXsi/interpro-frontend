import type { ImgHTMLAttributes } from 'react';
import './styles.css';

interface GalleryImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onClick'> {
  wrapperClassName?: string;
  onClick?: () => void;
}

export default function GalleryImage({
  wrapperClassName = '',
  onClick,
  ...imageProps
}: GalleryImageProps) {
  return (
    <div className={`GalleryImage ${wrapperClassName}`} onClick={onClick}>
      <img {...imageProps} />
      <span className="GalleryImage-badge" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M30 21.9983V29.9983H22V28.2205H28.2222V21.9983H30ZM22 13.9983V15.7761H15.7778V21.9983H14V13.9983H22Z"
            fill="white"
          />
        </svg>
      </span>
    </div>
  );
}
