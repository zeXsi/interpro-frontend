import './styles.css';
import DocOverview from 'shared/sections/DocOverview';
import ContactForm from 'shared/components/ContactForm';
import TitlePage from 'shared/components/TitlePage';

import JsonLd from 'shared/seo/JsonLd';
import { getFeedbackReviewSchemas } from 'shared/seo/schemas';
import { sgFeedbacks } from 'api/feedbacks/feedbacks.api';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { getOpenGraphMeta } from 'shared/seo/meta';

export function meta() {
  const title = 'Interpro: отзывы';
  const description =
    'Отзывы клиентов о компании Interpro: реальный опыт сотрудничества, впечатления о качестве услуг и результатах совместных проектов.';

  return getOpenGraphMeta({ title, description, pathname: '/about-us/feedbacks' });
}

export default function Feedbacks() {
  useSignalValue(sgFeedbacks);
  return (
    <div className="Feedbacks px">
      <JsonLd data={getFeedbackReviewSchemas(sgFeedbacks.v)} />
      <TitlePage title="Отзывы" />
      <DocOverview isNotPage={false} />
      <ContactForm />
    </div>
  );
}
