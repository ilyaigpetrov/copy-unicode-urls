/*
1) We can't have several active offsceen documents at the same moment
because otherwise it's not clear who should respond to the copy
request.
2) We can't reuse existing ODs because they may be closed by their
opener before we manage to copy data to the clipboard.
3) We must close the OD after copying is done because it eats about
90MB of RAM.
*/
let PREVIOUS_OD_CLOSING = Promise.resolve();
const OFFSCREEN_DOC_PATH = '/src/lib/offscreen-doc-for-copying.html';

export const copyToClipboardAsync = async (copyMe) => {
  console.log('Going to copy this url:', copyMe);
  try {
    console.log('Trying `navigator.clipboard`...');
    return await navigator.clipboard.writeText(copyMe);
  } catch(e) {
    console.log('Got error while copying attempt:', e);
    if (globalThis.document) {
      console.log('Trying `document.execCommand`...');
      const area = document.createElement('textarea');
      area.value = copyMe;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      return;
    }
    console.log('Trying `chrome.offscreen`...');
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOC_PATH);
    console.log(`Waiting for the previous OD to close...`);
    await PREVIOUS_OD_CLOSING;
    console.log('Creating new offscreen document for:', offscreenUrl);
    const openingNewOD = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'To copy URL as Unicode from the address bar into the clipboard.',
    });
    await openingNewOD;
    console.log('New offscreen document created. Sending a message to it...');
    const sending = chrome.runtime.sendMessage({
      type: 'copy-data-to-clipboard',
      target: 'offscreen-doc',
      data: copyMe,
    });
    const resp = await sending;
    // For some reason the resp is always undefined in Chrome.
    console.log(`The OD replied with: ${resp}`);
    return PREVIOUS_OD_CLOSING = chrome.offscreen.closeDocument();
  }
};