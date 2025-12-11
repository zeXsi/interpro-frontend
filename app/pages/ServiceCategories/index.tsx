import './styles.css';
import Button from 'shared/components/Button';
import ContactForm from 'shared/components/ContactForm';
import ServicesDesc from 'shared/components/ServicesDesc';
import TitlePage from 'shared/components/TitlePage';
import Link from 'shared/components/Link';
import { sgServiceCategories } from 'api/services/services.api';
import StartPage from 'shared/components/StartPage';

export function meta() {
  const title = 'Interpro: услуги';
  const description =
    'Interpro предлагает широкий спектр услуг для бизнеса и частных клиентов. Узнайте больше о наших сервисах, получите консультацию и обратную связь через удобные формы на сайте.';

  return [
    { title },

    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function ServiceCategories({}) {
  return (
    <StartPage>
      <div className="ServiceCategories px">
        <TitlePage title="услуги" />
        <ServicesDesc title="подход">
          Проектируем, строим, поддерживаем выставочные стенды, которые работают на бренд
        </ServicesDesc>

        <div className="ServiceCategories_container">
          {sgServiceCategories.v.map(({ payload, slug, name }, index) => {
            return (
              <ItemService
                key={index}
                title={payload.name}
                desc={payload.description}
                index={index + 1}
                link={`/services/${slug}`}
                nameSlag={name}
              />
            );
          })}
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}

interface ItemServiceProps {
  index: number;
  title: string;
  desc: string;
  link: string;
  nameSlag: string;
}

function ItemService({ nameSlag, index, title, desc, link }: ItemServiceProps) {
  return (
    <div className="ItemService">
      <span className="ItemService_index">( {formatNumber(index)} )</span>
      <div className="ItemService_inner">
        <div className="ItemService-title">{title}</div>
        <div className="ItemService_container">
          <p className="ItemService_desc">{desc}</p>
          <Link to={link} slug={[nameSlag]}>
            <Button.Arrow direction="right" className="ItemService_btn">
              узнать больше
            </Button.Arrow>
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number) {
  return num < 10 ? '0' + num : String(num);
}
