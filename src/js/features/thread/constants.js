// スレッドパネル機能の定数

// Chatwork DOM セレクタ（フォールバック用に複数）
export const THREAD_SELECTORS = {
  subContent: ['#_subContent'],
  subContentArea: ['#_subContentArea'],
  subContentAreaContent: ['#_subContentAreaContent'],
  replyTooltip: ['#_replyMessageTip'],
  replyTooltipContent: ['#_replyMessageTipContent'],
  timeLine: ['#_timeLine', '.timeLineArea', '[data-testid="timeline-area"]'],
  timelineMessage: ['.timelineMessage[data-mid]', '._message[data-mid]'],
  replyIndicator: ['.chatTimeLineReply[data-rid][data-mid]', '._replyMessage[data-rid][data-mid]'],
  chatInput: ['#_chatText', '[data-testid="chat-input"]'],
  sendButton: ['[data-testid="timeline_send-message-button"]'],
};

// CSSクラス名
export const THREAD_CSS = {
  panel: 'cw-thread-panel',
  panelHeader: 'cw-thread-panel__header',
  panelTitle: 'cw-thread-panel__title',
  panelClose: 'cw-thread-panel__close',
  panelBody: 'cw-thread-panel__body',
  panelFooter: 'cw-thread-panel__footer',
  messageItem: 'cw-thread-message',
  messageHighlight: 'cw-thread-message--highlight',
  messageAvatar: 'cw-thread-message__avatar',
  messageName: 'cw-thread-message__name',
  messageTime: 'cw-thread-message__time',
  messageText: 'cw-thread-message__text',
  messageActions: 'cw-thread-message__actions',
  messageActionBtn: 'cw-thread-message__action-btn',
  replyInput: 'cw-thread-reply-input',
  replySendBtn: 'cw-thread-reply-send',
  loading: 'cw-thread-loading',
};

// 設定
export const THREAD_CONFIG = {
  maxChainDepth: 5,
  panelWidth: 300,
};
