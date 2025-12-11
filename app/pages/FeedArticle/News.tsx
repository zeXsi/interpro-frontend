import FeedArticle, { _loader, _meta } from './index';
import { Route } from './+types/News';

export async function loader({ request }: Route.LoaderArgs) {

  return await _loader(request.url);
}
export function meta({ loaderData }: Route.MetaArgs) {
  return _meta(loaderData);
}
export default function NewsArticle({ loaderData }: Route.ComponentProps) {
  return <FeedArticle data={loaderData} />;
}
