import { toUnicode } from './node_modules/punycode/punycode.es6.js';

console.log('Extension started successfully.');

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

const copyLocalizedUrl = (url) => copyToClipboard(localizeUrl(url));

chrome.browserAction.onClicked.addListener(
  ({ url }) => copyLocalizedUrl(url),
);

{

  let seqId = 0;

  const createMenuEntry = (title, handler, contexts, opts) => {

    const id = (++seqId).toString();

    chrome.contextMenus.create({
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
        copyLocalizedUrl(
          info.linkUrl ||
          info.srcUrl ||
          info.frameUrl ||
          info.selectionText ||
          info.pageUrl // Needed?
        );
      }
      console.log(info, tab);

    });

  };

  createMenuEntry('Copy unicode URL', console.log,
    ['link', 'image', 'video', 'audio', 'frame', 'selection'],
  );

}
