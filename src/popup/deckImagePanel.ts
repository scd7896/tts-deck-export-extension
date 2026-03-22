import { EVENT_NAMES } from "../utils/event";
import { downloadImage } from "../utils/file";

type DeckImagePanelElements = {
  downloadButton: HTMLButtonElement;
  toggleDeckButton: HTMLButtonElement;
  deckImage: HTMLImageElement;
  deckImageBody: HTMLDivElement;
};

export function createDeckImagePanel({
  downloadButton,
  toggleDeckButton,
  deckImage,
  deckImageBody,
}: DeckImagePanelElements) {
  let isDeckCollapsed = false;

  downloadButton.addEventListener("click", () => {
    if (!deckImage.src) {
      console.warn("No deck image found to download");
      return;
    }

    downloadImage(deckImage.src, "deck.jpg");
  });

  toggleDeckButton.addEventListener("click", () => {
    isDeckCollapsed = !isDeckCollapsed;
    deckImageBody.hidden = isDeckCollapsed;
    toggleDeckButton.textContent = isDeckCollapsed ? "펼치기" : "접기";
  });

  return {
    async loadDeckImage() {
      const response = await chrome.runtime.sendMessage({
        type: EVENT_NAMES.LOAD_IMAGE,
      });

      console.log("loadImage response:", response);
      const deckImageBase64 = response?.payload as string | undefined;

      if (deckImageBase64 === undefined) {
        console.warn("No deck image received");
        return null;
      }

      deckImage.src = deckImageBase64;
      downloadButton.disabled = false;
      return deckImageBase64;
    },
  };
}
