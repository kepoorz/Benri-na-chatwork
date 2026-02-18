// Chatwork内部APIクライアント - タイムライン外メッセージの取得

import { THREAD_SELECTORS } from './constants.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('ThreadAPI');

/**
 * タイムラインDOMからメッセージを検索
 */
export function findMessageInTimeline(messageId) {
  const mid = String(messageId);
  // replyTipを除外して本体のタイムラインメッセージを優先
  const mainMsg = document.querySelector(`._message[data-mid="${mid}"]:not([id^="replyTip_"])`);
  if (mainMsg) return mainMsg;
  // フォールバック: replyTip含む
  for (const selector of THREAD_SELECTORS.timelineMessage) {
    const el = document.querySelector(`${selector.replace('[data-mid]', '')}[data-mid="${mid}"]`);
    if (el) return el;
  }
  const fallback = document.querySelector(`[data-mid="${mid}"]`);
  return fallback || null;
}

/**
 * メッセージDOM要素からデータを抽出
 */
export function extractMessageData(element) {
  const mid = element.dataset.mid;
  const rid = element.dataset.rid;
  const aid = element.dataset.aid;

  // デバッグ: 実際のDOM構造をログ出力（一時的にINFOレベル）
  log.info('メッセージDOM構造', {
    mid,
    outerHTML: element.outerHTML.substring(0, 500),
    childClasses: Array.from(element.querySelectorAll('*'))
      .slice(0, 30)
      .map((el) => ({
        tag: el.tagName,
        cls: el.className,
        text: el.textContent?.substring(0, 30),
      })),
  });

  // 名前: [data-testid="timeline_user-name"] が _message 内に存在
  const nameEl = element.querySelector(
    '[data-testid="timeline_user-name"], [class*="timelineMessage__name"], ._userName, .chatTimeLineName'
  );
  const name = nameEl ? nameEl.textContent.trim() : '';

  // アバター
  const avatarEl = element.querySelector(
    'img.userIconImage, img._avatarHoverTip, [data-testid="user-icon"] img'
  );
  const avatarUrl = avatarEl ? avatarEl.src : '';

  // 時刻
  const timeEl = element.querySelector(
    '._timeStamp, [class*="timelineMessage__time"], .chatTimeLineTime, [data-testid="message-time"]'
  );
  const time = timeEl ? timeEl.textContent.trim() : '';

  // 本文: Chatworkは<pre>タグ内にメッセージ本文を格納
  const bodyEl = element.querySelector(
    'pre, [class*="timelineMessage__text"], ._messageText, .chatTimeLineMessage__message, [data-testid="message-text"]'
  );
  const body = bodyEl ? bodyEl.innerHTML : '';
  const bodyText = bodyEl ? bodyEl.textContent.trim() : '';

  // 返信参照を検索
  const replyEl = element.querySelector('.chatTimeLineReply[data-mid], ._replyMessage[data-mid]');
  const replyToMid = replyEl ? replyEl.dataset.mid : null;
  const replyToRid = replyEl ? replyEl.dataset.rid : null;

  log.info('抽出結果', { mid, name, time, bodyText: bodyText.substring(0, 50), replyToMid });

  return {
    mid,
    rid,
    aid,
    name,
    avatarUrl,
    time,
    body,
    bodyText,
    replyToMid,
    replyToRid,
    domElement: element,
  };
}

/**
 * 現在のルームIDを取得
 */
export function getCurrentRoomId() {
  // URLから取得: #!rid12345
  const hashMatch = window.location.hash.match(/rid(\d+)/);
  if (hashMatch) return hashMatch[1];
  // #_roomList の選択状態から取得
  const activeRoom = document.querySelector(
    '[aria-selected="true"][data-rid], .roomListItem--active[data-rid]'
  );
  if (activeRoom) return activeRoom.dataset.rid;
  return null;
}

/**
 * myidを取得（Chatworkユーザー自身のID）
 */
function getMyId() {
  // グローバル変数から
  if (window.CW && window.CW.myid) return window.CW.myid;
  // meta tagから
  const meta = document.querySelector('meta[name="myid"]');
  if (meta) return meta.content;
  // ユーザーアイコンIDから
  const userIcon = document.querySelector('[id^="_userIcon"]');
  if (userIcon) {
    const match = userIcon.id.match(/_userIcon(\d+)/);
    if (match) return match[1];
  }
  return null;
}

/**
 * API経由でメッセージを取得
 */
async function fetchMessageFromApi(roomId, messageId) {
  const myid = getMyId();
  if (!myid) {
    log.warn('myidが取得できません');
    return null;
  }

  try {
    const response = await fetch(`/gateway/load_old_chat.php?myid=${myid}&_v=1.80a&_av=5&ln=ja`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `room_id=${roomId}&last_chat_id=${messageId}&jump_to_chat_id=${messageId}&first_chat_id=0`,
    });
    if (!response.ok) {
      log.warn('API応答エラー', { status: response.status });
      return null;
    }
    const data = await response.json();
    return parseMessageFromApiResponse(data, messageId);
  } catch (error) {
    log.warn('API経由メッセージ取得失敗', { roomId, messageId, error: error.message });
    return null;
  }
}

/**
 * APIレスポンスからメッセージデータをパース
 */
function parseMessageFromApiResponse(data, targetMid) {
  const mid = String(targetMid);
  // Chatwork APIレスポンス構造: { result: { chat_list: { "mid": {...} } } }
  const chatList = data?.result?.chat_list;
  if (!chatList) return null;

  const msg = chatList[mid];
  if (!msg) return null;

  // [返信 aid=xxx to=rid-mid] または [rp aid=xxx to=rid-mid] 形式の返信参照をパース
  const rpMatch = msg.msg?.match(/\[(?:返信|rp)\s+aid=(\d+)\s+to=(\d+)-(\d+)\]/);

  return {
    mid: mid,
    rid: msg.rid ? String(msg.rid) : null,
    aid: msg.aid ? String(msg.aid) : null,
    name: msg.nm || '',
    avatarUrl: msg.av ? `https://appdata.chatwork.com/avatar/${msg.av}` : '',
    time: msg.tm ? formatTimestamp(msg.tm) : '',
    body: escapeHtml(msg.msg || '').replace(/\[(?:返信|rp)[^\]]*\][^\n]*\n?/, ''),
    bodyText: (msg.msg || '').replace(/\[(?:返信|rp)[^\]]*\][^\n]*\n?/, ''),
    replyToMid: rpMatch ? rpMatch[3] : null,
    replyToRid: rpMatch ? rpMatch[2] : null,
    domElement: null,
    fromApi: true,
  };
}

function formatTimestamp(unixTime) {
  const d = new Date(unixTime * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * メッセージIDでメッセージデータを取得（DOM優先、APIフォールバック）
 */
export async function fetchMessageById(roomId, messageId) {
  // 1. DOMから検索
  const domEl = findMessageInTimeline(messageId);
  if (domEl) {
    log.debug('DOMからメッセージ取得', { messageId });
    return extractMessageData(domEl);
  }

  // 2. APIフォールバック
  log.debug('API経由でメッセージ取得試行', { roomId, messageId });
  return await fetchMessageFromApi(roomId, messageId);
}
