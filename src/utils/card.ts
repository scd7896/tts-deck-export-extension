import { EVENT_NAMES, TMessage } from "./event";

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
  if (typeof source === "string") {
    return loadRemoteImage(source);
  }

  return loadImageElement(source);
}

export type DeckBuilderOptions = {
  outputType?: string; // e.g., "image/png", "image/webp"
  outputQuality?: number; // 0 to 1, for image/webp
};

function loadRemoteImage(source: string): Promise<HTMLImageElement> {
  if (shouldUseExtensionFetch(source)) {
    console.log("Loading card image via extension fetch:", source);
    return requestImageDataUrl(source).then((dataUrl) => loadImageElement(dataUrl));
  }

  return loadImageElement(source).catch(async () => {
    console.warn("Direct image load failed, trying extension fetch:", source);
    const dataUrl = await requestImageDataUrl(source);
    return loadImageElement(dataUrl);
  });
}

function loadImageElement(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl: string | null = null;

    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve(img);
    };
    img.onerror = (error) => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(error);
    };

    if (typeof source === "string") {
      img.src = source;
      return;
    }

    objectUrl = URL.createObjectURL(source);
    img.src = objectUrl;
  });
}

async function requestImageDataUrl(url: string): Promise<string> {
  console.log("Requesting image from content to background:", url);

  const response = (await chrome.runtime.sendMessage({
    type: EVENT_NAMES.LOAD_CACHED_IMAGE,
    payload: url,
  } as TMessage)) as {
    payload?: string;
    isError?: boolean;
  };

  console.log("Received image response from background:", {
    url,
    hasResponse: !!response,
    isError: response?.isError,
    hasPayload: !!response?.payload,
    payloadStartsWithDataUrl:
      typeof response?.payload === "string" &&
      response.payload.startsWith("data:"),
  });

  if (response?.isError || !response?.payload) {
    throw new Error(`Failed to load image via extension fetch: ${url}`);
  }

  return response.payload;
}

function shouldUseExtensionFetch(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === "assets.cookierunbraverse.com";
  } catch {
    return false;
  }
}
