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
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ params }: LoaderFunctionArgs) {
  const { name } = params;

  if (!name) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    const { getPresentation } = createPresentationQuery(name);
    const presentationResponse = await getPresentation();

    // если API вернуло пусто / не найдено
    if (!presentationResponse || !presentationResponse.slides?.length) {
      throw new Response('Not Found', { status: 404 });
    }

    return presentationResponse;
  } catch (error) {
    throw new Response('Not Found', { status: 404 });
  }
}

export default function Presentation() {
  const presentationResponse = useLoaderData();

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
      <main className={presentationResponse.theme}>
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
