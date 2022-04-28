globalThis.migrationPromise = new Promise(async (resolve) => {
  console.log('Checking for migrations...');
  const { version, storage } = APIS;
  const dflts = [
    [ 'ifToDecode', true ],
    [ 'ifToDecodeMultipleTimes', false ],
    [ 'ifToEncodeUrlTerminators', true ],
  ];
  const setOptionsAsync = async (options) => {
    await storage.clearAsync();
    await storage.setAsync({ options });
    await storage.setAsync({ version: version.current });
  };
  const ifEmpty = await storage.isEmptyAsync();
  if (ifEmpty) {
    // Initialisation. First install.
    await setOptionsAsync(dflts);
    return resolve();
  }
  // Migration (may be already migrated).
  const oldVersion = await storage.getAsync('version');
  console.log(`Current version is ${version.current}. ${ oldVersion ? `Migrating from ${oldVersion}.` : '' }`);
  let migratedOpts;
  switch(true) {
    case !oldVersion: {
      // Update from version <= 0.0.18.
      const ifSentence = await storage.getAsync('ifToEncodeSentenceTerminators');
      if (ifSentence !== undefined) {
        console.log('Migrating to 0.0.18.');
        await storage.setAsync({ ifToEncodeUrlTerminators: ifSentence });
        await storage.removeAsync('ifToEncodeSentenceTerminators');
      }
      console.log('Migrating to 0.0.19.');
      const allProps = await storage.getAsync();
      // `allProps` looks like `{ 'ifToEncodeSentenceTerminators': true, 'ifFoobar': false }`.
      migratedOpts = dflts.reduce((acc, [ dfltKey, dfltValue ]) => {
        const oldValue = allProps[dfltKey];
        acc.push([ dfltKey, typeof(oldValue) === 'boolean' ? oldValue : dfltValue ]);
        return acc;
      }, []);
    }; // Fallthrough.
    default:
      await setOptionsAsync(migratedOpts || dflts);
  }
  return resolve();
});