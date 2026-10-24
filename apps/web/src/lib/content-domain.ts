import 'server-only';
import path from 'node:path';
import { projectRoot } from './services-env';
const load = process
  .getBuiltinModule('module')
  .createRequire(path.join(projectRoot, 'package.json'));
export const { parseHTML } = load('linkedom');
export const { clean, fieldsFor, rendered, groupsFor } = load('./cms/fields.cjs');
export const { publicURL, storageRoute } = load('./cms/urls.cjs');
export type ContentData = {
  route: string;
  selector?: string;
  template?: string;
  fields: { kind: string; path: (string | number)[]; label: string; value: string }[];
  documents?: { title: string; url: string }[];
  contentType?: string;
  publicationBlocks?: import('./publication-blocks').PublicationBlock[];
  publicationDate?: string;
  key?: string;
  value?: unknown[];
  trashedAt?: string;
  purged?: boolean;
  order?: number;
};
export function asData(value: unknown) {
  return value as ContentData;
}
export function jsonData(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export const { normalizeDocument } = load('./cms/presentation.cjs');
