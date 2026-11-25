import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const EXPECTED_ID = '6ba49b66-ace8-4db4-acbd-292b6dde4ced';
const EXPECTED_VERSION = '0.3.36';
const EXPECTED_SHA256 = '557fa079b326d8720bc7831faaa16d765ed9e02d422dc4e147606a260a087f92';
const EXPECTED_SIZE_BYTES = 371989;
const EXPECTED_IMPORT_URL = 'https://testingcf.jsdelivr.net/gh/jerinmiss620-web/Freesia-Communicator@main/core/current/Freesia-Messenger.js';
const EXPECTED_IMPORT = "import '" + EXPECTED_IMPORT_URL + "'";

async function readText(path) {
  return readFile(new URL(path, root), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourcePath = 'core/v0.3.36/Freesia-Messenger.js';
const currentPath = 'core/current/Freesia-Messenger.js';
const packagePath = 'install/Freesia-Messenger-GitHub-ESM-Import-v0.3.36.json';
const previousPath = 'core/v0.3.35/Freesia-Messenger.js';
const manifestPath = 'core/v0.3.36/release.json';

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
assert(manifest.channel === 'stable-esm-import', 'Release manifest must identify the Stable ESM-import channel');
assert(manifest.source_path === sourcePath, 'Release manifest source path must match');
assert(manifest.source_commit === '4b1fa89a5e14dc926d7b0e1d6cb16a97663d2498', 'Release manifest must pin the immutable source commit');
assert(manifest.source_url === 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/4b1fa89a5e14dc926d7b0e1d6cb16a97663d2498/core/v0.3.36/Freesia-Messenger.js', 'Release manifest must use the immutable raw source URL');
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
assert(pkg.info.includes('GitHub 正式本体引入入口'), 'Importer information must identify the Stable GitHub Core');
assert(!pkg.content.includes('import('), 'Importer must not use a dynamic import wrapper');
assert(!pkg.content.includes('window.'), 'Importer must not contain a custom host/bootstrap wrapper');

const apiVersion = source.match(/version:\s*'([^']+)'/)?.[1];
assert(apiVersion === EXPECTED_VERSION, 'Core API version must be ' + EXPECTED_VERSION);
assert(source.includes('通讯侠 v' + EXPECTED_VERSION + ' 已启动'), 'Core startup log must match release version');
assert(source.includes('const HOST_WIN = SCRIPT_WIN.parent;'), 'Core must use the direct parent Tavern host');
assert(!/LOADER_KEY|loaderBusy|loaderStateHandler|getRemoteLoader|Permanent Bootstrap|Remote Loader|远程更新/.test(source), 'Core must not retain Bootstrap / Loader dependencies or controls');
assert(source.includes('fm-keyboard-open'), 'Mobile keyboard state class must be present');
assert(source.includes('padding-bottom: var(--fm-safe-bottom)'), 'Mobile footer must use the keyboard-aware safe-area variable');
assert(!source.includes('max-width: min(520px, calc(100vw - 16px))'), 'Frame CSS max-width cap must be absent');
assert(!source.includes('max-width: none; max-height: none'), 'Redundant mobile max-width override must be absent');
assert(source.includes('const maxWidth = Math.min(520, bounds.width - 16);'), 'PC frame width must remain JS-clamped to 520px');
assert(source.includes("width: bounds.width + 'px'"), 'Mobile frame width must use the Visual Viewport width');
assert(source.includes('messages-retry-dismiss') && source.includes('retryNoticeDismissed'), 'Retry notice must be dismissible and persist its state');
const internalStyleStart = source.indexOf('function buildStyle()');
const externalStyleStart = source.indexOf('function buildExtensionStyle()');
const destroyStart = source.indexOf('function destroy()', externalStyleStart);
const internalStyle = source.slice(internalStyleStart, externalStyleStart);
const externalStyle = source.slice(externalStyleStart, destroyStart);
assert(internalStyleStart >= 0 && externalStyleStart > internalStyleStart && destroyStart > externalStyleStart, 'Phone and extension styles must be separate functions');
assert(!internalStyle.includes('#${EXTENSION_ID}'), 'Phone Shadow DOM stylesheet must not target the Tavern extension panel');
assert(internalStyle.includes('#${ROOT_ID} input:is([type="checkbox"], [type="radio"])'), 'Phone internal checkbox styling must remain private to the phone window');
assert(!externalStyle.includes('input'), 'Document-level extension stylesheet must not style checkbox/input controls');
assert(source.includes('HOST_DOC.head.appendChild(buildExtensionStyle())'), 'Only the extension stylesheet may be added to the host document head');
assert(!source.includes('HOST_DOC.head.appendChild(style)'), 'Phone stylesheet must never be added to the host document head');
assert(source.includes('host.appendChild(scopedStyle)'), 'Non-Shadow-DOM fallback must keep phone CSS inside its root host');
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
console.log('Importer is a single static ES Module import to the main branch.');
console.log('Current alias matches versioned release.');
console.log('Source SHA-256 and UTF-8 byte length match release manifest.');
console.log('Business storage keys preserved:', after.size);
