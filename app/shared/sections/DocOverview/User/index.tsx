import './styles.css';

interface UserProps {
  name: string;
  description: string;
}
export default function User({ name, description }: UserProps) {
  return (
    <div className="User">
      <div className="User_name">{ name }</div>
      <p className="User_description">{ description }</p>
    </div>
  );
}
