import './styles.css';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import { Link as RouterLink } from 'react-router';

export default function Contacts({ data, id }: any) {
  const fields = data.fields;

  if (!fields) return null;

  const discussLink = fields.ct_tg || fields.ct_wa || import.meta.env.VITE_EMAIL;
  return (
    <section className="Contacts" id={id}>
      <div className="Contacts__content">
        <div className="Contacts__col">
          <p>( менеджер )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <span>{fields.ct_name}</span>
            </li>
          </ul>
        </div>
        <div className="Contacts__col">
          <p>( контакты )</p>
          <ul className="Contacts__list">
            {fields.ct_tg && (
              <li className="Contacts__list-item">
                <a href={fields.ct_tg}>
                  <Button className="Contacts__list-btn" variant="link" children="TELEGRAM" />
                </a>
              </li>
            )}
            {fields.ct_wa && (
              <li className="Contacts__list-item">
                <a href={fields.ct_wa}>
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
              <Link to={import.meta.env.VITE_EMAIL} typeLink="external">
                <Button
                  className="Contacts__list-btn"
                  variant="link"
                  children={import.meta.env.VITE_EMAIL_NAME}
                />
              </Link>
            </li>
            <li className="Contacts__list-item">
              <a href={discussLink} target="_blank">
                <button className="Contacts__list-button">Обсудить стенд</button>
              </a>
            </li>
          </ul>
        </div>
        <div className="Contacts__col">
          <p>( наш сайт )</p>
          <ul className="Contacts__list">
            <li className="Contacts__list-item">
              <RouterLink to="/">
                <Button className="Contacts__list-btn" variant="link" children="interpro.pro" />
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
