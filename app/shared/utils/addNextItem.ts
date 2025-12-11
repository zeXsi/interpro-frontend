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
export function addNextItem<T extends Item[]>(items: T): T {
  return items.map((item, index) => {
    if (index < items.length - 1) {
      const nextItem = items[index + 1] as any as Obj;
      item.nextItem = {
        slug: nextItem.slug,
        id: nextItem.id,
        title: getTitle(nextItem.payload),
      };
      return item;
    }

    const firstProject = items[0] as any as Obj;
    item.nextItem = {
      slug: firstProject.slug,
      id: firstProject.id,
      title: getTitle(firstProject.payload),
    };
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
