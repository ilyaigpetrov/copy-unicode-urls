window.migrationPromise = new Promise(async (resolve) => {
  console.log('Checking for migrations...');

  const version = window.apis.version;
  const storage = window.apis.storage;

  const oldVersion = await storage.get('version');
  console.log(`Current version is ${version.current}. Migrating from ${oldVersion}.`);
  if (!oldVersion) {
    // First intsall or update from version < 0.0.19.
    const ifSentence = await storage.get('ifToEncodeSentenceTerminators');
    if (ifSentence !== undefined) {
      console.log('Migrating to 0.0.18.');
      await storage.set({ ifToEncodeUrlTerminators: ifSentence });
      await storage.remove('ifToEncodeSentenceTerminators');
    }
    await storage.set({ version: '0.0.18' });
  }
  if (version.isLeq('0.0.18')) {
    console.log('Migrating to 0.0.19.');
    const allProps = await storage.get();
    await storage.remove();
    delete allProps.version;
    await storage.set({
      options: allProps,
    });
  }
  await storage.set({ version: version.current });
  resolve();
});
