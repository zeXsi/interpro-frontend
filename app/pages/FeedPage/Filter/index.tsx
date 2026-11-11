import './styles.css';

interface FilterProps<T extends readonly string[]> {
  items: T;
  startItem: T[number];
  onClick?: (tag: T[number]) => void;
}

export default function Filter<T extends readonly string[]>({ items, startItem, onClick }: FilterProps<T>) {
  const toClick = (tag: T[number]) => {
    onClick?.(tag);
  };
  return (
    <ul className="Filter">
      { items.map((tag, index) => {
        const clIsActive = startItem === tag ? 'active' : '';
        return (
          <li
            children={ tag }
            key={ index }
            onClick={ () => toClick(tag) }
            className={ `Filter-item ${clIsActive}` }
          />
        );
      }) }
    </ul>
  );
}
