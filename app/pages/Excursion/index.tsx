import { BGLinks, Form } from 'shared/components/popups/useMWForm';
import './styles.css';

export default function Excursion() {
  return (
    <div className="Excursion px">
      <BGLinks />
      <Form type='excursion' subTitle="запишись" title="На экскурсию по нашему производству"/>
    </div>
  );
}
