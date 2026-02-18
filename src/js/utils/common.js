/**
 * common.js - 共通ユーティリティ関数
 */

/**
 * ランダムなIDを生成
 * @param {string} prefix - IDのプレフィックス（デフォルト: 'cw'）
 * @returns {string} - 生成されたID
 */
export function generateId(prefix = 'cw') {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * 指定時間待機するPromiseを返す
 * @param {number} ms - 待機時間（ミリ秒）
 * @returns {Promise} - 指定時間後に解決するPromise
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 指定した関数を一定間隔で実行を試みる
 * @param {Function} fn - 実行する関数
 * @param {number} interval - 試行間隔（ミリ秒）
 * @param {number} maxAttempts - 最大試行回数
 * @returns {Promise} - 関数の実行結果を解決するPromise
 */
export async function retry(fn, interval = 500, maxAttempts = 5) {
  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;
      if (attempt >= maxAttempts) {
        break;
      }
      await sleep(interval);
    }
  }

  throw new Error(
    `最大試行回数(${maxAttempts})に達しました: ${lastError?.message || '不明なエラー'}`
  );
}

/**
 * オブジェクトのディープコピーを作成
 * @param {Object} obj - コピーするオブジェクト
 * @returns {Object} - コピーされたオブジェクト
 */
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} - デバウンスされた関数
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * スロットル関数
 * @param {Function} func - 実行する関数
 * @param {number} limit - 制限時間（ミリ秒）
 * @returns {Function} - スロットルされた関数
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
