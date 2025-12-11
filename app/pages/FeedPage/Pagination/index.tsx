import Button from 'shared/components/Button';
import './styles.css';

interface Props {
  countPages: number;
  currentPage: number;
  onChange: (page: number) => void;
  sliceStart?: number;
  sliceEnd?: number;
}

export default function Pagination({
  countPages,
  currentPage,
  onChange,
  sliceStart = 3,
  sliceEnd = 2,
}: Props) {
  const handlePrev = () => {
    if (currentPage > 1) onChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < countPages) onChange(currentPage + 1);
  };

  const renderPages = () => {
    const pages: (number | '...')[] = [];

    if (countPages <= sliceStart + sliceEnd + 2) {
      for (let i = 1; i <= countPages; i++) pages.push(i);
    } else {
      const startPages = Array.from({ length: sliceStart }, (_, i) => i + 1);
      const endPages = Array.from({ length: sliceEnd }, (_, i) => countPages - sliceEnd + i + 1);

      const middleRange = [
        currentPage - 1,
        currentPage,
        currentPage + 1,
      ].filter((p) => p > sliceStart && p < countPages - sliceEnd + 1);

      pages.push(...startPages);

      // троеточие после начала
      if (middleRange.length) {
        if (middleRange[0] > sliceStart + 1) {
          pages.push('...');
        }
        pages.push(...middleRange);
        if (middleRange[middleRange.length - 1] < countPages - sliceEnd) {
          pages.push('...');
        }
      } else {
        // если нет middleRange, но до конца далеко — тоже ставим троеточие
        if (countPages - sliceEnd > sliceStart + 1) {
          pages.push('...');
        }
      }

      pages.push(...endPages);
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <li key={ `dots-${idx}` } className="Pagination_list-item dots">
            ...
          </li>
        );
      }

      const isActive = page === currentPage;
      return (
        <li
          key={ page }
          className={ `Pagination_list-item ${isActive ? 'active' : ''}` }
          onClick={ () => onChange(page) }
        >
          { page }
        </li>
      );
    });
  };


  return (
    <div className="Pagination">
      <Button.Arrow
        variant="link"
        className="Pagination-arrow"
        size="sm"
        direction="left"
        onClick={ handlePrev }
        disabled={ currentPage === 1 }
      >
        Предыдущая
      </Button.Arrow>

      <ul className="Pagination_list">{ renderPages() }</ul>

      <Button.Arrow
        variant="link"
        className="Pagination-arrow"
        size="sm"
        direction="right"
        onClick={ handleNext }
        disabled={ currentPage === countPages }
      >
        Следующая
      </Button.Arrow>
    </div>
  );
}
