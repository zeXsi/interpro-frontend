import { Route } from './+types/Blog';
import FeedArticle, { _loader, _meta } from './index';

export async function loader({ request }: Route.LoaderArgs) {
  return await _loader(request.url);
}
export function meta({ loaderData }: Route.MetaArgs) {
  return _meta(loaderData);
}
export default function BlogArticle({ loaderData }: Route.ComponentProps) {
  console.log(23);
  return <FeedArticle data={loaderData} />;
}
