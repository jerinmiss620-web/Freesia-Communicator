import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const repoPrefix = 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/';

async function readText(path) {
  return readFile(new URL(path, root), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(text) {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}
function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const delta = (a[i] || 0) - (b[i] || 0);
    if (delta) return delta;
  }
  return 0;
}
function checkManifest(manifest, expectedChannel, path) {
  assert(manifest.schema_version === 1, path + ': unsupported schema_version');
  assert(manifest.project === 'Freesia Messenger', path + ': project mismatch');
  assert(manifest.channel === expectedChannel, path + ': channel mismatch');
  const release = manifest.release;
  assert(release && release.version === manifest.latest_version, path + ': version mismatch');
  assert(release.source_path, path + ': source_path missing');
  assert(/^[a-f0-9]{40}$/.test(release.source_commit || ''), path + ': source_commit invalid');
  assert(/^[a-f0-9]{64}$/.test(release.sha256 || ''), path + ': sha256 invalid');
  assert(Number.isSafeInteger(release.size_bytes) && release.size_bytes > 0, path + ': size_bytes invalid');
  const expectedUrl = repoPrefix + release.source_commit + '/' + release.source_path;
  assert(release.source_url === expectedUrl, path + ': source_url is not pinned to its commit/path');
}
async function checkSource(manifestPath, channel) {
  const manifest = JSON.parse(await readText(manifestPath));
  checkManifest(manifest, channel, manifestPath);
  const source = await readText(manifest.release.source_path);
  const bytes = Buffer.byteLength(source, 'utf8');
  assert(bytes === manifest.release.size_bytes, manifestPath + ': UTF-8 byte length mismatch');
  assert(sha256(source) === manifest.release.sha256, manifestPath + ': SHA-256 mismatch');
  new Script(source, { filename: manifest.release.source_path });
  return manifest;
}

const stable = await checkSource('latest.json', 'stable');
const test = await checkSource('channels/test.json', 'test');
const loader = await checkSource('loader/latest.json', 'stable-loader');
assert(test.minimum_loader_version === '0.1.5', 'Test Core must require Remote Loader 0.1.5');
assert(Array.isArray(test.adoptable_releases) && test.adoptable_releases.length >= 6, 'Test manifest must include historical Core adoption records');
const adoptedVersions = new Set();
for (const record of test.adoptable_releases) {
  assert(record.version.split('.').length === 3 && record.version.split('.').every(part => /^[0-9]+$/.test(part)), 'Adoption record version invalid');
  assert(compareVersions(record.version, test.release.version) < 0, 'Adoption records must be older than the Test release');
  assert(!adoptedVersions.has(record.version), 'Duplicate adoption record: ' + record.version);
  adoptedVersions.add(record.version);
  assert(record.source_path === 'core/v' + record.version + '/Freesia-Messenger.js', 'Adoption source path mismatch: ' + record.version);
  assert(/^[a-f0-9]{40}$/.test(record.source_commit || ''), 'Adoption Commit invalid: ' + record.version);
  assert(/^[a-f0-9]{64}$/.test(record.sha256 || ''), 'Adoption SHA-256 invalid: ' + record.version);
  assert(Number.isSafeInteger(record.size_bytes) && record.size_bytes > 0, 'Adoption size invalid: ' + record.version);
  assert(record.source_url === repoPrefix + record.source_commit + '/' + record.source_path, 'Adoption URL is not pinned: ' + record.version);
  const historicalSource = await readText(record.source_path);
  assert(Buffer.byteLength(historicalSource, 'utf8') === record.size_bytes, 'Adoption byte length mismatch: ' + record.version);
  assert(sha256(historicalSource) === record.sha256, 'Adoption SHA-256 mismatch: ' + record.version);
  new Script(historicalSource, { filename: record.source_path });
}

assert(compareVersions(test.release.version, stable.release.version) >= 0, 'Test Core must not be older than Stable');
if (compareVersions(test.release.version, stable.release.version) === 0) {
  assert(stable.release.sha256 === test.release.sha256, 'Stable/Test sources must match when their versions match');
}

const bootstrapSources = {};
for (const version of ['1.0.0', '1.0.1', '1.0.2', '1.0.3', '1.0.4']) {
  const base = 'bootstrap/Freesia-Communicator-Permanent-Bootstrap-' + version;
  const bootstrapSource = await readText(base + '.js');
  new Script(bootstrapSource, { filename: 'Permanent Bootstrap ' + version });
  const bootstrapPackage = JSON.parse(await readText(base + '.json'));
  assert(bootstrapPackage.type === 'script', 'Bootstrap import package type mismatch: ' + version);
  assert(bootstrapPackage.content === bootstrapSource, 'Bootstrap JSON content differs from standalone source: ' + version);
  assert(bootstrapPackage.enabled === false, 'Bootstrap import package must be disabled by default: ' + version);
  bootstrapSources[version] = bootstrapSource;
}
const activeBootstrap = bootstrapSources['1.0.4'];
const loaderSource = await readText(loader.release.source_path);
const coreTestSource = await readText(test.release.source_path);
for (const [label, source] of [['Bootstrap 1.0.2', activeBootstrap], ['Loader ' + loader.release.version, loaderSource]]) {
  for (const host of ['raw.githubusercontent.com', 'cdn.jsdelivr.net', 'fastly.jsdelivr.net', 'testingcf.jsdelivr.net']) {
    assert(source.includes(host), label + ': missing fallback host ' + host);
  }
  assert(source.includes('await validate('), label + ': integrity validation is not inside route fallback');
}
assert(activeBootstrap.includes('const MAX_ATTEMPTS = 4'), 'Bootstrap must attempt all four routes');
assert(loaderSource.includes('let checkPromise = null'), 'Loader must deduplicate concurrent remote checks');
assert(loaderSource.includes('if (checkPromise) return checkPromise'), 'Loader shared check promise is not used');
assert(loaderSource.includes('lastRequest'), 'Loader must retain per-route request diagnostics');
assert(loaderSource.includes('maxAttempts: routes.length'), 'Loader diagnostics must report the full fallback route count');
assert(loaderSource.includes("CHANNEL === 'test'"), 'Loader status must identify the active update channel');

assert(loader.minimum_bootstrap_version === '1.0.4', 'Loader v0.1.5 must require Bootstrap 1.0.4');
for (const [label, script] of [['Bootstrap 1.0.4', activeBootstrap], ['Loader 0.1.5', loaderSource], ['Core ' + test.release.version, coreTestSource]]) {
  assert(script.includes('const HOST_WIN = SCRIPT_WIN.parent;'), label + ': must use the TLE direct-parent host contract');
  assert(!script.includes('function findHost(frame)'), label + ': must not guess the host by traversing ancestors');
}
assert(activeBootstrap.includes('maybeAdoptCurrentCore()'), 'Bootstrap must initiate first-time Core adoption');
assert(activeBootstrap.includes('(info.autoRestoreAuthorized && info.hasLastKnownGood)'), 'Bootstrap must retry adoption when restore is authorized but the LKG cache is missing');
assert(activeBootstrap.includes("const CACHE_PREFIX = 'freesia_messenger_bootstrap_cache_v2_'"), 'Bootstrap must use the localStorage cache namespace');
assert(!activeBootstrap.includes('indexedDB.open'), 'Bootstrap must not require IndexedDB to read or write its cache');
assert(loaderSource.includes('function writeLocalStorageRecord'), 'Loader must persist verified source records in localStorage');
assert(loaderSource.includes('const readback = writeLocalStorageRecord(key, record);'), 'Loader save path must write and read back localStorage first');
const loaderReadStart = loaderSource.indexOf('async function readRecord');
assert(loaderSource.indexOf('payload?.schema_version === 1', loaderReadStart) < loaderSource.indexOf('const indexedRecord = await idbGet(slot)', loaderReadStart), 'Loader must prefer localStorage before attempting legacy IndexedDB reads');
assert(!loaderSource.includes('async function idbPut'), 'Loader must not write new rollback records to IndexedDB');
assert(coreTestSource.includes('(!loaderInfo?.autoRestoreAuthorized || !loaderInfo?.hasLastKnownGood)'), 'Core must show adoption action when Last Known Good is missing');
assert(activeBootstrap.includes('await runtime.adoptCurrent()'), 'Bootstrap must call Loader adoption after startup');
assert(loaderSource.includes('function validateAdoptableRelease(release)'), 'Loader must validate historical adoption records');
assert(loaderSource.includes('adoptableReleases.find(item => item.version === active.version)'), 'Loader must adopt an older active Core from the historical release list');
assert(loaderSource.includes('if (active && isHealthy(active, active.version))'), 'Loader must detect an already-running Core using its actual health contract');
assert(loaderSource.includes('isHealthy(previous, previous.version)'), 'Loader rollback detection must not depend on a nonexistent state field');

function extractRootHelper(source, nextMarker, label) {
  const start = source.indexOf('  function getMessengerRoot() {');
  const end = source.indexOf(nextMarker, start);
  assert(start >= 0 && end > start, label + ': Shadow DOM root helper not found');
  return source.slice(start, end).trim();
}
const loaderRootHelper = extractRootHelper(loaderSource, '\n\n  function isHealthy', 'Loader');
const bootstrapRootHelper = extractRootHelper(activeBootstrap, '\n\n  function coreIsRunning', 'Bootstrap');
for (const [label, helper] of [['Loader', loaderRootHelper], ['Bootstrap', bootstrapRootHelper]]) {
  const shadowRootNode = { id: 'freesia-messenger-root' };
  const rootHost = { shadowRoot: { querySelector: selector => selector === '#freesia-messenger-root' ? shadowRootNode : null } };
  const hostDocument = { getElementById: id => id === 'freesia-messenger-root-host' ? rootHost : null };
  const getRoot = new Function('HOST_DOC', helper + '\nreturn getMessengerRoot();');
  assert(getRoot(hostDocument) === shadowRootNode, label + ': Shadow DOM root was not detected');
}
assert(loaderSource.includes('api.hostWindow === HOST_WIN &&\n      getMessengerRoot()'), 'Loader health check must use Shadow DOM-aware root lookup');
assert(activeBootstrap.includes("typeof core.close === 'function'"), 'Bootstrap must verify the actual Core close API');
assert(!activeBootstrap.includes('core?.remoteLoaderManaged === true'), 'Bootstrap must not misclassify a healthy standalone Core as failed startup');

assert(coreTestSource.includes("const width = Math.min(420, Math.max(360, bounds.width - 32));"), 'PC default window width must be 420px');
assert(coreTestSource.includes("const height = Math.min(780, Math.max(520, bounds.height - 32));"), 'PC default window height must cap at 780px');
assert(coreTestSource.includes("kind === 'workspace' && mode === 'desktop' ? 'v8' : 'v7'"), 'Only the PC workspace geometry key should migrate to v8');
assert(coreTestSource.includes("const maxWidth = Math.max(minWidth, Math.min(520, bounds.width - 16));"), 'PC window resize must cap at 520px');
assert(coreTestSource.includes("w: Math.min(maxWidth, Math.max(minWidth, drag.width + dx))"), 'PC resize handler must enforce the portrait width cap');
assert(coreTestSource.includes("width: min(420px, calc(100vw - 32px));"), 'PC frame CSS fallback width must be 420px');
assert(coreTestSource.includes("height: min(780px, calc(100dvh - 32px));"), 'PC frame CSS fallback height must cap at 780px');
assert(coreTestSource.includes("max-width: min(520px, calc(100vw - 16px));"), 'PC frame CSS must prevent desktop-wide stretching');
assert(coreTestSource.includes("@media (max-width: 821px)"), 'Mobile full-screen breakpoint must remain at 821px');
assert(coreTestSource.includes("#${ROOT_ID} .fm-frame { position: absolute; inset: 0; width: auto; height: auto; min-height: 0; max-height: none; border: 0; border-radius: 0; box-shadow: none; transform: none; }"), 'Mobile full-screen frame rules must remain intact');

console.log('Freesia Messenger release validation passed.');
console.log('Stable Core:', stable.release.version);
console.log('Test Core:', test.release.version);
console.log('Loader Runtime:', loader.release.version);
console.log('Bootstrap Runtime: 1.0.4');
