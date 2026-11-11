import { Route } from './+types/News';
import FeedPage, { _meta } from './index';
import { _loader } from './loader.server';

export async function loader({ request }: Route.LoaderArgs) {
  return await _loader(request.url);
}

export function meta() {
  return _meta('news');
}
export default function News({ loaderData }: Route.ComponentProps) {
  return <FeedPage data={loaderData} />;
}
