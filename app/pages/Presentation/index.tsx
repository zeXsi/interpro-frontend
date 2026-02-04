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
import { createPresentationQuery } from 'api/presentation/presentation.api';
import { useLoaderData } from 'react-router';
import Video from './Video';

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

  return (
    <>
      <PresentationHeader />
      <main>
        <Cover />
        {presentationResponse.slides.map((item: any) => {
          if (item.type === 'text') return <Description data={item} key={item.id} />;
          if (item.type === 'photo_text') return <Idea data={item} key={item.id} />;
          if (item.type === 'stand_view') return <Stand data={item} key={item.id} />;
          if (item.type === 'before_after') return <Comparison data={item} key={item.id} />;
          if (item.type === 'legend') return <Legend data={item} key={item.id} />;
          if (item.type === 'contacts') return <Contacts data={item} key={item.id} />;
          if (item.type === 'video') return <Video data={item} key={item.id} />;
        })}
        <Content />
        <Panorama />
      </main>
    </>
  );
}
