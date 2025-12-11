import './styles.css';
import InfoList from 'shared/components/InfoList';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import ContactForm from 'shared/components/ContactForm';
import useBreakpoints from '@qtpy/use-breakpoints';

import { useLenis } from 'lenis/react';
import { useState } from 'react';
import StartPage from 'shared/components/StartPage';

const coords = [55.834275, 37.648852];

export function meta() {
  const title = "Interpro: контакты";
  const description =
    "Свяжитесь с Interpro: актуальные контактные данные, адрес офиса и формы обратной связи для клиентов и партнеров.";

  return [
    { title },

    { name: "description", content: description },

    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
}

export default function Contacts() {
  const lenis = useLenis();
  const [isActiveMenu, setIsActiveMenu] = useState(false);
  const clIsActiveMenu = isActiveMenu ? 'isActiveMenu' : '';
  const onClick = () => {
    setIsActiveMenu((v) => {
      !v ? lenis?.stop() : lenis?.start();
      return !v;
    });
  };
  const height = useBreakpoints(
    {
      1440: '800px',
      768: '420px',
      0: '380px',
    },
    200
  );

  return (
    <StartPage>
      <YMaps>
        <div className="Contacts">
          <div className="Contacts_info  px">
            <InfoList
              title="связаться:"
              className="__group-1"
              items={[
                ['telegram', import.meta.env.VITE_TELEGRAM_URL_1, 'external'],
                ['Whatsapp', import.meta.env.VITE_WHATSAPP_URL, 'external'],
                ['+7 (499) 390 03-75', import.meta.env.VITE_PHONE, 'external'],
                ['info@interpro.pro', import.meta.env.VITE_EMAIL, 'external'],
              ]}
            />
            <InfoList
              className="InfoList-left __group-2 address map"
              mode="text_underline"
              title="адрес:"
              items={[
                [
                  '129226, г. Москва, ул. Сельскохозяйственная, д.  4, стр. 16,  эт.1, пом. II , ком. 3',
                  'https://yandex.ru/maps/org/interproyekt/30061971306/?ll=37.648855%2C55.834079&z=18.6',
                  'external',
                ],
              ]}
            />
            <InfoList
              title="Соц. сети:"
              className="__group-3"
              items={[
                ['telegram-канал', import.meta.env.VITE_TELEGRAM_URL_2, 'external'],
                ['telegram-live', import.meta.env.VITE_TELEGRAM_URL_3, 'external'],
                ['instagram', import.meta.env.VITE_INSTAGRAM_URL, 'external'],
                ['youtube', import.meta.env.VITE_YOUTUBE_URL, 'external'],
                ['vk', import.meta.env.VITE_VK_URL, 'external'],
                ['pinterest', import.meta.env.VITE_PINTEREST_URL, 'external'],
                ['behance', import.meta.env.VITE_BEHANCE_URL, 'external'],
              ]}
            />
            <InfoList
              className="__group-4"
              mode="text"
              title="реквизиты:"
              items={[
                ['ООО «ИНТЕРПРОЕКТ»', ''],
                ['ОГРН: 1177746477963', ''],
                ['инн: 9717060176', ''],
                ['кпп: 771701001', ''],
              ]}
            />
          </div>
          <div onClick={onClick} className="Contacts_map">
            <Map
              className={`map ${clIsActiveMenu}`}
              style={{ width: '100vw', height: height, margin: 'auto' }}
              defaultState={{
                center: coords,
                zoom: 18,
              }}
            >
              <Placemark
                geometry={coords}
                options={{
                  preset: 'islands#redIcon',
                }}
              />
            </Map>
          </div>
          <ContactForm className="px" />
        </div>
      </YMaps>
    </StartPage>
  );
}
