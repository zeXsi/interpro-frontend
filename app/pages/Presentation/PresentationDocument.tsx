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

export default function PresentationDocument({
  presentationResponse,
}: {
  presentationResponse: any;
}) {
  const shouldShowFirstSlide = presentationResponse?.show_first_slide !== false;

  return (
    <>
      <PresentationHeader />
      <main className={presentationResponse.theme}>
        {shouldShowFirstSlide && <Cover />}
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
