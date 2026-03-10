import './styles.css';
import { useLoaderData } from 'react-router';

export default function Cover() {
  const presentationResponse = useLoaderData();

  const renderSpans = (arr?: any[]) => arr?.map((item, index) => <span key={index}>{item}</span>);

  return (
    <section className="Cover" id="hero">
      <h1 className="Cover__title">{presentationResponse.title}</h1>
      <p className="Cover__txt">
        {renderSpans(presentationResponse.tax?.year)}
        {renderSpans(presentationResponse.tax?.expo)}
        {renderSpans(presentationResponse.tax?.stand_type)}
        
        {presentationResponse?.project_size && (
          <span>
            {presentationResponse.project_size} м<sup>2</sup>
          </span>
        )}
      </p>
    </section>
  );
}
