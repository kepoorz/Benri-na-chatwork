import { SELECTORS, CSS_CLASSES } from './constants.js';
import { getFilterButtons, addRoomToFilter, removeRoomFromFilter } from './state.js';
import { findElementBySelectors } from '../../utils/dom/elements.js';
import { logger } from '../../utils/logging/logger.js';
import { debounce } from '../../utils/common.js';

const log = logger.withContext('FilterLogic');

let mutationObserver = null;

function findAllRoomItems() {
  for (const selector of SELECTORS.roomItem) {
    try {
      const items = document.querySelectorAll(selector);
      if (items.length > 0) {
        log.debug('ルーム要素を検出', { selector, count: items.length });
        return Array.from(items);
      }
    } catch (_e) {
      /* skip invalid selector */
    }
  }
  log.warn('ルーム要素が見つかりません');
  return [];
}

export function getRoomId(roomElement) {
  for (const attr of SELECTORS.roomId) {
    const value = roomElement.getAttribute(attr);
    if (value) return value;
  }
  const link = roomElement.querySelector('a[href]');
  if (link) {
    const match = link.href.match(/rid(\d+)/);
    if (match) return match[1];
  }
  return null;
}

function matchUnreadFilter(roomElement) {
  for (const selector of SELECTORS.unreadBadge) {
    try {
      if (roomElement.querySelector(selector)) return true;
    } catch (_e) {
      /* skip */
    }
  }
  return false;
}

function matchMentionFilter(roomElement) {
  for (const selector of SELECTORS.mentionBadge) {
    try {
      if (roomElement.querySelector(selector)) return true;
    } catch (_e) {
      /* skip */
    }
  }
  return false;
}

function matchNewFilter(roomElement) {
  for (const selector of SELECTORS.unreadBadge) {
    try {
      const badge = roomElement.querySelector(selector);
      if (badge) {
        const text = badge.textContent.trim();
        return /^\d+$/.test(text) && parseInt(text, 10) > 0;
      }
    } catch (_e) {
      /* skip */
    }
  }
  return false;
}

function matchRoomIdFilter(roomElement, roomIds) {
  const rid = getRoomId(roomElement);
  return rid ? roomIds.includes(rid) : false;
}

function matchFilter(roomElement, filter) {
  switch (filter.type) {
    case 'unread':
      if (filter.label === 'TO') return matchMentionFilter(roomElement);
      if (filter.label === '新着') return matchNewFilter(roomElement);
      return matchUnreadFilter(roomElement);
    case 'bookmark':
    case 'save':
      return matchRoomIdFilter(roomElement, filter.roomIds);
    default:
      return false;
  }
}

export function applyFilters(activeFilters) {
  log.time('applyFilters');

  if (!activeFilters || activeFilters.length === 0) {
    clearAllFilters();
    log.timeEnd('applyFilters');
    return;
  }

  const rooms = findAllRoomItems();
  let visibleCount = 0;

  rooms.forEach((room) => {
    const matches = activeFilters.some((f) => matchFilter(room, f));
    room.style.display = matches ? '' : 'none';
    if (matches) visibleCount++;
  });

  log.info('フィルター適用完了', {
    activeCount: activeFilters.length,
    total: rooms.length,
    visible: visibleCount,
    hidden: rooms.length - visibleCount,
  });

  // bookmark/saveタイプのフィルターがアクティブなら追加/削除ボタン表示
  const editableActive = activeFilters.filter((f) => f.type === 'bookmark' || f.type === 'save');
  if (editableActive.length > 0) {
    showRoomAddButtons(editableActive[0].id);
  } else {
    hideRoomAddButtons();
  }

  log.timeEnd('applyFilters');
}

export function clearAllFilters() {
  const rooms = findAllRoomItems();
  rooms.forEach((room) => {
    room.style.display = '';
  });
  hideRoomAddButtons();
  log.debug('全フィルターをクリアしました', { roomCount: rooms.length });
}

export function showRoomAddButtons(filterId) {
  hideRoomAddButtons();
  const filter = getFilterButtons().find((b) => b.id === filterId);
  if (!filter) return;

  const rooms = findAllRoomItems();
  rooms.forEach((room) => {
    const rid = getRoomId(room);
    if (!rid) return;

    const btn = document.createElement('span');
    btn.className = CSS_CLASSES.roomAddBtn;
    const isIncluded = filter.roomIds.includes(rid);
    btn.textContent = isIncluded ? '★' : '☆';
    if (isIncluded) btn.classList.add(CSS_CLASSES.roomAddBtnActive);
    btn.dataset.filterId = filterId;
    btn.dataset.roomId = rid;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (filter.roomIds.includes(rid)) {
        removeRoomFromFilter(filterId, rid);
        btn.textContent = '☆';
        btn.classList.remove(CSS_CLASSES.roomAddBtnActive);
      } else {
        addRoomToFilter(filterId, rid);
        btn.textContent = '★';
        btn.classList.add(CSS_CLASSES.roomAddBtnActive);
      }
    });

    room.style.position = 'relative';
    room.appendChild(btn);
  });

  log.debug('ルーム追加ボタンを表示', { filterId, roomCount: rooms.length });
}

export function hideRoomAddButtons() {
  document.querySelectorAll(`.${CSS_CLASSES.roomAddBtn}`).forEach((btn) => btn.remove());
}

export function countMatchingRooms(filter) {
  const rooms = findAllRoomItems();
  return rooms.filter((room) => matchFilter(room, filter)).length;
}

export function startObserver(onMutation) {
  stopObserver();
  const container = findElementBySelectors(SELECTORS.roomListContainer);
  if (!container) return;

  log.inspect(container);

  const debouncedCallback = debounce(() => {
    log.debug('ルームリスト変更を検出');
    onMutation();
  }, 200);

  mutationObserver = new MutationObserver(debouncedCallback);
  mutationObserver.observe(container, { childList: true, subtree: true });
  log.info('MutationObserver開始');
}

export function stopObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
    log.debug('MutationObserver停止');
  }
}
