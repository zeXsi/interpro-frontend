import './styles.css';
import DocOverview from 'shared/sections/DocOverview';
import ContactForm from 'shared/components/ContactForm';
import TitlePage from 'shared/components/TitlePage';

export function meta() {
  const title = 'Interpro: отзывы';
  const description =
    'Отзывы клиентов о компании Interpro: реальный опыт сотрудничества, впечатления о качестве услуг и результатах совместных проектов.';

  return [
    { title },

    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function Feedbacks() {
  return (
    <div className="Feedbacks px">
      <TitlePage title="Отзывы" />
      <DocOverview isNotPage={false} />
      <ContactForm />
    </div>
  );
}
