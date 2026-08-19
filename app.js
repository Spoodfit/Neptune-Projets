import { workspace as dataWorkspace, projects as dataProjects, statusLabels as dataStatusLabels } from './data.js';

globalThis.workspace = dataWorkspace;
globalThis.projects = dataProjects;
globalThis.statusLabels = dataStatusLabels;

const sources = [
  './app/core.js',
  './app/timeline.js',
  './app/project.js',
  './app/ai-parse.js',
  './app/ai-ui.js',
  './app/direct-actions.js',
  './app/main.js',
];

for (const src of sources) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.body.appendChild(script);
  });
}
