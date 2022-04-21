import { toUnicode } from '../node_modules/punycode/punycode.es6.js';

(async () => {
  await window.migrationPromise;
  console.log('Migration is over. Main bg starts.');

  const optsSource = {
    ifToDecode: { dflt: true, order: 0 },
    ifToEncodeUrlTerminators: { dflt: true, order: 1 },
    ifToDecodeMultipleTimes: { dflt: false, order: 2 },
  };
  const os = optsSource;
  const sortedOptsKeys = Object.keys(os).sort((keyA, keyB) => os[keyA].order - os[keyB].order);

  const defaults = sortedOptsKeys.reduce(
    (acc, key) => Object.assign(
      acc,
      { [key]: os[key].dflt },
    ),
    {},
  );

  const oldOpts = await window.apis.storage.get('options');
  const opts = Object.assign(
    {},
    defaults,
    oldOpts ? JSON.parse(oldOpts) : {},
  );

  const copyToClipboardAsync = async (str) => {
    try {
      return await navigator.clipboard.writeText(str);
    } catch {
      const area = document.createElement('textarea');
      area.value = str;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
  };

  const localizeUrl = (url) => {

    let u;
    try {
      u = new URL(url);
    } catch {
      u = new URL(`http://${url}`);
    }
    let newHref = u.href
    let oldHref;
    do {
      oldHref = newHref;
      newHref = decodeURI(newHref
        .replace(u.hostname, toUnicode(u.hostname)),
      )
      // Encode whitespace.
      .replace(
        /\s/g,
        (_, index, wholeString) => encodeURIComponent(wholeString.charAt(index)),
      );
    } while (opts.ifToDecodeMultipleTimes && oldHref !== newHref);
    return newHref;
  };

  const copyUrl = async (url) => {

    if (opts.ifToDecode) {
      url = localizeUrl(url);
    }
    if (opts.ifToEncodeUrlTerminators) {
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
    copyToClipboardAsync(url);
  };

  chrome.browserAction.onClicked.addListener(
    ({ url }) => copyUrl(url),
  );

  const createMenuEntry = (id, type, title, handler, contexts, rest) => {

    chrome.contextMenus.create({
      type,
      id,
      title,
      contexts,
      ...rest,
    }, () => {
      if (chrome.runtime.lastError) {
        // Suppress menus recreation.
      }
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {

      if (info.menuItemId === id) {
        handler(info);
      }

    });

  };

  createMenuEntry('copyUrlFromTheAddressBar', 'normal', chrome.i18n.getMessage('copyUrlFromTheAddressBar'), (info) => copyUrl(
      info.pageUrl,
    ),
    ['all'],
  );

  // CheckBoxes

  sortedOptsKeys.forEach((key) =>
    createMenuEntry(key, 'checkbox', chrome.i18n.getMessage(key), (info) => {

        opts[key] = info.checked;
        window.apis.storage.set({ options: JSON.stringify(opts) });
      },
      ['browser_action'],
      {
        checked: opts[key] === true,
      },
    ),
  );

  // /CheckBoxes

  createMenuEntry('donate', 'normal', chrome.i18n.getMessage('donate'), (info) => {
      chrome.tabs.create({ url: 'https://ilyaigpetrov.page.link/copy-unicode-urls-donate' });
    },
    ['browser_action'],
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

  createMenuEntry('copyHighlightLink', 'normal', chrome.i18n.getMessage('copyUnicodeLinkToHighlight'), (info) => {
    copyUrl(`${info.pageUrl.replace(/#.*/g, '')}#:~:text=${info.selectionText}`);
  },
  ['selection'],
);

})();
