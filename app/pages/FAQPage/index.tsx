import './styles.css';
import FAQSection from 'shared/sections/FAQSection';
import ContactForm from 'shared/components/ContactForm';
import StartPage from 'shared/components/StartPage';
import TitlePage from 'shared/components/TitlePage';

import JsonLd from 'shared/seo/JsonLd';
import { getFaqSchema } from 'shared/seo/schemas';
import { getFaqs } from 'api/faq/faq.api';
import type { Route } from './+types';
import { getOpenGraphMeta } from 'shared/seo/meta';

export async function loader() {
  const faqs = await getFaqs();
  return { faqs: faqs.map(({ payload }) => ({ question: payload.question, answer: payload.answer })) };
}

export function meta() {
  const title = "Interpro: ответы на часто задаваемые вопросы";
  const description =
    "На странице FAQ Interpro вы найдете ответы на часто задаваемые вопросы о сервисе, услугах и возможностях платформы.";

  return getOpenGraphMeta({ title, description, pathname: '/faq' });
}

export default function FAQPage({ loaderData }: Route.ComponentProps) {
  return (
    <StartPage>
      <JsonLd
        data={getFaqSchema(loaderData.faqs)}
      />
      <div className="FAQPage px">
        <TitlePage title="Частые вопросы" />
        <FAQSection items={loaderData.faqs} />
        <ContactForm />
      </div>
    </StartPage>
  );
}
