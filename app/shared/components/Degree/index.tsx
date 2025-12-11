import './styles.css'

interface Props {
  text: string | number;
  degree: number;
}
export default function Degree({ text, degree }: Props) {
  const num = Number.parseInt(`${text}`);
  const isZero = num == 0;

  return (
    <p className="Degree">
      { !isZero ? text : 'Нет' }
      { !isZero && <sup>{ degree }</sup> }
    </p>
  );
}
