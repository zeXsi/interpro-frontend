import Button from 'shared/components/Button';
import './styles.css';
import { Link } from 'react-router';

export default function Contacts() {
  return (
    <section className="Contacts">
      <div className="Contacts__content">
        <div className="Contacts__col">
          <p>( менеджер )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <span>Анастасия</span>
            </li>
          </ul>
        </div>
        <div className="Contacts__col">
          <p>( контакты )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <Link to={import.meta.env.VITE_TELEGRAM_URL_1}>
                <Button className="Contacts__list-btn" variant="link" children="TELEGRAM" />
              </Link>
            </li>
            <li className="Contacts__list-item">
              <Link to={import.meta.env.VITE_WHATSAPP_URL}>
                <Button className="Contacts__list-btn" variant="link" children="WHATSAPP" />
              </Link>
            </li>
            <li className="Contacts__list-item">
              <a href={`tel:${import.meta.env.VITE_PHONE}`}>
                <Button
                  className="Contacts__list-btn"
                  variant="link"
                  children="+7 (926) 996 25-35"
                />
              </a>
            </li>
            <li className="Contacts__list-item">
              <Link to={`mailto:${import.meta.env.VITE_EMAIL}`}>
                <Button
                  className="Contacts__list-btn"
                  variant="link"
                  children="info@interpro.pro"
                />
              </Link>
            </li>
            <li className="Contacts__list-item">
              <button className="Contacts__list-button">
                <a href="#!">Обсудить стенд</a>
              </button>
            </li>
          </ul>
        </div>
        <div className="Contacts__col">
          <p>( наш сайт )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <Link to="">
                <Button className="Contacts__list-btn" variant="link" children="interpro.pro" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
