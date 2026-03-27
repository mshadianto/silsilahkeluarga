# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-file React application (`silsilah-keluarga.jsx`) for displaying and managing the family tree (silsilah) of the HM Syachroel AP family. The UI is in Indonesian (Bahasa Indonesia). There is no build system, package.json, or bundler — the file is designed to run in an environment that provides React and a `window.storage` API (get/set/delete with a key-value interface).

## Architecture

Everything lives in `silsilah-keluarga.jsx` (~1470 lines), organized into these sections:

1. **Constants & Config** (lines 8–18) — Storage key, gender/relation/view enums, generation color palette
2. **Storage module** (lines 20–40) — Async wrapper around `window.storage` for persistence under key `silsilah-syachroel-v2`
3. **FamilyEngine** (lines 42–145) — Pure business logic: CRUD helpers, tree traversal (getChildren, getParent, getSiblings, getRoots, getGeneration, getDescendantCount), stats aggregation, search, JSON import/export. All functions are stateless and take `people` (the flat array) as input.
4. **DEMO_DATA** (lines 147–222) — Hardcoded seed data for the Syachroel family (3 generations, ~30 members). Uses stable string IDs (e.g. `p_syachroel`).
5. **Icon components** (lines 224–242) — Inline SVG icons as React components
6. **CSS** (lines 244–895) — All styles in a template literal injected via `<style>{css}</style>`. Dark theme, CSS variables, responsive breakpoints at 768px. Fonts: Playfair Display (headings) and DM Sans (body) loaded from Google Fonts.
7. **View components** (lines 897–1077) — `PersonCard`, `TreeNode` (recursive), `TreeView`, `ListView`, `StatsView`, `TimelineView`
8. **Modal components** (lines 1079–1306) — `PersonDetail`, `PersonForm`, `ImportExportModal`
9. **App** (lines 1308–1471) — Main component managing state (people array, view mode, search, modals, toast). Default export.

## Key Data Model

Each person is a flat object in a `people` array with these fields:
- `id`, `name`, `gender` ("male"/"female"), `birthDate`, `deathDate`, `birthPlace`, `photo`, `notes`
- `parentId` — links to the biological parent (one parent per person; children are found via filter)
- `spouseId` — bidirectional spouse link (both partners reference each other)
- `createdAt`

Tree structure is derived at render time via `FamilyEngine.buildTree()` — there is no separate tree data structure stored.

## Important Patterns

- **Spouse linking is bidirectional**: When saving a person with a spouse, `handleSave` is called twice — once for the person, once to set `spouseId` on the partner. The `PersonForm.handleSave` callback signature uses `onSave(null, spouseId, personId)` for the linking call.
- **Deletion guard**: A person cannot be deleted if they have children. Uses custom `ConfirmDialog` to inform the user.
- **No build step**: No npm/webpack/vite. The JSX file expects a host environment (e.g., Val Town, similar playground) that transpiles JSX and provides React + `window.storage`.
- **All state is in App**: The `people` array is the single source of truth. Views receive it as a prop and derive everything via `FamilyEngine`.
- **Custom dialogs**: All confirmations use the `ConfirmDialog` component (no browser `alert`/`confirm`). Supports keyboard (Enter to confirm, Escape to cancel).
- **Form prefill**: `PersonForm` accepts a `prefill` prop for pre-populating parent/spouse when using quick actions ("Tambah Anak" / "Tambah Pasangan") from PersonDetail.
- **Keyboard shortcuts**: Ctrl+K focuses search, Ctrl+N opens add form, Escape closes any modal.
- **Zoom controls**: TreeView has zoom in/out/reset (50%–150%) for navigating large trees.
- **Photo avatar**: Person cards and detail views display a photo image if the `photo` URL field is populated, otherwise fall back to initials.
- **Breadcrumb lineage**: PersonDetail shows clickable ancestor path (e.g. Grandparent > Parent > Person).
