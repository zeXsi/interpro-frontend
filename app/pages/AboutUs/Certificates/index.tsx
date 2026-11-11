import TitlePage from 'shared/components/TitlePage';
import './styles.css';
import Certificates from 'shared/sections/Certificates';
import ContactForm from 'shared/components/ContactForm';
import { getLicenses } from 'api/licenses/license.api';
import type { Route } from './+types';

export async function loader() {
  const licenses = await getLicenses();
  return { licenses: licenses.map(({ payload }) => ({
    title: payload.title,
    file_name: payload.file_name,
    file_url: payload.file_url,
    preview_url: payload.preview_url,
  })) };
}

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

export default function CertificatesPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="CertificatesPage px">
      <TitlePage title={ 'Лицензии и сертификаты' } className="title-2" />
      <Certificates items={loaderData.licenses} />
      <ContactForm />
    </div>
  );
}
