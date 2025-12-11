import './styles.css';
import CrossIcon from 'assets/icons/cross.svg?react';
import Accordion from 'shared/components/Accordion';
import Button from 'shared/components/Button';
import InfoList from 'shared/components/InfoList';
import Link from 'shared/components/Link';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { sgFaqs } from 'api/faq/faq.api';


interface Props {
  qntyPreview?: number;
}
export default function FAQSection({ qntyPreview = Infinity }: Props) {
  useSignalValue(sgFaqs)

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
            ['info@interpro.pro', import.meta.env.VITE_EMAIL, 'external'],
          ]}
        />
      </div>
      <div className="FAQSection_right">
        <div className="FAQSection_right-items">
          { sgFaqs.v.slice(0, qntyPreview).map(({ payload }, index) => (
            <Accordion key={ index }>
              <Accordion.Header>
                <span className="Accordion_header-title">{ payload.question }</span>
                <CrossIcon className="Accordion_header-icon" />
              </Accordion.Header>
              <Accordion.Content>
                <p className="Accordion_content-description">{ payload.answer }</p>
              </Accordion.Content>
            </Accordion>
          )) }
        </div>
        {
          //prettier-ignore
          qntyPreview !== Infinity && (
            <Link to="/faq">
              <Button.Arrow direction='right' className='FAQSection_right-btn' >
                Все вопросы
              </Button.Arrow> 
            </Link>
        )}
      </div>
     
    </div>
  );
}
