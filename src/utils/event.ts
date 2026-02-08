export enum EVENT_NAMES {
  LOAD_DECK = "load_deck",
}

export type TMessage = {
  type: EVENT_NAMES;
  payload?: any;
};
