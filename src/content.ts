import { getDeckExporter, getGameName } from "./deck/deck";
import { EVENT_NAMES, TMessage } from "./utils/event";

chrome.runtime.onMessage.addListener(
  async (msg: TMessage, sender, sendResponse) => {
    const gameName = getGameName();
    console.log(
      "received message in content script:",
      msg,
      "for game:",
      gameName,
    );

    if (!gameName) {
      console.warn("지원하지 않는 게임입니다.");
      return;
    }

    switch (msg.type) {
      case EVENT_NAMES.LOAD_DECK:
        const deckExporter = getDeckExporter(gameName);
        const deckImage = await deckExporter.createDeckImage();
        sendResponse({ payload: deckImage });
        break;
      default:
        console.warn("알 수 없는 메시지 타입:", msg);
        return;
    }

    return true; // async 대응
  },
);
