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

assert(compareVersions(test.release.version, stable.release.version) >= 0, 'Test Core must not be older than Stable');
if (compareVersions(test.release.version, stable.release.version) === 0) {
  assert(stable.release.sha256 === test.release.sha256, 'Stable/Test sources must match when their versions match');
}

const bootstrapSources = {};
for (const version of ['1.0.0', '1.0.1', '1.0.2']) {
  const base = 'bootstrap/Freesia-Communicator-Permanent-Bootstrap-' + version;
  const bootstrapSource = await readText(base + '.js');
  new Script(bootstrapSource, { filename: 'Permanent Bootstrap ' + version });
  const bootstrapPackage = JSON.parse(await readText(base + '.json'));
  assert(bootstrapPackage.type === 'script', 'Bootstrap import package type mismatch: ' + version);
  assert(bootstrapPackage.content === bootstrapSource, 'Bootstrap JSON content differs from standalone source: ' + version);
  assert(bootstrapPackage.enabled === false, 'Bootstrap import package must be disabled by default: ' + version);
  bootstrapSources[version] = bootstrapSource;
}
const activeBootstrap = bootstrapSources['1.0.2'];
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

assert(loader.minimum_bootstrap_version === '1.0.2', 'Loader v0.1.3 must require Bootstrap 1.0.2');
assert(activeBootstrap.includes('const HOST_WIN = findHost(SCRIPT_WIN);'), 'Bootstrap must use the Core ancestor host resolver');
assert(loaderSource.includes('HOST_WIN = findHost(SCRIPT_WIN);'), 'Loader must use the Core ancestor host resolver');
assert(coreTestSource.includes('const HOST_WIN = findHost(window);'), 'Test Core must expose the shared ancestor host resolver');

function extractResolver(source, nextMarker, label) {
  const start = source.indexOf('  function findHost(frame) {');
  const end = source.indexOf(nextMarker, start);
  assert(start >= 0 && end > start, label + ': host resolver block not found');
  return source.slice(start, end).trim();
}
const coreResolver = extractResolver(coreTestSource, '\\n\\n  const HOST_WIN = findHost(window);', 'Core');
const bootstrapResolver = extractResolver(activeBootstrap, '\\n  const HOST_WIN = findHost(SCRIPT_WIN);', 'Bootstrap');
const loaderResolver = extractResolver(loaderSource, '\\n\\n  let HOST_WIN;', 'Loader');
assert.equal(bootstrapResolver, coreResolver, 'Bootstrap host resolver differs from Core');
assert.equal(loaderResolver, coreResolver, 'Loader host resolver differs from Core');

const resolveHost = new Function('frame', coreResolver + '\\nreturn findHost(frame);');
const topWindow = { document: { getElementById: id => id === 'sheld' ? {} : null }, parent: null };
topWindow.parent = topWindow;
const wrapperWindow = { document: { getElementById: () => null }, parent: topWindow };
const scriptWindow = { document: { getElementById: () => null }, parent: wrapperWindow };
assert.equal(resolveHost(scriptWindow), topWindow, 'nested script frame must resolve the same top-level Tavern host');

function extractRootHelper(source, nextMarker, label) {
  const start = source.indexOf('  function getMessengerRoot() {');
  const end = source.indexOf(nextMarker, start);
  assert(start >= 0 && end > start, label + ': Shadow DOM root helper not found');
  return source.slice(start, end).trim();
}
const loaderRootHelper = extractRootHelper(loaderSource, '\\n\\n  function isHealthy', 'Loader');
const bootstrapRootHelper = extractRootHelper(activeBootstrap, '\\n\\n  function coreIsRunning', 'Bootstrap');
for (const [label, helper] of [['Loader', loaderRootHelper], ['Bootstrap', bootstrapRootHelper]]) {
  const shadowRootNode = { id: 'freesia-messenger-root' };
  const rootHost = { shadowRoot: { querySelector: selector => selector === '#freesia-messenger-root' ? shadowRootNode : null } };
  const hostDocument = { getElementById: id => id === 'freesia-messenger-root-host' ? rootHost : null };
  const getRoot = new Function('HOST_DOC', helper + '\\nreturn getMessengerRoot();');
  assert.equal(getRoot(hostDocument), shadowRootNode, label + ': Shadow DOM root was not detected');
}
assert(loaderSource.includes('api.hostWindow === HOST_WIN &&\\n      getMessengerRoot()'), 'Loader health check must use Shadow DOM-aware root lookup');
assert(activeBootstrap.includes('core?.remoteLoaderManaged === true'), 'Bootstrap must only accept a Loader-managed Core as successful startup');
assert(activeBootstrap.includes('core.version === runtimeVersion'), 'Bootstrap must compare the actual Core version with Loader runtime state');

console.log('Freesia Messenger release validation passed.');
console.log('Stable Core:', stable.release.version);
console.log('Test Core:', test.release.version);
console.log('Loader Runtime:', loader.release.version);
console.log('Bootstrap Runtime: 1.0.2');
