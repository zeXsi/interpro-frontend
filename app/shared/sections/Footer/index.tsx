import './styles.css';
import InfoList from 'shared/components/InfoList';
import Button from 'shared/components/Button';

import LogoIcon from 'assets/icons/logo.svg?react';
import { useNavigate } from 'shared/components/NavigationTracker';

export default function Footer() {
  const { goTo } = useNavigate();

  return (
    <>
      <div className="Footer px">
        <div className="Footer-title">
          Возьмём на <br /> себя — от идеи <br /> до стройки
        </div>

        {/* <div className="Footer_header-right"> */}
        <InfoList
          title="навигация:"
          items={[
            ['Проекты', '/projects'],
            ['блог', '/blog'],
            ['о нас', '/about-us'],
            ['контакты', '/about-us'],

            ['отзывы', '/about-us/clients'],
            ['клиенты', '/about-us/clients'],
            ['частые вопросы', '/faq'],
          ]}
        />
        <InfoList
          title="Соц. сети:"
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
        {/* <InfoList
            title="услуги:"
            items={[
              ['Проектирование и строительство', ''],
              ['Организация участия', ''],
              ['Event-сервис', ''],
              ['Контент и медиа', ''],
              ['Маркетинг и аналитика', ''],
              ['pinterest', ''],
              ['Интерактив и вовлечение', ''],
            ]}
          /> */}
        <InfoList
          className="__requisites"
          title="реквизиты:"
          items={[
            ['ООО «ИНТЕРПРОЕКТ»', ''],
            ['ОГРН: 1177746477963', ''],
            ['инн: 9717060176', ''],
            ['кпп: 771701001', ''],
          ]}
        />
        <InfoList
          className="InfoList-left __1"
          title="связаться:"
          items={[
            ['telegram', import.meta.env.VITE_TELEGRAM_URL_1, 'external'],
            ['Whatsapp', import.meta.env.VITE_WHATSAPP_URL, 'external'],
            ['+7 (499) 390 03-75', import.meta.env.VITE_PHONE, 'external'],
            ['info@interpro.pro', import.meta.env.VITE_EMAIL, 'external'],
          ]}
        />
        <InfoList
          className="InfoList-left __2 address map"
          title="адрес:"
          items={[
            [
              '129226, г. Москва, ул. Сельскохозяйственная, д.  4, стр. 16,  эт.1, пом. II , ком. 3',
              'https://yandex.ru/maps/org/interproyekt/30061971306/?ll=37.648855%2C55.834079&z=18.6',
              'external',
            ],
          ]}
        />
        {/* </div> */}
        <div className="Footer_bottom ">
          <div className="Footer-text-year">
            <span onClick={() => goTo('/')}>
              <LogoIcon className="Footer_bottom-logo" />
            </span>{' '}
            <span>© 2017 — 2025 интерпроект</span>
          </div>
          <div className="Footer_bottom-wrapper">
            <Button size="sm" variant="ghostLink" onClick={() => goTo('/mapping')}>
              карта сайта
            </Button>
            <Button size="sm" variant="ghostLink" onClick={() => goTo('/privacy')}>
              политика конфиденциальности
            </Button>
            <Button size="sm" variant="ghostLink" onClick={() => goTo('/advertising-privacy')}>
              Политика рекламных материалов
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
