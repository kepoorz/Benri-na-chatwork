// スレッドチェーン構築 - 返信元を再帰的に辿りメッセージチェーンを構築

import { THREAD_CONFIG } from './constants.js';
import { fetchMessageById } from './api.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('ThreadChain');

/**
 * 指定メッセージから返信チェーンを構築（最大maxChainDepth件）
 * アンカーメッセージ自身を含め、返信元を遡る
 *
 * @param {string} roomId - ルームID
 * @param {string} anchorMid - アンカーメッセージID（クリックされた返信参照の対象）
 * @param {string} clickedMid - クリック元メッセージID（返信参照を含むメッセージ）
 * @returns {Promise<Array>} - 時系列順のメッセージデータ配列
 */
export async function buildThreadChain(roomId, anchorMid, clickedMid) {
  log.time('buildThreadChain');
  const chain = [];
  const visited = new Set();
  const maxDepth = THREAD_CONFIG.maxChainDepth;

  // アンカーメッセージ（返信先）から遡る
  let currentMid = anchorMid;

  while (currentMid && chain.length < maxDepth && !visited.has(currentMid)) {
    visited.add(currentMid);
    const msg = await fetchMessageById(roomId, currentMid);
    if (!msg) {
      log.warn('メッセージ取得失敗、チェーン構築中断', { mid: currentMid });
      break;
    }
    chain.unshift(msg); // 先頭に追加（古い順に並べる）
    currentMid = msg.replyToMid;
  }

  // クリック元メッセージ（返信を含むメッセージ）がチェーンに含まれていなければ末尾に追加
  if (clickedMid && !visited.has(clickedMid) && chain.length < maxDepth) {
    const clickedMsg = await fetchMessageById(roomId, clickedMid);
    if (clickedMsg) {
      chain.push(clickedMsg);
    }
  }

  log.info('スレッドチェーン構築完了', { depth: chain.length, anchorMid });
  log.timeEnd('buildThreadChain');
  return chain;
}
