import { useHidePreloader } from 'store/stPreloader';
import Button from '../Button';
import Link from '../Link';
import './styles.css';

export default function BTNContact() {
  const { clIsHidePreload } = useHidePreloader();
  
  return (
    <Link to={['/', '#ContactForm']}>
      <Button className={`BTNContact ${clIsHidePreload}`}>
        связаться
      </Button>
    </Link>
  );
}
