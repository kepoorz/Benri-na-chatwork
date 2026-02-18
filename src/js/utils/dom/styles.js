/**
 * styles.js - スタイル操作のためのユーティリティ
 */

import { logger } from '../logging/logger.js';

/**
 * スタイルシートをDOMに追加
 * @param {string} cssText - CSSスタイルのテキスト
 * @returns {HTMLStyleElement} - 追加されたスタイル要素
 */
export function addStyles(cssText) {
  try {
    // 既存のスタイル要素を検索
    const existingStyle = document.querySelector('style[data-extension="benri-na-chatwork"]');

    // 既存の要素があれば更新、なければ新規作成
    if (existingStyle) {
      existingStyle.textContent = cssText;
      logger.debug('既存のスタイル要素を更新しました');
      return existingStyle;
    } else {
      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.setAttribute('data-extension', 'benri-na-chatwork');
      style.textContent = cssText;
      document.head.appendChild(style);
      logger.debug('新しいスタイル要素を追加しました');
      return style;
    }
  } catch (error) {
    logger.error('スタイル追加エラー:', error);
    throw error;
  }
}

/**
 * 拡張機能のスタイルを削除
 */
export function removeStyles() {
  try {
    const style = document.querySelector('style[data-extension="benri-na-chatwork"]');
    if (style) {
      style.remove();
      logger.debug('スタイル要素を削除しました');
    }
  } catch (error) {
    logger.error('スタイル削除エラー:', error);
  }
}
