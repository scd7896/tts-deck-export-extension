export const CARD_WIDTH = 409;
export const CARD_HEIGHT = 585;
export const CARD_COLUMNS = 10;
export const CARD_ROWS = 7;

/**
 * WebP 카드 이미지 리스트를
 * Tabletop Simulator DeckBuilder용 카드 시트로 변환
 */
export async function buildDeckImage(
  cardImages: (string | Blob)[],
  options: DeckBuilderOptions,
): Promise<Blob> {
  const { outputType = "image/jpg", outputQuality = 0.92 } = options;

  const maxCards = CARD_COLUMNS * CARD_ROWS;
  const images = cardImages.slice(0, maxCards);

  // 1️⃣ 이미지 로드
  const loadedImages = await Promise.all(images.map(loadImage));

  // 2️⃣ 캔버스 생성
  const canvas = document.createElement("canvas");
  canvas.width = CARD_COLUMNS * CARD_WIDTH;
  canvas.height = CARD_ROWS * CARD_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  // 3️⃣ 카드 배치 (간격 0)
  loadedImages.forEach((img, index) => {
    const col = index % CARD_COLUMNS;
    const row = Math.floor(index / CARD_COLUMNS);

    if (row >= CARD_ROWS) return;

    ctx.drawImage(
      img,
      col * CARD_WIDTH,
      row * CARD_HEIGHT,
      CARD_WIDTH,
      CARD_HEIGHT,
    );
  });

  // 4️⃣ 결과 이미지 반환
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error("Failed to export deck image");
        }
        resolve(blob);
      },
      outputType,
      outputType === "image/webp" ? outputQuality : undefined,
    );
  });
}

function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = reject;

    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

export type DeckBuilderOptions = {
  outputType?: string; // e.g., "image/png", "image/webp"
  outputQuality?: number; // 0 to 1, for image/webp
};
