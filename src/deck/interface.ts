export interface IDeckExporter {
  createDeckImage(): Promise<Blob>;
}
