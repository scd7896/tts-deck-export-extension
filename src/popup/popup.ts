import { EVENT_NAMES } from "../utils/event";
import { downloadImage } from "../utils/file";

const downloadButton = document.getElementById(
  "download-button",
) as HTMLButtonElement;

let img = document.createElement("img");
img.className = "deck-image";
img.style.width = "450px";
document.body.appendChild(img);

downloadButton.addEventListener("click", () => {
  const img = document.querySelector(".deck-image") as HTMLImageElement;
  if (!img) {
    console.warn("No deck image found to download");
    return;
  }
  downloadImage(img.src, "deck.jpg");
});

function init() {
  chrome.runtime
    .sendMessage({ type: EVENT_NAMES.LOAD_IMAGE })
    .then((response) => {
      console.log("loadImage response:", response);
      const deckImageBase64 = response?.payload as string;

      if (deckImageBase64 === undefined) {
        console.warn("No deck image received");
        return;
      }
      img.src = response.payload;
      downloadButton.disabled = false;
    });
}

init();
