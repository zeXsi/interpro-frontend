import './styles.css';
import Button from 'shared/components/Button';
import { Link } from 'react-router';

export default function Contacts({ data, id }: any) {
  const fields = data.fields;

  if (!fields) return null;

  const discussLink = fields.ct_tg || fields.ct_wa || `mailto:${import.meta.env.VITE_EMAIL}`;
  return (
    <section className="Contacts" id={id}>
      <div className="Contacts__content">
        <div className="Contacts__col">
          <p>( менеджер )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <span>{data.fields.ct_name}</span>
            </li>
          </ul>
        </div>
        <div className="Contacts__col">
          <p>( контакты )</p>
          <ul className="Contacts__list">
            {data.fields.ct_tg && (
              <li className="Contacts__list-item">
                <a href={data.fields.ct_tg}>
                  <Button className="Contacts__list-btn" variant="link" children="TELEGRAM" />
                </a>
              </li>
            )}
            {data.fields.ct_wa && (
              <li className="Contacts__list-item">
                <a href={data.fields.ct_wa}>
                  <Button className="Contacts__list-btn" variant="link" children="WHATSAPP" />
                </a>
              </li>
            )}
            <li className="Contacts__list-item">
              <a href={import.meta.env.VITE_PHONE}>
                <Button
                  className="Contacts__list-btn"
                  variant="link"
                  children="+7 (926) 996 25-35"
                />
              </a>
            </li>
            <li className="Contacts__list-item">
              <a href={import.meta.env.VITE_EMAIL}>
                <Button
                  className="Contacts__list-btn"
                  variant="link"
                  children="info@interpro.pro"
                />
              </a>
            </li>
            <li className="Contacts__list-item">
              <a href={discussLink}>
                <button className="Contacts__list-button">Обсудить стенд</button>
              </a>
            </li>
          </ul>
        </div>
        <div className="Contacts__col">
          <p>( наш сайт )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <Link to="/">
                <Button className="Contacts__list-btn" variant="link" children="interpro.pro" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
