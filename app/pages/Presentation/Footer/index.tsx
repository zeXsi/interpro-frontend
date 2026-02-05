import './styles.css';
import { useLoaderData } from 'react-router';
import { useActiveSection } from 'shared/hooks/useActiveSection';
import { useEffect, useRef } from 'react';

export default function PresentationFooter() {
  const presentationResponse = useLoaderData();
  const activeId = useActiveSection();
  const listRef = useRef<HTMLUListElement>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (!activeId || !listRef.current) return;

    const activeElement = listRef.current.querySelector<HTMLButtonElement>(
      `.PresentationFooter__link.active`
    );

    if (activeElement) {
      // Прокручиваем так, чтобы активная ссылка была по центру контейнера
      activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, [activeId]);

  return (
    <section className="PresentationFooter">
      <nav className="PresentationFooter__nav">
        <ul className="PresentationFooter__list" ref={listRef}>
          <li className="PresentationFooter__item">
            <button
              onClick={() => scrollToSection('hero')}
              className={`PresentationFooter__link ${activeId === 'hero' ? 'active' : ''}`}
            >
              {presentationResponse.title}
            </button>
          </li>
          {presentationResponse.slides.map(
            (item: any) =>
              item.slide_title && (
                <li className="PresentationFooter__item" key={item.id}>
                  <button
                    onClick={() => scrollToSection(`${item.type}${item.id}`)}
                    className={`PresentationFooter__link ${
                      activeId === `${item.type}${item.id}` ? 'active' : ''
                    }`}
                  >
                    {item.slide_title}
                  </button>
                </li>
              )
          )}
        </ul>
      </nav>
    </section>
  );
}
