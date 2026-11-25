import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const EXPECTED_ID = '6ba49b66-ace8-4db4-acbd-292b6dde4ced';
const EXPECTED_VERSION = '0.3.30';

async function readText(path) {
  return readFile(new URL(path, root), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourcePath = 'core/v0.3.30/Freesia-Messenger.js';
const currentPath = 'core/current/Freesia-Messenger.js';
const packagePath = 'install/Freesia-Messenger-GitHub-Direct-v0.3.30.json';
const previousPath = 'core/v0.3.29/Freesia-Messenger.js';

const [source, current, previous, packageText] = await Promise.all([
  readText(sourcePath),
  readText(currentPath),
  readText(previousPath),
  readText(packagePath),
]);
const pkg = JSON.parse(packageText);

assert(source === current, 'core/current must exactly match the versioned release source');
assert(pkg.type === 'script', 'Tavern Helper package type must be script');
assert(pkg.id === EXPECTED_ID, 'Tavern Helper script ID must be preserved');
assert(pkg.enabled === true, 'Direct-import package must be enabled by default');
assert(pkg.content.includes('import(source)'), 'Importer must dynamically import the remote Core');
assert(pkg.content.includes('testingcf.jsdelivr.net/gh/jerinmiss620-web/Freesia-Communicator@main/core/current/Freesia-Messenger.js'), 'Importer must use the GitHub current source path');
assert(pkg.content.includes("' + Date.now()"), 'Importer must bust the browser module cache on each execution');
assert(pkg.content.includes('host.__FREESIA_MESSENGER_V1__'), 'Importer must verify the Core instance registered in the Tavern host');
assert(pkg.content.includes('.catch(error =>'), 'Importer must report import failures');
assert(pkg.content.includes('toastr?.error'), 'Importer must surface a visible Tavern error when possible');

const apiVersion = source.match(/version:\s*'([^']+)'/)?.[1];
assert(apiVersion === EXPECTED_VERSION, 'Core API version must be ' + EXPECTED_VERSION);
assert(source.includes('通讯侠 v' + EXPECTED_VERSION + ' 已启动'), 'Core startup log must match release version');
assert(source.includes('const HOST_WIN = SCRIPT_WIN.parent;'), 'Core must use the direct parent Tavern host');
assert(!/LOADER_KEY|loaderBusy|loaderStateHandler|getRemoteLoader|Permanent Bootstrap|Remote Loader|远程更新/.test(source), 'Direct Core must not retain Bootstrap / Loader dependencies or controls');
new Script(source, { filename: sourcePath });
new Script(pkg.content, { filename: packagePath });

function storageKeys(text) {
  const values = new Map();
  const pattern = /const\s+([A-Z0-9_]+_KEY)\s*=\s*'([^']+)'/g;
  for (const match of text.matchAll(pattern)) {
    if (match[1] !== 'LOADER_KEY') values.set(match[1], match[2]);
  }
  return values;
}
const before = storageKeys(previous);
const after = storageKeys(source);
assert(before.size === after.size, 'Core storage key count changed during direct-import migration');
for (const [name, value] of before) {
  assert(after.get(name) === value, 'Core business storage key changed: ' + name);
}

console.log('Freesia Messenger GitHub direct-import validation passed.');
console.log('Core:', EXPECTED_VERSION);
console.log('Importer ID:', EXPECTED_ID);
console.log('Current alias matches versioned release.');
console.log('Business storage keys preserved:', after.size);
