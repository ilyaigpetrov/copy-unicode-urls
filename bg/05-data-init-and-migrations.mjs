globalThis.migrationPromise = new Promise(async (resolve) => {
  console.log('Checking for migrations...');
  const { version, storage } = globalThis.APIS;
  const dflts = {
    options: [
      [ 'ifToDecode', true ],
      [ 'ifToDecodeMultipleTimes', false ],
      [ 'ifToEncodeUrlTerminators', true ],
    ],
    donateUrl: 'https://rebrand.ly/ilya-donate',
  };
  const ifEmpty = await storage.isEmptyAsync();
  if (ifEmpty) {
    // Initialisation. First install.
    await storage.setAsync({
      ...dflts,
      version: version.current,
    });
    return resolve();
  }
  // Migration (may be already migrated).
  console.log(`Current extension version is ${version.current}.`);
  const oldVersion = await storage.getAsync('version');
  const ifNoNeedToMigrate = oldVersion === version.current;
  if (ifNoNeedToMigrate) {
    return resolve();
  }
  console.log(`Migrating to ${version.current} from ${oldVersion || 'a very old version'}.`);
  switch(true) {
    case !oldVersion: {
      // Update from version <= 0.0.18.
      const ifSentence = await storage.getAsync('ifToEncodeSentenceTerminators');
      if (ifSentence !== undefined) {
        console.log('Migrating to 0.0.18.');
        await storage.setAsync({
          ifToEncodeUrlTerminators: ifSentence,
        });
        await storage.removeAsync('ifToEncodeSentenceTerminators')
      }
    }; // Fallthrough.
    case version.isLeq(oldVersion, '0.0.18'): {
      console.log('Migrating to >= 0.0.19.');
      const oldState = await storage.getAsync();
      // `oldState` looks like `{ 'ifToEncodeSentenceTerminators': true, 'ifFoobar': false }`.
      const migratedOpts = dflts.options.reduce((acc, [ dfltKey, dfltValue ]) => {
        const oldValue = oldState[dfltKey];
        acc.push([ dfltKey, typeof(oldValue) === 'boolean' ? oldValue : dfltValue ]);
        return acc;
      }, []);
      await storage.clearAsync();
      await storage.setAsync({ ...dflts, options: migratedOpts });
    }; // Fallthrough.
    default:
      await storage.setAsync({ version: version.current });
  }
  return resolve();
});
