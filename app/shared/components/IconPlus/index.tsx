import './styles.css';


interface IconPlus {
  isActive: boolean;
}
export function IconPlus({ isActive }: IconPlus) {
  const clIsActive = isActive ? 'active' : '';
  return (
    <div className={ `IconPlus ${clIsActive}` }>
      <div className="IconPlus-line"></div>
    </div>
  );
}
