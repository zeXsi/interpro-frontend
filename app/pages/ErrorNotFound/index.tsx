import Button from 'shared/components/Button';
import './styles.css';
import { useNavigate } from 'shared/components/NavigationTracker';
import StartPage from 'shared/components/StartPage';

export default function ErrorNotFound() {
  const { goTo } = useNavigate();

  return (
    <>
      <StartPage>
        <div className="Errors px">
          <div className="ErrorNotFound">
            <h1 className="ErrorNotFound-title">( 404 )</h1>
            <p className="ErrorNotFound-desc">
              Такой страницы нет — возможно, она ещё не построена
            </p>
            <Button variant="ghostLink" onClick={() => goTo('/')}>
              На главную
            </Button>
          </div>
        </div>
      </StartPage>
    </>
  );
}

