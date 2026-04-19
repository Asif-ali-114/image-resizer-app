export default class CanvasHistory {
  constructor(canvas) {
    this.canvas = canvas;
    this.history = [];
    this.redoStack = [];
    this.maxHistory = 50;
    this.isProcessing = false;
  }

  save() {
    if (this.isProcessing || !this.canvas) return;
    const json = JSON.stringify(this.canvas.toJSON());
    const last = this.history[this.history.length - 1];
    if (json === last) return;
    this.history.push(json);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.redoStack = [];
  }

  clear() {
    this.history = [];
    this.redoStack = [];
  }

  undo() {
    if (!this.canvas || this.history.length === 0) return;
    this.isProcessing = true;
    const current = JSON.stringify(this.canvas.toJSON());
    this.redoStack.push(current);
    const prev = this.history.pop();
    this.canvas.loadFromJSON(prev, () => {
      this.canvas.renderAll();
      this.isProcessing = false;
    });
  }

  redo() {
    if (!this.canvas || this.redoStack.length === 0) return;
    this.isProcessing = true;
    const current = JSON.stringify(this.canvas.toJSON());
    this.history.push(current);
    const next = this.redoStack.pop();
    this.canvas.loadFromJSON(next, () => {
      this.canvas.renderAll();
      this.isProcessing = false;
    });
  }

  getUndoCount() {
    return this.history.length;
  }

  getRedoCount() {
    return this.redoStack.length;
  }
}
