import { toUnicode } from './node_modules/punycode/punycode.es6.js';

(async () => {
  console.log('Extension started successfully.');

  window.apis = {};
  window.apis.storage = {
    get(what) {
      return new Promise((resolve) => (
        chrome.storage.sync.get(
          what ? [what] : null,
          (msg) => resolve(what ? msg[what] : msg),
        )
      ));
    },
    set(what) {
      return new Promise((resolve) => (
        chrome.storage.sync.set(what, resolve)
      ));
    },
  };

  let mode = await window.apis.storage.get('mode');
  if (mode === undefined) {
    await window.apis.storage.set({ mode: 'decode' });
  }

  const copyToClipboard = (str) => {

    const area = document.createElement('textarea');
    area.value = str;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  };

  const localizeUrl = (url) => {

    let u;
    try {
      u = new URL(url);
    } catch(e) {
      u = new URL(`http://${url}`);
    }
    return decodeURI(u.href
        .replace(u.hostname, toUnicode(u.hostname))
        // Prevent decodings of %25, otherwise %2526 -> %26 -> & in the address bar
        // instead of preserving %2526 (%252526 -> %2526 -> %26 in the address bar).
        .replace(/%25/g, '%2525'),
      )
      // Encode %-signs that are not part of percent encodings left by decodeURI.
      .replace(
        // %3F is '?' that doesn't start a query string.
        // %26 is '&', %23 is '#', %3D is '=', %2F is '/', %25 is '%'
        // All escapes above are not decoded by decodeURI with replaces.
        /%(?!3F)(?!26)(?!23)(?!3D)(?!2F)(?!25)/ig,
        '%25', // %25 is encoded '%'.
      )
      // Encode whitespace.
      .replace(
        /\s/g,
        (_, index, wholeString) => encodeURIComponent(wholeString.charAt(index)),
      );
  };

  const copyUrl = async (url) => {

    const ifToDecode = (await window.apis.storage.get('mode')) === 'decode';
    copyToClipboard(
      ifToDecode
        ? localizeUrl(url)
        : url.replace(/[(){}[\].,;:!?]$/g, (matched, index, wholeString) => `%${matched.charCodeAt(0).toString(16)}`),
    );
  };

  chrome.browserAction.onClicked.addListener(
    ({ url }) => copyUrl(url),
  );

  let seqId = 0;

  const createMenuEntry = (type, title, handler, contexts, opts) => {

    const id = (++seqId).toString();

    chrome.contextMenus.create({
      type,
      id,
      title,
      contexts,
      ...opts,
    }, () => {
      if (chrome.runtime.lastError) {
        // Suppress menus recreation.
      }
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {

      if (info.menuItemId === id) {
        handler(info);
      }
      console.log(info, tab);

    });

  };

  createMenuEntry('radio', 'Encode mode (for legacy software)', (info) => {

      window.apis.storage.set({ mode: 'encode' });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('mode')) === 'encode',
    },
  );

  createMenuEntry('radio', 'Decode mode (to unicode)', (info) => {

      window.apis.storage.set({ mode: 'decode' });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('mode')) === 'decode',
    },
  );

  createMenuEntry('normal', 'Copy unicode URL', (info) => copyUrl(
      info.linkUrl ||
      info.srcUrl ||
      info.frameUrl ||
      info.selectionText ||
      info.pageUrl // Needed?
    ),
    ['link', 'image', 'video', 'audio', 'frame', 'selection'],
  );

})();
