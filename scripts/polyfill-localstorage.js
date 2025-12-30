// Dev-only polyfill for localStorage when running Next in Node (server-side)
// This file is intended to be preloaded with `node -r ./scripts/polyfill-localstorage.js ...`

if (typeof window === 'undefined' && !global.localStorage) {
  try {
    const { LocalStorage } = require('node-localstorage');
    const path = require('path');
    // store server-side localStorage data in project root (dev only)
    const storagePath = path.resolve(process.cwd(), '.server_localstorage');
    // Create LocalStorage instance and assign to global
    global.localStorage = new LocalStorage(storagePath);
  } catch (e) {
    // If node-localstorage isn't installed or something else fails, log a warning
    // eslint-disable-next-line no-console
    console.warn('polyfill-localstorage: could not initialize node-localstorage:', e && e.message ? e.message : e);
  }
}

module.exports = {};
