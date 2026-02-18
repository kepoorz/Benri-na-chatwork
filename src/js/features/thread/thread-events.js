// スレッドイベント管理 - 返信インジケータクリックでスレッドパネルを表示

import { THREAD_SELECTORS } from './constants.js';
import { openThread, setChain } from './state.js';
import { buildThreadChain } from './thread-chain.js';
import { showThreadPanel, hideThreadPanel } from './thread-panel.js';
import { getCurrentRoomId } from './api.js';
import { findElementBySelectors } from '../../utils/dom/elements.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('ThreadEvents');

let timelineClickHandler = null;

/**
 * タイムライン上の返信インジケータクリックを監視
 */
export function setupThreadEvents() {
  const timeLine = findElementBySelectors(THREAD_SELECTORS.timeLine);
  if (!timeLine) {
    log.warn('タイムライン要素が見つかりません。スレッドイベント未設定。');
    return;
  }

  timelineClickHandler = async (e) => {
    // 返信インジケータ（.chatTimeLineReply[data-mid]）のクリックを検出
    const replyEl = e.target.closest(
      '.chatTimeLineReply[data-rid][data-mid], ._replyMessage[data-rid][data-mid]'
    );
    if (!replyEl) return;

    const anchorMid = replyEl.dataset.mid;
    const anchorRid = replyEl.dataset.rid;
    if (!anchorMid) return;

    // クリック元メッセージのIDを取得（replyEl自身をスキップして親の_message要素を探す）
    const messageEl = replyEl.parentElement?.closest('[data-mid]');
    const clickedMid = messageEl ? messageEl.dataset.mid : null;

    const roomId = anchorRid || getCurrentRoomId();
    if (!roomId) {
      log.warn('ルームIDを特定できません');
      return;
    }

    log.info('返信インジケータクリック', { anchorMid, clickedMid, roomId });

    // 状態更新
    openThread(roomId, anchorMid);

    // スレッドチェーン構築
    try {
      const chain = await buildThreadChain(roomId, anchorMid, clickedMid);
      setChain(chain);
      showThreadPanel(chain, anchorMid);
    } catch (error) {
      log.error('スレッドチェーン構築エラー', error);
    }
  };

  timeLine.addEventListener('click', timelineClickHandler);
  log.info('スレッドイベントをセットアップしました');
}

/**
 * イベントリスナーを解除
 */
export function teardownThreadEvents() {
  if (timelineClickHandler) {
    const timeLine = findElementBySelectors(THREAD_SELECTORS.timeLine);
    if (timeLine) {
      timeLine.removeEventListener('click', timelineClickHandler);
    }
    timelineClickHandler = null;
  }
  hideThreadPanel();
  log.info('スレッドイベントを解除しました');
}
