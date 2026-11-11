import FeedArticle, { _meta } from './index';
import { _loader } from './loader.server';
import { Route } from './+types/News';

export async function loader({ request }: Route.LoaderArgs) {

  return await _loader(request.url);
}
export function meta({ loaderData, location }: Route.MetaArgs) {
  return _meta(loaderData, location.pathname);
}
export default function NewsArticle({ loaderData }: Route.ComponentProps) {
  return <FeedArticle data={loaderData} />;
}
