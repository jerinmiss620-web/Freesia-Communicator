import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const bootstrap = read('bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.6-TEST.js');
const loaderSource = read('loader/runtime/v0.1.8/Freesia-Messenger-Remote-Loader.js');
const coreSource = read('core/v0.3.37/Freesia-Messenger.js');
const plan = { bootstrap: '1.0.6', loader: '0.1.8', core: '0.3.37' };
const B = '__FREESIA_MESSENGER_REMOTE_BOOTSTRAP_V1__';
const L = '__FREESIA_MESSENGER_REMOTE_LOADER_V1__';
const C = '__FREESIA_MESSENGER_V1__';
const AUTO = 'freesia_messenger_remote_auto_update_v1';
const rootURL = 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/';
const branch = 'test-bootstrap-rebuild';
const sources = new Map();
let loaderManifest, coreManifest, offline = false, corrupt = false;
let db = new IDBFactory();
let storage = new Map([['freesia_messenger_appearance_v1', 'dark']]);
let dom, host, frame, timers = new Map(), errors = [], blobs = new Map(), blobID = 0;
let transient = null, transientUsed = false, pendingFetchResolve = null;
let failWrite = () => false;
const originalPut = IDBObjectStore.prototype.put;
IDBObjectStore.prototype.put = function(value, ...args) {
  if (failWrite(this.transaction.db.name, value)) {
    failWrite = () => false;
    throw new DOMException('simulated IndexedDB quota failure', 'QuotaExceededError');
  }
  return originalPut.call(this, value, ...args);
};

const canonicalUrl = input => String(input).replace(
  /^https:\/\/(?:cdn|fastly|testingcf)\.jsdelivr\.net\/gh\/jerinmiss620-web\/Freesia-Communicator@([^/]+)\//,
  rootURL + '$1/'
);
const hash = source => createHash('sha256').update(source).digest('hex');
const bytes = source => Buffer.byteLength(source, 'utf8');

function publish(kind, version, suffix = '') {
  const source = (kind === 'loader'
    ? loaderSource.replaceAll(plan.loader, version)
    : coreSource.replaceAll(plan.core, version)) + suffix;
  const source_path = kind === 'loader'
    ? `loader/runtime/v${version}/Freesia-Messenger-Remote-Loader.js`
    : `core/v${version}/Freesia-Messenger.js`;
  const source_commit = createHash('sha1').update(source).digest('hex');
  const source_url = rootURL + source_commit + '/' + source_path;
  sources.set(source_url, source);
  const manifest = {
    schema_version: 1,
    project: 'Freesia Messenger',
    channel: kind === 'loader' ? 'stable-loader' : 'stable',
    latest_version: version,
    ...(kind === 'loader'
      ? { minimum_bootstrap_version: '1.0.6' }
      : { minimum_loader_version: '0.1.8' }),
    release: {
      version, source_path, source_commit, source_url,
      sha256: hash(source), size_bytes: bytes(source)
    }
  };
  if (kind === 'loader') loaderManifest = manifest;
  else coreManifest = manifest;
  return manifest;
}

async function waitFor(predicate, label) {
  for (let i = 0; i < 700; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Timeout: ' + label + '\nBootstrap=' + JSON.stringify(host?.[B]?.getInfo?.()) +
    '\nLoader=' + JSON.stringify(host?.[L]?.getInfo?.()) + '\n' + errors.join('\n'));
}
async function settled() {
  await waitFor(() => host?.[B] && !host[B].getInfo().busy &&
    host?.[L] && !host[L].getInfo().busy && host?.[C], 'Bootstrap / Loader / Core settled');
  assertSingle();
}
function assertSingle() {
  const api = host[C];
  assert.ok(api, 'Messenger Core API exists');
  assert.equal(api.hostWindow, host);
  assert.equal(typeof api.open, 'function');
  assert.equal(typeof api.close, 'function');
  assert.equal(typeof api.destroy, 'function');
  const rootHost = host.document.getElementById('freesia-messenger-root-host');
  assert.ok(rootHost, 'Messenger root host exists');
  assert.ok(rootHost.shadowRoot?.querySelector('#freesia-messenger-root'), 'Messenger shadow root is mounted');
  assert.ok(rootHost.shadowRoot.querySelectorAll('style').length >= 1, 'Messenger visual styles are mounted inside the isolated shadow root');
  assert.equal(host[L].diagnostics.destroyed, false);
  assert.equal(host[L].getInfo().currentVersion, api.version);
  assert.equal(host[B].getInfo().currentLoaderVersion, host[L].version);
}
async function readBootstrapCache() {
  const request = db.open('Freesia_Messenger_Remote_Bootstrap_Cache', 1);
  const database = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = database.transaction('records', 'readonly');
  const all = tx.objectStore('records').getAll();
  const records = await new Promise((resolve, reject) => {
    all.onsuccess = () => resolve(all.result);
    all.onerror = () => reject(all.error);
  });
  database.close();
  return records;
}
async function readLoaderCache() {
  const request = db.open('Freesia_Messenger_Remote_Loader_Cache', 1);
  const database = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = database.transaction('records', 'readonly');
  const all = tx.objectStore('records').getAll();
  const records = await new Promise((resolve, reject) => {
    all.onsuccess = () => resolve(all.result);
    all.onerror = () => reject(all.error);
  });
  database.close();
  return records;
}
async function writeCache(name, slot, value) {
  const request = db.open(name, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains('records')) {
      request.result.createObjectStore('records', { keyPath: 'slot' });
    }
  };
  const database = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = database.transaction('records', 'readwrite');
  tx.objectStore('records').put({ slot, schema_version: 1, ...value });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('cache seed transaction aborted'));
  });
  database.close();
}
async function boot({ empty = false, transientFailure = null } = {}) {
  errors = [];
  timers = new Map();
  transient = transientFailure;
  transientUsed = false;
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (error.type !== 'css-parsing') errors.push(error.message); });
  dom = new JSDOM('<!doctype html><html><head></head><body><div id="top-settings-holder"></div><div id="sheld"><div id="chat"></div><form id="send_form"><textarea id="send_textarea"></textarea></form></div><iframe></iframe></body></html>',
    { url: 'https://tavern.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  host = dom.window;
  frame = host.document.querySelector('iframe').contentWindow;
  Object.defineProperty(host, 'indexedDB', { value: db });
  for (const [key, value] of storage) host.localStorage.setItem(key, value);
  host.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  host.CSS = { escape: value => value, supports: () => false };
  host.document.elementsFromPoint = () => [];
  host.console = frame.console = {
    info() {}, warn() {},
    error(...args) { errors.push(args.map(String).join(' ')); }
  };
  frame.confirm = () => true;
  frame.TextEncoder = TextEncoder;
  frame.Blob = Blob;
  frame.URL.createObjectURL = blob => {
    const url = 'blob:freesia-' + (++blobID);
    blobs.set(url, blob);
    return url;
  };
  frame.URL.revokeObjectURL = url => blobs.delete(url);

  const nativeTimeout = frame.setTimeout.bind(frame);
  const nativeClear = frame.clearTimeout.bind(frame);
  let timerID = 100000;
  frame.setTimeout = (fn, ms, ...args) => {
    if (ms === 21600000 || ms === 60000) {
      const id = ++timerID;
      timers.set(id, { fn, ms });
      return id;
    }
    return nativeTimeout(fn, [250, 500, 900, 1000].includes(ms) ? 0 : ms, ...args);
  };
  frame.clearTimeout = id => {
    timers.delete(id);
    nativeClear(id);
  };

  frame.fetch = async (input, options = {}) => {
    const url = canonicalUrl(input);
    const path = String(url).split('?')[0];
    const isManifest = path.endsWith('/loader/test-latest.json') ||
      path.endsWith('/latest.json') || path.endsWith('/channels/test.json');
    if (transient && !transientUsed &&
        (transient === 'manifest' ? path.endsWith('/loader/test-latest.json') : path.includes('/loader/runtime/'))) {
      transientUsed = true;
      if (transient === 'timeout') {
        return await new Promise((resolve, reject) => options.signal?.addEventListener('abort',
          () => reject(new frame.DOMException('request aborted', 'AbortError')), { once: true }));
      }
      throw new TypeError('simulated transient network failure');
    }
    if (offline) throw new TypeError('simulated offline');
    if (isManifest) {
      const manifest = path.endsWith('/loader/test-latest.json') ? loaderManifest :
        path.endsWith('/channels/test.json') ? JSON.parse(read('channels/test.json')) : coreManifest;
      return { ok: true, status: 200, text: async () => JSON.stringify(manifest) };
    }
    const source = sources.get(String(path));
    if (!source) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => source + (corrupt ? '\n// corrupted' : '') };
  };

  const nativeAppend = frame.document.head.appendChild.bind(frame.document.head);
  frame.document.head.appendChild = script => {
    if (script.tagName !== 'SCRIPT') return nativeAppend(script);
    nativeTimeout(async () => {
      if (!script.onload) return;
      try {
        const isBlob = blobs.has(script.src);
        if (!isBlob && offline) throw new Error('simulated offline script load');
        const source = isBlob ? await blobs.get(script.src).text() : sources.get(String(canonicalUrl(script.src)).split('?')[0]);
        assert.ok(source, 'injected script source is published');
        if (script.integrity) {
          assert.equal(script.integrity, 'sha256-' + createHash('sha256').update(source).digest('base64'));
        }
        try { frame.eval(source); } catch (error) { errors.push(error?.stack || String(error)); }
        script.onload?.();
      } catch {
        script.onerror?.();
      }
    }, 0);
    return script;
  };

  frame.eval(bootstrap);
  if (empty) await waitFor(() => host[B] && !host[B].getInfo().busy, 'empty offline bootstrap');
  else await settled();
}
function close() {
  if (!host) return;
  storage = new Map(Object.keys(host.localStorage).map(key => [key, host.localStorage.getItem(key)]));
  host[B]?.destroy?.();
  assert.equal(host[B], undefined);
  assert.equal(host[L], undefined);
  assert.equal(host[C], undefined);
  assert.equal(timers.size, 0, 'all scheduled update timers are removed');
  dom.window.close();
}
async function tick() {
  const pending = [...timers.values()];
  timers.clear();
  await Promise.all(pending.map(({ fn }) => fn()));
  await settled();
}
async function versions(core, loader) {
  await waitFor(() => host[C]?.version === core && host[L]?.version === loader, 'running ' + core + '/' + loader);
  await settled();
}

try {
  publish('core', '0.3.37');
  publish('loader', '0.1.8');

  db = new IDBFactory();
  await boot({ transientFailure: 'manifest' });
  await versions('0.3.37', '0.1.8');
  assert.deepEqual(errors, [], 'first transient manifest failure must recover without runtime exceptions');
  console.log('PASS: Bootstrap first-install retry reaches real Loader 0.1.8 and Core 0.3.37');
  const bootCache = await readBootstrapCache();
  const coreCache = await readLoaderCache();
  assert.ok(bootCache.some(record => record.slot === 'last' && record.version === '0.1.8'));
  assert.ok(coreCache.some(record => record.slot === 'lkg' && record.version === '0.3.37'));
  console.log('PASS: Bootstrap Loader cache and Core LKG are durably written to their IndexedDB stores');
  
  publish('core', '0.3.38');
  await tick();
  await versions('0.3.38', '0.1.8');
  console.log('PASS: Core updates unattended without re-importing Bootstrap');

  publish('loader', '0.1.9');
  await tick();
  await versions('0.3.38', '0.1.9');
  console.log('PASS: Loader updates unattended and keeps the same Core instance/data namespace');

  host[L].setAutoUpdateEnabled(false);
  publish('core', '0.3.39');
  publish('loader', '0.1.10');
  await tick();
  await versions('0.3.38', '0.1.9');
  assert.equal(host[L].getInfo().autoUpdateEnabled, false);
  host[L].setAutoUpdateEnabled(true);
  await waitFor(() => host[C]?.version === '0.3.39' && host[L]?.version === '0.1.10', 're-enable updates');
  await settled();
  console.log('PASS: auto-update opt-out persists; re-enable resumes Core and Loader updates');

  close();
  offline = true;
  await boot();
  await versions('0.3.39', '0.1.10');
  console.log('PASS: offline reload restores the last verified Loader and Core from IndexedDB');

  offline = false;
  publish('core', '0.3.40');
  corrupt = true;
  await tick();
  await versions('0.3.39', '0.1.10');
  corrupt = false;
  host.dispatchEvent(new host.Event('online'));
  await versions('0.3.40', '0.1.10');
  console.log('PASS: corrupt source is rejected; reconnect recovers the valid release');

  publish('core', '0.3.41', `\nwindow.parent.${C}.destroy(); throw Error('intentional Core initialization failure');`);
  await tick();
  await versions('0.3.40', '0.1.10');
  console.log('PASS: failed Core initialization rolls back to the previous healthy Core');

  publish('core', '0.3.39');
  await tick();
  await versions('0.3.40', '0.1.10');
  console.log('PASS: stale manifests cannot downgrade a newer running Core');

  // A failed LKG write must not leave the new Core reported as a successful durable update.
  publish('core', '0.3.42');
  failWrite = (name, value) => name === 'Freesia_Messenger_Remote_Loader_Cache' &&
    value.slot === 'lkg' && value.version === '0.3.42';
  await tick();
  await versions('0.3.40', '0.1.10');
  console.log('PASS: failed durable LKG promotion rolls back without replacing the previous cache');

  // Destroying the Bootstrap during a pending manifest request must not resurrect Loader/Core.
  let finishFetch;
  const realFetch = frame.fetch;
  frame.fetch = (url, options) => new Promise(resolve => {
    finishFetch = async () => resolve(await realFetch(url, options));
  });
  const pending = host[L].checkRemote();
  await waitFor(() => finishFetch, 'pending Loader manifest request');
  host[B].destroy();
  await finishFetch();
  await pending;
  assert.equal(host[B], undefined);
  assert.equal(host[L], undefined);
  assert.equal(host[C], undefined);
  assert.equal(timers.size, 0);
  console.log('PASS: destruction during pending network work cannot resurrect the runtime');
  close();

  // Migration regression: Bootstrap v1.0.5 kept its Loader source in localStorage;
  // Loader v0.1.6 kept Core LKG there, while an older IndexedDB record may still exist.
  // The new Bootstrap must migrate its localStorage cache, and Loader 0.1.8 must choose
  // the newer verified localStorage LKG over a stale-but-valid IndexedDB record.
  db = new IDBFactory();
  offline = true;
  const bootManifest = publish('loader', '0.1.8');
  const coreManifestForMigration = publish('core', '0.3.37');
  const bootRecord = {
    schema_version: 2, slot: 'last', version: '0.1.8',
    source: loaderSource, size_bytes: bytes(loaderSource), sha256: hash(loaderSource),
    source_url: bootManifest.release.source_url,
    source_commit: bootManifest.release.source_commit,
    saved_at: new Date().toISOString()
  };
  const newestCoreRecord = {
    schema_version: 1, version: '0.3.37',
    source: coreSource, size_bytes: bytes(coreSource), sha256: hash(coreSource),
    source_url: coreManifestForMigration.release.source_url,
    source_commit: coreManifestForMigration.release.source_commit,
    saved_at: new Date().toISOString()
  };
  const staleCoreSource = coreSource.replaceAll(plan.core, '0.3.36');
  const staleCommit = createHash('sha1').update(staleCoreSource).digest('hex');
  const staleCoreRecord = {
    version: '0.3.36', source: staleCoreSource,
    size_bytes: bytes(staleCoreSource), sha256: hash(staleCoreSource),
    source_commit: staleCommit,
    source_url: rootURL + staleCommit + '/core/v0.3.36/Freesia-Messenger.js'
  };
  await writeCache('Freesia_Messenger_Remote_Loader_Cache', 'lkg', staleCoreRecord);
  storage = new Map([
    ['freesia_messenger_bootstrap_cache_v2_last', JSON.stringify(bootRecord)],
    ['freesia.messenger.loader.lastKnownGood.v1', JSON.stringify(newestCoreRecord)],
    ['freesia.messenger.loader.autoRestore.v1', 'true'],
    ['freesia_messenger_appearance_v1', 'dark']
  ]);
  await boot();
  await versions('0.3.37', '0.1.8');
  const migratedBootstrap = await readBootstrapCache();
  const migratedCore = await readLoaderCache();
  assert.ok(migratedBootstrap.some(record => record.slot === 'last' && record.version === '0.1.8'));
  assert.ok(migratedCore.some(record => record.slot === 'lkg' && record.version === '0.3.37'));
  const corePointer = JSON.parse(host.localStorage.getItem('freesia.messenger.loader.lastKnownGood.v1'));
  assert.equal(corePointer.backend, 'indexedDB');
  assert.equal(corePointer.version, '0.3.37');
  assert.ok(host.localStorage.getItem('freesia_messenger_bootstrap_cache_v2_last'),
    'legacy Bootstrap cache remains as a compatibility copy');
  assert.equal(host.localStorage.getItem('freesia_messenger_appearance_v1'), 'dark',
    'user appearance preference is preserved');
  console.log('PASS: v1.0.5 Bootstrap cache and v0.1.6 Loader LKG migrate safely; newer verified LKG wins over stale IndexedDB');
  close();
  offline = false;

  console.log('Messenger Bootstrap → Loader → Core update-chain tests passed.');
} finally {
  IDBObjectStore.prototype.put = originalPut;
  dom?.window.close();
}
