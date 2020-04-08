import { toUnicode } from './node_modules/punycode/punycode.es6.js';

(async () => {
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
  };

  if ((await window.apis.storage.get('ifToDecode')) === undefined) {
    await window.apis.storage.set({ ifToDecode: true });
  }

  if ((await window.apis.storage.get('ifToEncodeSentenceTerminators')) === undefined) {
    await window.apis.storage.set({ ifToEncodeSentenceTerminators: false });
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
        .replace(u.hostname, toUnicode(u.hostname)),
      )
      // Encode whitespace.
      .replace(
        /\s/g,
        (_, index, wholeString) => encodeURIComponent(wholeString.charAt(index)),
      );
  };

  const copyUrl = async (url) => {

    const ifToDecode = (await window.apis.storage.get('ifToDecode'));
    const ifToEncodeSentenceTerminators = (await window.apis.storage.get('ifToEncodeSentenceTerminators'));
    if (ifToDecode) {
      url = localizeUrl(url);
    }
    if (ifToEncodeSentenceTerminators) {
      url = url.replace(/[(){}[\].,;:!?]$/g, (matched, index, wholeString) => `%${matched.charCodeAt(0).toString(16).toUpperCase()}`);
    }
    copyToClipboard(url);
  };

  chrome.browserAction.onClicked.addListener(
    ({ url }) => copyUrl(url),
  );

  const createMenuEntry = (id, type, title, handler, contexts, opts) => {

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

  createMenuEntry('ifToDecode', 'checkbox', 'If to decode', (info) => {

      window.apis.storage.set({ ifToDecode: info.checked });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('ifToDecode')) === true,
    },
  );

  createMenuEntry('ifToEncodeSentenceTerminators', 'checkbox', 'If to encode sentence terminators', (info) => {

      window.apis.storage.set({ ifToEncodeSentenceTerminators: info.checked });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('ifToEncodeSentenceTerminators')) === true,
    },
  );

  createMenuEntry('donate', 'normal', 'Donate ❤', (info) => {
      chrome.tabs.create({ url: 'https://ilyaigpetrov.page.link/copy-unicode-urls-donate' });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('ifToEncodeSentenceTerminators')) === true,
    },
  );

  createMenuEntry('copyUrl', 'normal', 'Copy unicode URL', (info) => copyUrl(
      info.linkUrl ||
      info.srcUrl ||
      info.frameUrl ||
      info.selectionText ||
      info.pageUrl // Needed?
    ),
    ['link', 'image', 'video', 'audio', 'frame', 'selection'],
  );

})();
