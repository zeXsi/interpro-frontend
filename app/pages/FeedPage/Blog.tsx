import { Route } from './+types/Blog';
import FeedPage, { _meta, _loader } from './index';

export async function clientLoader({ request }: Route.LoaderArgs) {
  return _loader(request.url);
}

export function meta() {
  return _meta();
}
export default function Blog({ loaderData }: Route.ComponentProps) {
  return <FeedPage data={loaderData} />;
}
