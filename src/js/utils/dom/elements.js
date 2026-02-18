/**
 * elements.js - DOM要素操作のためのユーティリティ
 */

import { logger } from '../logging/logger.js';

/**
 * 要素の親要素チェーンを取得
 * @param {HTMLElement} element - 要素
 * @param {number} maxDepth - 最大の深さ (デフォルト: 5)
 * @returns {Array} - 親要素のリスト
 */
export function getParentChain(element, maxDepth = 5) {
  try {
    const chain = [];
    let current = element;
    let depth = 0;

    while (current && depth < maxDepth) {
      chain.push({
        tag: current.tagName,
        id: current.id || null,
        classes: Array.from(current.classList || []).join(', ') || null,
      });
      current = current.parentElement;
      depth++;
    }

    return chain;
  } catch (error) {
    logger.error('親要素チェーン取得エラー:', error);
    return [];
  }
}

/**
 * さまざまなセレクタを試して要素を見つける
 * @param {Array<string>} selectors - 試すセレクタの配列
 * @returns {HTMLElement|null} - 見つかった要素またはnull
 */
export function findElementBySelectors(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        logger.debug(`セレクタで要素を見つけました: ${selector}`);
        return element;
      }
    } catch (error) {
      logger.debug(`セレクタ ${selector} のエラー:`, error);
    }
  }
  logger.debug('指定されたセレクタで要素が見つかりません', { selectors });
  return null;
}

/**
 * 要素のサニタイズを行う
 * @param {string} html - サニタイズするHTML文字列
 * @returns {string} - サニタイズされたHTML
 */
export function sanitizeHtml(html) {
  // スクリプトタグやイベントハンドラーを除去
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * 要素をクローンしてサニタイズする
 * @param {HTMLElement} element - クローンする要素
 * @returns {HTMLElement} - サニタイズされたクローン
 */
export function cloneAndSanitize(element) {
  try {
    const clone = element.cloneNode(true);
    const sanitizedHtml = sanitizeHtml(clone.outerHTML);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;
    return tempDiv.firstChild;
  } catch (error) {
    logger.error('要素のクローン作成エラー:', error);
    throw error;
  }
}

/**
 * DOMが準備できたかを確認する
 * @param {Function} callback - DOMが準備できた時に実行するコールバック
 * @param {Object} options - オプション
 * @param {Array<string>} options.timeLineSelectors - タイムライン要素を探すセレクタ
 * @param {Array<string>} options.roomListSelectors - ルームリスト要素を探すセレクタ
 * @param {number} options.retryInterval - 再試行間隔（ミリ秒）
 * @param {number} options.maxRetries - 最大再試行回数
 */
export function waitForDomReady({
  callback,
  timeLineSelectors = [
    '#_timeLine',
    '.sc-fKMpNL',
    '.timeLineArea',
    '[data-testid="timeline-area"]',
  ],
  roomListSelectors = [
    '#_roomListArea',
    '#RoomList',
    '#_chatListArea',
    '[data-testid="room-list"]',
  ],
  retryInterval = 500,
  maxRetries = 10,
} = {}) {
  let attempt = 0;

  function checkDomReady() {
    // タイムライン要素とルームリスト要素をチェック
    const timeLineElement = findElementBySelectors(timeLineSelectors);
    const roomListElement = findElementBySelectors(roomListSelectors);

    // デバッグ情報
    const debugInfo = {
      timeLineElement: timeLineElement ? true : false,
      timeLineSelector: timeLineElement
        ? timeLineElement.tagName + (timeLineElement.id ? '#' + timeLineElement.id : '')
        : null,
      roomListElement: roomListElement ? true : false,
      roomListSelector: roomListElement
        ? roomListElement.tagName + (roomListElement.id ? '#' + roomListElement.id : '')
        : null,
    };

    logger.debug('DOM要素チェック', debugInfo);

    if (timeLineElement || roomListElement) {
      logger.info('DOM要素の準備が完了しました。初期化を実行します...');
      callback();
    } else {
      attempt++;
      if (attempt < maxRetries) {
        logger.debug(`DOM要素がまだ準備できていません。再試行します... (${attempt}/${maxRetries})`);
        setTimeout(checkDomReady, retryInterval);
      } else {
        logger.warn(
          `最大再試行回数(${maxRetries})に達しました。DOMの準備ができていない可能性があります。`
        );
      }
    }
  }

  // 初回の確認は少し遅らせて実行
  setTimeout(checkDomReady, retryInterval);
}
