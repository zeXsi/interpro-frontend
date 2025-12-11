import './styles.css';
import { useImperativeHandle, useMemo, useRef, useState } from 'react';
import usePopup from './src';
import '@qtpy/use-popup/index.css';
import Button from 'shared/components/Button';
import Accordion from 'shared/components/Accordion';
import { IconPlus } from 'shared/components/IconPlus';
import { useNavigate } from 'shared/components/NavigationTracker';
import Link from 'shared/components/Link';
import { sgServiceCategories } from 'api/services/services.api';
import { sgProjects } from 'api/projects/projects.api';
import { signal } from 'shared/utils/_stm';
import { useSignalValue } from 'shared/utils/_stm/react/react';

type NavItem = {
  label: string;
  link?: string;
  parentLink?: string;
  parentLabel?: string;
  children?: NavItem[];
};

function buildTree(data: any[], parentPath: string = '/services'): NavItem[] {
  return data.map((category) => {
    const categoryPath = `${parentPath}/${category.slug}`;

    const node: NavItem = {
      label: category.name,
      link: categoryPath,
      children: [],
    };

    // Добавляем посты как children
    if (category.payload?.posts?.length) {
      const postNodes = category.payload.posts.map((post: any) => ({
        label: post.title,
        link: `${categoryPath}/${post.slug}`,
        parentLabel: category.name,
      }));
      node.children = [...(node.children || []), ...postNodes];
    }

    // Рекурсивно добавляем подкатегории
    if (category.payload?.children?.length) {
      const childNodes = buildTree(category.payload.children, categoryPath);
      node.children = [...(node.children || []), ...childNodes];
    }

    return node;
  });
}

type unionTypes = 'nav' | 'contacts';
interface ImpMethods {
  getData: () => unionTypes;
}
export const MWNavMode = signal<unionTypes>('nav');

export default function useMWNav() {
  const refTimeId = useRef<NodeJS.Timeout>(null);
  const { Popup, toOpenPopup, showWithData, toTogglePopup, toClosePopup, ...props } = usePopup<
    unionTypes,
    ImpMethods
  >(0.1);

  const _toOpenPopup = () => {
    if (refTimeId.current) return;
    toOpenPopup();
    if (props.getImperativeData()?.getData?.() === 'contacts') {
      props.getImperativeData()?.setData?.('nav');
    }
    refTimeId.current = setTimeout(() => {
      refTimeId.current = null;
    }, 1000);
  };

  const _toClosePopup = () => {
    if (refTimeId.current) return;
    showWithData('nav');
    toClosePopup();
  };
  const _toTogglePopup = () => {
    showWithData('nav');
    toTogglePopup();
  };

  return Popup.Memo(
    {
      ...props,
      showWithData,
      toTogglePopup: _toTogglePopup,
      toClosePopup: _toClosePopup,
      toOpenPopup: _toOpenPopup,
      Popup: ({ imperativeRef }) => {
        useSignalValue(MWNavMode);
        const setType = (v: unionTypes) => MWNavMode.v = v
        useImperativeHandle(imperativeRef, () => ({
          setData: setType,
          getData: () => MWNavMode.v,
        }));

        return (
          <Popup className="MWNav" isOnCloseBG={true} eventCloseBG="onMouseMove">
            <Switcher type={MWNavMode.v} toClosePopup={_toClosePopup} changeChildren={setType} />
          </Popup>
        );
      },
    },
    []
  );
}

function Switcher({
  type,
  toClosePopup,
  changeChildren,
}: {
  type: unionTypes;
  toClosePopup: () => void;
  changeChildren: (_type: unionTypes) => void;
}) {
  switch (type) {
    case 'nav':
      return (
        <>
          <Desktop toClosePopup={toClosePopup} changeChildren={changeChildren} />
          <Mobile toClosePopup={toClosePopup} changeChildren={changeChildren} />
        </>
      );
    case 'contacts':
      return <Contacts toClosePopup={toClosePopup} />;
  }
}

interface ContactsProps {
  toClosePopup: () => void;
}
function Contacts({ toClosePopup }: ContactsProps) {
  return (
    <div className="Contacts px">
      <Link to={['/', '#ContactForm']}>
        <Button variant="link" className="Contacts-title" onClick={toClosePopup}>
          оставить контакты
        </Button>
      </Link>
      <div className="Contacts-wrapper">
        <Link to={import.meta.env.VITE_PHONE} typeLink="external">
          <Button variant="link" underline="left-right" className="Contacts-items">
            +7 (499) 390 03-75
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_TELEGRAM_URL_1} typeLink="external">
          <Button variant="link" underline="left-right" className="Contacts-items">
            Telegram
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_WHATSAPP_URL} typeLink="external">
          <Button variant="link" underline="left-right" className="Contacts-items">
            Whatsapp
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_EMAIL} typeLink="external">
          <Button variant="link" underline="left-right" className="Contacts-items add-line-height">
            info@interpro.pro
          </Button>
        </Link>
      </div>
    </div>
  );
}
function Desktop({
  toClosePopup,
}: {
  changeChildren: (v: unionTypes) => void;
  toClosePopup: () => void;
}) {
  const { goTo } = useNavigate();
  const servicesTree = useMemo(() => buildTree(sgServiceCategories.v), []);

  const columns = [
    {
      label: 'Услуги',
      link: '/services',
      children: servicesTree,
    },
    {
      label: 'Блог',
      link: '/blog',
      // children: [{ label: 'О компании', link: '/about-us', children: [{ label: 'О компании', link: '/about-us' }], }],
    },
    {
      label: 'Новости',
      link: '/news',
    },
    {
      label: 'О нас',
      link: '/about-us',
    },
    {
      label: 'Контакты',
      link: '/contacts',
    },
  ];

  const toNavigate = (route: string, ...names: string[]) => {
    goTo(route, ...names);
    setTimeout(() => toClosePopup(), 500);
  };

  return (
    <div className="MWNav_desktop">
      <ThreeLevelNav columns={columns} onNavigate={toNavigate} />;
    </div>
  );
}

export type ThreeLevelNavItem = {
  label: string;
  link?: string;
  children?: ThreeLevelNavItem[];
};

interface ThreeLevelNavProps {
  columns: ThreeLevelNavItem[];
  onNavigate: (route: string, ...names: string[]) => void;
}

export function ThreeLevelNav({ columns, onNavigate }: ThreeLevelNavProps) {
  const [activeItem, setActiveItem] = useState<ThreeLevelNavItem | null>(null);
  const [activeSubItem, setActiveSubItem] = useState<ThreeLevelNavItem | null>(null);

  return (
    <div className="ThreeLevelNav px">
      {/* колонка 1 */}
      <ul className="ThreeLevelNav_list col_1">
        {columns.map((item) => (
          <li
            key={item.label}
            className={`ThreeLevelNav_list-li ${
              activeItem?.label === item.label ? 'isActive' : ''
            }`}
            onMouseEnter={() => {
              setActiveItem(item);
              setActiveSubItem(null);
            }}
            onClick={() => item.link && onNavigate(item.link, item.label)}
          >
            {item.label}
          </li>
        ))}
      </ul>

      {/* колонка 2 */}
      <ul className="ThreeLevelNav_subList col_2">
        {activeItem?.children?.map((child) => (
          <li
            key={child.label}
            className={`ThreeLevelNav_subList-li ${
              activeSubItem?.label === child.label ? 'isActive' : ''
            }`}
            onMouseEnter={() => {
              if (child.children) {
                setActiveSubItem(child);
              } else {
                setActiveSubItem(null);
              }
            }}
            onClick={() => child.link && onNavigate(child.link, child.label)}
          >
            {child.label}
          </li>
        ))}
      </ul>

      {/* колонка 3 */}
      <ul className="ThreeLevelNav_subList col_3">
        {activeSubItem?.children?.map((subChild) => (
          <li
            key={subChild.label}
            className="ThreeLevelNav_subList-li"
            onClick={() =>
              subChild.link && onNavigate(subChild.link, activeSubItem!.label, subChild.label)
            }
          >
            {subChild.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mobile({
  toClosePopup,
  changeChildren,
}: {
  changeChildren: (v: unionTypes) => void;
  toClosePopup: () => void;
}) {
  const { goTo } = useNavigate();
  const [isOpenNested, setIsOpenNested] = useState(false);
  const clIsActiveNested = isOpenNested ? 'isActiveNested' : '';
  const [typeNav, setTypeNav] = useState<'services' | 'about-us'>();
  const handleClick = (str: 'services' | 'about-us') => {
    setIsOpenNested(true);
    setTypeNav(str);
  };
  const toNavigate = (route: string, ...names: string[]) => {
    goTo(route, ...names);
    setTimeout(() => {
      toClosePopup();
      changeChildren('nav');
    }, 500);
  };

  return (
    <div className="MWNav_table px">
      <div className="MWNav_list px">
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => toNavigate('/projects')}
          direction="right"
          className="MWNav_list-li __projects"
          //prettier-ignore
          children={ <p>Проекты <span>{ sgProjects.v.length }</span></p> }
        />
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => handleClick('services')}
          children="Услуги"
          direction="right"
          className="MWNav_list-li nested"
        />
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => toNavigate('/blog')}
          children="Блог"
          direction="right"
          className="MWNav_list-li"
        />
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => toNavigate('/news')}
          children="Новости"
          direction="right"
          className="MWNav_list-li"
        />
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => handleClick('about-us')}
          children="О нас"
          direction="right"
          className="MWNav_list-li nested"
        />
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => toNavigate('/contacts')}
          children="контакты"
          direction="right"
          className="MWNav_list-li "
        />
      </div>
      <div className={`MWNav_container  ${clIsActiveNested}`}>
        <Button.Arrow
          variant="ghostLink"
          className="MWNav_container-btn-comeback"
          onClick={() => setIsOpenNested(false)}
          size="sm"
          underline={false}
          children="назад"
        />

        <div className="MWNav_container-list ">
          {typeNav === 'services' ? (
            <ServicesNavTable toNavigate={toNavigate} />
          ) : (
            <AboutUs toNavigate={toNavigate} />
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  toNavigate: (route: string, ...names: string[]) => void;
}
function AboutUs({ toNavigate }: Props) {
  return (
    <ul className="AboutUs_list">
      <li onClick={() => toNavigate('/about-us/feedbacks')} className="AboutUs_list-item">
        {'Отзывы'}
      </li>
      <li onClick={() => toNavigate('/faq')} className="AboutUs_list-item">
        {'Частые вопросы'}
      </li>
      <li onClick={() => toNavigate('/about-us/clients')} className="AboutUs_list-item">
        {'Клиенты'}
      </li>
      <li onClick={() => toNavigate('/about-us/certificates')} className="AboutUs_list-item">
        {'Лицензии и сертификаты'}
      </li>
    </ul>
  );
}

function ServicesNavTable({ toNavigate }: Props) {
  const tree = useMemo(() => buildTree(sgServiceCategories.v), []);
  const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
  const toClick = (val: boolean, index: number) => {
    setSelectedIndex(val ? index : null);
  };

  return (
    <>
      <li className="MWNav_title __services" onClick={() => toNavigate('/services')}>
        все услуги
      </li>
      {tree.map((item, index) => {
        const isActive = selectedIndex === index;
        return (
          <>
            <Accordion onClick={(v) => toClick(v, index)} key={index}>
              <Accordion.Header>
                <span className="Accordion_header-title">{item.label}</span>
                <IconPlus isActive={isActive} />
              </Accordion.Header>
              <Accordion.Content>
                <ul className="Accordion_list">
                  <li
                    className="Accordion_list-item"
                    onClick={() => toNavigate(item.link!, item.label)}
                    children="все"
                  />
                  {item.children?.map((childItem) => {
                    return (
                      <li
                        onClick={() => {
                          toNavigate(childItem.link!, item.label, childItem.label);
                        }}
                        className="Accordion_list-item"
                        children={childItem.label}
                      />
                    );
                  })}
                </ul>
              </Accordion.Content>
            </Accordion>
          </>
        );
      })}
    </>
  );
}
