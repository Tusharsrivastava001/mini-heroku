import { readFile, writeFile } from 'node:fs/promises';

const [repository, tag] = process.argv.slice(2);
if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  throw new Error('Expected repository as owner/name.');
}
if (!tag || !/^[A-Za-z0-9_.-]+$/.test(tag)) {
  throw new Error('Expected image tag to contain only letters, numbers, dots, underscores, and hyphens.');
}

const chartPath = 'infra/helm/deployforge/values.yaml';
const lines = (await readFile(chartPath, 'utf8')).split(/\r?\n/);
const components = new Set(['api', 'worker', 'dashboard']);
const updated = new Set();
let component;

for (let index = 0; index < lines.length; index += 1) {
  const section = /^([a-z][a-z-]*):$/.exec(lines[index]);
  if (section) {
    component = components.has(section[1]) ? section[1] : undefined;
  }
  if (!component) continue;

  if (/^    repository:/.test(lines[index])) {
    lines[index] = `    repository: ghcr.io/${repository.toLowerCase()}/${component}`;
    updated.add(`${component}:repository`);
  } else if (/^    tag:/.test(lines[index])) {
    lines[index] = `    tag: "${tag}"`;
    updated.add(`${component}:tag`);
  }
}

for (const name of components) {
  if (!updated.has(`${name}:repository`) || !updated.has(`${name}:tag`)) {
    throw new Error(`Could not find repository and tag values for ${name} in ${chartPath}.`);
  }
}

await writeFile(chartPath, `${lines.join('\n').replace(/\n*$/, '')}\n`);
