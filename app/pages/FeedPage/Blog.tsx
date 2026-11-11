import { Route } from './+types/Blog';
import FeedPage, { _meta } from './index';
import { _loader } from './loader.server';

export async function loader({ request }: Route.LoaderArgs) {
  return _loader(request.url);
}

export function meta() {
  return _meta('blog');
}
export default function Blog({ loaderData }: Route.ComponentProps) {
  return <FeedPage data={loaderData} />;
}
