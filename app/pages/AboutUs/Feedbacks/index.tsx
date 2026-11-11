import './styles.css';
import DocOverview from 'shared/sections/DocOverview';
import ContactForm from 'shared/components/ContactForm';
import TitlePage from 'shared/components/TitlePage';

import JsonLd from 'shared/seo/JsonLd';
import { getFeedbackReviewSchemas } from 'shared/seo/schemas';
import { getFeedbacks } from 'api/feedbacks/feedbacks.api';
import feedbacksToItems from 'shared/sections/DocOverview/feedbacksToItems';
import type { Route } from './+types';
import { getOpenGraphMeta } from 'shared/seo/meta';

export async function loader() {
  const feedbacks = await getFeedbacks();
  return { feedbacks: feedbacks.map(({ payload }) => ({ payload: {
    title: payload.title,
    company: payload.company,
    person: payload.person ? { name: payload.person.name, position: payload.person.position } : payload.person,
    text: payload.text,
    pdf: payload.pdf,
    date: payload.date,
  } })) };
}

export function meta() {
  const title = 'Interpro: отзывы';
  const description =
    'Отзывы клиентов о компании Interpro: реальный опыт сотрудничества, впечатления о качестве услуг и результатах совместных проектов.';

  return getOpenGraphMeta({ title, description, pathname: '/about-us/feedbacks' });
}

export default function Feedbacks({ loaderData }: Route.ComponentProps) {
  return (
    <div className="Feedbacks px">
      <JsonLd data={getFeedbackReviewSchemas(loaderData.feedbacks)} />
      <TitlePage title="Отзывы" />
      <DocOverview isNotPage={false} items={feedbacksToItems(loaderData.feedbacks)} />
      <ContactForm />
    </div>
  );
}
