/**
 * popup.js - ポップアップの動作を制御
 */

document.addEventListener('DOMContentLoaded', function () {
  const threadFeatureCheckbox = document.getElementById('thread-feature');

  // 設定読み込み
  chrome.storage.sync.get({ threadFeature: true }, function (items) {
    threadFeatureCheckbox.checked = items.threadFeature;
  });

  // スレッド機能トグル
  threadFeatureCheckbox.addEventListener('change', function () {
    chrome.storage.sync.set({ threadFeature: this.checked });
    sendMessageToContentScript({
      action: 'toggleThreadFeature',
      enabled: this.checked,
    });
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
