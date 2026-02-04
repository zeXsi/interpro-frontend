import './styles.css';
import PresentationHeader from './Header';
import Cover from './Cover';
import Description from './Description';
import Idea from './Idea';
import Stand from './Stand';
import Contacts from './Contacts';
import Comparison from './Comparison';
import Legend from './Legend';
import Panorama from './Panorama';
import Content from './Content';
import Video from './Video';
import PresentationFooter from './Footer';
import { createPresentationQuery } from 'api/presentation/presentation.api';
import { useLoaderData } from 'react-router';

export async function loader() {
  try {
    const { sgPresentation, getPresentation } = createPresentationQuery('imperiya-klimata');

    const presentationResponse = await getPresentation();

    return presentationResponse;
  } catch (error) {
    return error;
  }
}

export default function Presentation() {
  const presentationResponse = useLoaderData();
  console.log(presentationResponse);

  const COMPONENTS: Record<string, React.FC<any>> = {
    text: Description,
    photo_text: Idea,
    stand_view: Stand,
    before_after: Comparison,
    legend: Legend,
    contacts: Contacts,
    heading: Content,
    video: Video,
    photo_360: Panorama,
  };

  return (
    <>
      <PresentationHeader />
      <main>
        <Cover />
        {presentationResponse.slides.map((item: any) => {
          const Component = COMPONENTS[item.type];
          if (!Component) return null;

          return <Component key={item.id} id={item.type + item.id} data={item} />;
        })}
      </main>
      <PresentationFooter />
    </>
  );
}
