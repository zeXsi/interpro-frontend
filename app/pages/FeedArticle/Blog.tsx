import { Route } from './+types/Blog';
import FeedArticle, { _loader, _meta } from './index';

export async function loader({ request }: Route.LoaderArgs) {
  return await _loader(request.url);
}
export function meta({ loaderData, location }: Route.MetaArgs) {
  return _meta(loaderData, location.pathname);
}
export default function BlogArticle({ loaderData }: Route.ComponentProps) {
  return <FeedArticle data={loaderData} />;
}
