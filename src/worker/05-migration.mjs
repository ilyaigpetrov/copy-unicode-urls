globalThis.migrationPromise = new Promise(async (resolve) => {
  console.log('Checking for migrations...');
  const ifSentence = await globalThis.apis.storage.get('ifToEncodeSentenceTerminators');
  if (ifSentence !== undefined) {
    console.log('Migrating to the new version');
    await globalThis.apis.storage.set({ ifToEncodeUrlTerminators: ifSentence });
    await globalThis.apis.storage.remove('ifToEncodeSentenceTerminators');
  }
  resolve();
});
