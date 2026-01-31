import './styles.css';
import PresentationHeader from './Header';
import Cover from './Cover';
import Description from './Description';
import Idea from './Idea';
import Stand from './Stand';
import Contacts from './Contacts';

export default function Presentation() {
  return (
    <>
      <PresentationHeader />
      <main>
        <Cover />
        <Description />
        <Idea />
        <Stand />
        <Contacts />
      </main>
    </>
  );
}
