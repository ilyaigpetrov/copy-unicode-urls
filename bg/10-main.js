import { toUnicode } from '../node_modules/punycode/punycode.es6.js';

(async () => {
  await window.migrationPromise;
  console.log('Migration is over. Main bg starts.');

  if ((await window.apis.storage.get('ifToDecode')) === undefined) {
    await window.apis.storage.set({ ifToDecode: true });
  }

  if ((await window.apis.storage.get('ifToEncodeUrlTerminators')) === undefined) {
    await window.apis.storage.set({ ifToEncodeUrlTerminators: true });
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
    const ifToEncodeUrlTerminators = (await window.apis.storage.get('ifToEncodeUrlTerminators'));
    if (ifToDecode) {
      url = localizeUrl(url);
    }
    if (ifToEncodeUrlTerminators) {
      /*
        Issue #7.
        Thunderbird sources:
        https://searchfox.org/comm-central/source/mozilla/netwerk/streamconv/converters/mozTXTToHTMLConv.cpp#281 (mozTXTToHTMLConv::FindURLEnd)
        These chars terminate the URL: ><"`}{)]`
        These sequence doesn't terminate the URL: //[ (e.g. http://[1080::...)
        These chars are not allowed at the end of the URL: .,;!?-:'
        I apply slightly more strict rules below.
      **/
      url = url.replace(/(?:[<>{}()[\]"`']|[.,;:!?-]$)/g, (matched, index, wholeString) => `%${matched.charCodeAt(0).toString(16).toUpperCase()}`);
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

  createMenuEntry('ifToDecode', 'checkbox', chrome.i18n.getMessage('ifToDecode'), (info) => {

      window.apis.storage.set({ ifToDecode: info.checked });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('ifToDecode')) === true,
    },
  );

  createMenuEntry('ifToEncodeUrlTerminators', 'checkbox', chrome.i18n.getMessage('ifToEncodeUrlTerminators'), (info) => {

      window.apis.storage.set({ ifToEncodeUrlTerminators: info.checked });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('ifToEncodeUrlTerminators')) === true,
    },
  );

  createMenuEntry('donate', 'normal', chrome.i18n.getMessage('donate'), (info) => {
      chrome.tabs.create({ url: 'https://ilyaigpetrov.page.link/copy-unicode-urls-donate' });
    },
    ['browser_action'],
    {
      checked: (await window.apis.storage.get('ifToEncodeUrlTerminators')) === true,
    },
  );

  createMenuEntry('copyUrl', 'normal', chrome.i18n.getMessage('copyUnicodeUrl'), (info) => copyUrl(
      info.linkUrl ||
      info.srcUrl ||
      info.frameUrl ||
      info.selectionText ||
      info.pageUrl // Needed?
    ),
    ['link', 'image', 'video', 'audio', 'frame', 'selection'],
  );

})();
