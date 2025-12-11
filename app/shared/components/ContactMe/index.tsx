import { useHidePreloader } from 'store/stPreloader';
import Button from '../Button';
import Link from '../Link';
import './styles.css';
import { memo } from 'react';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { sgIsOpenMWCookies } from 'store/stGlobal';

function ContactMe() {
  const { clIsHidePreload } = useHidePreloader();
  const isOpen= useSignalValue(sgIsOpenMWCookies)
  const clIsOpenMWCookies = isOpen ? 'isOpenMWCookies' : ''

  return (
    <Link to={['/', '#ContactForm']}>
      <Button className={ `ContactMe btn ${clIsOpenMWCookies} ${clIsHidePreload}`}>связаться</Button>
    </Link>
  );
}
export default  memo(ContactMe)