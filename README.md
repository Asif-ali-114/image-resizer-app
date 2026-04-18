# Image Resizer App

Image Resizer App is a browser-based image tool built with React 18 and Vite 5.

It supports:
- Single-image workflow: upload, resize, optional crop, preview, and download.
- Bulk workflow: process multiple images and download a ZIP.
- Format conversion to JPG, PNG, and WebP.
- Local-only processing with worker/WASM and canvas fallback paths.

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment variables

This project has no required environment variables. All processing runs client-side.
