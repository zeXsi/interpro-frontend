import type { Project } from 'api/projects/projects.types';

function toFormatNames(val: Project['payload']['meta']['exhibition'] | undefined): string {
  if (!val) return '';
  return val.map(({ name }) => name).join(`, \r\n`);
}

export default toFormatNames;
