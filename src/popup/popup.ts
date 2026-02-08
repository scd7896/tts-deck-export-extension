import { EVENT_NAMES } from "../utils/event";

document.getElementById("btn")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CHECK_DOM" });
});

function init() {
  chrome.runtime.sendMessage({ type: EVENT_NAMES.LOAD_DECK }, (response) => {
    const deckImageBlob = response?.payload as Blob;
    console.log("Received deck image blob:", deckImageBlob);
    if (deckImageBlob === undefined) {
      console.warn("No deck image received");
      return;
    }
    const url = URL.createObjectURL(deckImageBlob);
    const imgElement = document.getElementById(
      "deck-image",
    ) as HTMLImageElement;
    imgElement.src = url;
  });
}

init();
