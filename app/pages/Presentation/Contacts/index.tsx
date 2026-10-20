import './styles.css';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import { Link as RouterLink } from 'react-router';

export default function Contacts({ data, id }: any) {
  const fields = data.fields;

  if (!fields) return null;

  const discussLink = fields.ct_tg || fields.ct_wa || import.meta.env.VITE_EMAIL;
  return (
    <section className="PresentationContacts" id={id}>
      <div className="PresentationContacts__content">
        <div className="PresentationContacts__col">
          <p>( менеджер )</p>
          <ul className="PresentationContacts__list">
            <li className="PresentationContacts__list-item">
              <span>{fields.ct_name}</span>
            </li>
          </ul>
        </div>
        <div className="PresentationContacts__col">
          <p>( контакты )</p>
          <ul className="PresentationContacts__list">
            {fields.ct_tg && (
              <li className="PresentationContacts__list-item">
                <a href={fields.ct_tg}>
                  <Button
                    as="span"
                    className="PresentationContacts__list-btn"
                    variant="link"
                    children="TELEGRAM"
                  />
                </a>
              </li>
            )}
            {fields.ct_wa && (
              <li className="PresentationContacts__list-item">
                <a href={fields.ct_wa}>
                  <Button
                    as="span"
                    className="PresentationContacts__list-btn"
                    variant="link"
                    children="WHATSAPP"
                  />
                </a>
              </li>
            )}
            <li className="PresentationContacts__list-item">
              <a href={import.meta.env.VITE_PHONE}>
                <Button
                  as="span"
                  className="PresentationContacts__list-btn"
                  variant="link"
                  children="+7 (926) 996 25-35"
                />
              </a>
            </li>
            <li className="PresentationContacts__list-item">
              <Link to={import.meta.env.VITE_EMAIL} typeLink="external">
                <Button
                  as="span"
                  className="PresentationContacts__list-btn"
                  variant="link"
                  children={import.meta.env.VITE_EMAIL_NAME}
                />
              </Link>
            </li>
            <li className="PresentationContacts__list-item">
              <a href={discussLink} target="_blank">
                <span className="PresentationContacts__list-button">Обсудить стенд</span>
              </a>
            </li>
          </ul>
        </div>
        <div className="PresentationContacts__col">
          <p>( наш сайт )</p>
          <ul className="PresentationContacts__list">
            <li className="PresentationContacts__list-item">
              <RouterLink to="/">
                <Button
                  as="span"
                  className="PresentationContacts__list-btn"
                  variant="link"
                  children="interpro.pro"
                />
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
