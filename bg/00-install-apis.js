console.log('Extension started successfully.');
window.apis = {};
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
    return new Promise((resolve) => (
      chrome.storage.local.remove(keyOrKeys, resolve)
    ));
  },
};
