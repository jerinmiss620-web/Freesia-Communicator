(() => {
  'use strict';
  // 简介：通讯侠 永久远程更新链。使用方式：仅导入并启用 Bootstrap，由它管理 Loader 与 Core。
  // 注意事项：首次迁移禁用旧独立脚本；首次安装需要联网，自动更新可在原有折叠区域关闭。作者：小松鼠 & ChatGPT（小松7）。

  // Freesia Messenger · Headless Remote Loader Runtime 0.1.8 (TLE IndexedDB cache lifecycle port) (Bootstrap rebuild test)
  // Headless runtime owned by the immutable bootstrap. Future runtime revisions are fetched from the pinned loader manifest.
  // Auto update is default-on after verified rollback/restore authorization; manual update remains available.

  const SCRIPT_WIN = window;
  const SCRIPT_DOC = SCRIPT_WIN.document;
  // Match the TLE Bootstrap/Loader host contract: the direct parent is Tavern Helper's host page.
  const HOST_WIN = SCRIPT_WIN.parent;
  const HOST_DOC = HOST_WIN?.document;
  if (!HOST_DOC?.documentElement || !HOST_DOC.body) {
    console.error('[Freesia Messenger Loader] 无法访问酒馆宿主页面。');
    return;
  }

  const LOADER_VERSION = '0.1.8';
  const PROJECT = 'Freesia Messenger';
  const LOADER_CHANNEL = 'stable-loader';
  const CHANNEL_KEY = 'freesia_messenger_update_channel_v1';
  function readConfiguredChannel() {
    try { return HOST_WIN.localStorage?.getItem(CHANNEL_KEY) === 'test' ? 'test' : 'stable'; }
    catch { return 'stable'; }
  }
  let CHANNEL = readConfiguredChannel();
  const MANIFEST_URL = () => CHANNEL === 'test'
    ? 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/test-bootstrap-toast-cleanup/channels/test.json'
    : 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/test-bootstrap-toast-cleanup/latest.json';
  const INSTANCE_KEY = '__FREESIA_MESSENGER_V1__';
  const LOADER_KEY = '__FREESIA_MESSENGER_REMOTE_LOADER_V1__';
  const LKG_KEY = 'freesia.messenger.loader.lastKnownGood.v1';
  const PREVIOUS_KEY = 'freesia.messenger.loader.previousKnownGood.v1';
  const CANDIDATE_KEY = 'freesia.messenger.loader.candidate.v1';
  const AUTO_RESTORE_KEY = 'freesia.messenger.loader.autoRestore.v1';
  const AUTO_UPDATE_KEY = 'freesia_messenger_remote_auto_update_v1';
  const AUTO_RESTORE_DELAY = 900;
  const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
  const CACHE_DB_NAME = 'Freesia_Messenger_Remote_Loader_Cache';
  const CACHE_DB_VERSION = 1;
  const CACHE_STORE_NAME = 'records';
  let cacheDbPromise = null;
  let checkPromise = null;
  const cacheFlags = { lkg: false, previous: false };

  // Running Test and Stable Loaders together creates competing update checks.
  // Do not silently take over another Loader's active session.
  const LEGACY_PARENT = SCRIPT_WIN.parent;
  const oldTestLoader = HOST_WIN.__FREESIA_MESSENGER_REMOTE_LOADER_TEST_V1__ ||
    (LEGACY_PARENT !== HOST_WIN ? LEGACY_PARENT.__FREESIA_MESSENGER_REMOTE_LOADER_TEST_V1__ : null);
  if (oldTestLoader && !oldTestLoader.diagnostics?.destroyed) {
    console.warn('[Freesia Messenger Remote Loader] 检测到 Test Loader 仍在运行。请先禁用旧 Loader 并刷新；Stable Loader 本次不启动。');
    return;
  }
  const previousLoader = HOST_WIN[LOADER_KEY] ||
    (LEGACY_PARENT !== HOST_WIN ? LEGACY_PARENT[LOADER_KEY] : null);
  previousLoader?.destroy?.();

  const controller = new SCRIPT_WIN.AbortController();
  let candidate = null;
  let adoptableReleases = [];
  let allowChannelDowngrade = false;
  let busy = false;
  let scriptInjectionAvailable = false;
  let startupConflict = false;
  let closed = false;
  let checkTimer = 0;
  const CHECK_INTERVAL = 6 * 60 * 60 * 1000;
  const RETRY_INTERVAL = 60 * 1000;

  // Headless mode: no DOM panel, no floating launcher, no Shadow DOM.
  const diagnosticState = {
    version: LOADER_VERSION,
    channel: CHANNEL,
    startedAt: new Date().toISOString(),
    headless: true,
    uiMounted: false,
    scriptInjectionAvailable: false,
    lastLoadMethod: null,
    remoteScriptError: null,
    activeVersion: null,
    autoRestoreAuthorized: false,
    autoUpdateEnabled: true,
    cache: { lkg: false, previous: false },
    availableVersion: null,
    remoteCheckedAt: null,
    updateAvailable: false,
    lastStatus: null,
    request: null,
    lastRequest: null,
    destroyed: false,
  };
  try { HOST_WIN.__FREESIA_MESSENGER_REMOTE_LOADER_DIAGNOSTICS__ = diagnosticState; } catch {}

  const LOADER_STATE_EVENT = 'freesia-messenger-loader-state-change';
  function notifyHostState() {
    try { HOST_WIN.dispatchEvent(new HOST_WIN.CustomEvent(LOADER_STATE_EVENT)); } catch {}
  }
  function setStatus(message, kind = 'info') {
    if (closed) return;
    const text = String(message || '');
    diagnosticState.lastStatus = { message: text.slice(0, 1600), kind, at: new Date().toISOString() };
    notifyHostState();
    const method = kind === 'error' ? 'error' : (kind === 'warning' ? 'warn' : 'info');
    try { HOST_WIN.console?.[method]?.('[Freesia Messenger Remote Loader] ' + text); } catch {}
    if (kind !== 'info') {
      try {
        const toast = HOST_WIN.toastr?.[kind === 'warning' ? 'warning' : kind];
        toast?.call(HOST_WIN.toastr, text.split('\n')[0].slice(0, 180), 'Freesia Messenger Loader');
      } catch {}
    }
  }

  // Internal route failover is diagnostic progress, not a user-facing warning.
  // A failed mirror followed by a successful fallback must not emit a toast.
  function setTransientStatus(message) {
    if (closed) return;
    diagnosticState.lastStatus = {
      message: String(message || '').slice(0, 1600),
      kind: 'info',
      at: new Date().toISOString(),
    };
    notifyHostState();
    try { HOST_WIN.console?.info?.('[Freesia Messenger Remote Loader] ' + message); } catch {}
  }

  function setMeta(message) {
    diagnosticState.summary = String(message || '').slice(0, 800);
  }

  function setBusy(value) {
    busy = Boolean(value);
    diagnosticState.busy = busy;
  }

    function getActiveInstance() {
    try { return HOST_WIN[INSTANCE_KEY] || null; }
    catch { return null; }
  }

  function getMessengerRoot() {
    const directRoot = HOST_DOC.getElementById('freesia-messenger-root');
    if (directRoot) return directRoot;
    const rootHost = HOST_DOC.getElementById('freesia-messenger-root-host');
    try {
      return rootHost?.shadowRoot?.querySelector('#freesia-messenger-root') || null;
    } catch {
      return null;
    }
  }

  function isHealthy(api, expectedVersion) {
    return Boolean(
      api &&
      api.version === expectedVersion &&
      typeof api.destroy === 'function' &&
      typeof api.open === 'function' &&
      typeof api.close === 'function' &&
      api.hostWindow === HOST_WIN &&
      getMessengerRoot()
    );
  }

    function encodeUtf8(value) {
    if (SCRIPT_WIN.TextEncoder) return new SCRIPT_WIN.TextEncoder().encode(value);
    const binary = unescape(encodeURIComponent(value));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function sha256Fallback(bytes) {
    const K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
    ];
    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const data = new Uint8Array(paddedLength);
    data.set(bytes);
    data[bytes.length] = 0x80;
    for (let i = 0; i < 8; i++) data[paddedLength - 1 - i] = Math.floor(bitLength / (2 ** (8 * i))) & 0xff;
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let offset = 0; offset < paddedLength; offset += 64) {
      for (let i = 0; i < 16; i++) {
        const j = offset + i * 4;
        w[i] = ((data[j] << 24) | (data[j + 1] << 16) | (data[j + 2] << 8) | data[j + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const x = w[i - 15];
        const y = w[i - 2];
        const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    return H.map(value => value.toString(16).padStart(8, '0')).join('');
  }

  async function sha256(text) {
    const bytes = encodeUtf8(text);
    const subtle = SCRIPT_WIN.crypto?.subtle;
    if (subtle?.digest) {
      try {
        const digest = await subtle.digest('SHA-256', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('[Freesia Messenger Loader] WebCrypto 不可用，切换纯 JS SHA-256。', error);
      }
    }
    return sha256Fallback(bytes);
  }

  async function verifySource(record) {
    if (!record || typeof record.source !== 'string') throw new Error('通讯侠源码内容缺失');
    validateManifest({
      schema_version: 1,
      project: PROJECT,
      channel: CHANNEL,
      latest_version: record.version,
      release: { ...record, source_path: `core/v${record.version}/Freesia-Messenger.js` }
    });
    const bytes = encodeUtf8(record.source);
    if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error('通讯侠源码超过安全大小限制');
    if (bytes.byteLength !== record.size_bytes) {
      throw new Error(`源码长度不匹配：期望 ${record.size_bytes}，实际 ${bytes.byteLength}`);
    }
    const actualHash = await sha256(record.source);
    if (actualHash !== record.sha256) throw new Error('SHA-256 校验失败');
    return true;
  }

    // Only transport via CDN; source_url remains the canonical pinned GitHub URL.
  function downloadRoutes(originalUrl, authoritativeFirst = false) {
    const root = 'https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/';
    if (!originalUrl.startsWith(root)) throw new Error('下载来源仓库不受信任');
    const target = /^(main|test-bootstrap-toast-cleanup|[a-f0-9]{40})\/(loader\/latest\.json|latest\.json|channels\/test\.json|loader\/runtime\/v\d+\.\d+\.\d+\/Freesia-Messenger-Remote-Loader\.js|core\/v\d+\.\d+\.\d+\/Freesia-Messenger\.js)(\?.*)?$/.exec(originalUrl.slice(root.length));
    if (!target) throw new Error('下载路径或固定 Commit 无效');
    const cdnPath = 'jerinmiss620-web/Freesia-Communicator@' + target[1] + '/' + target[2] + (target[3] || '');
    const official = { url: originalUrl, label: 'GitHub Raw', timeout: 20000 };
    const cdn = { url: 'https://cdn.jsdelivr.net/gh/' + cdnPath, label: 'jsDelivr', timeout: 8000 };
    const fastly = { url: 'https://fastly.jsdelivr.net/gh/' + cdnPath, label: 'Fastly', timeout: 8000 };
    const testingcf = { url: 'https://testingcf.jsdelivr.net/gh/' + cdnPath, label: 'TestingCF', timeout: 8000 };
    // Mutable manifests prefer the authoritative GitHub source; immutable files use CDN first.
    return authoritativeFirst && !/^[a-f0-9]{40}$/.test(target[1])
      ? [{ ...official, timeout: 5000 }, cdn, fastly, testingcf]
      : [cdn, fastly, testingcf, official];
  }

  async function fetchText(url, timeoutMs = 20000, validate = null) {
    const isManifest = /\/(?:main|test-bootstrap-toast-cleanup)\/(?:loader\/latest\.json|latest\.json|channels\/test\.json)(?:\?|$)/.test(url);
    const routes = downloadRoutes(url, isManifest);
    const stage = isManifest
      ? (url.includes('/channels/test.json') ? 'Test Core 清单' : 'Stable Core 清单')
      : 'Core 源码';
    let lastError = null;

    for (let attempt = 0; attempt < routes.length; attempt++) {
      const route = routes[attempt];
      if (closed || controller.signal.aborted) throw new Error('Loader 已关闭');

      const startedAt = Date.now();
      const requestTimeout = Math.min(timeoutMs, route.timeout);
      const requestInfo = {
        stage,
        attempt: attempt + 1,
        maxAttempts: routes.length,
        route: route.label,
        timeoutMs: requestTimeout,
        status: 'requesting',
        startedAt: new Date(startedAt).toISOString(),
      };
      diagnosticState.request = requestInfo;
      setStatus(stage + '：正在尝试 ' + route.label + '（' + (attempt + 1) + '/' + routes.length + '）');

      const requestController = new SCRIPT_WIN.AbortController();
      let timedOut = false;
      let httpStatus = null;
      const abort = () => requestController.abort();
      const timer = SCRIPT_WIN.setTimeout(
        () => { timedOut = true; requestController.abort(); },
        requestTimeout);
      controller.signal.addEventListener('abort', abort, { once: true });

      try {
        const response = await SCRIPT_WIN.fetch(route.url, {
          method: 'GET', cache: 'no-store', credentials: 'omit',
          redirect: 'follow', signal: requestController.signal,
        });
        httpStatus = response.status;
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const body = await response.text();
        if (closed || controller.signal.aborted) throw new Error('Loader 已关闭');
        if (timedOut) throw new Error('下载超时');

        if (typeof validate === 'function') {
          try { await validate(body, route); }
          catch (error) { throw new Error('内容校验失败：' + (error?.message || error)); }
        }

        const completedAt = Date.now();
        diagnosticState.request = null;
        diagnosticState.lastRequest = {
          ...requestInfo,
          status: 'success',
          httpStatus,
          elapsedMs: completedAt - startedAt,
          completedAt: new Date(completedAt).toISOString(),
        };
        notifyHostState();
        return body;
      } catch (error) {
        if (closed || controller.signal.aborted) throw error;

        const reason = String(error?.message || error);
        const errorType = timedOut ? 'timeout'
          : httpStatus !== null ? 'http'
          : reason.includes('内容校验失败') ? 'verification'
          : 'network';
        const failedAt = Date.now();
        diagnosticState.request = null;
        diagnosticState.lastRequest = {
          ...requestInfo,
          status: 'failed',
          errorType,
          httpStatus,
          elapsedMs: failedAt - startedAt,
          reason,
          completedAt: new Date(failedAt).toISOString(),
        };
        lastError = new Error(route.label + (timedOut ? ' 请求超时' : ' 下载或校验失败') + '：' + reason);
        if (attempt < routes.length - 1) {
          setTransientStatus(lastError.message + '；正在切换下一备用线路。');
        } else {
          notifyHostState();
        }
      } finally {
        SCRIPT_WIN.clearTimeout(timer);
        controller.signal.removeEventListener('abort', abort);
      }
    }

    throw lastError || new Error('所有下载线路均不可用');
  }

  function validateAdoptableRelease(release) {
    if (!release || typeof release.version !== 'string' ||
        !/^\d+\.\d+\.\d+$/.test(release.version)) {
      throw new Error('可接管版本的版本号无效');
    }
    if (!/^[a-f0-9]{64}$/.test(release.sha256 || '')) throw new Error('可接管版本 SHA-256 字段无效');
    if (!Number.isSafeInteger(release.size_bytes) || release.size_bytes < 1 || release.size_bytes > MAX_SOURCE_BYTES) {
      throw new Error('可接管版本源码大小字段无效');
    }
    const expectedPath = `core/v${release.version}/Freesia-Messenger.js`;
    if (release.source_path !== expectedPath) throw new Error('可接管版本源码路径与版本号不一致');
    if (!/^[a-f0-9]{40}$/.test(release.source_commit || '')) throw new Error('可接管版本 Commit 字段无效');
    let sourceUrl;
    try { sourceUrl = new URL(release.source_url); }
    catch { throw new Error('可接管版本源码 URL 无效'); }
    const expectedUrl = `https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/${release.source_commit}/${expectedPath}`;
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'raw.githubusercontent.com' ||
        sourceUrl.href !== expectedUrl) {
      throw new Error('可接管版本源码必须指向固定 Commit 的官方仓库路径');
    }
    return {
      version: release.version,
      source_path: expectedPath,
      source_commit: release.source_commit,
      source_url: expectedUrl,
      sha256: release.sha256,
      size_bytes: release.size_bytes,
    };
  }

  function validateManifest(manifest, options = {}) {
    if (!manifest || manifest.schema_version !== 1) throw new Error('版本清单 schema_version 不受支持');
    if (manifest.project !== PROJECT || manifest.channel !== CHANNEL) throw new Error('版本清单项目或更新通道不匹配');
    if (manifest.minimum_loader_version && compareVersions(LOADER_VERSION, manifest.minimum_loader_version) < 0) {
      throw new Error(`当前 Loader v${LOADER_VERSION} 低于清单要求的 v${manifest.minimum_loader_version}`);
    }
    const release = manifest.release;
    if (!release || typeof release.version !== 'string' || release.version !== manifest.latest_version) {
      throw new Error('版本清单中的版本号不一致');
    }
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.version)) throw new Error('版本号格式无效');
    if (!/^[a-f0-9]{64}$/.test(release.sha256 || '')) throw new Error('SHA-256 字段无效');
    if (!Number.isSafeInteger(release.size_bytes) || release.size_bytes < 1 || release.size_bytes > MAX_SOURCE_BYTES) {
      throw new Error('源码大小字段无效');
    }
    let sourceUrl;
    try { sourceUrl = new URL(release.source_url); }
    catch { throw new Error('源码 URL 无效'); }
    const expectedPath = /^\/jerinmiss620-web\/Freesia-Communicator\/[a-f0-9]{40}\/core\/v\d+\.\d+\.\d+\/Freesia-Messenger\.js$/;
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'raw.githubusercontent.com' || !expectedPath.test(sourceUrl.pathname)) {
      throw new Error('源码地址不在受信任的仓库与版本路径内');
    }
    if (!sourceUrl.pathname.includes(`/core/v${release.version}/Freesia-Messenger.js`)) {
      throw new Error('源码 URL 版本目录与清单版本号不一致');
    }
    if (release.source_path !== `core/v${release.version}/Freesia-Messenger.js`) {
      throw new Error('源码路径字段与版本号不一致');
    }
    const commitMatch = sourceUrl.pathname.match(/^\/jerinmiss620-web\/Freesia-Communicator\/([a-f0-9]{40})\/core\/v\d+\.\d+\.\d+\/Freesia-Messenger\.js$/);
    if (!commitMatch || !/^[a-f0-9]{40}$/.test(release.source_commit || '') ||
        release.source_commit !== commitMatch[1] ||
        sourceUrl.href !== `https://raw.githubusercontent.com/jerinmiss620-web/Freesia-Communicator/${release.source_commit}/${release.source_path}`) {
      throw new Error('源码 Commit 与固定下载地址不一致');
    }

    const listed = manifest.adoptable_releases ?? [];
    if (!Array.isArray(listed) || listed.length > 10) throw new Error('可接管版本列表无效');
    const seen = new Set();
    const validated = listed.map(item => {
      const safe = validateAdoptableRelease(item);
      if (compareVersions(safe.version, release.version) >= 0) {
        throw new Error('可接管版本必须早于当前远程版本');
      }
      if (seen.has(safe.version)) throw new Error('可接管版本列表包含重复版本');
      seen.add(safe.version);
      return safe;
    });
    if (options.captureAdoptable === true) adoptableReleases = validated;
    return release;
  }

    function getStorage() {
    try { return HOST_WIN.localStorage; }
    catch { return null; }
  }

  function isAutoUpdateEnabled() {
    // Missing preference means enabled by default. Explicit 'false' always wins.
    try { return getStorage()?.getItem(AUTO_UPDATE_KEY) !== 'false'; }
    catch { return true; }
  }

  function setAutoUpdateEnabled(enabled) {
    const storage = getStorage();
    if (!storage) throw new Error('宿主 localStorage 不可用，无法保存自动更新选项');
    storage.setItem(AUTO_UPDATE_KEY, enabled ? 'true' : 'false');
    refreshButtons();
    setStatus(enabled
      ? '已开启自动安装更新：现在检查，页面运行期间也会定期检查。'
      : '已关闭自动安装更新：仍可在 通讯侠 面板手动检查和安装。');
    try { HOST_WIN.dispatchEvent(new HOST_WIN.CustomEvent('freesia-messenger-loader-auto-update-preference')); } catch {}
    return isAutoUpdateEnabled();
  }

  function serializeRecord(record) {
    return {
      schema_version: 1,
      version: record.version,
      sha256: record.sha256,
      size_bytes: record.size_bytes,
      source: record.source,
      source_url: record.source_url || null,
      source_commit: record.source_commit || null,
      saved_at: new Date().toISOString(),
    };
  }

  function slotForKey(key) {
    if (key === LKG_KEY) return 'lkg';
    if (key === PREVIOUS_KEY) return 'previous';
    if (key === CANDIDATE_KEY) return 'candidate';
    throw new Error('未知的 Loader 缓存槽位');
  }

  function isLostDbConnection(error) {
    const message = String(error?.message || error || '');
    return /connection to indexed database server lost|database connection (?:is|has been) clos(?:ed|ing)|database (?:has been|is) closed|connection (?:was|is) closed|backing store.*(?:closed|disconnect)/i.test(message);
  }

  function invalidateCacheDb() {
    const previous = cacheDbPromise;
    cacheDbPromise = null;
    previous?.then(db => { try { db.close(); } catch {} }).catch(() => {});
  }

  function getCacheDb() {
    if (!cacheDbPromise) {
      const opening = new Promise((resolve, reject) => {
        let factory;
        try { factory = HOST_WIN.indexedDB; }
        catch (error) { reject(error); return; }
        if (!factory?.open) {
          reject(new Error('当前宿主不支持 IndexedDB'));
          return;
        }
        let request;
        try { request = factory.open(CACHE_DB_NAME, CACHE_DB_VERSION); }
        catch (error) { reject(error); return; }
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
            db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'slot' });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            try { db.close(); } catch {}
            if (cacheDbPromise === opening) cacheDbPromise = null;
          };
          db.onclose = () => { if (cacheDbPromise === opening) cacheDbPromise = null; };
          resolve(db);
        };
        request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'));
        request.onblocked = () => reject(new Error('IndexedDB 数据库升级被其他页面阻塞'));
      });
      cacheDbPromise = opening;
      opening.catch(() => { if (cacheDbPromise === opening) cacheDbPromise = null; });
    }
    return cacheDbPromise;
  }

  async function withDbReconnect(operation) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try { return await operation(await getCacheDb()); }
      catch (error) {
        if (!isLostDbConnection(error)) throw error;
        invalidateCacheDb();
        if (attempt === 1) {
          throw new Error('IndexedDB 连接失效，重新连接后仍不可用。请彻底退出并重新打开 TT／酒馆；原缓存未删除。' +
            ' 原因：' + (error?.message || error));
        }
        setStatus('IndexedDB 连接中断，正在重新连接一次（保留原缓存）…', 'warning');
      }
    }
  }

  async function idbGet(slot) {
    return withDbReconnect(db => new Promise((resolve, reject) => {
      let result = null;
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error || new Error('IndexedDB 读取失败'));
      };
      let transaction;
      try {
        transaction = db.transaction(CACHE_STORE_NAME, 'readonly');
        const request = transaction.objectStore(CACHE_STORE_NAME).get(slot);
        request.onsuccess = () => { result = request.result || null; };
        request.onerror = () => fail(request.error);
        transaction.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(result);
        };
        transaction.onerror = () => fail(transaction.error);
        transaction.onabort = () => fail(transaction.error || new Error('IndexedDB 读取事务中止'));
      } catch (error) { fail(error); }
    }));
  }

  async function idbPut(slot, record) {
    const payload = { ...serializeRecord(record), slot };
    return withDbReconnect(db => new Promise((resolve, reject) => {
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error || new Error('IndexedDB 写入失败'));
      };
      let transaction;
      try {
        transaction = db.transaction(CACHE_STORE_NAME, 'readwrite');
        transaction.objectStore(CACHE_STORE_NAME).put(payload);
        transaction.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(true);
        };
        transaction.onerror = () => fail(transaction.error);
        transaction.onabort = () => fail(transaction.error || new Error('IndexedDB 写入事务中止'));
      } catch (error) { fail(error); }
    }));
  }

  function writeCachePointer(key, slot, record) {
    const storage = getStorage();
    if (!storage) return false;
    try {
      // Remove a legacy full-source copy only after the IndexedDB record is durable and verified.
      storage.removeItem(key);
      storage.setItem(key, JSON.stringify({
        schema_version: 2, backend: 'indexedDB', slot,
        version: record.version, sha256: record.sha256,
        size_bytes: record.size_bytes, saved_at: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.warn('[Freesia Messenger Loader] IndexedDB 缓存已验证，但 localStorage 索引写入失败。', error);
      return false;
    }
  }

  async function writeIndexedRecord(slot, record) {
    await verifySource(record);
    await idbPut(slot, record);
    const stored = await idbGet(slot);
    if (!stored) throw new Error('IndexedDB 写入后未能读取缓存记录');
    await verifySource(stored);
    if (stored.version !== record.version || stored.sha256 !== record.sha256) {
      throw new Error('IndexedDB 缓存读回不是本次写入版本');
    }
    return stored;
  }

  function writeLocalStorageRecord(key, record) {
    const storage = getStorage();
    if (!storage) throw new Error('宿主 localStorage 不可用，无法保存通讯侠回滚缓存');
    const serialized = JSON.stringify(serializeRecord(record));
    storage.setItem(key, serialized);
    const readback = JSON.parse(storage.getItem(key) || 'null');
    return readback;
  }

  async function saveRecord(key, record) {
    const slot = slotForKey(key);
    await verifySource(record);

    // IndexedDB is authoritative whenever it can be opened. A transaction failure must not
    // create a newer localStorage record that could be shadowed by an older IndexedDB record.
    let dbAvailable = false;
    let openError = null;
    try { await getCacheDb(); dbAvailable = true; }
    catch (error) { openError = error; }

    if (dbAvailable) {
      try {
        const stored = await writeIndexedRecord(slot, record);
        cacheFlags[slot] = true;
        writeCachePointer(key, slot, stored);
        return true;
      } catch (indexedError) {
        throw new Error('IndexedDB 已可用，但缓存写入或读回校验失败；为避免缓存版本分叉，没有改写 localStorage：'
          + (indexedError?.message || indexedError));
      }
    }

    // Compatibility fallback only when IndexedDB itself cannot be opened.
    const storage = getStorage();
    if (!storage) throw new Error('IndexedDB 不可用（' + (openError?.message || '未知原因') + '），且 localStorage 不可用');
    try {
      const readback = writeLocalStorageRecord(key, record);
      await verifySource(readback);
      if (readback.version !== record.version || readback.sha256 !== record.sha256) {
        throw new Error('localStorage 缓存读回版本与本次写入不一致');
      }
      cacheFlags[slot] = true;
      console.warn('[Freesia Messenger Loader] IndexedDB 无法打开，已回退到 localStorage 源码缓存。', openError);
      return true;
    } catch (storageError) {
      cacheFlags[slot] = false;
      throw new Error('IndexedDB 无法打开：' + (openError?.message || openError) +
        '；localStorage 回退也失败：' + (storageError?.message || storageError));
    }
  }

  async function readRecord(key, label) {
    const slot = slotForKey(key);
    let indexedRecord = null;
    let indexedError = null;
    try {
      indexedRecord = await idbGet(slot);
      if (indexedRecord) await verifySource(indexedRecord);
    } catch (error) {
      indexedRecord = null;
      indexedError = error;
      console.warn('[Freesia Messenger Loader] ' + label + ' IndexedDB 读取失败，尝试兼容缓存。', error);
    }

    const storage = getStorage();
    let payload = null;
    try { payload = JSON.parse(storage?.getItem(key) || 'null'); } catch {}
    let legacyRecord = null;
    // v0.1.6 / v0.1.7 stored full source in localStorage. Compare it with
    // IndexedDB before migration: the older IDB record may predate that newer LKG.
    if (payload?.schema_version === 1 && typeof payload.source === 'string') {
      try {
        await verifySource(payload);
        legacyRecord = payload;
      } catch (error) {
        console.warn('[Freesia Messenger Loader] ' + label + ' localStorage 兼容缓存校验失败。', error);
      }
    }

    if (indexedRecord && legacyRecord) {
      if (compareVersions(legacyRecord.version, indexedRecord.version) > 0) {
        try {
          const migrated = await writeIndexedRecord(slot, legacyRecord);
          cacheFlags[slot] = true;
          writeCachePointer(key, slot, migrated);
          return migrated;
        } catch (migrationError) {
          console.warn('[Freesia Messenger Loader] ' + label + ' 更新较新的 localStorage 缓存到 IndexedDB 失败；暂时使用已校验的 localStorage 版本。', migrationError);
          cacheFlags[slot] = true;
          return legacyRecord;
        }
      }
      cacheFlags[slot] = true;
      writeCachePointer(key, slot, indexedRecord);
      return indexedRecord;
    }

    if (indexedRecord) {
      cacheFlags[slot] = true;
      writeCachePointer(key, slot, indexedRecord);
      return indexedRecord;
    }

    if (legacyRecord) {
      cacheFlags[slot] = true;
      // Migrate only after the IndexedDB copy has been read back and hash-verified.
      try {
        const migrated = await writeIndexedRecord(slot, legacyRecord);
        writeCachePointer(key, slot, migrated);
        return migrated;
      } catch (migrationError) {
        console.warn('[Freesia Messenger Loader] ' + label + ' 迁移到 IndexedDB 失败，暂时保留原始 localStorage 缓存。', migrationError);
        return legacyRecord;
      }
    }

    // A version-2 pointer refers only to IndexedDB, never to an embedded source.
    if (payload?.schema_version === 2 && payload.backend === 'indexedDB') {
      cacheFlags[slot] = false;
      return null;
    }
    cacheFlags[slot] = false;
    if (indexedError) console.warn('[Freesia Messenger Loader] ' + label + ' 没有可用的兼容源码缓存。', indexedError);
    return null;
  }

  async function saveLastKnownGood(record) {
    return saveRecord(LKG_KEY, record);
  }

  async function readLastKnownGood() {
    return readRecord(LKG_KEY, 'Last Known Good');
  }

  async function savePreviousKnownGood(record) {
    return saveRecord(PREVIOUS_KEY, record);
  }

  async function readPreviousKnownGood() {
    return readRecord(PREVIOUS_KEY, 'Previous Known Good');
  }

  function isAutoRestoreEnabled() {
    try { return getStorage()?.getItem(AUTO_RESTORE_KEY) === 'true'; }
    catch { return false; }
  }

  function setAutoRestoreEnabled(enabled) {
    const storage = getStorage();
    if (!storage) throw new Error('宿主 localStorage 不可用，无法保存自动恢复设置');
    storage.setItem(AUTO_RESTORE_KEY, enabled ? 'true' : 'false');
    refreshButtons();
  }

  function testClassicScriptCapability() {
    const mount = SCRIPT_DOC.head || SCRIPT_DOC.documentElement;
    if (!SCRIPT_DOC.createElement || !mount?.appendChild) {
      throw new Error('当前 Tavern Helper 执行环境不支持经典 script 元素引入');
    }
    scriptInjectionAvailable = true;
    diagnosticState.scriptInjectionAvailable = true;
    return true;
  }

  function sha256ToSri(hash) {
    if (!/^[a-f0-9]{64}$/i.test(hash || '')) throw new Error('SRI SHA-256 字段无效');
    const bytes = [];
    for (let i = 0; i < hash.length; i += 2) bytes.push(parseInt(hash.slice(i, i + 2), 16));
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    if (typeof SCRIPT_WIN.btoa !== 'function') throw new Error('当前浏览器不支持 SRI 编码');
    return 'sha256-' + SCRIPT_WIN.btoa(binary);
  }

  function appendClassicScript(src, integrity, method) {
    return new Promise((resolve, reject) => {
      const mount = SCRIPT_DOC.head || SCRIPT_DOC.documentElement;
      if (!mount?.appendChild) {
        reject(new Error('Tavern Helper script document 没有可用的 script 挂载点'));
        return;
      }
      const script = SCRIPT_DOC.createElement('script');
      script.async = false;
      script.src = src;
      script.dataset.tleRemoteLoader = LOADER_VERSION;
      script.referrerPolicy = 'no-referrer';
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
      }
      let settled = false;
      const onAbort = () => {
        if (settled) return;
        settled = true;
        SCRIPT_WIN.clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        reject(new Error('Loader 已关闭'));
      };
      controller.signal.addEventListener('abort', onAbort, { once: true });
      const timer = SCRIPT_WIN.setTimeout(() => {
        if (settled) return;
        settled = true;
        controller.signal.removeEventListener('abort', onAbort);
        script.onload = null;
        script.onerror = null;
        script.remove();
        reject(new Error('外部 script 加载超时（12 秒）'));
      }, 12000);
      script.onload = () => {
        if (settled) return;
        settled = true;
        controller.signal.removeEventListener('abort', onAbort);
        SCRIPT_WIN.clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        resolve(method);
      };
      script.onerror = () => {
        if (settled) return;
        settled = true;
        controller.signal.removeEventListener('abort', onAbort);
        SCRIPT_WIN.clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        reject(new Error('外部 script 加载失败：网络、CORS 或 Subresource Integrity 校验未通过'));
      };
      try { mount.appendChild(script); }
      catch (error) {
        if (!settled) {
          settled = true;
          controller.signal.removeEventListener('abort', onAbort);
          SCRIPT_WIN.clearTimeout(timer);
          script.remove();
          reject(error);
        }
      }
    });
  }

  async function loadScriptRecord(record, options = {}) {
    await verifySource(record);
    if (closed) throw new Error('Loader 已关闭');
    const preferRemote = options.preferRemote !== false;
    if (preferRemote && record.source_url) {
      try {
        const integrity = sha256ToSri(record.sha256);
        const method = await appendClassicScript(downloadRoutes(record.source_url)[0].url, integrity, 'cdn-script-src+sri');
        diagnosticState.lastLoadMethod = method;
        diagnosticState.remoteScriptError = null;
        return method;
      } catch (error) {
        diagnosticState.remoteScriptError = String(error?.message || error).slice(0, 400);
        console.warn('[Freesia Messenger Remote Loader] 远程 script-src 不可用；改用已通过 SHA-256 校验的本地缓存源码。', error);
      }
    }
    if (closed) throw new Error('Loader 已关闭');
    if (!SCRIPT_WIN.Blob || !SCRIPT_WIN.URL?.createObjectURL) {
      throw new Error('当前浏览器不支持 Blob script 回退');
    }
    const blob = new SCRIPT_WIN.Blob([record.source], { type: 'text/javascript;charset=utf-8' });
    const blobUrl = SCRIPT_WIN.URL.createObjectURL(blob);
    try {
      const method = await appendClassicScript(blobUrl, null, 'verified-blob-script-fallback');
      diagnosticState.lastLoadMethod = method;
      return method;
    } finally {
      SCRIPT_WIN.URL.revokeObjectURL(blobUrl);
    }
  }

  function hasStoredLkg() {
    if (cacheFlags.lkg) return true;
    try {
      const value = JSON.parse(getStorage()?.getItem(LKG_KEY) || 'null');
      return value?.schema_version === 1 && typeof value.source === 'string';
    } catch { return false; }
  }

  function hasStoredPrevious() {
    if (cacheFlags.previous) return true;
    try {
      const value = JSON.parse(getStorage()?.getItem(PREVIOUS_KEY) || 'null');
      return value?.schema_version === 1 && typeof value.source === 'string';
    } catch { return false; }
  }

  function refreshButtons() {
    const active = getActiveInstance();
    diagnosticState.activeVersion = active?.version || null;
    diagnosticState.autoRestoreAuthorized = isAutoRestoreEnabled();
    diagnosticState.autoUpdateEnabled = isAutoUpdateEnabled();
    diagnosticState.cache = {
      lkg: hasStoredLkg() || cacheFlags.lkg,
      previous: hasStoredPrevious() || cacheFlags.previous,
    };
    diagnosticState.availableVersion = candidate?.version || null;
    diagnosticState.updateAvailable = Boolean(candidate && (!active?.version || compareVersions(candidate.version, active.version) > 0));
    notifyHostState();
  }

  function checkRemote(options = {}) {
    if (closed) return Promise.resolve(null);
    if (checkPromise) return checkPromise;
    if (busy) return Promise.resolve(candidate);

    const pending = Promise.resolve().then(() => checkRemoteOnce(options));
    const shared = pending.finally(() => {
      if (checkPromise === shared) checkPromise = null;
    });
    checkPromise = shared;
    return shared;
  }

  async function checkRemoteOnce(options = {}) {
    if (closed || busy) return candidate;
    const promptUpdate = options.promptUpdate !== false;
    setBusy(true);
    candidate = null;
    let shouldLoad = false;
    try {
      setStatus('正在读取 ' + (CHANNEL === 'test' ? 'Test 测试' : 'Stable 正式') + ' 通道版本清单……');
      const manifestText = await fetchText(MANIFEST_URL() + '?_fm=' + Date.now(), 20000, text => {
        let parsed;
        try { parsed = JSON.parse(text); }
        catch { throw new Error('远程版本清单不是有效 JSON'); }
        validateManifest(parsed);
      });
      if (closed) return null;
      let manifest;
      try { manifest = JSON.parse(manifestText); }
      catch { throw new Error('远程版本清单不是有效 JSON'); }
      const release = validateManifest(manifest, { captureAdoptable: true });
      diagnosticState.remoteCheckedAt = new Date().toISOString();
      setStatus('已找到远程版本 v' + release.version + '，正在下载并校验源码……');
      const source = await fetchText(release.source_url, 20000, async text => {
        await verifySource({
          version: release.version,
          sha256: release.sha256,
          size_bytes: release.size_bytes,
          source_url: release.source_url,
          source_commit: release.source_commit || null,
          source: text,
        });
      });
      const record = {
        version: release.version,
        sha256: release.sha256,
        size_bytes: release.size_bytes,
        source_url: release.source_url,
        source_commit: release.source_commit || null,
        source,
      };
      await verifySource(record);
      if (closed) return null;
      const active = getActiveInstance();
      const activeVersion = active?.version || null;
      if (activeVersion && compareVersions(release.version, activeVersion) < 0 && !allowChannelDowngrade) {
        setStatus('远程版本 v' + release.version + ' 低于当前运行版本 v' + activeVersion + '，为避免意外降级已忽略。', 'warning');
        candidate = null;
        return null;
      }
      candidate = record;
      if (isHealthy(active, record.version)) {
        let cacheWarning = '';
        try {
          const currentLkg = await readLastKnownGood();
          if (currentLkg && currentLkg.sha256 !== record.sha256) await savePreviousKnownGood(currentLkg);
          if (!currentLkg || currentLkg.sha256 !== record.sha256) await saveLastKnownGood(record);
        } catch (cacheError) {
          cacheWarning = '；当前 通讯侠 健康运行，但缓存维护失败：' + (cacheError?.message || cacheError);
          console.warn('[Freesia Messenger Remote Loader] 当前实例健康；缓存维护失败，不影响运行。', cacheError);
        }
        setStatus('远程源码校验通过：v' + record.version + '。当前运行版本已经是最新版本，无需重新加载。' + cacheWarning, cacheWarning ? 'warning' : 'info');
      } else {
        const lkg = await readLastKnownGood();
        if (active && !lkg) {
          setStatus('发现远程版本 v' + record.version + '，但当前 通讯侠 v' + activeVersion + ' 没有可验证的 Last Known Good 回滚缓存。为保护正在运行的版本，本次不自动替换。', 'warning');
        } else if (active && lkg && compareVersions(active.version, lkg.version) !== 0) {
          setStatus('当前运行 通讯侠 v' + activeVersion + ' 与 Last Known Good 缓存 v' + lkg.version + ' 不一致。无法证明回滚备份对应当前实例，因此拒绝自动替换；请先统一当前实例与缓存版本。', 'warning');
        } else {
          shouldLoad = promptUpdate;
          setStatus(
            (activeVersion ? '发现可用更新：v' + activeVersion + ' → v' + record.version + '。' : '发现可安装版本：v' + record.version + '。') +
            (promptUpdate ? '源码校验通过。将请求用户确认安装。' : '源码校验通过；等待用户在 通讯侠 面板点击安装。'),
            'info'
          );
        }
      }
    } catch (error) {
      setStatus('检查失败：' + (error?.message || error) + '。现有 通讯侠 不会被修改。', 'error');
      console.error('[Freesia Messenger Remote Loader] 远程检查失败。', error);
    } finally {
      setBusy(false);
      refreshButtons();
    }
    if (!closed && shouldLoad && candidate) {
      const active = getActiveInstance();
      try {
        await loadRecord(candidate, active ? '远程更新' : '首次远程安装', { preferRemote: true });
      } catch (loadError) {
        setStatus('远程版本已校验，但本次未能安全加载：' + (loadError?.message || loadError), 'warning');
      }
    }
    return candidate;
  }

  function compareVersions(a, b) {
    const parse = value => String(value).split(/[.-]/).slice(0, 3).map(part => Number(part) || 0);
    const av = parse(a);
    const bv = parse(b);
    for (let i = 0; i < 3; i++) {
      if (av[i] > bv[i]) return 1;
      if (av[i] < bv[i]) return -1;
    }
    return 0;
  }

  async function loadRecord(record, label, options = {}) {
    if (closed || busy) return false;
    setBusy(true);
    try {
    if (!scriptInjectionAvailable) throw new Error('当前环境没有可用的经典 script 引入能力');
    await verifySource(record);
    const previous = getActiveInstance();
    const lkg = await readLastKnownGood();
    if (previous && !lkg && !isHealthy(previous, record.version)) {
      throw new Error('当前已有 通讯侠 运行，但没有可验证的 Last Known Good 回滚缓存。为保护唯一可用实例，已拒绝升级。');
    }
    if (previous && lkg && compareVersions(previous.version, lkg.version) !== 0) {
      throw new Error('当前运行 通讯侠 v' + previous.version + ' 与 Last Known Good 缓存 v' + lkg.version + ' 不一致，无法确认回滚备份对应当前实例，已拒绝升级。');
    }
    if (isHealthy(previous, record.version)) {
      setStatus('当前已经运行 通讯侠 v' + record.version + '，无需再次加载。', 'success');
      return true;
    }
    const confirmed = options.confirmed === true || SCRIPT_WIN.confirm(
      label + '\n\n即将加载 通讯侠 v' + record.version + '。\n' +
      '优先通过不可变 GitHub script.src + SRI 引入；外部脚本失败时回退到已校验的本地缓存脚本。\n' +
      '替换前会验证上一版本回滚备份；备份无法建立时不会替换当前 通讯侠。\n\n继续吗？'
    );
    if (!confirmed) {
      setStatus('用户取消了 通讯侠 v' + record.version + ' 的加载；当前实例保持不变。', 'info');
      return false;
    }
    setStatus('正在为 通讯侠 v' + record.version + ' 准备回滚备份……');
    let rollbackBackupReady = false;
    try {
      if (lkg && lkg.sha256 !== record.sha256) {
        const existingPrevious = await readPreviousKnownGood();
        if (!existingPrevious || existingPrevious.sha256 !== lkg.sha256) await savePreviousKnownGood(lkg);
        const verifiedPrevious = await readPreviousKnownGood();
        if (!verifiedPrevious || verifiedPrevious.sha256 !== lkg.sha256) throw new Error('上一版本回滚备份未能完成读回校验；当前 通讯侠 保持不变。');
        rollbackBackupReady = true;
      } else if (lkg) {
        rollbackBackupReady = true;
      }
    } catch (backupError) {
      setStatus('无法安全升级：上一版本备份建立失败。\n' + (backupError?.message || backupError) + '\n当前 通讯侠 未被替换。', 'error');
      return false;
    }

    if (closed || (options.automatic && !isAutoUpdateEnabled())) return false;
    // Stage and read back before replacing the only healthy instance.
    await writeIndexedRecord('candidate', record);
    if (closed || (options.automatic && !isAutoUpdateEnabled())) return false;
    setStatus('回滚备份' + (rollbackBackupReady ? '已验证' : '无需更换') + '，正在通过经典 script 引入 通讯侠 v' + record.version + '……');
    try {
      await loadScriptRecord(record, { preferRemote: options.preferRemote !== false });
      if (!isHealthy(getActiveInstance(), record.version)) throw new Error('script 已加载，但 通讯侠 实例、宿主引用或卸载接口健康检查未通过');
      getActiveInstance().remoteLoaderManaged = true;
      await saveLastKnownGood(record);
      if (!isAutoRestoreEnabled()) setAutoRestoreEnabled(true);
    } catch (error) {
      if (closed) return false;
      console.error('[Freesia Messenger Remote Loader] 远程脚本启动或健康检查失败。', error);
      const current = getActiveInstance();
      if (current && current !== previous) {
        try { current.destroy?.(); }
        catch (destroyError) { console.error('[Freesia Messenger Remote Loader] 清理失败实例时发生错误。', destroyError); }
      }
      const previousStillRunning = previous && HOST_WIN[INSTANCE_KEY] === previous && isHealthy(previous, previous.version);
      if (previousStillRunning) {
        setStatus('远程加载失败：' + (error?.message || error) + '。原有 通讯侠 仍在运行，没有执行回滚。', 'error');
      } else {
        const fallbacks = [await readLastKnownGood(), await readPreviousKnownGood()].filter(item => item && item.sha256 !== record.sha256);
        let recovered = false;
        const rollbackErrors = [];
        for (const fallback of fallbacks) {
          try {
            setStatus('新版本启动失败，正在从本地校验缓存恢复 通讯侠 v' + fallback.version + '……', 'warning');
            await loadScriptRecord(fallback, { preferRemote: false });
            if (!isHealthy(getActiveInstance(), fallback.version)) throw new Error('缓存版本健康检查未通过');
            getActiveInstance().remoteLoaderManaged = true;
            try { await saveLastKnownGood(fallback); }
            catch (cacheError) { console.warn('[Freesia Messenger Remote Loader] 已恢复，但无法提升 LKG 缓存。', cacheError); }
            setStatus('新版本启动失败，已自动恢复到 通讯侠 v' + fallback.version + '。\n原始错误：' + (error?.message || error), 'warning');
            recovered = true;
            break;
          } catch (rollbackError) {
            rollbackErrors.push('v' + fallback.version + ': ' + (rollbackError?.message || rollbackError));
            console.error('[Freesia Messenger Remote Loader] 尝试缓存回滚失败。', rollbackError);
          }
        }
        if (!recovered) setStatus('远程加载与自动回滚均失败。\n加载错误：' + (error?.message || error) + '\n回滚错误：' + (rollbackErrors.join('；') || '没有不同于候选版本的缓存源码') + '\n请重新启用原始 通讯侠 脚本并刷新酒馆。', 'error');
      }
      return false;
    }

    setStatus('更新成功：实际运行 通讯侠 v' + getActiveInstance().version + '；Last Known Good 已持久保存并读回校验，刷新将恢复此版本。', 'success');
    allowChannelDowngrade = false;
    return true;
    } finally {
      try { getStorage()?.removeItem(CANDIDATE_KEY); } catch {}
      setBusy(false);
      if (!closed) refreshButtons();
    }
  }

  async function rollback() {
    if (busy) return false;
    const record = await readPreviousKnownGood();
    if (!record) {
      setStatus('没有通过完整性校验的上一版本缓存。', 'error');
      refreshButtons();
      return false;
    }
    try { return await loadRecord(record, '恢复上一版本 v' + record.version, { preferRemote: false }); }
    catch (error) {
      setStatus('回滚失败：' + (error?.message || error), 'error');
      return false;
    }
  }

  function delay(ms) {
    return new Promise(resolve => SCRIPT_WIN.setTimeout(resolve, ms));
  }

  async function autoRestore() {
    if (!isAutoRestoreEnabled() && !HOST_WIN.__FREESIA_MESSENGER_REMOTE_BOOTSTRAP_V1__) {
      setStatus('自动恢复未获授权。新版本只会在用户确认后加载。', 'info');
      return false;
    }
    await delay(AUTO_RESTORE_DELAY);
    if (closed) return false;
    const active = getActiveInstance();
    if (active && isHealthy(active, active.version)) {
      startupConflict = true;
      setStatus('检测到已有 通讯侠 v' + (active.version || '未知') + ' 正在运行。为避免重复实例，自动恢复已跳过。', 'warning');
      return false;
    }
    let record = await readLastKnownGood();
    if (!record) {
      record = await readPreviousKnownGood();
      if (record) setStatus('主缓存不可用，尝试上一份已验证版本 v' + record.version + '……', 'warning');
    }
    if (!record) {
      setStatus('没有可恢复的 Core 缓存，将检查 GitHub 完成首次安装。', 'info');
      return false;
    }
    try {
      await loadScriptRecord(record, { preferRemote: false });
      if (!isHealthy(getActiveInstance(), record.version)) throw new Error('缓存源码已执行，但 通讯侠 健康检查未通过');
      getActiveInstance().remoteLoaderManaged = true;
      if (!isAutoRestoreEnabled()) setAutoRestoreEnabled(true);
      setStatus('自动恢复成功：实际运行 通讯侠 v' + record.version + '。正在检查远程更新。', 'success');
      return true;
    } catch (error) {
      if (closed) return false;
      console.error('[Freesia Messenger Remote Loader] 自动恢复失败。', error);
      try { getActiveInstance()?.destroy?.(); } catch {}
      const fallback = await readPreviousKnownGood();
      if (fallback && fallback.sha256 !== record.sha256) {
        try {
          setStatus('主缓存启动失败，正在尝试上一版本 v' + fallback.version + '……', 'warning');
          await loadScriptRecord(fallback, { preferRemote: false });
          if (!isHealthy(getActiveInstance(), fallback.version)) throw new Error('上一版本健康检查未通过');
          getActiveInstance().remoteLoaderManaged = true;
          try { await saveLastKnownGood(fallback); } catch (cacheError) { console.warn('[Freesia Messenger Remote Loader] 已恢复上一版本，但无法更新 LKG 缓存。', cacheError); }
          setStatus('已从上一版本恢复：通讯侠 v' + fallback.version + '。主缓存错误：' + (error?.message || error), 'warning');
          return true;
        } catch (fallbackError) { console.error('[Freesia Messenger Remote Loader] 上一版本自动恢复也失败。', fallbackError); }
      }
      setStatus('自动恢复失败：' + (error?.message || error) + '。请重新启用原始 通讯侠 脚本并刷新酒馆。', 'error');
      return false;
    }
  }

  async function maybeAutoInstallUpdate() {
    if (closed || busy || !candidate) return false;
    const active = getActiveInstance();
    // A first installation does not displace any running Core and therefore needs
    // no pre-existing rollback copy. The new validated release becomes the LKG.
    // Existing active Core instances always retain the stricter backup gate below.
    if (!active) {
      if (!HOST_WIN.__FREESIA_MESSENGER_REMOTE_BOOTSTRAP_V1__) return false;
      setStatus('Bootstrap 首次安装：已验证的 ' + (CHANNEL === 'test' ? 'Test 测试版' : 'Stable 正式版') + ' 通讯侠 v' + candidate.version + '，不会替换已有实例。');
      try { return await loadRecord(candidate, '首次自动安装正式版 通讯侠', {
        preferRemote: true, confirmed: true
      }); } catch (error) {
        setStatus('首次自动安装失败：' + (error?.message || error), 'warning');
        return false;
      }
    }
    if (!isAutoUpdateEnabled()) return false;
    if (compareVersions(candidate.version, active.version) <= 0 && !allowChannelDowngrade) return false;
    if (!isAutoRestoreEnabled()) {
      setStatus('检测到新版本，但当前 通讯侠 尚未授权 Loader 自动恢复；为保证首次更新安全，请先手动接管。', 'warning');
      return false;
    }
    if (!isHealthy(active, active.version)) {
      setStatus('检测到新版本，但当前 通讯侠 健康检查未通过；未执行自动安装。', 'warning');
      return false;
    }
    // Never displace an unbacked standalone instance. This is stricter than
    // manual updating and preserves the current version for emergency rollback.
    let previous;
    try { previous = await readLastKnownGood(); }
    catch (error) {
      setStatus('检测到新版本，但读取回滚缓存失败，已跳过自动安装：' + (error?.message || error), 'warning');
      return false;
    }
    if (!previous || previous.version !== active.version) {
      setStatus('检测到新版本，但回滚缓存与当前运行版本不一致；未执行自动安装。', 'warning');
      return false;
    }
    // Reconfirm the option after asynchronous storage access.
    if (closed || !isAutoUpdateEnabled() || getActiveInstance() !== active) return false;
    setStatus((CHANNEL === 'test' ? 'Test 测试版' : 'Stable 正式版') + ' v' + candidate.version + ' 校验通过，自动更新已开启；准备安全安装并保留上一版本。');
    try {
      return await loadRecord(candidate, '自动更新', { preferRemote: true, confirmed: true, automatic: true });
    } catch (error) {
      setStatus('自动更新已中止；当前版本保持不变：' + (error?.message || error), 'warning');
      return false;
    }
  }

  async function startup() {
    setBusy(true);
    try {
      testClassicScriptCapability();
      if (scriptInjectionAvailable) await autoRestore();
    } catch (error) {
      scriptInjectionAvailable = false;
      diagnosticState.scriptInjectionAvailable = false;
      setStatus('经典 script 引入环境检查失败：' + (error?.message || error) + '。当前不会替换 通讯侠。', 'error');
      console.error('[Freesia Messenger Remote Loader] 启动环境检查或自动恢复失败。', error);
    } finally {
      setBusy(false);
      refreshButtons();
    }
    if (!closed) await refreshAutomatic();
  }

  async function refreshAutomatic() {
    if (closed) return;
    if (busy) { scheduleCheck(RETRY_INTERVAL); return; }
    try {
      await checkRemote({ promptUpdate: false });
      if (!closed) await maybeAutoInstallUpdate();
    } catch (error) {
      setStatus('自动更新失败：' + (error?.message || error), 'warning');
    } finally {
      scheduleCheck(candidate ? CHECK_INTERVAL : RETRY_INTERVAL);
    }
  }
  function scheduleCheck(ms = CHECK_INTERVAL) {
    SCRIPT_WIN.clearTimeout(checkTimer);
    if (!closed) checkTimer = SCRIPT_WIN.setTimeout(() => void refreshAutomatic(), ms);
  }

  function destroy() {
    if (closed) return;
    closed = true;
    controller.abort();
    SCRIPT_WIN.clearTimeout(checkTimer);
    invalidateCacheDb();
    diagnosticState.destroyed = true;
    diagnosticState.busy = false;
    if (HOST_WIN[LOADER_KEY] === api) delete HOST_WIN[LOADER_KEY];
  }

  function getInfo() {
    // Read-only snapshot. Never dispatch a state-change event here: 通讯侠 calls
    // getInfo() while handling that same event, so re-dispatch would recurse.
    return {
      loaderVersion: LOADER_VERSION,
      channel: CHANNEL,
      currentVersion: getActiveInstance()?.version || null,
      availableVersion: candidate?.version || null,
      updateAvailable: diagnosticState.updateAvailable,
      hasLastKnownGood: Boolean(diagnosticState.cache.lkg),
      autoRestoreAuthorized: isAutoRestoreEnabled(),
      autoUpdateEnabled: isAutoUpdateEnabled(),
      checkedAt: diagnosticState.remoteCheckedAt,
      busy,
      lastStatus: diagnosticState.lastStatus,
      request: diagnosticState.request ? { ...diagnosticState.request } : null,
      lastRequest: diagnosticState.lastRequest ? { ...diagnosticState.lastRequest } : null,
    };
  }

  async function adoptCurrent() {
    if (busy || closed) return false;
    if (!candidate) await checkRemote({ promptUpdate: false });
    if (!candidate) {
      setStatus('接管失败：尚未取得并校验远程版本清单。', 'warning');
      return false;
    }
    const active = getActiveInstance();
    if (!active || !isHealthy(active, active.version)) {
      setStatus('接管失败：当前没有可验证的通讯侠运行实例。', 'warning');
      return false;
    }
    let release = null;
    if (active.version === candidate.version) release = candidate;
    else release = adoptableReleases.find(item => item.version === active.version) || null;
    if (!release) {
      setStatus('接管失败：当前通讯侠 v' + active.version +
        ' 不在远程清单提供的安全接管版本列表中；原有实例未被修改。', 'warning');
      return false;
    }
    setBusy(true);
    try {
      let record = release;
      if (release !== candidate) {
        setStatus('正在下载当前运行版本 v' + active.version + ' 的固定 Commit 源码，以建立可验证回滚副本……');
        const source = await fetchText(release.source_url, 20000, async text => {
          await verifySource({ ...release, source: text });
        });
        record = { ...release, source };
      }
      await verifySource(record);
      if (closed || getActiveInstance() !== active || !isHealthy(active, active.version)) {
        throw new Error('接管期间当前 Core 实例发生变化；未写入回滚授权。');
      }
      if (!SCRIPT_WIN.confirm(
        '确认让 Remote Loader 接管当前运行的通讯侠 v' + active.version + '？\n\n' +
        '将从固定 GitHub Commit 下载对应版本源码，校验 SHA-256 与 UTF-8 字节长度，并保存为 Last Known Good 回滚副本。当前运行实例不会被替换。\n\n' +
        '确认后，请在酒馆助手中停用原来单独导入的通讯侠 Core 脚本，再完整刷新酒馆。之后由 Bootstrap / Loader 自动恢复并更新。'
      )) return false;
      await saveLastKnownGood(record);
      const saved = await readLastKnownGood();
      if (!saved || saved.version !== active.version || saved.sha256 !== record.sha256) {
        throw new Error('回滚缓存写入后读回校验失败');
      }
      active.remoteLoaderManaged = true;
      setAutoRestoreEnabled(true);
      setStatus('已安全接管通讯侠 v' + active.version +
        '：当前源码已通过 SHA-256 校验并保存为 Last Known Good。请停用原单独导入的 Core 脚本后完整刷新。', 'success');
      return true;
    } catch (error) {
      setStatus('接管失败：' + (error?.message || error), 'error');
      return false;
    } finally {
      setBusy(false);
      if (!closed) refreshButtons();
    }
  }
  function setChannel(next) {
    const target = String(next || '').trim().toLowerCase();
    if (!['stable', 'test'].includes(target)) throw new Error('更新通道只能是 stable 或 test');
    if (target === CHANNEL) return true;
    if (busy) {
      setStatus('Loader 正在执行操作，请稍后再切换通道。', 'warning');
      return false;
    }
    const accepted = SCRIPT_WIN.confirm(
      '将通讯侠更新通道切换为 ' + target.toUpperCase() + '？\n\n切换后会重新检查远程版本。若目标通道版本较旧，将在此确认后允许回退到目标通道版本。'
    );
    if (!accepted) return false;
    try { HOST_WIN.localStorage.setItem(CHANNEL_KEY, target); }
    catch (error) {
      setStatus('无法保存更新通道：' + (error?.message || error), 'error');
      return false;
    }
    CHANNEL = target;
    diagnosticState.channel = target;
    candidate = null;
    allowChannelDowngrade = true;
    refreshButtons();
    setStatus('已切换到 ' + target.toUpperCase() + ' 通道，正在重新检查版本。');
    scheduleCheck(0);
    return true;
  }

  const api = {
    version: LOADER_VERSION,
    channel: LOADER_CHANNEL,
    bootstrapManaged: true,
    diagnostics: diagnosticState,
    getInfo,
    checkRemote: () => checkRemote({ promptUpdate: false }),
    loadRemote: async () => {
      if (!candidate) await checkRemote({ promptUpdate: false });
      if (!candidate) return false;
      return loadRecord(candidate, '手动加载 ' + (CHANNEL === 'test' ? 'Test 测试版' : 'Stable 正式版') + ' 通讯侠', { preferRemote: true });
    },
    adoptCurrent,
    setAutoUpdateEnabled,
    setChannel,
    rollback,
    setAutoRestore: setAutoRestoreEnabled,
    destroy,
    ready: null,
  };
  HOST_WIN[LOADER_KEY] = api;

  SCRIPT_WIN.addEventListener('pagehide', destroy, { once: true, signal: controller.signal });
  SCRIPT_WIN.addEventListener('beforeunload', destroy, { once: true, signal: controller.signal });

  setStatus('Headless Loader v' + LOADER_VERSION + ' 已启动。默认自动安装经过验证的正式版；可在 通讯侠 面板关闭。手动更新仍会要求确认。', 'info');
  refreshButtons();
  HOST_WIN.addEventListener('freesia-messenger-loader-auto-update-preference', () => {
    if (isAutoUpdateEnabled()) scheduleCheck(0);
  }, { signal: controller.signal });
  HOST_WIN.addEventListener('online', () => scheduleCheck(0), { signal: controller.signal });
  HOST_WIN.addEventListener('storage', event => {
    if (event.key === AUTO_UPDATE_KEY) { refreshButtons(); if (isAutoUpdateEnabled()) scheduleCheck(0); }
  }, { signal: controller.signal });
  api.ready = startup();
  console.info('[Freesia Messenger Remote Loader] Headless Loader v' + LOADER_VERSION + ' 已启动。稳定通道自动更新；通过 通讯侠 面板查看运行版本与设置。', diagnosticState);
})();
