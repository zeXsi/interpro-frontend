import Link from 'shared/components/Link';
import './styles.css';

import 'shared/components/Button/styles.css';
import ArrowIcon from 'assets/icons/arrow.svg?react';
import StartPage from 'shared/components/StartPage';

export function meta() {
  const title = "Interpro: заявка";
  const description =
    "Спасибо за обращение в Interpro! Мы свяжемся с вами в ближайшее время, чтобы обсудить детали вашего запроса.";

  return [
    { title },
    {
      name: "description",
      content: description,
    },
    {
      property: "og:title",
      content: title,
    },
    {
      property: "og:description",
      content: description,
    },
  ];
}


export default function ThankYouPage() {
  return (
    <StartPage>
      <div className="ThankYouPage px">
        <h1 className="ThankYouPage-title">Спасибо, мы скоро свяжемся с Вами</h1>
        <Link to="/">
          <span className="ButtonArrow normal left link">
            <span className="Button link center-right">Назад</span>
            <ArrowIcon className="ButtonArrow-icon" />
          </span>
        </Link>
      </div>
    </StartPage>
  );
}
