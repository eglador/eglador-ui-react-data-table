<img src=".github/eglador-logo.svg" alt="eglador-ui-react-data-table" width="200" />

# eglador-ui-react-data-table

[![npm version](https://img.shields.io/npm/v/eglador-ui-react-data-table?style=flat-square&color=blue)](https://www.npmjs.com/package/eglador-ui-react-data-table)
[![npm downloads](https://img.shields.io/npm/dm/eglador-ui-react-data-table?style=flat-square&color=green)](https://www.npmjs.com/package/eglador-ui-react-data-table)
[![license](https://img.shields.io/npm/l/eglador-ui-react-data-table?style=flat-square)](https://github.com/eglador/eglador-ui-react-data-table/blob/main/LICENSE)
![zero runtime deps](https://img.shields.io/badge/zero%20deps-runtime-22C55E?style=flat-square)
![tailwind v4](https://img.shields.io/badge/tailwindcss-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![react >= 18](https://img.shields.io/badge/react-%3E%3D18-61DAFB?style=flat-square&logo=react&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-ready-3178C6?style=flat-square&logo=typescript&logoColor=white)

Schema-driven, accessible data table for React. Backend bir schema endpoint sunar — frontend kolon, filter, sort, include, pagination ve form metadata'sını otomatik okur. **Tailwind CSS v4**, zero runtime dependencies, TypeScript-first.

## Highlights

- **Schema-driven** — tek endpoint, sıfır kolon konfigürasyonu
- **Compound API** — `<DataTable.Root>`, `.Header`, `.Body`, `.Row`, `.Cell`, `.Toolbar`, `.Search`, `.FilterBar`, `.Pagination`
- **Headless hooks** — `useDataTable`, `useAutoColumns`, `useSchema`
- **Spatie Query Builder adapter** — `filter[X]=Y`, `sort=-X`, `include=a,b`, `page[size]=N`
- **16 filter operators** — eq, neq, gt(e), lt(e), contains, starts/ends_with, in/not_in, between, is_null/is_not_null, is_true/is_false
- **Multi-sort** — Shift / Cmd / Ctrl + click
- **Selection** — single / multiple, controlled & uncontrolled
- **URL sync** — durum URL'e yansır, sayfa yenilense de korunur
- **Density** — compact / comfortable / spacious
- **Variants** — default / bordered / striped / minimal
- **Sticky header & footer**, sticky kolonlar (left/right)
- **Custom columns** — render override, accessor, label, width, sticky, align
- **Added columns** — select / drag / actions / expander (start/end pozisyon)
- **Auto relation render** — relation objelerinden `name` / `title` / `slug` otomatik çıkarım
- **i18n** — tüm label'lar schema'dan; frontend hardcode etmez
- **Schema-driven search** — `searchable: true` field'lardan otomatik placeholder, `min_length` threshold'u
- **Tailwind v4** — zinc paleti, `rounded-sm`, modern utility-first
- **Zero runtime deps** — `clsx` + `tailwind-merge` pre-bundled
- **TypeScript-first** — row shape üzerinde generic, schema tip-safe

## Installation

```bash
npm install eglador-ui-react-data-table
```

**Peer dependencies:** `react >= 18` · `react-dom >= 18` · `tailwindcss ^4`

## Setup

```css
/* app/globals.css */
@import "tailwindcss";
@source "../node_modules/eglador-ui-react-data-table";
```

| Framework | CSS file | `@source` path |
|---|---|---|
| Next.js (App Router) | `app/globals.css` | `../node_modules/eglador-ui-react-data-table` |
| Next.js (`src/`) | `src/app/globals.css` | `../../node_modules/eglador-ui-react-data-table` |
| Vite | `src/index.css` | `../node_modules/eglador-ui-react-data-table` |

## Quick start

```tsx
import { DataTable } from "eglador-ui-react-data-table";

export default function ArticlesPage() {
  return <DataTable endpoint="/api/v1/articles" />;
}
```

Schema endpoint otomatik infer edilir (`/api/v1/articles` → `/api/v1/schema/articles`). Toolbar özelliklerini açın:

```tsx
<DataTable
  endpoint="/api/v1/articles"
  search
  filters
  pagination
  refresh
  density
  columnVisibility
  selection="multiple"
/>
```

## Schema yapısı (özet)

```json
{
  "data": {
    "type": "articles",
    "labels": { "singular": "Makale", "plural": "Makaleler" },
    "fields": {
      "title": {
        "type": "string",
        "label": "Başlık",
        "in": ["list", "show", "create", "update"],
        "sortable": true,
        "searchable": true,
        "filter": { "operator": "partial" },
        "form": { "input": "text", "required": true, "max": 255 }
      }
    },
    "relations": {
      "category": {
        "type": "belongs_to",
        "target": "categories",
        "label": "Kategori",
        "default_loaded": true,
        "in": ["list", "show"]
      }
    },
    "virtual_filters": [
      { "field": "search", "operator": "fulltext", "label": "Arama", "min_length": 2 }
    ],
    "endpoints": {
      "list": {
        "method": "GET",
        "default_sort": "-published_at",
        "pagination": { "default_size": 15, "max_size": 100 }
      }
    }
  }
}
```

Schema-driven her şey:

- Sütun başlıkları & filter chip'leri: `field.label`
- Sortable kolonlar: `field.sortable: true`
- Default sort: `endpoints.list.default_sort`
- Filter UI türleri: `field.filter.operator`'a göre
- Async select option'ları: `field.source` lookup endpoint
- Default visible: `field.default_visible !== false`
- Pagination params: `pagination.{number,size}_parameter`
- Title: `labels.plural`
- Search placeholder: `searchable: true` field'lardan kompoze

## Custom columns

```tsx
<DataTable
  endpoint="/api/v1/articles"
  customColumns={[
    {
      field: "title",
      minWidth: 280,
      render: (_v, row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <div className="text-xs text-zinc-500">{row.slug}</div>
        </div>
      ),
    },
  ]}
/>
```

## Headless mode

Tam custom render:

```tsx
import { useDataTable, laravelAdapter } from "eglador-ui-react-data-table";

const source = laravelAdapter({ endpoint: "/api/v1/articles" });
const table = useDataTable({
  source,
  columns: [{ id: "title", accessorKey: "title", header: "Başlık", sortable: true }],
  initialState: { pagination: { mode: "offset", page: 1, pageSize: 25 } },
});
```

## Compatibility

Next.js, Remix, Vite + React, Gatsby — herhangi bir React framework.

Bileşen `"use client"` ile işaretlenmiştir (`useState` / `useEffect`). Bir client component içine yerleştirin.

## Development

```bash
npm install
npm run dev               # tsup watch mode
npm run build             # production build → dist/
npm run typecheck         # tsc --noEmit
npm run storybook         # http://localhost:6006
npm run build-storybook   # static export
```

## Publishing

GitHub Actions ile otomatik:

1. `package.json` `version` güncelle
2. Commit & push
3. Eşleşen tag ile GitHub Release oluştur (örn. `v1.0.0`)

## Author

Kenan Gündoğan — [github.com/kenangundogan](https://github.com/kenangundogan)

Maintained under [Eglador](https://github.com/eglador)

## License

MIT
