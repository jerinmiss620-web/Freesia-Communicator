import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const EXPECTED_ID = '6ba49b66-ace8-4db4-acbd-292b6dde4ced';
const EXPECTED_VERSION = '0.3.35';
const EXPECTED_SHA256 = 'e1f0957b21808fe4bfa8b10aa40be078e9c052ff84b5e0f2ad9060d25ffc554b';
const EXPECTED_SIZE_BYTES = 371619;
const EXPECTED_IMPORT_URL = 'https://testingcf.jsdelivr.net/gh/jerinmiss620-web/Freesia-Communicator@main/core/current/Freesia-Messenger.js';
const EXPECTED_IMPORT = "import '" + EXPECTED_IMPORT_URL + "'";

async function readText(path) {
  return readFile(new URL(path, root), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourcePath = 'core/v0.3.35/Freesia-Messenger.js';
const currentPath = 'core/current/Freesia-Messenger.js';
const packagePath = 'install/Freesia-Messenger-GitHub-ESM-Import-v0.3.35.json';
const previousPath = 'core/v0.3.30/Freesia-Messenger.js';
const manifestPath = 'core/v0.3.35/release.json';

const [source, current, previous, packageText, manifestText] = await Promise.all([
  readText(sourcePath),
  readText(currentPath),
  readText(previousPath),
  readText(packagePath),
  readText(manifestPath),
]);
const pkg = JSON.parse(packageText);
const manifest = JSON.parse(manifestText);

assert(source === current, 'core/current must exactly match the versioned release source');
assert(manifest.version === EXPECTED_VERSION, 'Release manifest version must match Core');
assert(manifest.source_path === sourcePath, 'Release manifest source path must match');
assert(manifest.source_commit === 'f8552fbbfa3669ac6785d32445b1b887700e024e', 'Release manifest must pin the immutable source commit');
assert(manifest.source_url === 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/f8552fbbfa3669ac6785d32445b1b887700e024e/core/v0.3.35/Freesia-Messenger.js', 'Release manifest must use the immutable raw source URL');
assert(manifest.sha256 === EXPECTED_SHA256, 'Release manifest SHA-256 must match');
assert(manifest.size_bytes === EXPECTED_SIZE_BYTES, 'Release manifest byte length must match');
assert(manifest.import_package_path === packagePath, 'Release manifest must point to the ESM import package');
assert(manifest.import_statement === EXPECTED_IMPORT, 'Release manifest must record the exact static import');
const sourceBytes = Buffer.from(source, 'utf8');
assert(sourceBytes.length === EXPECTED_SIZE_BYTES, 'Core UTF-8 byte length mismatch');
assert(createHash('sha256').update(sourceBytes).digest('hex') === EXPECTED_SHA256, 'Core SHA-256 mismatch');

assert(pkg.type === 'script', 'Tavern Helper package type must be script');
assert(pkg.id === EXPECTED_ID, 'Tavern Helper script ID must be preserved');
assert(pkg.enabled === true, 'Tavern Helper import entry must be enabled by default');
assert(pkg.name.includes('v' + EXPECTED_VERSION), 'Importer display name must match release version');
assert(pkg.info.includes('v' + EXPECTED_VERSION), 'Importer information must match release version');
assert(pkg.content === EXPECTED_IMPORT, 'Tavern Helper content must be exactly one static ES Module import statement');
assert(!pkg.content.includes('import('), 'Importer must not use a dynamic import wrapper');
assert(!pkg.content.includes('window.'), 'Importer must not contain a custom host/bootstrap wrapper');

const apiVersion = source.match(/version:\s*'([^']+)'/)?.[1];
assert(apiVersion === EXPECTED_VERSION, 'Core API version must be ' + EXPECTED_VERSION);
assert(source.includes('通讯侠 v' + EXPECTED_VERSION + ' 已启动'), 'Core startup log must match release version');
assert(source.includes('const HOST_WIN = SCRIPT_WIN.parent;'), 'Core must use the direct parent Tavern host');
assert(!/LOADER_KEY|loaderBusy|loaderStateHandler|getRemoteLoader|Permanent Bootstrap|Remote Loader|远程更新/.test(source), 'Core must not retain Bootstrap / Loader dependencies or controls');
assert(source.includes('fm-keyboard-open'), 'Mobile keyboard state class must be present');
assert(source.includes('padding-bottom: var(--fm-safe-bottom)'), 'Mobile footer must use the keyboard-aware safe-area variable');
assert(source.includes('max-width: none; max-height: none'), 'Mobile full-screen rule must clear the desktop max-width constraint');
assert(source.includes('messages-retry-dismiss') && source.includes('retryNoticeDismissed'), 'Retry notice must be dismissible and persist its state');
assert(!source.includes('#${EXTENSION_ID} input:is([type="checkbox"], [type="radio"])'), 'Extension checkboxes must not receive private phone control styling');
assert(!source.includes("state.extensionEntry && state.extensionEntry.getAttribute('data-fm-theme')"), 'Phone appearance mode must not be applied to the Tavern extension panel');
new Script(source, { filename: sourcePath });

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
assert(before.size === after.size, 'Core storage key count changed during release');
for (const [name, value] of before) {
  assert(after.get(name) === value, 'Core business storage key changed: ' + name);
}

console.log('Freesia Messenger GitHub ESM-import validation passed.');
console.log('Core:', EXPECTED_VERSION);
console.log('Importer ID:', EXPECTED_ID);
console.log('Importer is a single static ES Module import.');
console.log('Current alias matches versioned release.');
console.log('Source SHA-256 and UTF-8 byte length match release manifest.');
console.log('Business storage keys preserved:', after.size);
