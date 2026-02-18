/**
 * index.js - ユーティリティのエントリーポイント
 *
 * このファイルはユーティリティモジュール全体のエントリーポイントとして機能します。
 */

// ログ関連ユーティリティをエクスポート
export { logger } from './logging/logger.js';

// DOM操作ユーティリティをエクスポート
export * from './dom/index.js';

// 共通ユーティリティをエクスポート
export * from './common.js';
