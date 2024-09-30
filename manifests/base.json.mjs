export const render = ({ version, edition }) => {
  let localizedSuffix;
  switch (edition) {
    case 'main':
      localizedSuffix = '';
      break;
    case 'test':
      localizedSuffix = ` __MSG_FOR_TESTING__`;
      break;
    default:
      throw new TypeError(`Edition type ${edition} is unknown.`);
  }
  return {
    "manifest_version": 3,

    "default_locale": "en",
    "name": `__MSG_ExtensionName__${localizedSuffix}`,
    "version": `${version}`,
    "description": "__MSG_ExtensionDescription__",
    "homepage_url": "https://github.com/ilyaigpetrov/copy-unicode-urls",
    "icons": {
      "128": "/icons/u-red-128.png"
    },
    "author": "ilyaigpetrov+copy-unicode-urls@gmail.com",

    "action": {
      "default_title":
        `__MSG___ | __MSG_Version__: ${version + localizedSuffix}`,
      "default_popup": "/src/pages/options/index.html"
    },
    "options_ui": {
      "page": "/src/pages/options/index.html"
    },
    "action": {
      "default_title": "__MSG_IconHint__",
      "default_icon": "./icons/u-red-128.png"
    },
    "commands": {
      "_execute_action": {
        "suggested_key": {
          "default": "Alt+U"
        }
      }
    }
  };
};