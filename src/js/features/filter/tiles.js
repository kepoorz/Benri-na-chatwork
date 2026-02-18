import { CSS_CLASSES, SELECTORS, FILTER_GRID_HEIGHT } from './constants.js';
import { getFilterButtons, toggleFilter, updateFilterButton, getActiveFilters } from './state.js';
import { applyFilters, countMatchingRooms, startObserver } from './filter-logic.js';
import { showEmojiPicker, hideEmojiPicker } from './emoji-picker.js';
import { findElementBySelectors } from '../../utils/dom/elements.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('FilterTiles');

let gridElement = null;

export function createFilterTileGrid() {
  log.time('createFilterTileGrid');

  // #sidebarSwitch の直後に配置
  const sidebarSwitch = findElementBySelectors(SELECTORS.sidebarSwitch);
  if (!sidebarSwitch) {
    log.warn('sidebarSwitchが見つかりません。フィルターグリッドを作成できません。');
    log.timeEnd('createFilterTileGrid');
    return;
  }

  log.inspect(sidebarSwitch);

  // 既存のグリッドがあれば削除
  destroyFilterTileGrid();

  gridElement = document.createElement('div');
  gridElement.className = CSS_CLASSES.grid;

  const buttons = getFilterButtons();
  buttons.forEach((btn) => {
    gridElement.appendChild(renderTile(btn));
  });

  // sidebarSwitchの直後に挿入
  sidebarSwitch.parentElement.insertBefore(gridElement, sidebarSwitch.nextSibling);
  log.info('フィルターグリッドを作成しました（sidebarSwitch直後）', { tileCount: buttons.length });

  // #_sidebarPane の height を調整
  // 元: calc(100% - 49px) → 新: calc(100% - 49px - FILTER_GRID_HEIGHT px)
  adjustSidebarPaneHeight();

  updateTileStates();
  log.timeEnd('createFilterTileGrid');
}

/**
 * #_sidebarPane の高さをフィルターグリッド分だけ縮める
 */
function adjustSidebarPaneHeight() {
  const sidebarPane = findElementBySelectors(SELECTORS.sidebarPane);
  if (!sidebarPane) {
    log.warn('sidebarPaneが見つかりません。高さ調整をスキップします。');
    return;
  }
  sidebarPane.style.height = `calc(100% - 49px - ${FILTER_GRID_HEIGHT}px)`;
  log.debug('sidebarPane高さ調整', { height: sidebarPane.style.height });
}

/**
 * #_sidebarPane の高さを元に戻す
 */
function restoreSidebarPaneHeight() {
  const sidebarPane = findElementBySelectors(SELECTORS.sidebarPane);
  if (!sidebarPane) return;
  sidebarPane.style.height = '';
  log.debug('sidebarPane高さ復元');
}

function renderTile(button) {
  const tile = document.createElement('div');
  tile.className = CSS_CLASSES.tile;
  tile.dataset.filterId = button.id;

  const emoji = document.createElement('span');
  emoji.className = CSS_CLASSES.tileEmoji;
  emoji.textContent = button.emoji;

  const label = document.createElement('span');
  label.className = CSS_CLASSES.tileLabel;
  label.textContent = button.label;

  const badge = document.createElement('span');
  badge.className = CSS_CLASSES.tileBadge;
  const count = countMatchingRooms(button);
  badge.textContent = count;
  badge.style.display = count > 0 ? '' : 'none';

  tile.appendChild(emoji);
  tile.appendChild(label);
  tile.appendChild(badge);

  if (button.active) {
    tile.classList.add(CSS_CLASSES.tileActive);
  }

  return tile;
}

export function setupTileEvents() {
  if (!gridElement) return;

  gridElement.addEventListener('click', (e) => {
    const tile = e.target.closest(`.${CSS_CLASSES.tile}`);
    if (!tile) return;

    const filterId = tile.dataset.filterId;

    // 絵文字部分クリック -> ピッカー表示（editableのみ）
    const emojiSpan = e.target.closest(`.${CSS_CLASSES.tileEmoji}`);
    const btn = getFilterButtons().find((b) => b.id === filterId);
    if (emojiSpan && btn && btn.editable) {
      e.stopPropagation();
      log.debug('絵文字ピッカー表示', { filterId, currentEmoji: btn.emoji });
      showEmojiPicker(tile, btn.emoji, (newEmoji) => {
        updateFilterButton(filterId, { emoji: newEmoji });
        emojiSpan.textContent = newEmoji;
      });
      return;
    }

    // 通常クリック -> トグル
    toggleFilter(filterId);
    log.time('applyFilters');
    applyFilters(getActiveFilters());
    log.timeEnd('applyFilters');
    updateTileStates();
  });

  // 右クリック -> 編集モード
  gridElement.addEventListener('contextmenu', (e) => {
    const tile = e.target.closest(`.${CSS_CLASSES.tile}`);
    if (!tile) return;

    const filterId = tile.dataset.filterId;
    const btn = getFilterButtons().find((b) => b.id === filterId);
    if (!btn || !btn.editable) return;

    e.preventDefault();
    log.debug('編集モード開始', { filterId, label: btn.label });
    startEditMode(tile, btn);
  });

  // MutationObserverでルームリスト変更を監視
  startObserver(() => {
    const active = getActiveFilters();
    if (active.length > 0) {
      applyFilters(active);
    }
    updateTileStates();
  });

  log.info('タイルイベントをセットアップしました');
}

function startEditMode(tile, button) {
  // 既存の編集モードを解除
  const existingEditing = gridElement.querySelector(`.${CSS_CLASSES.tileEditing}`);
  if (existingEditing) {
    cancelEditMode(existingEditing);
  }

  tile.classList.add(CSS_CLASSES.tileEditing);

  const labelSpan = tile.querySelector(`.${CSS_CLASSES.tileLabel}`);
  const originalLabel = labelSpan.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = CSS_CLASSES.tileInput;
  input.value = button.label;
  input.maxLength = 10;

  labelSpan.style.display = 'none';
  tile.insertBefore(input, labelSpan.nextSibling);
  input.focus();
  input.select();

  function commitEdit() {
    const newLabel = input.value.trim() || originalLabel;
    updateFilterButton(button.id, { label: newLabel });
    labelSpan.textContent = newLabel;
    labelSpan.style.display = '';
    input.remove();
    tile.classList.remove(CSS_CLASSES.tileEditing);
    hideEmojiPicker();
    log.debug('編集確定', { filterId: button.id, newLabel });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      labelSpan.textContent = originalLabel;
      labelSpan.style.display = '';
      input.remove();
      tile.classList.remove(CSS_CLASSES.tileEditing);
      hideEmojiPicker();
      log.debug('編集キャンセル', { filterId: button.id });
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(commitEdit, 150);
  });
}

function cancelEditMode(tile) {
  const input = tile.querySelector(`.${CSS_CLASSES.tileInput}`);
  const labelSpan = tile.querySelector(`.${CSS_CLASSES.tileLabel}`);
  if (input) {
    input.remove();
  }
  if (labelSpan) {
    labelSpan.style.display = '';
  }
  tile.classList.remove(CSS_CLASSES.tileEditing);
}

export function updateTileStates() {
  if (!gridElement) return;

  const buttons = getFilterButtons();
  const tiles = gridElement.querySelectorAll(`.${CSS_CLASSES.tile}`);

  tiles.forEach((tile) => {
    const filterId = tile.dataset.filterId;
    const btn = buttons.find((b) => b.id === filterId);
    if (!btn) return;

    tile.classList.toggle(CSS_CLASSES.tileActive, btn.active);

    const badge = tile.querySelector(`.${CSS_CLASSES.tileBadge}`);
    if (badge) {
      const count = countMatchingRooms(btn);
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  });
}

export function destroyFilterTileGrid() {
  if (gridElement) {
    gridElement.remove();
    gridElement = null;
    restoreSidebarPaneHeight();
    log.debug('フィルターグリッドを削除しました');
  }
}
