// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Once the message has been posted from the service worker, checks are made to
// confirm the message type and target before proceeding. This is so that the
// module can easily be adapted into existing workflows where secondary uses for
// the document (or alternate offscreen documents) might be implemented.

// Registering this listener when the script is first executed ensures that the
// offscreen document will be able to receive messages when the promise returned
// by `offscreen.createDocument()` resolves.
chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the
// message to a more specific message handler.
async function handleMessages(message) {
  console.log('OD handler invoked with msg:', message);
  if (message.target === 'offscreen-doc') {
    // Dispatch the message to an appropriate handler.
    switch (message.type) {
      case 'copy-data-to-clipboard':
        try {
          handleClipboardWrite(message.data);
          console.log('OD:Copied. Resolving...');
          return Promise.resolve('COPIED_SUCCESSFULLY');
        } finally {
          // Job's done! Close the offscreen document.
          window.close();
        }
        break;
      default:
        console.warn(`Unexpected message type received: '${message.type}'.`);
    }
  }
  console.log('OD:Not copied. Rejecting...');
  return Promise.reject('NOT_COPIED');
}

// We use a <textarea> element for two main reasons:
//  1. preserve the formatting of multiline text,
//  2. select the node's content using this element's `.select()` method.

// Use the offscreen document's `document` interface to write a new value to the
// system clipboard.
//
// At the time this demo was created (Jan 2023) the `navigator.clipboard` API
// requires that the window is focused, but offscreen documents cannot be
// focused. As such, we have to fall back to `document.execCommand()`.
function handleClipboardWrite(data) {
  // Error if we received the wrong kind of data.
  if (typeof data !== 'string') {
    throw new TypeError(
      `Value provided must be a 'string', got '${typeof data}'.`
    );
  }
  // `document.execCommand('copy')` works against the user's selection in a web
  // page. As such, we must insert the string we want to copy to the web page
  // and to select that content in the page before calling `execCommand()`.
  text.value = data;
  text.select();
  document.execCommand('copy');
}