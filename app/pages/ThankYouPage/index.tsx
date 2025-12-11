import { useNavigate } from 'shared/components/NavigationTracker';
import './styles.css';

import Button from 'shared/components/Button';
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
  const { goTo } = useNavigate();

  return (
    <StartPage>
      <div className="ThankYouPage px">
        <h1 className="ThankYouPage-title">Спасибо, мы скоро свяжемся с Вами</h1>
        <Button.Arrow variant="link" onClick={() => goTo('/')}>
          Назад
        </Button.Arrow>
      </div>
    </StartPage>
  );
}
