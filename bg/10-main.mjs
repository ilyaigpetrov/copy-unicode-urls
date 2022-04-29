import { toUnicode } from '../../node_modules/punycode/punycode.es6.js';

(async () => {
  await globalThis.migrationPromise;
  console.log('Migration is over. Main bg/worker starts.');

  const { storage } = globalThis.APIS;
  const options = await storage.getAsync('options');
  const getOpt = (key) => (options.find((el) => el[0] === key)[1]);

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
    } while (getOpt('ifToDecodeMultipleTimes') && oldHref !== newHref);
    return newHref;
  };

  const copyUrl = async (url) => {

    if (getOpt('ifToDecode')) {
      url = localizeUrl(url);
    }
    if (getOpt('ifToEncodeUrlTerminators')) {
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
  
  options.forEach(([ key, value ], i) =>
    createMenuEntry(key, 'checkbox', chrome.i18n.getMessage(key), (info) => {

        options[i] = [ key, info.checked ];
        storage.setAsync({ options });
      },
      ['browser_action'],
      {
        checked: value === true,
      },
    ),
  );

  // /CheckBoxes

  createMenuEntry('donate', 'normal', chrome.i18n.getMessage('donate'), async (info) => {
      chrome.tabs.create({ url: await storage.getAsync('donateUrl') });
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
