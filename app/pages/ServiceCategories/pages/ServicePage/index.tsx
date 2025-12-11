import './styles.css';
import TitlePage from 'shared/components/TitlePage';
import ContactForm from 'shared/components/ContactForm';

import { useLayoutEffect } from 'react';

import { useNavigate } from 'shared/components/NavigationTracker';

import IsNot from 'shared/components/IsNot';
import { getServiceById } from 'api/services/services.api';
import { Route } from './+types';

export async function loader({ params }: Route.LoaderArgs) {
  const data = await getServiceById({ slug: params.slugService });

  // if (!data) {
  //   throw new Response("Not found", { status: 404 });
  // }

  return data;
}

export function meta({ loaderData }: Route.MetaArgs) {
  const titlePart = loaderData?.payload?.title || '';
  const description =
    loaderData?.payload?.description ||
    'Этот проект был реализован компанией Interpro с применением современных решений и экспертизы.';

  const title = `Interpro: услуга ${titlePart}`;

  return [
    { title },
    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function ServicePage({ loaderData: data, params }: Route.ComponentProps) {
  const { setCrumbs } = useNavigate();

  useLayoutEffect(() => {
    const path = `/services/${params?.slug}/${params?.slugService}`;
    if (data?.payload.category.name && data?.payload.title) {
      setCrumbs(path, data?.payload.category.name, data?.payload.title);
    }
  }, [data]);

  return (
    <div className="InteractiveExhibit px">
      <TitlePage title={data?.payload.title ?? ''} />
      <p className="InteractiveExhibit-desc">{data?.payload.description}</p>
      <IsNot value={data?.payload.cover}>
        <div className="InteractiveExhibit-img">
          <img src={data?.payload.cover!} />
        </div>
      </IsNot>
      <ContactForm />
    </div>
  );
}
