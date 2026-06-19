/**
 * Pauses inference while the user is selecting text.
 *
 * Privacy rationale: this reads only Selection.type/rangeCount. It never reads
 * selected text, range contents, DOM text, or clipboard data.
 */
export class SelectionInhibitor {
  private active = false;
  private listening = false;
  private readonly handleSelectionChange = (): void => {
    this.active = this.computeActive();
  };

  public start(): void {
    if (this.listening || typeof document === "undefined") {
      return;
    }

    document.addEventListener("selectionchange", this.handleSelectionChange);
    this.active = this.computeActive();
    this.listening = true;
  }

  public stop(): void {
    if (!this.listening || typeof document === "undefined") {
      return;
    }

    document.removeEventListener("selectionchange", this.handleSelectionChange);
    this.active = false;
    this.listening = false;
  }

  public isInhibited(): boolean {
    return this.active;
  }

  private computeActive(): boolean {
    if (typeof window === "undefined" || typeof window.getSelection !== "function") {
      return false;
    }

    const selection = window.getSelection();
    return selection !== null && selection.type === "Range" && selection.rangeCount > 0;
  }
}
