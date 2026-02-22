export enum EVENT_NAMES {
  LOAD_DECK = "load_deck",
  LOAD_IMAGE = "load_image",
  LOAD_CACHED_IMAGE = "load_cached_image",
}

export type TMessage = {
  type: EVENT_NAMES;
  payload?: any;
};
