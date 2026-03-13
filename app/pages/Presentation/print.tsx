import './styles.css';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import PresentationDocument from './PresentationDocument';
import { loadPrimedPresentationOrThrow } from './presentation.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { name } = params;
  if (!name) {
    throw new Response('Not Found', { status: 404 });
  }

  const url = new URL(request.url);

  return loadPrimedPresentationOrThrow(name, url.searchParams.get('token'));
}

export default function PresentationPrint() {
  const presentationResponse = useLoaderData();

  return <PresentationDocument presentationResponse={presentationResponse} />;
}
