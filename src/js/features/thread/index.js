// スレッドパネル機能エントリーポイント

import { setupThreadEvents, teardownThreadEvents } from './thread-events.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('Thread');

export async function setupThreadFeature() {
  log.time('setupThreadFeature');
  log.info('スレッド機能をセットアップ中...');
  try {
    setupThreadEvents();
    log.info('スレッド機能セットアップ完了');
  } catch (error) {
    log.error('スレッド機能セットアップエラー', error);
  }
  log.timeEnd('setupThreadFeature');
}

export function disableThreadFeature() {
  teardownThreadEvents();
  log.info('スレッド機能を無効化しました');
}
