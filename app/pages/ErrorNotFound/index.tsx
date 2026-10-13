import 'shared/components/Button/styles.css';
import './styles.css';
import Link from 'shared/components/Link';
import StartPage from 'shared/components/StartPage';

export function loader() {
  throw new Response('Not found', { status: 404 });
}

export default function ErrorNotFound() {
  return (
    <>
      <StartPage>
        <div className="Errors px">
          <div className="ErrorNotFound">
            <h1 className="ErrorNotFound-title">( 404 )</h1>
            <p className="ErrorNotFound-desc">
              Такой страницы нет — возможно, она ещё не построена
            </p>
            <Link to="/">
              <span className="Button ghostLink center-right">На главную</span>
            </Link>
          </div>
        </div>
      </StartPage>
    </>
  );
}

