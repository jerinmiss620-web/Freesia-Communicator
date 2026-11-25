import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const digest = value => createHash('sha256').update(Buffer.from(value, 'utf8')).digest('hex');
const bytes = value => Buffer.byteLength(value, 'utf8');

const bootstrapPath = 'bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.6-TEST.js';
const packagePath = 'install/Freesia-Messenger-Permanent-Bootstrap-1.0.6-TEST.json';
const loaderPath = 'loader/runtime/v0.1.8/Freesia-Messenger-Remote-Loader.js';
const [bootstrap, packageText, loader, loaderManifestText, stableManifestText, testManifestText, core] =
  await Promise.all([
    read(bootstrapPath), read(packagePath), read(loaderPath), read('loader/test-latest.json'),
    read('latest.json'), read('channels/test.json'), read('core/v0.3.37/Freesia-Messenger.js')
  ]);
const pkg = JSON.parse(packageText);
const loaderManifest = JSON.parse(loaderManifestText);
const stableManifest = JSON.parse(stableManifestText);
const testManifest = JSON.parse(testManifestText);

assert.equal(pkg.type, 'script');
assert.equal(pkg.enabled, false, 'test installer must import disabled');
assert.equal(pkg.id, 'b6d6a0f1-6d7b-4c4a-9d18-8a2f0b7e61c3');
assert.equal(pkg.content, bootstrap, 'Tavern Helper package must contain the exact Bootstrap source');
assert.match(bootstrap, /const VERSION = '1\.0\.6'/);
assert.ok(bootstrap.includes('test-bootstrap-rebuild/loader/latest.json'));
assert.ok(bootstrap.includes("'0.1.6': {"), 'old Loader 0.1.6 rollback source must be registered');
assert.ok(bootstrap.includes("'0.1.7': {"), 'test Loader 0.1.7 rollback source must be registered');
assert.ok(bootstrap.includes('Freesia_Messenger_Remote_Bootstrap_Cache'));
assert.ok(bootstrap.includes('readLegacyLocalStorageSlot'));
assert.ok(bootstrap.includes('withDbReconnect'), 'Bootstrap must use the TLE IndexedDB reconnect lifecycle');
assert.ok(bootstrap.includes('freesia_messenger_bootstrap_cache_v2_'), 'existing Bootstrap cache namespace must remain');
assert.ok(bootstrap.includes('__FREESIA_MESSENGER_V1__'), 'Messenger Core API identity must remain');
assert.ok(bootstrap.includes('freesia-messenger-root-host'), 'Messenger root health check must remain');

assert.equal(loaderManifest.project, 'Freesia Messenger');
assert.equal(loaderManifest.channel, 'stable-loader');
assert.equal(loaderManifest.latest_version, '0.1.8');
assert.equal(loaderManifest.minimum_bootstrap_version, '1.0.6');
assert.equal(loaderManifest.release.source_path, loaderPath);
assert.match(loaderManifest.release.source_commit, /^[a-f0-9]{40}$/);
assert.equal(loaderManifest.release.source_url,
  'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/' +
  loaderManifest.release.source_commit + '/' + loaderPath);
assert.equal(loaderManifest.release.size_bytes, bytes(loader));
assert.equal(loaderManifest.release.sha256, digest(loader));
assert.ok(loader.includes("const LOADER_VERSION = '0.1.8';"));
assert.ok(loader.includes('test-bootstrap-rebuild/latest.json'));
assert.ok(loader.includes('test-bootstrap-rebuild/channels/test.json'));
assert.ok(loader.includes('(?:main|test-bootstrap-rebuild)'), 'mutable branch manifests must be recognized');
assert.ok(loader.includes('__FREESIA_MESSENGER_V1__'));
assert.ok(loader.includes('freesia.messenger.loader.lastKnownGood.v1'));
assert.ok(loader.includes('withDbReconnect'), 'TLE IndexedDB reconnect lifecycle must remain');
assert.ok(loader.includes('async function idbPut'));
assert.ok(loader.includes('async function writeIndexedRecord'));
assert.ok(loader.includes("await writeIndexedRecord('candidate', record)"));
assert.ok(loader.includes("schema_version: 2, backend: 'indexedDB'"));

assert.equal(stableManifest.project, 'Freesia Messenger');
assert.equal(stableManifest.channel, 'stable');
assert.equal(stableManifest.latest_version, '0.3.37');
assert.equal(stableManifest.minimum_loader_version, '0.1.8');
assert.equal(stableManifest.release.source_path, 'core/v0.3.37/Freesia-Messenger.js');
assert.equal(stableManifest.release.size_bytes, bytes(core));
assert.equal(stableManifest.release.sha256, digest(core));
assert.equal(core.match(/version:\s*'([^']+)'/)?.[1], '0.3.37');
assert.ok(core.includes('const CHAT_DATA_KEY ='));
assert.ok(core.includes('const PRESET_KEY ='));

assert.equal(testManifest.channel, 'test');
assert.equal(testManifest.latest_version, '0.3.29');
assert.equal(testManifest.minimum_loader_version, '0.1.8');

console.log('Messenger Bootstrap rebuild static release checks passed.');
