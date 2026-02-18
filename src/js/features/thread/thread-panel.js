// スレッドパネルUI - 右カラムにスレッドビューを表示

import { THREAD_SELECTORS, THREAD_CSS, THREAD_CONFIG } from './constants.js';
import { threadState, closeThread, saveRightColumnChildren } from './state.js';
import { findElementBySelectors, sanitizeHtml } from '../../utils/dom/elements.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('ThreadPanel');

/**
 * スレッドパネルを右カラムに表示
 * @param {Array} chain - メッセージチェーン
 * @param {string} anchorMid - ハイライトするメッセージID
 */
export function showThreadPanel(chain, anchorMid) {
  log.time('showThreadPanel');

  const subContentArea =
    findElementBySelectors(THREAD_SELECTORS.subContentAreaContent) ||
    findElementBySelectors(THREAD_SELECTORS.subContentArea);
  if (!subContentArea) {
    log.warn('右カラム要素が見つかりません');
    log.timeEnd('showThreadPanel');
    return;
  }

  // 既存パネルがあれば削除
  const existing = document.querySelector(`.${THREAD_CSS.panel}`);
  if (existing) {
    existing.remove();
  } else {
    // 初回: 右カラムの既存コンテンツを退避
    const children = Array.from(subContentArea.children);
    saveRightColumnChildren(children);
    children.forEach((child) => {
      child.__cwThreadHidden = true;
      child.style.display = 'none';
    });
  }

  // パネル構築
  const panel = document.createElement('div');
  panel.className = THREAD_CSS.panel;

  // ヘッダー
  const header = document.createElement('div');
  header.className = THREAD_CSS.panelHeader;

  const title = document.createElement('span');
  title.className = THREAD_CSS.panelTitle;
  title.textContent = `スレッド (${chain.length}件)`;

  const closeBtn = document.createElement('button');
  closeBtn.className = THREAD_CSS.panelClose;
  closeBtn.textContent = '\u00D7';
  closeBtn.title = '閉じる';
  closeBtn.addEventListener('click', () => hideThreadPanel());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // ボディ
  const body = document.createElement('div');
  body.className = THREAD_CSS.panelBody;

  chain.forEach((msg) => {
    const item = renderMessageItem(msg, msg.mid === anchorMid);
    body.appendChild(item);
  });

  panel.appendChild(header);
  panel.appendChild(body);

  subContentArea.appendChild(panel);

  // アンカーメッセージまでスクロール
  const highlightedEl = body.querySelector(`.${THREAD_CSS.messageHighlight}`);
  if (highlightedEl) {
    highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  log.info('スレッドパネル表示', { messageCount: chain.length, anchorMid });
  log.timeEnd('showThreadPanel');
}

/**
 * メッセージアイテムをレンダリング
 */
function renderMessageItem(msg, isAnchor) {
  const item = document.createElement('div');
  item.className = THREAD_CSS.messageItem;
  item.dataset.mid = msg.mid;
  if (isAnchor) {
    item.classList.add(THREAD_CSS.messageHighlight);
  }

  // ジャンプボタン（右上）- メインタイムラインのメッセージへスクロール
  const jumpBtn = document.createElement('button');
  jumpBtn.className = THREAD_CSS.messageJump;
  jumpBtn.title = 'メッセージへ移動';
  jumpBtn.textContent = '\u2192\u3053\u3053\u306B\u79FB\u52D5';
  jumpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    jumpToMessage(msg.mid);
  });

  // ヘッダー行（アバター + 名前 + 時刻 + ジャンプボタン）
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;';

  if (msg.avatarUrl) {
    const avatar = document.createElement('img');
    avatar.className = THREAD_CSS.messageAvatar;
    avatar.src = msg.avatarUrl;
    avatar.alt = msg.name;
    headerRow.appendChild(avatar);
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = THREAD_CSS.messageName;
  nameSpan.textContent = msg.name;
  headerRow.appendChild(nameSpan);

  const timeSpan = document.createElement('span');
  timeSpan.className = THREAD_CSS.messageTime;
  timeSpan.textContent = msg.time;
  headerRow.appendChild(timeSpan);

  headerRow.appendChild(jumpBtn);

  item.appendChild(headerRow);

  // メッセージ本文
  const textDiv = document.createElement('div');
  textDiv.className = THREAD_CSS.messageText;

  if (msg.domElement && !msg.fromApi) {
    const bodyEl = msg.domElement.querySelector(
      'pre, [class*="timelineMessage__text"], ._messageText, .chatTimeLineMessage__message, [data-testid="message-text"]'
    );
    if (bodyEl) {
      const sanitized = sanitizeHtml(bodyEl.innerHTML);
      textDiv.innerHTML = sanitized;
    } else {
      textDiv.textContent = msg.bodyText || '';
    }
  } else {
    textDiv.innerHTML = msg.body || msg.bodyText || '';
  }

  item.appendChild(textDiv);

  // ホバー時アクションバー（Chatworkネイティブ風）
  const actionBar = document.createElement('div');
  actionBar.className = THREAD_CSS.messageActions;

  const actions = [
    { icon: '#icon_reply', label: '返信', handler: () => injectReplyTag(msg) },
    { icon: '#icon_quote', label: '引用', handler: () => injectQuoteTag(msg) },
  ];

  actions.forEach(({ icon, label, handler }) => {
    const btn = document.createElement('button');
    btn.className = THREAD_CSS.messageActionBtn;
    btn.innerHTML =
      `<svg viewBox="0 0 10 10" width="14" height="14"><use fill-rule="evenodd" href="${icon}"></use></svg>` +
      `<span class="${THREAD_CSS.messageActionLabel}">${label}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handler();
    });
    actionBar.appendChild(btn);
  });

  item.appendChild(actionBar);

  return item;
}

/**
 * メインタイムラインの該当メッセージへスクロール
 */
function jumpToMessage(mid) {
  // Chatworkのメッセージ要素を探す
  const target =
    document.querySelector(`#_messageId${mid}`) ||
    document.querySelector(`[data-mid="${mid}"]._message`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 一時的にハイライト
    target.style.transition = 'background-color 0.3s';
    target.style.backgroundColor = 'rgba(95, 184, 120, 0.2)';
    setTimeout(() => {
      target.style.backgroundColor = '';
    }, 2000);
    log.info('メッセージへ移動', { mid });
  } else {
    log.warn('メッセージが見つかりません（タイムライン外）', { mid });
  }
}

/**
 * 指定メッセージへの返信タグをチャット入力欄に挿入
 */
function injectReplyTag(msg) {
  const chatInput = findElementBySelectors(THREAD_SELECTORS.chatInput);
  if (!chatInput) {
    log.warn('チャット入力欄が見つかりません');
    return;
  }

  const aid = msg.aid || '';
  const rid = threadState.anchorRoomId || msg.rid || '';
  const mid = msg.mid || '';
  const senderName = msg.name || '';

  // [返信 aid=AID to=RID-MID]名前さん 形式
  const replyTag = `[返信 aid=${aid} to=${rid}-${mid}]${senderName}さん`;
  const current = chatInput.value;
  chatInput.value = current ? `${current}\n${replyTag}\n` : `${replyTag}\n`;
  chatInput.focus();
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));

  log.info('返信タグを挿入', { replyTag });
}

/**
 * 引用タグをチャット入力欄に挿入
 */
function injectQuoteTag(msg) {
  const chatInput = findElementBySelectors(THREAD_SELECTORS.chatInput);
  if (!chatInput) {
    log.warn('チャット入力欄が見つかりません');
    return;
  }

  const aid = msg.aid || '';
  const time = msg.time || '';
  const bodyText = msg.bodyText || '';

  // [qt][qtmeta aid=AID time=TIME]本文[/qt] 形式
  const quoteTag = `[qt][qtmeta aid=${aid} time=${time}]${bodyText}[/qt]`;
  const current = chatInput.value;
  chatInput.value = current ? `${current}\n${quoteTag}\n` : `${quoteTag}\n`;
  chatInput.focus();
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));

  log.info('引用タグを挿入', { aid });
}

/**
 * スレッドパネルを非表示にし、元の右カラムコンテンツを復元
 */
export function hideThreadPanel() {
  const panel = document.querySelector(`.${THREAD_CSS.panel}`);
  if (panel) {
    panel.remove();
  }

  // 退避したコンテンツを復元
  const saved = threadState.savedRightColumnChildren;
  if (saved) {
    saved.forEach((child) => {
      if (child.__cwThreadHidden) {
        child.style.display = '';
        delete child.__cwThreadHidden;
      }
    });
  }

  closeThread();
  log.info('スレッドパネルを閉じました');
}
