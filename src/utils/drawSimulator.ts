import { CARD_COLUMNS, CARD_HEIGHT, CARD_ROWS, CARD_WIDTH } from "./card";

export type Deck = {
  shuffle: () => void;
  reset: (shuffle?: boolean) => void;
  draw: (count: number) => Blob[]; // count 장을 뽑아 반환 (남은 만큼)
};

export async function createDeckFromSheet(
  sheet: Blob | string,
  maxCards = 60,
): Promise<Deck> {
  const columns = CARD_COLUMNS;
  const rows = CARD_ROWS;
  const cardWidth = CARD_WIDTH;
  const cardHeight = CARD_HEIGHT;
  const totalCells = Math.min(columns * rows, maxCards);

  const sheetImg = await loadImage(sheet);

  // crop each card into Blob (PNG)
  const cardBlobs: Blob[] = [];
  for (let i = 0; i < totalCells; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const sx = col * cardWidth;
    const sy = row * cardHeight;

    const blob = await cropImageToBlob(
      sheetImg,
      sx,
      sy,
      cardWidth,
      cardHeight,
      "image/png",
    );
    cardBlobs.push(blob);
  }

  // deck state
  let deck = cardBlobs.slice();
  const original = cardBlobs.slice();
  let pos = 0;

  const fyShuffle = (arr: any[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  return {
    shuffle: () => {
      const tail = deck.slice(pos);
      fyShuffle(tail);
      deck = deck.slice(0, pos).concat(tail);
    },
    reset: (shouldShuffle = true) => {
      deck = original.slice();
      pos = 0;
      if (shouldShuffle) fyShuffle(deck);
    },
    draw: (count: number) => {
      if (count <= 0) return [];
      const available = deck.length - pos;
      const take = Math.min(count, available);
      const slice = deck.slice(pos, pos + take);
      pos += take;
      return slice;
    },
  };
}

/* Helpers */

function loadImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image"));
    if (typeof source === "string") {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.src = url;
      // revoke after load
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
    }
  });
}

function cropImageToBlob(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  type: string,
  quality?: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to crop card"));
        else resolve(blob as Blob);
      },
      type,
      quality,
    );
  });
}
