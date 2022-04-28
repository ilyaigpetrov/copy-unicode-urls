// Storage
export const storage = {
  getAsync(what) {
    return new Promise((resolve) => (
      chrome.storage.local.get(
        what ? [what] : null,
        (msg) => resolve(what ? msg[what] : msg),
      )
    ));
  },
  setAsync(what) {
    return new Promise((resolve) => (
      chrome.storage.local.set(what, resolve)
    ));
  },
  removeAsync(keyOrKeys) {
    return new Promise((resolve) =>
      chrome.storage.local.remove(keyOrKeys, resolve)
    );
  },
  clearAsync() {
    return new Promise((resolve) => chrome.storage.local.clear(resolve));
  },
  isEmptyAsync() {
    return new Promise(async (resolve) => {
      const o = await this.getAsync();
      resolve(Object.keys(o).length === 0);
    });
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
export const version = {
  current,
  isLeq: (a, b) => {
    if (!b) {
      b = a;
      a = current;
    }
    return compareVersions(a, b) <= 0;
  },
};
