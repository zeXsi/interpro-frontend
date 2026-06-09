import './styles.css';
import FAQSection from 'shared/sections/FAQSection';
import ContactForm from 'shared/components/ContactForm';
import StartPage from 'shared/components/StartPage';

import JsonLd from 'shared/seo/JsonLd';
import { getFaqSchema } from 'shared/seo/schemas';
import { sgFaqs } from 'api/faq/faq.api';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { getOpenGraphMeta } from 'shared/seo/meta';

export function meta() {
  const title = "Interpro: ответы на часто задаваемые вопросы";
  const description =
    "На странице FAQ Interpro вы найдете ответы на часто задаваемые вопросы о сервисе, услугах и возможностях платформы.";

  return getOpenGraphMeta({ title, description, pathname: '/faq' });
}

export default function FAQPage() {
  useSignalValue(sgFaqs);
  return (
    <StartPage>
      <JsonLd
        data={getFaqSchema(
          sgFaqs.v.map(({ payload }) => ({
            question: payload.question,
            answer: payload.answer,
          }))
        )}
      />
      <div className="FAQPage px">
        <FAQSection />
        <ContactForm />
      </div>
    </StartPage>
  );
}
