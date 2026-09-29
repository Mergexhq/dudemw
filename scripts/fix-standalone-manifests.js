#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const serverApp = path.join(root, '.next', 'server', 'app');
const standaloneApp = path.join(root, '.next', 'standalone', '.next', 'server', 'app');
const GROUPS = ['(store)'];
let fixed = 0;
for (const g of GROUPS) {
  const src = path.join(serverApp, g, 'page_client-reference-manifest.js');
  const destDir = path.join(standaloneApp, g);
  const dest = path.join(destDir, 'page_client-reference-manifest.js');
  if (!fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(src), { recursive: true });
    fs.writeFileSync(src, '(self.__RSC_MANIFEST=self.__RSC_MANIFEST||{})["/"]={"ssrModuleMapping":{},"edgeSSRModuleMapping":{},"cssFiles":[],"clientModules":{}};', 'utf8');
    console.log('[postbuild] Created stub: ' + src);
    fixed++;
  }
  if (fs.existsSync(standaloneApp)) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('[postbuild] Copied to standalone: ' + dest);
    fixed++;
  } else {
    console.warn('[postbuild] No standalone dir, skipping ' + g);
  }
}
console.log('[postbuild] Done. Fixed ' + fixed + ' manifest(s).');