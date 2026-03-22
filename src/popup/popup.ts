import { createDeckImagePanel } from "./deckImagePanel";
import "./popup.css";
import { createDrawSimulatorPanel } from "./drawSimulatorPanel";

function init() {
  const deckImagePanel = createDeckImagePanel({
    downloadButton: document.getElementById(
      "download-button",
    ) as HTMLButtonElement,
    toggleDeckButton: document.getElementById(
      "toggle-deck-button",
    ) as HTMLButtonElement,
    deckImage: document.querySelector(".deck_image") as HTMLImageElement,
    deckImageBody: document.querySelector(".deck_image_body") as HTMLDivElement,
  });

  const drawSimulatorPanel = createDrawSimulatorPanel({
    drawButton: document.getElementById("draw-button") as HTMLButtonElement,
    resetButton: document.getElementById("reset-button") as HTMLButtonElement,
    drawnCards: document.querySelector(".drawn_cards") as HTMLDivElement,
    drawPlaceholder: document.querySelector(
      ".draw_placeholder",
    ) as HTMLParagraphElement,
    drawCount: document.querySelector(".draw_count") as HTMLSpanElement,
  });

  deckImagePanel.loadDeckImage().then((deckImageBase64) => {
    if (!deckImageBase64) {
      return;
    }

    return drawSimulatorPanel.initialize(deckImageBase64);
  });
}

init();
