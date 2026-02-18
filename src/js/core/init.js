import { state, loadState } from './state.js';
import { logger } from '../utils/logging/logger.js';
import { waitForDomReady } from '../utils/dom/elements.js';
import { setupThreadFeature, disableThreadFeature } from '../features/thread/index.js';

const log = logger.withContext('Init');

export async function initialize() {
  log.time('initialize');
  log.info('初期化開始...');
  try {
    await loadState();
    if (state.threadEnabled) {
      setupThreadFeature();
    }
    setupMessageListeners();
    log.info('初期化完了');
  } catch (error) {
    log.error('初期化エラー', error);
  }
  log.timeEnd('initialize');
}

function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message) => {
    log.debug('メッセージ受信', { action: message.action });
    if (message.action === 'toggleThreadFeature') {
      state.threadEnabled = message.enabled;
      if (message.enabled) {
        setupThreadFeature();
      } else {
        disableThreadFeature();
      }
    }
  });
}

export function initOnChatworkPage() {
  if (window.location.hostname.includes('chatwork.com')) {
    log.info('ChatWorkページ検出。初期化開始...');
    waitForDomReady({ callback: initialize, retryInterval: 500, maxRetries: 10 });
  }
}
