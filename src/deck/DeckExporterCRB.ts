import { buildDeckImage } from "../utils/card";
import { IDeckExporter } from "./interface";

class DeckExporterCRB implements IDeckExporter {
  createDeckImage(): Promise<Blob> {
    // Implementation for CRB game
    const mainDeck = document.querySelector(".main-deck");
    const extraDeck = document.querySelector(".extra-deck");

    const mainCards = mainDeck?.querySelectorAll("img");
    const extraCards = extraDeck?.querySelectorAll("img");
    const cardUrls: string[] = [];

    const insertCardUrls = (src: string) => {
      if (src.includes("storage")) {
        cardUrls.push(src);
      }
    };

    mainCards?.forEach((item) => {
      insertCardUrls(item.src);
    });
    extraCards?.forEach((item) => {
      insertCardUrls(item.src);
    });

    // Create the deck image using the collected card URLs
    return buildDeckImage(cardUrls, {
      columns: 10,
      rows: 7,
      cardWidth: 409,
      cardHeight: 585,
      outputType: "image/jpg",
      outputQuality: 0.6,
    });
  }
}

export { DeckExporterCRB };
