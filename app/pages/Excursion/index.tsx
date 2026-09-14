import { BGLinks, Form } from 'shared/components/popups/useMWForm';
import './styles.css';

export default function Excursion() {
  return (
    <div className="Excursion px">
      <h1 className="Excursion-title">Экскурсия по производству Interpro</h1>
      <BGLinks />
      <Form type='excursion' subTitle="запишись" title="На экскурсию по нашему производству"/>
    </div>
  );
}
