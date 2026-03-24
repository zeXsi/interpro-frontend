import { useHidePreloader } from 'store/stPreloader';
import Button from '../Button';
import './styles.css';
import useMWNav, { MWNavMode } from 'shared/components/popups/useMWNav';
import { useSignalValue } from 'shared/utils/_stm/react/react';

export default function BTNContact() {
  const { clIsHidePreload } = useHidePreloader();
  const mode = useSignalValue(MWNavMode);
  const { Popup, toClosePopup, showWithData, isShowed } = useMWNav();

  const onClickContact = () => {
    if (!isShowed || mode === 'nav') {
      showWithData('contacts');
      return;
    }

    toClosePopup();
  };

  return (
    <>
      <Button className={`BTNContact ${clIsHidePreload}`} onClick={onClickContact}>
        связаться
      </Button>
      <Popup />
    </>
  );
}
