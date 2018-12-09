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
  return decodeURI(u.href.replace(u.hostname, toUnicode(u.hostname)))
    .replace(
      /(\s)/g,
      (index, whole) => encodeURIComponent(whole.charAt(index)),
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
