import './styles.css';
import TitlePage from 'shared/components/TitlePage';
import ServicesDesc from 'shared/components/ServicesDesc';
import InfoList from 'shared/components/InfoList';
import ContactForm from 'shared/components/ContactForm';
import Button from 'shared/components/Button';
import Subtitle from 'shared/components/Subtitle';

import IsNot from 'shared/components/IsNot';
import Link from 'shared/components/Link';
import { useNavigate } from 'shared/components/NavigationTracker';
import { useLayoutEffect } from 'react';
import { getServiceCategoriesById } from 'api/services/services.api';
import { Route } from './+types';
import StartPage from 'shared/components/StartPage';

export async function loader({ params }: Route.LoaderArgs) {
  const data = await getServiceCategoriesById({ slug: params.slug });

  if (!data) {
    throw new Response('Not found', { status: 404 });
  }

  return data;
}

export function meta({ loaderData }: Route.MetaArgs) {
  const titlePart = loaderData?.name || '';
  const description =
    loaderData?.description ||
    'Этот проект был реализован компанией Interpro с применением современных решений и экспертизы.';

  const title = `Interpro: категория услуги ${titlePart}`;

  return [
    { title },
    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function ServiceCategoryPage({ loaderData: data, params }: Route.ComponentProps) {
  const clIsImg = !!data?.payload.cover ? 'with-img' : '';
  const { goTo, setCrumbs } = useNavigate();

  useLayoutEffect(() => {
    const path = `/services/${params?.slug}`;
    if (data?.payload?.name) {
      setCrumbs(path, data?.payload?.name);
    }
  }, [data]);

  return (
    <StartPage>
      <div className={`ServiceCategoryPage px ${clIsImg} `}>
        <TitlePage title={data?.payload.name!} />
        <ServicesDesc title="Принципы">{data?.payload.description!}</ServicesDesc>
        <InfoList
          variant={'custom'}
          title={`( что делаем )`}
          onClick={(index) => {
            const post = data?.payload?.posts[index];
            if (!post) return;

            goTo(`/services/${params?.slug}/${post.slug}`, data?.payload.name, post.title);
          }}
          items={data?.payload?.posts?.map(({ title }) => [title, '']) || []}
        />
        <IsNot value={data?.payload.cover}>
          <div className="ServiceCategoryPage-img">
            <img src={data?.payload.cover!} />
          </div>
        </IsNot>

        <div className="ServiceCategoryPage_info">
          <div className="ServiceCategoryPage_info-block">
            <Subtitle>( следующая услуга )</Subtitle>
            <Link to={`/services/${data?.nextItem?.slug}`} slug={data?.nextItem?.title}>
              <Button.Arrow variant="link" direction="right" className="ItemService_btn">
                {data?.nextItem?.title}
              </Button.Arrow>
            </Link>
          </div>
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}
