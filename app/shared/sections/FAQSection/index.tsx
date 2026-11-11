import './styles.css';
import CrossIcon from 'assets/icons/cross.svg?react';
import Accordion from 'shared/components/Accordion';
import Button from 'shared/components/Button';
import InfoList from 'shared/components/InfoList';
import Link from 'shared/components/Link';

export interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  qntyPreview?: number;
  items: FAQItem[];
  showAllLink?: boolean;
}

export default function FAQSection({ items, showAllLink = false }: Props) {
  return <FAQContent items={items} showAllLink={showAllLink} />;
}

function FAQContent({ items, showAllLink }: { items: FAQItem[]; showAllLink: boolean }) {
  return (
    <div className="FAQSection px" id="FAQSection">
      <div className="FAQSection-left">
        <div className="FAQSection-title">Мы собрали всё, что обычно спрашивают перед стартом</div>
        <InfoList
          title="задать свой вопрос:"
          items={[
            ['telegram', import.meta.env.VITE_TELEGRAM_URL_1, 'external'],
            ['Whatsapp', import.meta.env.VITE_WHATSAPP_URL, 'external'],
            ['+7 (499) 390 03-75', import.meta.env.VITE_PHONE, 'external'],
            [import.meta.env.VITE_EMAIL_NAME, import.meta.env.VITE_EMAIL, 'external'],
          ]}
        />
      </div>
      <div className="FAQSection_right">
        <div className="FAQSection_right-items">
          {items.map((item, index) => (
            <Accordion key={index}>
              <Accordion.Header>
                <span className="Accordion_header-title">{item.question}</span>
                <CrossIcon className="Accordion_header-icon" />
              </Accordion.Header>
              <Accordion.Content>
                <p
                  className="Accordion_content-description"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </Accordion.Content>
            </Accordion>
          ))}
        </div>
        {
          //prettier-ignore
          showAllLink && (
            <Link to="/faq">
              <Button.Arrow as="span" direction='right' className='FAQSection_right-btn' >
                Все вопросы
              </Button.Arrow> 
            </Link>
        )}
      </div>

    </div>
  );
}
