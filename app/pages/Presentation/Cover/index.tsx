import './styles.css';
import { useLoaderData } from 'react-router';

export default function Cover() {
  const presentationResponse = useLoaderData();

  return (
    <section className="Cover" id="hero">
      <h1 className="Cover__title">{presentationResponse.title}</h1>
      <p className="Cover__txt">
        {presentationResponse.tax?.year && <span>{presentationResponse.tax.year[0]}</span>}
        {presentationResponse.tax?.expo && <span>{presentationResponse.tax.expo[0]}</span>}
        {presentationResponse.tax?.stand_type && (
          <span>{presentationResponse.tax.stand_type[0]}</span>
        )}
        {presentationResponse?.project_size && (
          <span>
            {presentationResponse?.project_size} м<sup>2</sup>
          </span>
        )}
      </p>
    </section>
  );
}
