import { EMOJI_LIST, CSS_CLASSES } from './constants.js';
import { logger } from '../../utils/logging/logger.js';

const log = logger.withContext('EmojiPicker');

let currentPicker = null;
let outsideClickHandler = null;

export function showEmojiPicker(targetTileElement, currentEmoji, onSelect) {
  hideEmojiPicker();

  log.debug('絵文字ピッカーを表示', { currentEmoji });

  const picker = document.createElement('div');
  picker.className = CSS_CLASSES.emojiPicker;

  // カテゴリタブ
  const tabs = document.createElement('div');
  tabs.className = CSS_CLASSES.emojiPickerTabs;

  const grid = document.createElement('div');
  grid.className = CSS_CLASSES.emojiPickerGrid;

  const categories = Object.keys(EMOJI_LIST);

  function renderCategory(category) {
    grid.innerHTML = '';
    EMOJI_LIST[category].forEach((emoji) => {
      const item = document.createElement('span');
      item.className = CSS_CLASSES.emojiPickerItem;
      item.textContent = emoji;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        log.debug('絵文字を選択', { emoji });
        onSelect(emoji);
        hideEmojiPicker();
      });
      grid.appendChild(item);
    });

    // タブのアクティブ状態更新
    tabs.querySelectorAll(`.${CSS_CLASSES.emojiPickerTab}`).forEach((tab) => {
      tab.classList.toggle(CSS_CLASSES.emojiPickerTabActive, tab.dataset.category === category);
    });
  }

  categories.forEach((category) => {
    const tab = document.createElement('span');
    tab.className = CSS_CLASSES.emojiPickerTab;
    tab.textContent = category;
    tab.dataset.category = category;
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      renderCategory(category);
    });
    tabs.appendChild(tab);
  });

  picker.appendChild(tabs);
  picker.appendChild(grid);

  // 初期カテゴリ表示
  renderCategory(categories[0]);

  // targetTile付近に配置
  const rect = targetTileElement.getBoundingClientRect();
  picker.style.position = 'absolute';
  picker.style.top = `${rect.bottom + window.scrollY + 4}px`;
  picker.style.left = `${rect.left + window.scrollX}px`;
  picker.style.zIndex = '10001';

  document.body.appendChild(picker);
  currentPicker = picker;

  // 外側クリックで閉じる
  outsideClickHandler = (e) => {
    if (!picker.contains(e.target) && !targetTileElement.contains(e.target)) {
      hideEmojiPicker();
    }
  };
  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler);
  }, 0);
}

export function hideEmojiPicker() {
  if (currentPicker) {
    currentPicker.remove();
    currentPicker = null;
    log.debug('絵文字ピッカーを非表示');
  }
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler);
    outsideClickHandler = null;
  }
}
