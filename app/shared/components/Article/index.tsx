import './styles.css';
import Link from 'shared/components/Link';

interface ArticleProps {
  date: string;
  srcImg: string;
  title: string;
  desc: string;
  to: string;
}

export default function Article({ date, to, srcImg, title, desc }: ArticleProps) {
  return (
    <Link to={to} slug={title}>
      <div className="Article">
        {srcImg && (
          <div className="Article-img">
            <img src={srcImg} />
          </div>
        )}
        <div className="Article_info">
          <span className="Article_info-date">{date}</span>
          <div className="Article_info-title">{title}</div>
          <p className="Article_info-desc">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
