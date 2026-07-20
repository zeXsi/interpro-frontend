import { Route } from './+types/News';
import FeedPage, { _meta, _loader } from './index';

export async function loader({ request }: Route.LoaderArgs) {
  return await _loader(request.url);
}

export function meta() {
  return _meta();
}
export default function News({ loaderData }: Route.ComponentProps) {
  return <FeedPage data={loaderData} />;
}
