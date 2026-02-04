import './styles.css';
import { useLoaderData } from 'react-router';
import { useActiveSection } from 'shared/hooks/useActiveSection';

export default function PresentationFooter() {
  const presentationResponse = useLoaderData();
  const activeId = useActiveSection(0.3);

  return (
    <section className="PresentationFooter">
      <nav className="PresentationFooter__nav">
        <ul className="PresentationFooter__list">
          <li className="PresentationFooter__item">
            <a
              href="#hero"
              className={`PresentationFooter__link ${activeId === 'hero' ? 'active' : ''}`}
            >
              {presentationResponse.title}
            </a>
          </li>
          {presentationResponse.slides.map(
            (item: any) =>
              item.slide_title && (
                <li className="PresentationFooter__item" key={item.id}>
                  <a
                    href={`#${item.type}${item.id}`}
                    className={`PresentationFooter__link ${
                      activeId === `${item.type}${item.id}` ? 'active' : ''
                    }`}
                  >
                    {item.slide_title}
                  </a>
                </li>
              )
          )}
        </ul>
      </nav>
    </section>
  );
}
