import { toTitleCase } from '@utils';

import type * as d from '../../../declarations';

export const usageToMarkdown = (usages: d.JsonDocsUsage) => {
  const content: string[] = [];
  const merged = mergeUsages(usages);
  if (merged.length === 0) {
    return content;
  }

  content.push(`## Usage`);

  merged.forEach(({ name, text }) => {
    content.push('');
    content.push(`### ${toTitleCase(name)}`);
    content.push('');
    content.push(text);
    content.push('');
  }),
    content.push('');
  content.push('');

  return content;
};

export const mergeUsages = (usages: d.JsonDocsUsage) => {
  const keys = Object.keys(usages);
  const map = new Map<string, string[]>();
  keys.forEach((key) => {
    const usage = usages[key].trim();
    const array = map.get(usage) || [];
    array.push(key);
    map.set(usage, array);
  });
  const merged: { name: string; text: string }[] = [];
  map.forEach((value, key) => {
    merged.push({
      name: value.join(' / '),
      text: key,
    });
  });
  return merged;
};
