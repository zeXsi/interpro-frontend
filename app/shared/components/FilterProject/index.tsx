import './styles.css';
import { useState } from 'react';
import CloseIcon from 'assets/icons/close.svg?react';
import { IconPlus } from '../IconPlus';

export interface FilterProps {
  items: FilterItem[];
  onClick?: (
    tagName: string | undefined,
    id: number | string | undefined,
    toClearAll: boolean
  ) => void;
}

export default function FilterProject({ items, onClick }: FilterProps) {
  return (
    <div className="FilterProject">
      {items?.map((props, index) => {
        return <FilterItem key={index} {...props} onClickItem={onClick} />;
      })}
    </div>
  );
}

export interface FilterItem {
  filterName: string;
  filterType: string;
  items: {
    name: string;
    id: string | number;
  }[];
}
interface FilterItemProps extends FilterItem {
  onClickItem?: FilterProps['onClick'];
}

function FilterItem({ filterName, filterType, items, onClickItem }: FilterItemProps) {
  const [active, setActive] = useState(false);
  const [activesIndex, setActivesIndex] = useState<number[]>([]);

  const qntyItems = activesIndex.length ? `(${activesIndex.length})` : undefined;
  const clIsActive = active ? 'active' : '';

  const handleClickTitle = () => setActive(!active);

  const toClearTags = () => {
    setActivesIndex([]);
    onClickItem?.(undefined, undefined, true);
  };

  const toClickItem = (index: number, name: string, id: number | string) => {
    setActivesIndex((prev) => {
      const newArr = [...prev];
      const isExistItem = prev.includes(index);
      return isExistItem ? newArr.filter((v) => v !== index) : [...newArr, index];
    });
    onClickItem?.(name, id, false);
  };

  return (
    <div className={`FilterItem ${clIsActive}`}>
      <div className="FilterItem-title" onClick={handleClickTitle}>
        {filterName} {qntyItems} <IconPlus isActive={!active} />
      </div>  
      <div className="wrap-anim-FilterItem-container">
        <div className="wrap-FilterItem-container">
          <div className="FilterItem-container">
            {items.map((props, index) => {
              const isActive = activesIndex.includes(index);
              const clIsActive = isActive ? 'active' : '';
              return (
                <span
                  key={index}
                  children={props.name}
                  onClick={() => toClickItem(index, filterType, props.id)}
                  className={`FilterItem-item ${clIsActive}`}
                />
              );
            })}
            <button onClick={toClearTags} className="FilterItem-item-cancel">
              очистить <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
