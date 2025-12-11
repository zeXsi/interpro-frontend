import TitlePage from 'shared/components/TitlePage';
import './styles.css';
import Certificates from 'shared/sections/Certificates';
import ContactForm from 'shared/components/ContactForm';

export function meta() {
  const title = 'Interpro: сертификаты';
  const description =
    'Ознакомьтесь с нашими сертификатами качества и соответствия. Мы гарантируем надежность, прозрачность и высокие стандарты в каждой детали.';

  return [
    { title },
    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function CertificatesPage() {
  return (
    <div className="CertificatesPage px">
      <TitlePage title={ 'Лицензии и сертификаты' } className="title-2" />
      <Certificates />
      <ContactForm />
    </div>
  );
}
