import './styles.css';
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import usePopup from './src';
import '@qtpy/use-popup/index.css';
import Button from 'shared/components/Button';
import Accordion from 'shared/components/Accordion';
import { IconPlus } from 'shared/components/IconPlus';
import Link from 'shared/components/Link';
import { sgServiceCategories } from 'api/services/services.api';
import { sgProjects } from 'api/projects/projects.api';
import { signal } from 'shared/utils/_stm';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { sgHomeData } from 'api/home/home.api';
import type { HomeServiceNavigationNode } from 'api/home/home.types';
import { useLocation } from 'react-router';

type NavigationCategory = {
  slug: string;
  name: string;
  posts: Array<{ slug: string; title: string }>;
  children: NavigationCategory[];
};

type NavItem = {
  label: string;
  link?: string;
  parentLink?: string;
  parentLabel?: string;
  children?: NavItem[];
};

function buildTree(data: NavigationCategory[], parentPath: string = '/services'): NavItem[] {
  return data.map((category) => {
    const categoryPath = `${parentPath}/${category.slug}`;

    const node: NavItem = {
      label: category.name,
      link: categoryPath,
      children: [],
    };

    // Добавляем посты как children
    if (category.posts.length) {
      const postNodes = category.posts.map((post) => ({
        label: post.title,
        link: `${categoryPath}/${post.slug}`,
        parentLabel: category.name,
      }));
      node.children = [...(node.children || []), ...postNodes];
    }

    // Рекурсивно добавляем подкатегории
    if (category.children.length) {
      const childNodes = buildTree(category.children, categoryPath);
      node.children = [...(node.children || []), ...childNodes];
    }

    return node;
  });
}

function buildServicesTree(data: NavigationCategory[]): NavItem[] {
  if (data.length === 1) {
    return (
      data[0].posts.map((post) => ({
        label: post.title,
        link: `/services/${post.slug}`,
      })) ?? []
    );
  }

  return buildTree(data);
}

function compactNavigation(nodes: HomeServiceNavigationNode[]): NavigationCategory[] {
  return nodes.map((node) => ({
    slug: node.slug,
    name: node.name,
    posts: node.posts,
    children: compactNavigation(node.children),
  }));
}

function fullNavigation(): NavigationCategory[] {
  const convert = (categories: typeof sgServiceCategories.v): NavigationCategory[] =>
    categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      posts: category.payload?.posts ?? [],
      children: convert(category.payload?.children ?? []),
    }));

  return convert(sgServiceCategories.v);
}

type unionTypes = 'nav' | 'contacts';
interface ImpMethods {
  getData: () => unionTypes;
}
type MWNavController = {
  showWithData: (data: unionTypes) => void;
  toOpenPopup: () => void;
  toClosePopup: () => void;
  toTogglePopup: () => void;
};
export const MWNavMode = signal<unionTypes>('nav');
const MWNavIsShowed = signal(false);
const MWNavHostId = signal<number | null>(null);
const mwNavControllers = new Map<number, MWNavController>();
let mwNavControllerId = 0;

const getNextMWNavHostId = () => {
  if (!mwNavControllers.size) return null;
  return Math.min(...mwNavControllers.keys());
};

export default function useMWNav() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const navigation = isHome
    ? compactNavigation(sgHomeData.v.services_navigation)
    : fullNavigation();
  const projectCount = isHome ? sgHomeData.v.projects.total : sgProjects.v.length;
  const instanceIdRef = useRef(0);
  if (!instanceIdRef.current) {
    mwNavControllerId += 1;
    instanceIdRef.current = mwNavControllerId;
  }

  const instanceId = instanceIdRef.current;
  const hostId = useSignalValue(MWNavHostId);
  const isShowed = useSignalValue(MWNavIsShowed);
  const isHost = hostId === instanceId;
  const refTimeId = useRef<NodeJS.Timeout>(null);
  const {
    Popup: PopupRoot,
    toOpenPopup,
    showWithData,
    toTogglePopup,
    toClosePopup,
    ...props
  } = usePopup<
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

  useEffect(() => {
    if (MWNavHostId.v === null) {
      MWNavHostId.v = instanceId;
    }

    return () => {
      mwNavControllers.delete(instanceId);

      if (MWNavHostId.v === instanceId) {
        MWNavHostId.v = getNextMWNavHostId();
        MWNavIsShowed.v = false;
      }

      if (!mwNavControllers.size) {
        MWNavIsShowed.v = false;
        MWNavMode.v = 'nav';
      }
    };
  }, [instanceId]);

  useEffect(() => {
    mwNavControllers.set(instanceId, {
      showWithData,
      toOpenPopup: _toOpenPopup,
      toClosePopup: _toClosePopup,
      toTogglePopup: _toTogglePopup,
    });
  }, [instanceId, showWithData, _toOpenPopup, _toClosePopup, _toTogglePopup]);

  useEffect(() => {
    if (isHost) {
      MWNavIsShowed.v = props.isShowed;
    }
  }, [isHost, props.isShowed]);

  const getController = () =>
    mwNavControllers.get(MWNavHostId.v ?? instanceId) ?? {
      showWithData,
      toOpenPopup: _toOpenPopup,
      toClosePopup: _toClosePopup,
      toTogglePopup: _toTogglePopup,
    };

  return PopupRoot.Memo(
    {
      ...props,
      isShowed,
      showWithData: (data) => getController().showWithData(data),
      toTogglePopup: () => getController().toTogglePopup(),
      toClosePopup: () => getController().toClosePopup(),
      toOpenPopup: () => getController().toOpenPopup(),
      Popup: ({ imperativeRef }) => {
        useSignalValue(MWNavMode);
        const setType = (v: unionTypes) => MWNavMode.v = v;
        useImperativeHandle(imperativeRef, () => ({
          setData: setType,
          getData: () => MWNavMode.v,
        }));

        if (!isHost) return null;

        return (
          <PopupRoot className="MWNav" isOnCloseBG={true} eventCloseBG="onMouseMove">
            <Switcher
              type={MWNavMode.v}
              toClosePopup={_toClosePopup}
              changeChildren={setType}
              navigation={navigation}
              projectCount={projectCount}
            />
          </PopupRoot>
        );
      },
    },
    [isHost, navigation, projectCount]
  );
}

function Switcher({
  type,
  toClosePopup,
  changeChildren,
  navigation,
  projectCount,
}: {
  type: unionTypes;
  toClosePopup: () => void;
  changeChildren: (_type: unionTypes) => void;
  navigation: NavigationCategory[];
  projectCount: number;
}) {
  switch (type) {
    case 'nav':
      return (
        <>
          <Desktop
            toClosePopup={toClosePopup}
            changeChildren={changeChildren}
            navigation={navigation}
          />
          <Mobile
            toClosePopup={toClosePopup}
            changeChildren={changeChildren}
            navigation={navigation}
            projectCount={projectCount}
          />
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
  const toClosePopupYM = () => {
    toClosePopup();
    (window as any).ym?.(99631636,'reachGoal','reach_contact');
  }
  return (
    <div className="Contacts px">
      <Link to={['/', '#ContactForm']} onClick={toClosePopupYM}>
        <Button as="span" variant="link" className="Contacts-title">
          оставить контакты
        </Button>
      </Link>
      <div className="Contacts-wrapper">
        <Link to={import.meta.env.VITE_PHONE} typeLink="external">
          <Button as="span" variant="link" underline="left-right" className="Contacts-items">
            +7 (499) 390 03-75
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_TELEGRAM_URL_1} typeLink="external">
          <Button as="span" variant="link" underline="left-right" className="Contacts-items">
            Telegram
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_WHATSAPP_URL} typeLink="external">
          <Button as="span" variant="link" underline="left-right" className="Contacts-items">
            Whatsapp
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_EMAIL} typeLink="external">
          <Button as="span" variant="link" underline="left-right" className="Contacts-items add-line-height">
            {import.meta.env.VITE_EMAIL_NAME}
          </Button>
        </Link>
      </div>
    </div>
  );
}
function Desktop({
  toClosePopup,
  navigation,
}: {
  changeChildren: (v: unionTypes) => void;
  toClosePopup: () => void;
  navigation: NavigationCategory[];
}) {
  const servicesTree = useMemo(() => buildServicesTree(navigation), [navigation]);

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
      label: 'Цены на застройку',
      link: '/stand-prices',
    },
    {
      label: 'Контакты',
      link: '/contacts',
    },
  ];

  const toNavigate = (route: string, ...names: string[]) => {
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
  parentLabel?: string;
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
          >
            {item.link ? (
              <Link
                to={item.link}
                slug={item.label}
                onClick={() => onNavigate(item.link!, item.label)}
              >
                <span>{item.label}</span>
              </Link>
            ) : item.label}
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
          >
            {child.link ? (
              <Link
                to={child.link}
                slug={child.parentLabel ? [child.parentLabel, child.label] : [child.label]}
                onClick={() => onNavigate(
                  child.link!,
                  ...(child.parentLabel ? [child.parentLabel, child.label] : [child.label])
                )}
              >
                <span>{child.label}</span>
              </Link>
            ) : child.label}
          </li>
        ))}
      </ul>

      {/* колонка 3 */}
      <ul className="ThreeLevelNav_subList col_3">
        {activeSubItem?.children?.map((subChild) => (
          <li
            key={subChild.label}
            className="ThreeLevelNav_subList-li"
          >
            {subChild.link ? (
              <Link
                to={subChild.link}
                slug={[activeSubItem!.label, subChild.label]}
                onClick={() => onNavigate(subChild.link!, activeSubItem!.label, subChild.label)}
              >
                <span>{subChild.label}</span>
              </Link>
            ) : subChild.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mobile({
  toClosePopup,
  changeChildren,
  navigation,
  projectCount,
}: {
  changeChildren: (v: unionTypes) => void;
  toClosePopup: () => void;
  navigation: NavigationCategory[];
  projectCount: number;
}) {
  const [isOpenNested, setIsOpenNested] = useState(false);
  const clIsActiveNested = isOpenNested ? 'isActiveNested' : '';
  const [typeNav, setTypeNav] = useState<'services' | 'about-us'>();
  const handleClick = (str: 'services' | 'about-us') => {
    setIsOpenNested(true);
    setTypeNav(str);
  };
  const toNavigate = (route: string, ...names: string[]) => {
    setTimeout(() => {
      toClosePopup();
      changeChildren('nav');
    }, 500);
  };

  return (
    <div className="MWNav_table px">
      <div className="MWNav_list" data-lenis-prevent>
        <Link to="/projects" onClick={() => toNavigate('/projects')}>
          <span className="ButtonArrow isHideUnderline MWNav_list-li __projects normal right link">
            <span className="Button link">Проекты <span>{projectCount}</span></span>
          </span>
        </Link>
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => handleClick('services')}
          children="Услуги"
          direction="right"
          className="MWNav_list-li nested"
        />
        <Link to="/blog" onClick={() => toNavigate('/blog')}>
          <span className="ButtonArrow isHideUnderline MWNav_list-li normal right link">
            <span className="Button link">Блог</span>
          </span>
        </Link>
        <Link to="/news" onClick={() => toNavigate('/news')}>
          <span className="ButtonArrow isHideUnderline MWNav_list-li normal right link">
            <span className="Button link">Новости</span>
          </span>
        </Link>
        <Button.Arrow
          variant="link"
          underline={false}
          onClick={() => handleClick('about-us')}
          children="О нас"
          direction="right"
          className="MWNav_list-li nested"
        />
        <Link to="/stand-prices" onClick={() => toNavigate('/stand-prices')}>
          <span className="ButtonArrow isHideUnderline MWNav_list-li normal right link">
            <span className="Button link">Цены на застройку</span>
          </span>
        </Link>
        <Link to="/contacts" onClick={() => toNavigate('/contacts')}>
          <span className="ButtonArrow isHideUnderline MWNav_list-li normal right link">
            <span className="Button link">контакты</span>
          </span>
        </Link>
      </div>
      <div className={`MWNav_container  ${clIsActiveNested}`} data-lenis-prevent>
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
            <ServicesNavTable toNavigate={toNavigate} navigation={navigation} />
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
      <li className="AboutUs_list-item">
        <Link to="/about-us" onClick={() => toNavigate('/about-us')}><span>О компании</span></Link>
      </li>
      <li className="AboutUs_list-item">
        <Link to="/about-us/feedbacks" onClick={() => toNavigate('/about-us/feedbacks')}><span>Отзывы</span></Link>
      </li>
      <li className="AboutUs_list-item">
        <Link to="/faq" onClick={() => toNavigate('/faq')}><span>Частые вопросы</span></Link>
      </li>
      <li className="AboutUs_list-item">
        <Link to="/about-us/clients" onClick={() => toNavigate('/about-us/clients')}><span>Клиенты</span></Link>
      </li>
      <li className="AboutUs_list-item">
        <Link to="/about-us/certificates" onClick={() => toNavigate('/about-us/certificates')}><span>Лицензии и сертификаты</span></Link>
      </li>
    </ul>
  );
}

function ServicesNavTable({
  toNavigate,
  navigation,
}: Props & { navigation: NavigationCategory[] }) {
  const tree = useMemo(() => buildTree(navigation), [navigation]);
  const servicesTree = useMemo(() => buildServicesTree(navigation), [navigation]);
  const hasSingleCategory = navigation.length === 1;
  const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
  const toClick = (val: boolean, index: number) => {
    setSelectedIndex(val ? index : null);
  };

  return (
    <>
      <li className="MWNav_title __services">
        <Link to="/services" onClick={() => toNavigate('/services')}><span>Все услуги</span></Link>
      </li>
      {hasSingleCategory && (
        <ul className="AboutUs_list">
          {servicesTree.map((item) => (
            <li
              key={item.link ?? item.label}
              className="AboutUs_list-item"
            >
              <Link to={item.link!} slug={item.label} onClick={() => toNavigate(item.link!, item.label)}>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!hasSingleCategory &&
        tree.map((item, index) => {
          const isActive = selectedIndex === index;
          return (
            <Accordion onClick={(v) => toClick(v, index)} key={item.link ?? item.label}>
              <Accordion.Header>
                <span className="Accordion_header-title">{item.label}</span>
                <IconPlus isActive={!isActive} />
              </Accordion.Header>
              <Accordion.Content>
                <ul className="Accordion_list">
                  <li
                    className="Accordion_list-item"
                  >
                    <Link to={item.link!} slug={item.label} onClick={() => toNavigate(item.link!, item.label)}><span>все</span></Link>
                  </li>
                  {item.children?.map((childItem) => {
                    return (
                      <li
                        key={childItem.link ?? childItem.label}
                        className="Accordion_list-item"
                      >
                        <Link to={childItem.link!} slug={[item.label, childItem.label]} onClick={() => toNavigate(childItem.link!, item.label, childItem.label)}>
                          <span>{childItem.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Accordion.Content>
            </Accordion>
          );
        })}
    </>
  );
}
