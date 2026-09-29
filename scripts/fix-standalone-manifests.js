const fs = require('fs');
const path = require('path');
const root = process.cwd();
const serverApp = path.join(root, '.next', 'server', 'app');
const standaloneApp = path.join(root, '.next', 'standalone', '.next', 'server', 'app');

function findManifestIn(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name === 'page_client-reference-manifest.js') return p;
    if (e.isDirectory()) { const f = findManifestIn(p); if (f) return f; }
  }
  return null;
}

const FIXES = [{ group: '(store)', routeKey: '/' }];

for (const { group, routeKey } of FIXES) {
  const groupDir = path.join(serverApp, group);
  const target = path.join(groupDir, 'page_client-reference-manifest.js');

  if (!fs.existsSync(target)) {
    // Find a sibling page manifest inside the same route group to use as template
    let template = null;
    if (fs.existsSync(groupDir)) {
      const subdirs = fs.readdirSync(groupDir, { withFileTypes: true })
        .filter(e => e.isDirectory()).map(e => path.join(groupDir, e.name));
      for (const d of subdirs) { const f = findManifestIn(d); if (f) { template = f; break; } }
    }

    if (template) {
      let content = fs.readFileSync(template, 'utf8');
      // Replace the route key e.g. "/products/[slug]" with "/" for the homepage
      // Manifest format: (self.__RSC_MANIFEST=self.__RSC_MANIFEST||{})["ROUTE"]={...}
      content = content.replace(/\)\["([^"]+)"\]=/, ')["' + routeKey + '"]=');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf8');
      console.log('[postbuild] Created manifest for ' + group + ' route "' + routeKey + '" from sibling: ' + path.relative(root, template));
    } else {
      // Fallback: empty stub (better than nothing, but module lookups will fail)
      const stub = '(self.__RSC_MANIFEST=self.__RSC_MANIFEST||{})["' + routeKey + '"]={"ssrModuleMapping":{},"edgeSSRModuleMapping":{},"cssFiles":[],"clientModules":{}};';
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, stub, 'utf8');
      console.warn('[postbuild] WARN: Created empty stub for ' + group + ' (no sibling found)');
    }
  } else {
    console.log('[postbuild] Manifest already present for ' + group);
  }

  // Copy to standalone output
  if (fs.existsSync(standaloneApp)) {
    const destDir = path.join(standaloneApp, group);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, 'page_client-reference-manifest.js');
    fs.copyFileSync(target, dest);
    console.log('[postbuild] Copied to standalone: ' + path.relative(root, dest));
  } else {
    console.warn('[postbuild] No standalone dir found — skipping copy for ' + group);
  }
}
console.log('[postbuild] Done.');