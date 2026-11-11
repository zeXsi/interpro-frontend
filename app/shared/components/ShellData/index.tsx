import { createContext, useContext } from 'react';
import type { ShellData } from 'api/pageData.types';

export const EMPTY_SHELL_DATA: ShellData = {
  projectCount: 0,
  servicesNavigation: [],
};

export const ShellDataContext = createContext<ShellData>(EMPTY_SHELL_DATA);

export function useShellData() {
  return useContext(ShellDataContext);
}
