import type { Project } from './api/projects/projects.types';
import type { ServiceCategory } from './api/services/services.types';

type Obj = {
  slug: string,
  id: string | number,
  payload: any;
  title: any,
}
type Item = {
  nextItem?: Omit<Obj, 'payload'>,
}
function buildNextItem(nextObj: Obj) {
  return {
    slug: nextObj.slug,
    id: nextObj.id,
    title: getTitle(nextObj.payload),
    ...(nextObj.payload?.category?.slug && {
      categorySlug: nextObj.payload.category.slug,
    }),
  };
}

export function addNextItem<T extends Item[]>(items: T): T {
  return items.map((item, index) => {
    if (index < items.length - 1) {
      const nextObj = items[index + 1] as any as Obj;
      item.nextItem = buildNextItem(nextObj);
      return item;
    }

    const firstObj = items[0] as any as Obj;
    item.nextItem = buildNextItem(firstObj);
    return item;
  }) as any;
}

export function getTitle(
  payload: ServiceCategory['payload'] | Project['payload']
): string | undefined {
  if ('title' in payload) {
    return payload.title;
  }
  if ('name' in payload) {
    return payload.name;
  }
}
