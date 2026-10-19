import './styles.css';

interface Props {
  items: string[];
}

export default function CompaniesGrid({ items }: Props) {
  return (
    <div className="CompaniesGrid">
      {items.map((src, i) => (
        <div key={i} className="CompaniesGrid-item">
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}
