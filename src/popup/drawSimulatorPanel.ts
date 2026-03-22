import { createDeckFromSheet, Deck } from "../utils/drawSimulator";

type DrawSimulatorPanelElements = {
  drawButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  drawnCards: HTMLDivElement;
  drawPlaceholder: HTMLParagraphElement;
  drawCount: HTMLSpanElement;
};

export function createDrawSimulatorPanel({
  drawButton,
  resetButton,
  drawnCards,
  drawPlaceholder,
  drawCount,
}: DrawSimulatorPanelElements) {
  let deck: Deck | null = null;
  let drawnCardUrls: string[] = [];
  let drawnCount = 0;

  drawButton.addEventListener("click", async () => {
    if (!deck) {
      console.warn("Deck is not ready");
      return;
    }

    const [card] = deck.draw(1);
    if (!card) {
      showPlaceholder("더 이상 뽑을 카드가 없습니다. 리셋 후 다시 시도해 주세요.");
      return;
    }

    await appendDrawnCard(card);
  });

  resetButton.addEventListener("click", () => {
    if (!deck) {
      console.warn("Deck is not ready");
      return;
    }

    deck.reset();
    clearDrawnCards();
    showPlaceholder("덱을 초기화했습니다. 다시 한 장을 뽑아보세요.");
    updateDrawCount();
  });

  return {
    async initialize(sheetImage: string) {
      deck = await createDeckFromSheet(sheetImage);
      deck.reset();
      drawButton.disabled = false;
      resetButton.disabled = false;
      clearDrawnCards();
      updateDrawCount();
      showPlaceholder("덱 준비 완료. 아래 버튼으로 카드를 뽑을 수 있습니다.");
    },
  };

  async function appendDrawnCard(card: Blob) {
    const cardUrl = URL.createObjectURL(card);
    drawnCardUrls.push(cardUrl);
    drawnCount += 1;

    const cardImage = document.createElement("img");
    cardImage.className = "drawn_card";
    cardImage.src = cardUrl;
    cardImage.alt = `드로우한 카드 ${drawnCount}`;
    drawnCards.appendChild(cardImage);

    showPlaceholder("지금까지 드로우한 카드입니다.");
    updateDrawCount();
  }

  function clearDrawnCards() {
    for (const drawnCardUrl of drawnCardUrls) {
      URL.revokeObjectURL(drawnCardUrl);
    }

    drawnCardUrls = [];
    drawnCount = 0;
    drawnCards.replaceChildren();
  }

  function showPlaceholder(message: string) {
    drawPlaceholder.textContent = message;
    drawPlaceholder.hidden = drawnCount > 0;
  }

  function updateDrawCount() {
    drawCount.textContent = `${drawnCount}장 드로우됨`;
  }
}
