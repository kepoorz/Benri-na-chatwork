/**
 * logger.js - 高機能デバッグロガー
 *
 * 機能:
 * - ログレベル制御 (TRACE/DEBUG/INFO/WARN/ERROR)
 * - カラー付きコンソール出力
 * - グループ化 (group/groupEnd)
 * - テーブル出力 (table)
 * - パフォーマンス計測 (time/timeEnd)
 * - DOM要素検査 (inspectElement)
 * - コールスタック表示 (trace)
 * - ログ履歴保持 (getHistory)
 * - コンテキスト付きログ (withContext)
 * - 条件付きログ (assert)
 */

const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5,
};

const LEVEL_COLORS = {
  TRACE: 'color: #aaa',
  DEBUG: 'color: #6c757d',
  INFO: 'color: #0d6efd',
  WARN: 'color: #ffc107; font-weight: bold',
  ERROR: 'color: #dc3545; font-weight: bold',
};

const LEVEL_ICONS = {
  TRACE: '🔍',
  DEBUG: '🐛',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
};

const PREFIX = 'Benri-na-chatwork';
const MAX_HISTORY = 500;

let currentLogLevel = LOG_LEVELS.INFO;
const logHistory = [];
const timers = new Map();

function now() {
  return new Date().toISOString().slice(11, 23);
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLogLevel;
}

function addToHistory(level, message, data, context) {
  const entry = {
    timestamp: Date.now(),
    time: now(),
    level,
    message,
    data: data !== undefined ? data : null,
    context: context || null,
  };
  logHistory.push(entry);
  if (logHistory.length > MAX_HISTORY) {
    logHistory.shift();
  }
  return entry;
}

function formatPrefix(level, context) {
  const ctx = context ? `[${context}]` : '';
  return `%c${LEVEL_ICONS[level]} [${PREFIX}][${level}][${now()}]${ctx}`;
}

function logWithStyle(consoleFn, level, message, data, context) {
  if (!shouldLog(level)) return;
  addToHistory(level, message, data, context);

  const prefix = formatPrefix(level, context);
  const style = LEVEL_COLORS[level];

  if (data !== undefined) {
    consoleFn(prefix, style, message, data);
  } else {
    consoleFn(prefix, style, message);
  }
}

/**
 * コンテキスト付きロガーを生成
 */
function createContextLogger(context) {
  return {
    trace: (msg, data) => logWithStyle(console.debug, 'TRACE', msg, data, context),
    debug: (msg, data) => logWithStyle(console.debug, 'DEBUG', msg, data, context),
    info: (msg, data) => logWithStyle(console.info, 'INFO', msg, data, context),
    warn: (msg, data) => logWithStyle(console.warn, 'WARN', msg, data, context),
    error: (msg, data) => logWithStyle(console.error, 'ERROR', msg, data, context),
    group: (label) => logger.group(label, context),
    groupEnd: () => logger.groupEnd(),
    table: (data, columns) => logger.table(data, columns),
    time: (label) => logger.time(label),
    timeEnd: (label) => logger.timeEnd(label),
    inspect: (el) => logger.inspectElement(el),
    assert: (condition, msg, data) => logger.assert(condition, msg, data),
  };
}

export const logger = {
  // --- 基本ログ ---
  trace(message, data) {
    logWithStyle(console.debug, 'TRACE', message, data);
  },

  debug(message, data) {
    logWithStyle(console.debug, 'DEBUG', message, data);
  },

  info(message, data) {
    logWithStyle(console.info, 'INFO', message, data);
  },

  warn(message, data) {
    logWithStyle(console.warn, 'WARN', message, data);
  },

  error(message, data) {
    logWithStyle(console.error, 'ERROR', message, data);
  },

  // --- グループ化 ---
  group(label, context) {
    if (!shouldLog('DEBUG')) return;
    const ctx = context ? `[${context}]` : '';
    console.group(`%c📂 [${PREFIX}]${ctx} ${label}`, 'color: #5fb878; font-weight: bold');
  },

  groupCollapsed(label, context) {
    if (!shouldLog('DEBUG')) return;
    const ctx = context ? `[${context}]` : '';
    console.groupCollapsed(`%c📁 [${PREFIX}]${ctx} ${label}`, 'color: #5fb878');
  },

  groupEnd() {
    console.groupEnd();
  },

  // --- テーブル出力 ---
  table(data, columns) {
    if (!shouldLog('DEBUG')) return;
    if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
      console.table(data, columns);
    } else {
      this.debug('table: データが不正です', data);
    }
  },

  // --- パフォーマンス計測 ---
  time(label) {
    const key = label || 'default';
    timers.set(key, performance.now());
    if (shouldLog('DEBUG')) {
      console.debug(`%c⏱️ [${PREFIX}] Timer started: ${key}`, 'color: #6c757d');
    }
  },

  timeEnd(label) {
    const key = label || 'default';
    const start = timers.get(key);
    if (start === undefined) {
      this.warn(`Timer "${key}" が見つかりません`);
      return null;
    }
    const elapsed = performance.now() - start;
    timers.delete(key);
    const formatted =
      elapsed < 1000 ? `${elapsed.toFixed(2)}ms` : `${(elapsed / 1000).toFixed(3)}s`;

    if (shouldLog('DEBUG')) {
      const color =
        elapsed > 1000
          ? 'color: #dc3545; font-weight: bold'
          : elapsed > 100
            ? 'color: #ffc107'
            : 'color: #28a745';
      console.debug(`%c⏱️ [${PREFIX}] ${key}: ${formatted}`, color);
    }
    addToHistory('DEBUG', `Timer ${key}: ${formatted}`, { elapsed });
    return elapsed;
  },

  // --- DOM要素検査 ---
  inspectElement(element) {
    if (!shouldLog('DEBUG')) return;
    if (!element || !(element instanceof HTMLElement)) {
      this.warn('inspectElement: 無効な要素', element);
      return;
    }

    const info = {
      tag: element.tagName.toLowerCase(),
      id: element.id || '(none)',
      classes: Array.from(element.classList).join(', ') || '(none)',
      attributes: {},
      rect: null,
      children: element.children.length,
      textContent: (element.textContent || '').slice(0, 100),
      visible: element.offsetParent !== null,
      computedDisplay: getComputedStyle(element).display,
    };

    for (const attr of element.attributes) {
      info.attributes[attr.name] = attr.value;
    }

    const rect = element.getBoundingClientRect();
    info.rect = {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    this.group(`DOM検査: <${info.tag}${info.id !== '(none)' ? '#' + info.id : ''}>`);
    this.table([info]);
    console.dir(element);
    this.groupEnd();

    return info;
  },

  // --- 複数DOM要素の一括検査 ---
  inspectElements(selector) {
    if (!shouldLog('DEBUG')) return;
    const elements = document.querySelectorAll(selector);
    this.group(`DOM一括検査: "${selector}" (${elements.length}件)`);
    const results = Array.from(elements).map((el, i) => ({
      index: i,
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: Array.from(el.classList).join(' '),
      visible: el.offsetParent !== null,
      text: (el.textContent || '').slice(0, 50),
    }));
    this.table(results);
    this.groupEnd();
    return results;
  },

  // --- コールスタック ---
  trace_stack(message) {
    if (!shouldLog('DEBUG')) return;
    console.trace(`%c🔍 [${PREFIX}] ${message || 'Stack trace'}`, 'color: #6c757d');
  },

  // --- 条件付きログ ---
  assert(condition, message, data) {
    if (!condition) {
      this.error(`ASSERT FAILED: ${message}`, data);
      console.assert(false, `[${PREFIX}] ${message}`, data);
    }
  },

  // --- コンテキスト付きロガー生成 ---
  withContext(context) {
    return createContextLogger(context);
  },

  // --- ログレベル設定 ---
  setLogLevel(level) {
    const upper = String(level).toUpperCase();
    if (LOG_LEVELS[upper] !== undefined) {
      currentLogLevel = LOG_LEVELS[upper];
      this.info(`ログレベル → ${upper}`);
    } else {
      this.warn(`無効なログレベル: ${level}。有効値: ${Object.keys(LOG_LEVELS).join(', ')}`);
    }
  },

  getLogLevel() {
    return Object.keys(LOG_LEVELS).find((k) => LOG_LEVELS[k] === currentLogLevel);
  },

  // --- ログ履歴 ---
  getHistory(filter) {
    if (!filter) return [...logHistory];
    return logHistory.filter((entry) => {
      if (filter.level && entry.level !== filter.level.toUpperCase()) return false;
      if (filter.context && entry.context !== filter.context) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      if (filter.search && !entry.message.includes(filter.search)) return false;
      return true;
    });
  },

  clearHistory() {
    logHistory.length = 0;
    this.debug('ログ履歴クリア');
  },

  printHistory(filter) {
    const entries = this.getHistory(filter);
    this.group(`ログ履歴 (${entries.length}件)`);
    this.table(
      entries.map((e) => ({
        time: e.time,
        level: e.level,
        context: e.context || '',
        message: e.message.slice(0, 80),
      }))
    );
    this.groupEnd();
  },

  // --- ステータスダンプ ---
  dumpStatus() {
    this.group('Benri-na-chatwork ステータス');
    this.info('ログレベル', this.getLogLevel());
    this.info('ログ履歴件数', logHistory.length);
    this.info('アクティブタイマー', Array.from(timers.keys()));
    this.info('URL', window.location.href);
    this.info('User Agent', navigator.userAgent);
    this.groupEnd();
  },

  // --- 定数エクスポート ---
  LOG_LEVELS,
};

window.logger = logger;

export default logger;
