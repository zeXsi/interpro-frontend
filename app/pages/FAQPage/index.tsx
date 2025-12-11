import './styles.css';
import FAQSection from 'shared/sections/FAQSection';
import ContactForm from 'shared/components/ContactForm';
import StartPage from 'shared/components/StartPage';

export function meta() {
  const title = "Interpro: ответы на часто задаваемые вопросы";
  const description =
    "На странице FAQ Interpro вы найдете ответы на часто задаваемые вопросы о сервисе, услугах и возможностях платформы.";

  return [
    { title },
    { name: "description", content: description },

    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
}

export default function FAQPage() {
  return (
    <StartPage>
      <div className="FAQPage px">
        <FAQSection />
        <ContactForm />
      </div>
    </StartPage>
  );
}
