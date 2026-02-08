/**
 * WebP 카드 이미지 리스트를
 * Tabletop Simulator DeckBuilder용 카드 시트로 변환
 */
export async function buildDeckImage(
  cardImages: (string | Blob)[],
  options: DeckBuilderOptions
): Promise<Blob> {
  const {
    columns,
    rows,
    cardWidth,
    cardHeight,
    outputType = "image/png",
    outputQuality = 0.92,
  } = options;

  const maxCards = columns * rows;
  const images = cardImages.slice(0, maxCards);
  console.log(images);

  // 1️⃣ 이미지 로드
  const loadedImages = await Promise.all(images.map(loadImage));

  // 2️⃣ 캔버스 생성
  const canvas = document.createElement("canvas");
  canvas.width = columns * cardWidth;
  canvas.height = rows * cardHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  // 3️⃣ 카드 배치 (간격 0)
  loadedImages.forEach((img, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    if (row >= rows) return;

    ctx.drawImage(
      img,
      col * cardWidth,
      row * cardHeight,
      cardWidth,
      cardHeight
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
      outputType === "image/webp" ? outputQuality : undefined
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
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
  outputType?: string; // e.g., "image/png", "image/webp"
  outputQuality?: number; // 0 to 1, for image/webp
};
