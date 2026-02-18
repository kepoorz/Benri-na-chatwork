/**
 * popup.js - ポップアップの動作を制御
 */

document.addEventListener('DOMContentLoaded', function () {
  const filterFeatureCheckbox = document.getElementById('filter-feature');
  const resetBtn = document.getElementById('reset-filters');

  // 設定読み込み
  chrome.storage.sync.get({ filterFeature: true }, function (items) {
    filterFeatureCheckbox.checked = items.filterFeature;
  });

  // フィルター機能トグル
  filterFeatureCheckbox.addEventListener('change', function () {
    chrome.storage.sync.set({ filterFeature: this.checked });
    sendMessageToContentScript({
      action: 'toggleFilterFeature',
      enabled: this.checked,
    });
  });

  // リセットボタン
  resetBtn.addEventListener('click', function () {
    if (confirm('フィルター設定をデフォルトに戻しますか？')) {
      chrome.storage.sync.remove('filterButtons', function () {
        sendMessageToContentScript({ action: 'resetFilters' });
        // 視覚的フィードバック
        resetBtn.textContent = 'リセット完了！';
        resetBtn.style.backgroundColor = '#5fb878';
        setTimeout(() => {
          resetBtn.textContent = 'フィルター設定をリセット';
          resetBtn.style.backgroundColor = '#ff6b6b';
        }, 2000);
      });
    }
  });
});

function sendMessageToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (
      tabs[0] &&
      (tabs[0].url.includes('chatwork.com') || tabs[0].url.includes('kcw.kddi.ne.jp'))
    ) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}
