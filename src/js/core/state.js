import { logger } from '../utils/logging/logger.js';

const log = logger.withContext('State');

export const state = {
  threadEnabled: true,
  settings: { logLevel: 'INFO' },
};

export function loadState() {
  return new Promise((resolve, reject) => {
    try {
      log.time('loadState');
      chrome.storage.sync.get({ threadFeature: true, settings: { logLevel: 'INFO' } }, (items) => {
        const error = chrome.runtime.lastError;
        if (error) {
          log.timeEnd('loadState');
          reject(error);
          return;
        }
        state.threadEnabled = items.threadFeature;
        state.settings = items.settings || { logLevel: 'INFO' };
        if (state.settings.logLevel && logger.setLogLevel) {
          logger.setLogLevel(state.settings.logLevel);
        }
        log.info('設定読み込み完了', { threadEnabled: state.threadEnabled });
        log.timeEnd('loadState');
        resolve(state);
      });
    } catch (error) {
      reject(error);
    }
  });
}
