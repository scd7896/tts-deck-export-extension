import { getDeckExporter, getGameName } from "./deck/deck";
import { EVENT_NAMES, TMessage } from "./utils/event";
import { blobToBase64 } from "./utils/file";

chrome.runtime.onMessage.addListener((msg: TMessage, sender, sendResponse) => {
  const gameName = getGameName();

  if (!gameName) {
    console.warn("지원하지 않는 게임입니다.");
    return;
  }

  switch (msg.type) {
    case EVENT_NAMES.LOAD_IMAGE:
      const deckExporter = getDeckExporter(gameName);
      deckExporter
        .createDeckImage()
        .then((deckImage) => blobToBase64(deckImage))
        .then((base64) => {
          console.log("Deck image base64:", base64);
          sendResponse({ type: EVENT_NAMES.LOAD_IMAGE, payload: base64 });
        });
      return true; // async 대응
    default:
      console.warn("알 수 없는 메시지 타입:", msg);
      return;
  }
});
