import { DEFAULT_FILTER_BUTTONS } from './constants.js';
import { logger } from '../../utils/logging/logger.js';
import { deepCopy } from '../../utils/common.js';

const log = logger.withContext('FilterState');

let filterButtons = [];

export function getFilterButtons() {
  return filterButtons;
}

export function loadFilterState() {
  return new Promise((resolve, reject) => {
    try {
      log.time('loadFilterState');
      chrome.storage.sync.get({ filterButtons: null }, (items) => {
        const error = chrome.runtime.lastError;
        if (error) {
          log.error('フィルター状態読み込みエラー', error);
          log.timeEnd('loadFilterState');
          reject(error);
          return;
        }
        if (items.filterButtons) {
          filterButtons = items.filterButtons;
          log.info('フィルター状態を読み込みました', { count: filterButtons.length });
        } else {
          filterButtons = deepCopy(DEFAULT_FILTER_BUTTONS);
          log.info('デフォルトのフィルター設定を使用します');
        }
        log.timeEnd('loadFilterState');
        resolve(filterButtons);
      });
    } catch (error) {
      log.error('フィルター状態読み込み例外', error);
      reject(error);
    }
  });
}

export function saveFilterState() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ filterButtons }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        log.error('フィルター状態保存エラー', error);
        reject(error);
        return;
      }
      log.debug('フィルター状態を保存しました');
      resolve();
    });
  });
}

export function toggleFilter(filterId) {
  const btn = filterButtons.find((b) => b.id === filterId);
  if (!btn) return;
  btn.active = !btn.active;
  log.info('フィルタートグル', { id: filterId, label: btn.label, active: btn.active });
  saveFilterState();
  return btn.active;
}

export function addRoomToFilter(filterId, roomId) {
  const btn = filterButtons.find((b) => b.id === filterId);
  if (!btn) return;
  if (!btn.roomIds.includes(roomId)) {
    btn.roomIds.push(roomId);
    log.debug('ルーム追加', { filterId, roomId, total: btn.roomIds.length });
    saveFilterState();
  }
}

export function removeRoomFromFilter(filterId, roomId) {
  const btn = filterButtons.find((b) => b.id === filterId);
  if (!btn) return;
  const idx = btn.roomIds.indexOf(roomId);
  if (idx !== -1) {
    btn.roomIds.splice(idx, 1);
    log.debug('ルーム削除', { filterId, roomId, total: btn.roomIds.length });
    saveFilterState();
  }
}

export function updateFilterButton(filterId, updates) {
  const btn = filterButtons.find((b) => b.id === filterId);
  if (!btn) return;
  if (updates.label !== undefined) btn.label = updates.label;
  if (updates.emoji !== undefined) btn.emoji = updates.emoji;
  log.debug('フィルターボタン更新', { filterId, updates });
  saveFilterState();
}

export function getActiveFilters() {
  return filterButtons.filter((b) => b.active);
}

export function resetToDefaults() {
  filterButtons = deepCopy(DEFAULT_FILTER_BUTTONS);
  log.info('フィルターをデフォルトにリセットしました');
  return saveFilterState();
}
