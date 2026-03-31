// shared/api/licenses.ts
import type { License } from './license.types';
import { createQuery } from 'shared/utils/querySignal';

const qLicenses = createQuery<License[], void>({
  endpoint: '/licenses',
  initial: [],
});

export const sgLicenses = qLicenses.sg;
export const getLicenses = () => qLicenses.fetch();
