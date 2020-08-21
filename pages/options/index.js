'use strict';

chrome.runtime.getBackgroundPage((bgWindow) => {

  chrome.storage.local.get(null, (storage) => {
    ifToDecode.checked = storage.ifToDecode;
    ifToEncodeUrlTerminators.checked = storage.ifToEncodeUrlTerminators;
  });
  ifToDecode.onclick = ({ target }) => {
    chrome.storage.local.set({ ifToDecode: target.checked });
    chrome.contextMenus.update('ifToDecode', { checked: target.checked });
  };
  ifToEncodeUrlTerminators.onclick = ({ target }) => {
    chrome.storage.local.set({ ifToEncodeUrlTerminators: target.checked });
    chrome.contextMenus.update('ifToEncodeUrlTerminators', { checked: target.checked });
  };

});

const textElements = document.querySelectorAll('[data-localize]');
textElements.forEach((e) => {
  const ref = e.dataset.localize;
  if (ref) {
     const translated= ref.replace(/__MSG_(\w+)__/g, (match, theGroup) => chrome.i18n.getMessage(theGroup));
    if (translated) {
      e.innerText = translated;
    }
  }
});

