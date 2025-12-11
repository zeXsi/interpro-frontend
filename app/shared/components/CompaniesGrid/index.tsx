import './styles.css';

interface Props {
  items: Array<React.ComponentType<React.SVGProps<SVGSVGElement>>>;
}

export default function CompaniesGrid({ items }: Props) {
  return (
    <div className="CompaniesGrid">
      {items.map((Svg, i) => {
        return (
          <div key={i} className="CompaniesGrid-item">
            <Svg />
          </div>
        );
      })}
    </div>
  );
}
