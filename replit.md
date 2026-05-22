# TREO TOOL'S (Student Tools Hub)

Brand: **TREO TOOL'S** — logo at `artifacts/student-tools/src/components/Logo.tsx` (sources `attached_assets/Generated_image_1779469447376.png`, also copied to `public/logo.png` for favicon). Logo is black and uses `dark:invert` to render white in dark mode.

An all-in-one student toolkit web app — image converters, PDF tools, background remover, photo resizer, scientific calculator, and Word document maker. Everything runs client-side in the browser; no server uploads.

## Run & Operate

- `pnpm --filter @workspace/student-tools run dev` — run the frontend (auto via workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui
- Routing: wouter
- PDF: pdf-lib, pdfjs-dist
- Image: browser-image-compression, @imgly/background-removal
- Docs: docx (Word .docx generation)
- API: Express 5 (minimal, health check only)

## Where things live

- `artifacts/student-tools/src/pages/` — all tool pages
- `artifacts/student-tools/src/pages/image/` — image conversion tools
- `artifacts/student-tools/src/pages/pdf/` — PDF tools
- `artifacts/student-tools/src/pages/docs/` — document tools
- `artifacts/student-tools/src/components/` — shared components (ToolLayout, FileDropZone)
- `artifacts/student-tools/src/App.tsx` — routing
- `artifacts/student-tools/src/index.css` — theme (indigo/violet primary)

## Tools included

Image: JPG→PDF, PDF→JPG, JPG→PNG, PNG→JPG, PNG→PDF, PDF→PNG, Photo Resizer, Background Remover
PDF: Maker, Editor, Locker, Unlocker, Merger, Splitter, Compressor, Text→PDF
Docs: Word File Maker (.docx)
Utilities: Scientific Calculator

## Architecture decisions

- All file processing is 100% client-side — no backend uploads
- pdf-lib for creating/modifying PDFs; pdfjs-dist for rendering/reading PDFs
- @imgly/background-removal uses ONNX AI model in the browser (15-30s processing)
- browser-image-compression for photo resizing/compression
- docx library generates .docx Word files in the browser
- Indigo/violet primary color scheme with category-coded accent colors

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Background removal loads an AI model on first use — takes 15-30 seconds, which is normal
- pdfjs-dist worker must be configured with `workerSrc` pointing to the CDN/bundled worker
- docx library generates Word files without needing a backend

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
