<img src=".github/eglador-logo.svg" alt="eglador-ui-react-data-table" width="200" />

# eglador-ui-react-data-table

[![npm version](https://img.shields.io/npm/v/eglador-ui-react-data-table?style=flat-square&color=blue)](https://www.npmjs.com/package/eglador-ui-react-data-table)
[![npm downloads](https://img.shields.io/npm/dm/eglador-ui-react-data-table?style=flat-square&color=green)](https://www.npmjs.com/package/eglador-ui-react-data-table)
[![license](https://img.shields.io/npm/l/eglador-ui-react-data-table?style=flat-square)](https://github.com/eglador/eglador-ui-react-data-table/blob/main/LICENSE)
![zero runtime deps](https://img.shields.io/badge/zero%20deps-runtime-22C55E?style=flat-square)
![tailwind v4](https://img.shields.io/badge/tailwindcss-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![react >= 18](https://img.shields.io/badge/react-%3E%3D18-61DAFB?style=flat-square&logo=react&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-ready-3178C6?style=flat-square&logo=typescript&logoColor=white)

Headless, accessible data table for React — column management, sorting, pagination, filtering, row selection, and a compound API for full markup control. **Tailwind CSS v4**, zero runtime dependencies.

> **Status:** Pre-alpha — API design in progress. The package scaffold (build, Storybook, CI) is in place; component implementation is next.

## Planned Features

- **Compound API** — `<DataTable.Root>`, `.Header`, `.Body`, `.Row`, `.Cell`, `.Pagination` for full markup control
- **Column management** — declarative column definitions with custom renderers, sortability, visibility, resizing
- **Sorting** — single / multi-column, controlled or uncontrolled, custom comparators
- **Pagination** — built-in pager with page size, jump-to, total count
- **Filtering** — column-level filters, global search, custom predicates
- **Row selection** — single / multiple, controlled or uncontrolled, with select-all
- **Empty / loading / error states** — first-class slots, no flash-of-empty
- **Server-side mode** — opt out of internal state for sorting / pagination / filtering when data lives on the server
- **Accessible** — semantic `<table>` markup, full keyboard navigation, ARIA roles for sortable headers and live status
- **TypeScript-first** — generic over row shape, every column inferred
- **Zero runtime dependencies** — only `clsx` + `tailwind-merge`, both pre-bundled

## Installation

```bash
npm install eglador-ui-react-data-table
```

**Peer dependencies:** `react >= 18` · `react-dom >= 18` · `tailwindcss ^4`

## Setup

Add the following to your global stylesheet so Tailwind picks up the component classes:

```css
@import "tailwindcss";
@source "../node_modules/eglador-ui-react-data-table";
```

The `@source` path is relative to the CSS file location:

| Framework | CSS file location | Path |
|---|---|---|
| Next.js (App Router) | `app/globals.css` | `../node_modules/eglador-ui-react-data-table` |
| Next.js (`src/`) | `src/app/globals.css` | `../../node_modules/eglador-ui-react-data-table` |
| Vite | `src/index.css` | `../node_modules/eglador-ui-react-data-table` |

## Compatibility

Works with any React-based framework: **Next.js**, **Remix**, **Vite + React**, **Gatsby**.

The component is marked `"use client"` (uses `useState` / `useEffect`). Place it inside a client component or after a `"use client"` directive.

## Development

```bash
npm install
npm run dev               # tsup watch mode
npm run build             # production build to dist/
npm run typecheck         # tsc --noEmit
npm run storybook         # Storybook dev (http://localhost:6006)
npm run build-storybook   # static Storybook export
```

## Publishing

Publishing is automated via GitHub Actions. When a GitHub Release is created, the package is published to npm.

1. Update `version` in `package.json`
2. Commit and push
3. Create a GitHub Release with a matching tag (e.g. `v1.0.0`)

## Author

Kenan Gündoğan — [https://github.com/kenangundogan](https://github.com/kenangundogan)

Maintained under [Eglador](https://github.com/eglador)

## License

MIT
