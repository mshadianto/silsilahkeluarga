# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-file React application (`silsilah-keluarga.jsx`) for displaying and managing the family tree (silsilah) of the HM Syachroel AP family. The UI is in Indonesian (Bahasa Indonesia). Built with Vite + React 18, deployed to GitHub Pages via GitHub Actions.

## Build & Development

```bash
npm install          # install dependencies
npm run dev          # start dev server (Vite)
npm run build        # production build → dist/
npm run preview      # preview production build locally
```

Deployment is automatic — pushing to `main` triggers `.github/workflows/deploy.yml` which builds and deploys to GitHub Pages. The `base` in `vite.config.js` is set to `/silsilahkeluarga/`.

## Architecture

The app logic lives in a single file `silsilah-keluarga.jsx` (~1700 lines). Entry point is `src/main.jsx` which mounts the app and provides a `window.storage` polyfill using `localStorage`.

### Sections in `silsilah-keluarga.jsx`

1. **Constants & Config** — Storage key (`silsilah-syachroel-v2`), gender/relation/view enums, generation color palette
2. **Storage module** — Async wrapper around `window.storage` (get/set/delete key-value)
3. **FamilyEngine** — Stateless business logic: CRUD helpers, tree traversal (`getChildren`, `getParent`, `getSiblings`, `getRoots`, `getGeneration`, `getDescendantCount`, `getAncestorPath`), stats aggregation, search, JSON import/export. All functions take the `people` flat array as input.
4. **DEMO_DATA** — Hardcoded seed data for the Syachroel family (3 generations, ~30 members) with stable string IDs (e.g. `p_syachroel`)
5. **Icon components** — Inline SVG icons as React components
6. **CSS** — All styles in a template literal injected via `<style>{css}</style>`. Light theme, CSS custom properties, responsive breakpoints at 768px and 480px. Fonts: Playfair Display (headings) and DM Sans (body) from Google Fonts.
7. **Utility components** — `ConfirmDialog`, `Tooltip`
8. **View components** — `PersonCard`, `TreeNode` (recursive), `TreeView` (with zoom), `ListView`, `StatsView`, `TimelineView`
9. **Modal components** — `PersonDetail` (with breadcrumb + quick actions), `PersonForm` (with photo upload), `ImportExportModal` (copy/download)
10. **App** — Main component managing state (people array, view mode, search, modals, confirm dialog, toast). Default export.

## Key Data Model

Each person is a flat object in the `people` array:
- `id`, `name`, `gender` ("male"/"female"), `birthDate`, `deathDate`, `birthPlace`, `photo` (base64 data URL or empty), `notes`
- `parentId` — links to the biological parent (children found via filter)
- `spouseId` — bidirectional spouse link (both partners reference each other)
- `createdAt`

Tree structure is derived at render time via `FamilyEngine.buildTree()` — no separate tree data structure is stored.

## Important Patterns

- **Spouse linking is bidirectional**: `handleSave` is called twice — once for the person, once to link the partner's `spouseId`. The callback signature `onSave(null, spouseId, personId)` handles the linking call.
- **Deletion guard**: Cannot delete a person who has children. Uses `ConfirmDialog` to inform the user.
- **Photo upload**: Files are read via `FileReader`, resized to 200px max via canvas, compressed as JPEG 80%, stored as base64 data URLs in localStorage. Max 500KB input.
- **Form prefill**: `PersonForm` accepts a `prefill` prop for pre-populating parent/spouse when using quick actions ("Tambah Anak" / "Tambah Pasangan") from `PersonDetail`.
- **Custom dialogs**: All confirmations use `ConfirmDialog` (no browser `alert`/`confirm`). Supports Enter to confirm, Escape to cancel.
- **Keyboard shortcuts**: `Ctrl+K` focuses search, `Ctrl+N` opens add form, `Escape` closes any modal.
- **Zoom controls**: `TreeView` has zoom in/out/reset (50%–150%).
- **Breadcrumb lineage**: `PersonDetail` shows clickable ancestor path.
- **All state is in App**: The `people` array is the single source of truth. Views derive everything via `FamilyEngine`.
- **localStorage polyfill**: `src/main.jsx` provides `window.storage` backed by `localStorage`, keeping the main component decoupled from the storage backend.
