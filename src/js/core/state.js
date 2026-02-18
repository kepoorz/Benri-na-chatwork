import { logger } from '../utils/logging/logger.js';

const log = logger.withContext('State');

export const state = {
  filterEnabled: true,
  threadEnabled: true,
  settings: { logLevel: 'INFO' },
};

export function loadState() {
  return new Promise((resolve, reject) => {
    try {
      log.time('loadState');
      chrome.storage.sync.get(
        { filterFeature: true, threadFeature: true, settings: { logLevel: 'INFO' } },
        (items) => {
          const error = chrome.runtime.lastError;
          if (error) {
            log.timeEnd('loadState');
            reject(error);
            return;
          }
          state.filterEnabled = items.filterFeature;
          state.threadEnabled = items.threadFeature;
          state.settings = items.settings || { logLevel: 'INFO' };
          if (state.settings.logLevel && logger.setLogLevel) {
            logger.setLogLevel(state.settings.logLevel);
          }
          log.info('設定読み込み完了', { filterEnabled: state.filterEnabled });
          log.timeEnd('loadState');
          resolve(state);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

export function saveFeatureState(enabled) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ filterFeature: enabled }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
        return;
      }
      state.filterEnabled = enabled;
      log.info('フィーチャー状態を保存', { enabled });
      resolve();
    });
  });
}
