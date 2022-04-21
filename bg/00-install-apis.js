console.log('Extension started successfully.');
window.apis = {};

// Storage

window.apis.storage = {
  get(what) {
    return new Promise((resolve) => (
      chrome.storage.local.get(
        what ? [what] : null,
        (msg) => resolve(what ? msg[what] : msg),
      )
    ));
  },
  set(what) {
    return new Promise((resolve) => (
      chrome.storage.local.set(what, resolve)
    ));
  },
  remove(keyOrKeys) {
    return new Promise((resolve) => keyOrKeys
      ? (
        chrome.storage.local.remove(keyOrKeys, resolve)
        )
      : chrome.storage.clear(resolve)
    );
  },
};

// Versions

const max = 2**16;
const versionToArray = (v) => [ ...v.split('.'), 0, 0, 0].slice(0,4);
const versionToInt = (v) => versionToArray(v)
  .reverse()
  .reduce((acc, vv, i) => acc + parseInt(vv)*(max**i), 0);

const compareVersions = (a, b) => versionToInt(a) - versionToInt(b);

const current = chrome.runtime.getManifest().version;
window.apis.version = {
  current,
  isLeq: (a, b) => {
    if (!b) {
      b = a;
      a = current;
    }
    return compareVersions(a, b) <= 0;
  },
};
