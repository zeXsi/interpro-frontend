import './styles.css'

interface ArticleProps {
  date: string;
  srcImg: string;
  title: string;
  desc: string;
  onClick?: () => void;
}

export default function Article({ date, onClick,  srcImg, title, desc }: ArticleProps) {
  return (
    <div className="Article" onClick={onClick} >
      <div className="Article-img">
        <img src={srcImg} />
      </div>
      <div className="Article_info">
        <span className="Article_info-date">{date}</span>
        <div className="Article_info-title">{title}</div>
        <p className="Article_info-desc">{desc}</p>
      </div>
    </div>
  );
}
