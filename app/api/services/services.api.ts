import { createQuery } from 'shared/utils/querySignal';
import type { Service, ServiceCategory } from './services.types';
import { addNextItem } from 'shared/utils/addNextItem';
import { QUERY_FAMILIES } from 'api/queryFamilies';

type PaginationParams = {
  per_page: number;
};

const qServiceCategories = createQuery<ServiceCategory[], PaginationParams>({
  endpoint: '/service_category',
  family: QUERY_FAMILIES.services,
  initial: [],
  middleware: (data) => {
    addNextItem(data as any);
    return data;
  },
});

export const sgServiceCategories = qServiceCategories.sg;
export const getServiceCategories = () => qServiceCategories.fetch({ per_page: 100 });
export const primeServiceCategories = (force = false, updateSignal = false) =>
  qServiceCategories.prime({ per_page: 100 }, { force, updateSignal });

type Param = { slug: string };
const qServiceCategoryById = createQuery<ServiceCategory | undefined, Param, ServiceCategory[]>({
  endpoint: '/service_category',
  family: QUERY_FAMILIES.services,
  parent: sgServiceCategories,
  findInParent: (parent, params) => parent?.find((item) => item.slug === params.slug) ?? null,
  takeFirst: true,
  initial: undefined,
});

export const sgCurrServiceCategory = qServiceCategoryById.sg;
export const getServiceCategoriesById = (params: Param) => qServiceCategoryById.fetch(params);

const qServices = createQuery<Service[], PaginationParams>({
  endpoint: '/service',
  family: QUERY_FAMILIES.services,
  initial: [],
  middleware: (data) => {
    addNextItem(data as any);
    return data;
  },
});

export const sgServices = qServices.sg;
export const getServices = () => qServices.fetch({ per_page: 100 });
export const primeServices = (force = false, updateSignal = false) =>
  qServices.prime({ per_page: 100 }, { force, updateSignal });

// проверить
const qServiceById = createQuery<Service | undefined, Param, Service[]>({
  endpoint: '/service',
  family: QUERY_FAMILIES.services,
  parent: sgServices,
  findInParent: (parent, params) => parent?.find((item) => item.slug === params.slug),
  takeFirst: true,
  initial: undefined,
});

export const sgCurrService = qServiceById.sg;
export const getServiceById = (params: Param) => qServiceById.fetch(params);
