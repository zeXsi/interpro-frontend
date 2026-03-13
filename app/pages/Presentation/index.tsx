import './styles.css';
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { Presentation as PresentationType } from 'api/presentation/presentation.types';
import PresentationDocument from './PresentationDocument';
import { loadPresentationOrThrow } from './presentation.server';

export function meta({ data }: { data: PresentationType }) {
  const tags = [
    ...(data?.tax?.year ?? []),
    ...(data?.tax?.expo ?? []),
    ...(data?.tax?.stand_type ?? []),
    ...(data?.project_size ? [`${data.project_size}м²`] : []),
  ].join(' ');

  const title = data?.title ? `Interpro x ${data.title}${tags ? ` / ${tags}` : ''}` : 'Interpro';

  const description = 'Дизайн-проект';

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Interpro' },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { name } = params;

  if (!name) {
    throw new Response('Not Found', { status: 404 });
  }

  return loadPresentationOrThrow(name);
}

export default function Presentation() {
  const presentationResponse = useLoaderData();

  return <PresentationDocument presentationResponse={presentationResponse} />;
}
