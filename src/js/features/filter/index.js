import { loadFilterState } from './state.js';
import { createFilterTileGrid, setupTileEvents, destroyFilterTileGrid } from './tiles.js';
import { clearAllFilters, stopObserver } from './filter-logic.js';
import { hideEmojiPicker } from './emoji-picker.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('Filter');

export async function setupFilterFeature() {
  log.time('setupFilterFeature');
  log.info('フィルター機能をセットアップ中...');
  try {
    await loadFilterState();
    createFilterTileGrid();
    setupTileEvents();
    log.info('フィルター機能セットアップ完了');
  } catch (error) {
    log.error('フィルター機能セットアップエラー', error);
  }
  log.timeEnd('setupFilterFeature');
}

export function disableFilterFeature() {
  clearAllFilters();
  stopObserver();
  hideEmojiPicker();
  destroyFilterTileGrid();
  log.info('フィルター機能を無効化しました');
}
