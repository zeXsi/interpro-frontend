import { signal } from 'shared/utils/_stm';
import { useSignalValue } from 'shared/utils/_stm/react/react';
import { Project } from 'api/projects/projects.types';

export const sgIsErrorPage = signal(false);
export const sgUserFilter = signal<UserFilter>({});
export const sgIsOpenMWCookies = signal<boolean>(true);

export type UserFilter = {
  exhibition_stand?: number[];
  type_stand?: number[];
  year_stand?: number[];
};

export function toggleFilter<K extends keyof UserFilter>(key: K, id: number) {
  const current = (sgUserFilter.v[key] ?? []) as number[];
  sgUserFilter.v = {
    ...sgUserFilter.v,
    [key]: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  };
}

toggleFilter.toClear = () => {
  sgUserFilter.v = {};
};

export function toFilterData(data: Project[]) {
  useSignalValue(sgUserFilter);

  const map: Record<keyof UserFilter, keyof Project> = {
    exhibition_stand: 'exhibition-stand',
    type_stand: 'type-stand',
    year_stand: 'year-stand',
  };

  return data.filter((item) => {
    if (!sgUserFilter.v || Object.keys(sgUserFilter.v).length === 0) {
      return true;
    }

    return (Object.keys(map) as (keyof typeof map)[]).every((key) => {
      const filterValues = sgUserFilter.v[key];
      if (!filterValues || filterValues.length === 0) return true;

      const projectValues = item[map[key]] as number[];
      return filterValues.some((filterId) => projectValues.includes(filterId));
    });
  });
}

