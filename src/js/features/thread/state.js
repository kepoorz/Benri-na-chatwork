// スレッドパネル状態管理（セッション限定、chrome.storage不使用）

export const threadState = {
  isOpen: false,
  anchorMessageId: null,
  anchorRoomId: null,
  chain: [],
  savedRightColumnChildren: null,
};

export function openThread(roomId, messageId) {
  threadState.isOpen = true;
  threadState.anchorMessageId = messageId;
  threadState.anchorRoomId = roomId;
  threadState.chain = [];
}

export function closeThread() {
  threadState.isOpen = false;
  threadState.anchorMessageId = null;
  threadState.anchorRoomId = null;
  threadState.chain = [];
  threadState.savedRightColumnChildren = null;
}

export function setChain(chain) {
  threadState.chain = chain;
}

export function saveRightColumnChildren(children) {
  threadState.savedRightColumnChildren = children;
}
