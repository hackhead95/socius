// Assembles the independent website in site/ (the static build plus the files the public
// hosting repository needs). Push the contents of site/ to the root of the public repo's
// main branch; GitHub Pages serves it (Settings > Pages > Deploy from a branch > main / root).
import { cpSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

execSync('npx vite build --outDir site --emptyOutDir', { stdio: 'inherit' });
cpSync('deploy/site', 'site', { recursive: true });
writeFileSync('site/.nojekyll', '');
if (!existsSync('site/guide/index.html')) console.warn('Warning: site/guide/index.html is missing (public/guide not built).');
console.log('site/ is ready to publish.');
