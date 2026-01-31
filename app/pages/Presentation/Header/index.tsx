import './styles.css';

export default function PresentationHeader() {
  return (
    <header className="PresentationHeader px">
      <nav className="PresentationHeader__nav">
        <ul className="PresentationHeader__list">
          <li className="PresentationHeader__item">
            <div className="PresentationHeader__item-box">INTER PRO x Novatek</div>
            <div className="PresentationHeader__item-box">
              <span>2026</span>
              <span>Металл Экспо</span>
              <span>Остров</span>
              <span>124 м2</span>
            </div>
          </li>
          <li className="PresentationHeader__item">
            <button className="PresentationHeader__item-button">Cкачать .pdf</button>
            <button className="PresentationHeader__item-button">
              <a href="#!">Обсудить стенд</a>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
