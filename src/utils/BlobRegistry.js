class BlobRegistry {
  constructor() {
    this.urls = new Map();
  }

  register(url, tag) {
    if (!url || !tag) return;
    this.urls.set(tag, url);
  }

  release(tag) {
    if (!tag) return;
    const url = this.urls.get(tag);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.urls.delete(tag);
  }

  releaseAll() {
    for (const url of this.urls.values()) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }

  replaceUrl(tag, newUrl) {
    if (!tag) return;
    const oldUrl = this.urls.get(tag);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      this.urls.delete(tag);
    }
    if (newUrl) {
      this.urls.set(tag, newUrl);
    }
  }
}

export const blobRegistry = new BlobRegistry();
export { BlobRegistry };
