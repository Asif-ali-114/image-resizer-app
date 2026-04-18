# Image Resizer App

A production-ready browser-based image resizing application built with React + Vite.

## Features

- Single-image resize workflow: upload, resize, crop, preview, and download.
- Bulk resize workflow with ZIP export.
- Hybrid processing engine:
  - Web Worker pipeline for heavy and bulk processing.
  - WASM-powered high-quality resizing and encoding via jSquash.
  - Canvas fallback path for compatibility.
- Multiple output formats: JPG, PNG, WebP.
- Quality and size-target controls.
- Live preview and progress updates.

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS
- JSZip
- jSquash WASM modules (`@jsquash/resize`, `@jsquash/jpeg`, `@jsquash/png`, `@jsquash/webp`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

- `src/` application source
- `src/imagePipeline.js` hybrid routing + worker pool orchestration
- `src/imageProcessor.worker.js` off-main-thread decode/resize/encode pipeline
- `ui/` design reference assets
- `vite.config.js` Vite + worker and dependency configuration

## Notes

- `node_modules` and `dist` are ignored by Git.
- Add deployment-specific environment values in `.env` (not committed).
