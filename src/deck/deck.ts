import { DeckExporterCRB } from "./DeckExporterCRB";
import { IDeckExporter } from "./interface";

export type TGameNames = "crb";

export const getDeckExporter = (gameName: TGameNames): IDeckExporter => {
  switch (gameName) {
    case "crb":
      return new DeckExporterCRB();
    default:
      throw new Error(`Unsupported game: ${gameName}`);
  }
};

export const getGameName = (): TGameNames | undefined => {
  const url = window.location.href;
  if (url.includes("cookierunbraverse")) {
    return "crb";
  }
};
