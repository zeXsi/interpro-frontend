import { useEffect, useState } from 'react';
import './styles.css';

interface FilterProps<T extends readonly string[]> {
  items: T;
  startItem: T[number];
  onClick?: (tag: T[number]) => void;
}

export default function Filter<T extends readonly string[]>({ items, startItem, onClick }: FilterProps<T>) {
  const [selectedItem, setSelectedItem] = useState(startItem);
  const toClick = (tag: T[number]) => {
    setSelectedItem(tag);
    onClick?.(tag);
  };
  useEffect(() => { 
    toClick(startItem)
  }, [startItem])
  return (
    <ul className="Filter">
      { items.map((tag, index) => {
        const clIsActive = selectedItem === tag ? 'active' : '';
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
