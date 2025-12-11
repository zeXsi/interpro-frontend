import { Project } from "shared/api/projects/projects.types";


function toFormatNames(val: undefined): undefined;
function toFormatNames(val: Project['payload']['meta']['exhibition']): string;
function toFormatNames(val: Project['payload']['meta']['exhibition'] | undefined): string | undefined {
  if (!val) return '';
  return val.map(({ name }) => name).join(`, \r\n`);
}

export default toFormatNames;
