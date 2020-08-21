window.migrationPromise = new Promise(async (resolve) => {
  console.log('Checking for migrations...');
  const ifSentence = await window.apis.storage.get('ifToEncodeSentenceTerminators');
  if (ifSentence !== undefined) {
    console.log('Migrate to ')
    await window.apis.storage.set({ ifToEncodeUrlTerminators: ifSentence });
    await window.apis.storage.remove('ifToEncodeSentenceTerminators');
  }
  resolve();
});
