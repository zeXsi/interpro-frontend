import './styles.css';
import { useLoaderData } from 'react-router';

export default function PresentationHeader() {
  const presentationResponse = useLoaderData();

  const contact = presentationResponse.slides.find((item: any) => item.type == 'contacts');
  const discussLink =
    contact.fields.ct_tg || contact.fields.ct_wa || `mailto:${import.meta.env.VITE_EMAIL}`;

  const renderSpans = (arr?: any[]) => arr?.map((item, index) => <span key={index}>{item}</span>);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <header className="PresentationHeader px">
      <nav className="PresentationHeader__nav">
        <ul className="PresentationHeader__list">
          <li className="PresentationHeader__item">
            {presentationResponse.title && (
              <div className="PresentationHeader__item-box">
                INTER PRO{' '}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.3623 0.242188L4.92871 4.08301L7.50391 0.242188H8.75195L5.52637 4.90039L8.88379 9.75195H7.65332L4.9375 5.73535L2.23047 9.75195H1L4.35742 4.90039L1.13184 0.242188H2.3623Z"
                    fill="#282828"
                  />
                </svg>
                {presentationResponse.title}
              </div>
            )}
            <div className="PresentationHeader__item-box">
              {renderSpans(presentationResponse.tax?.year)}
              {renderSpans(presentationResponse.tax?.expo)}
              {renderSpans(presentationResponse.tax?.stand_type)}

              {presentationResponse?.project_size && (
                <span>
                  {presentationResponse.project_size} м<sup>2</sup>
                </span>
              )}
            </div>
          </li>
          <li className="PresentationHeader__item">
            <a onClick={handlePrint}>
              <button className="PresentationHeader__item-button">
                Cкачать .pdf{' '}
                <svg
                  width="11"
                  height="14"
                  viewBox="0 0 11 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.77778 13.2575H8.88889C9.36038 13.2575 9.81257 13.0702 10.146 12.7368C10.4794 12.4034 10.6667 11.9512 10.6667 11.4797V9.70197C10.6667 9.5448 10.6042 9.39407 10.4931 9.28294C10.382 9.17181 10.2312 9.10938 10.0741 9.10938C9.91691 9.10938 9.76618 9.17181 9.65505 9.28294C9.54391 9.39407 9.48148 9.5448 9.48148 9.70197V11.4797C9.48148 11.6369 9.41905 11.7876 9.30791 11.8988C9.19678 12.0099 9.04605 12.0723 8.88889 12.0723H1.77778C1.62061 12.0723 1.46988 12.0099 1.35875 11.8988C1.24762 11.7876 1.18519 11.6369 1.18519 11.4797V9.70197C1.18519 9.5448 1.12275 9.39407 1.01162 9.28294C0.900486 9.17181 0.749758 9.10938 0.592593 9.10938C0.435427 9.10938 0.284699 9.17181 0.173566 9.28294C0.0624338 9.39407 0 9.5448 0 9.70197V11.4797C0 11.9512 0.187301 12.4034 0.520699 12.7368C0.854097 13.0702 1.30628 13.2575 1.77778 13.2575Z"
                    fill="black"
                  />
                  <path
                    d="M4.9142 10.1256C5.02533 10.2367 5.17603 10.2991 5.33316 10.2991C5.4903 10.2991 5.641 10.2367 5.75213 10.1256L8.64102 7.23674C8.69607 7.18172 8.73976 7.1164 8.76957 7.0445C8.79938 6.9726 8.81474 6.89553 8.81476 6.81769C8.81479 6.73986 8.79949 6.66278 8.76973 6.59085C8.73997 6.51893 8.69633 6.45358 8.64131 6.39852C8.58629 6.34346 8.52097 6.29978 8.44907 6.26997C8.37717 6.24015 8.3001 6.2248 8.22226 6.22477C8.14443 6.22474 8.06735 6.24004 7.99542 6.26981C7.9235 6.29957 7.85815 6.3432 7.80309 6.39822L5.92576 8.27259V0.592593C5.92576 0.435427 5.86332 0.284699 5.75219 0.173566C5.64106 0.0624335 5.49033 0 5.33316 0C5.176 0 5.02527 0.0624335 4.91414 0.173566C4.803 0.284699 4.74057 0.435427 4.74057 0.592593V8.27259L2.86324 6.39526C2.75204 6.28414 2.60126 6.22175 2.44407 6.22181C2.28687 6.22186 2.13613 6.28436 2.02502 6.39556C1.9139 6.50675 1.85151 6.65753 1.85156 6.81473C1.85162 6.97192 1.91412 7.12266 2.02531 7.23378L4.9142 10.1256Z"
                    fill="black"
                  />
                </svg>
              </button>
            </a>
            <a href={discussLink} target='_blank'>
              <button className="PresentationHeader__item-button">Обсудить стенд</button>
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
