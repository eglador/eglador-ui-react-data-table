import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "../components/data-table";

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  status: string;
  published_at: string | null;
  view_count: number;
  reading_time: number;
  is_featured: boolean;
  is_breaking: boolean;
  is_trending: boolean;
  category: { id: number; name: string; slug: string };
  author: { id: number; name: string; avatar?: string };
  tags: { id: number; name: string; slug: string }[];
}

const cat = (name: string) => ({ table: { category: name } });

function safeArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

function parseJsonObject<T>(raw: string | undefined, fallback: T): T {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

type AddedColumnArg = {
  field: string;
  type: "select" | "drag" | "actions" | "expander";
  position: "start" | "end";
  label?: string;
  width?: number;
};

const ADD_COLUMN_TYPES: AddedColumnArg["type"][] = [
  "select",
  "drag",
  "actions",
  "expander",
];
const ADD_COLUMN_POSITIONS: AddedColumnArg["position"][] = ["start", "end"];

function validAddColumns(v: unknown): AddedColumnArg[] {
  if (!Array.isArray(v)) return [];
  return v.filter((c): c is AddedColumnArg => {
    if (!c || typeof c !== "object") return false;
    const item = c as Partial<AddedColumnArg>;
    if (typeof item.field !== "string" || !item.field) return false;
    if (!item.type || !ADD_COLUMN_TYPES.includes(item.type)) return false;
    if (!item.position || !ADD_COLUMN_POSITIONS.includes(item.position))
      return false;
    return true;
  });
}

type PlaygroundArgs = {
  title: string;
  description: string;

  endpoint: string;
  schemaEndpoint: string;
  headersJson: string;

  visibleColumns: string[];
  hideColumns: string[];

  sortable: boolean;
  filters: boolean;
  search: boolean;
  searchPlaceholder: string;
  searchDebounceMs: number;

  paginationEnabled: boolean;
  paginationVariant: "full" | "simple";
  paginationShowInfo: boolean;
  defaultPageSize: number;

  defaultSort: { column: string; direction: "asc" | "desc" }[];
  defaultFilters: {
    id?: string;
    column: string;
    operator: string;
    value: unknown;
  }[];
  includes: string[];

  selectionMode: "none" | "single" | "multiple";

  density: boolean;
  columnVisibility: boolean;
  refresh: boolean;
  stickyHeader: boolean;
  footerHeader: boolean;
  maxHeight: number;
  variant: "default" | "bordered" | "striped" | "minimal";
  toolbarEndButton: boolean;
  bulkActionsBar: boolean;
  addColumns: AddedColumnArg[];

  urlSync: boolean;
  urlSyncPrefix: string;

  debounce: number;
  keepPreviousData: boolean;
  refetchOnFocus: boolean;
  refetchOnReconnect: boolean;
  refetchInterval: number;
  retryCount: number;

  optimisticUpdates: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: "Data Table/Playground",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Schema-driven `<DataTable>`. The component fetches the resource schema from `schemaEndpoint` (auto-inferred from `endpoint` if omitted) and derives `allowedSorts`, `allowedFilters`, filter UI types, default sort, default includes, page size, and search field routing automatically. You only configure display (columns, slots, toolbar features).",
      },
    },
  },
  args: {
    title: "Articles",
    description: "Schema-driven Laravel/Spatie tablo.",

    endpoint: "http://127.0.0.1:8000/api/v1/articles",
    schemaEndpoint: "",
    headersJson: "",

    visibleColumns: [
      "cover_image",
      "title",
      "category",
      "author",
      "status",
      "view_count",
      "published_at",
    ],
    hideColumns: [],

    sortable: true,
    filters: true,
    search: true,
    searchPlaceholder: "Search articles…",
    searchDebounceMs: 250,

    paginationEnabled: true,
    paginationVariant: "full",
    paginationShowInfo: true,
    defaultPageSize: 0,

    defaultSort: [],
    defaultFilters: [],
    includes: [],

    selectionMode: "multiple",

    density: true,
    columnVisibility: true,
    refresh: true,
    stickyHeader: true,
    footerHeader: false,
    maxHeight: 600,
    variant: "default",
    toolbarEndButton: true,
    bulkActionsBar: true,
    addColumns: [
      { field: "select", type: "select", position: "start" },
      { field: "actions", type: "actions", position: "end", label: "Actions" },
    ],

    urlSync: false,
    urlSyncPrefix: "articles_",

    debounce: 300,
    keepPreviousData: true,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
    retryCount: 1,

    optimisticUpdates: true,
  },
  argTypes: {
    title: { control: "text", ...cat("Identity") },
    description: { control: "text", ...cat("Identity") },

    endpoint: {
      control: "text",
      description: "Resource list endpoint.",
      ...cat("Backend"),
    },
    schemaEndpoint: {
      control: "text",
      description:
        "Schema endpoint. Empty = auto-infer from `endpoint` (insert `/schema/` before resource).",
      ...cat("Backend"),
    },
    headersJson: {
      control: "text",
      description:
        'JSON object string — e.g. `{"Authorization": "Bearer token"}`. Empty = none.',
      ...cat("Backend"),
    },

    visibleColumns: {
      control: "object",
      description:
        "Whitelist + order. Array of field ids. Empty = show all auto-discovered.",
      ...cat("Columns"),
    },
    hideColumns: {
      control: "object",
      description:
        "Blacklist. Ignored when `visibleColumns` is non-empty.",
      ...cat("Columns"),
    },

    sortable: {
      control: "boolean",
      description:
        "Enable header sort UI. Schema's `sorts` list controls WHICH columns are sortable.",
      ...cat("Sort"),
    },

    filters: {
      control: "boolean",
      description:
        "Show filter chips bar + add-filter button. Schema's `filters` array provides type/operator/options for each filterable field.",
      ...cat("Filter"),
    },

    search: { control: "boolean", ...cat("Search") },
    searchPlaceholder: { control: "text", ...cat("Search") },
    searchDebounceMs: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      ...cat("Search"),
    },

    paginationEnabled: { control: "boolean", ...cat("Pagination") },
    paginationVariant: {
      control: "select",
      options: ["full", "simple"],
      ...cat("Pagination"),
    },
    paginationShowInfo: { control: "boolean", ...cat("Pagination") },
    defaultPageSize: {
      control: { type: "number", min: 0, max: 200, step: 5 },
      description: "0 = use schema's `pagination.default_size`.",
      ...cat("Pagination"),
    },

    defaultSort: {
      control: "object",
      description:
        "Override schema's `default_sort`. Array of `{ column, direction }`. Empty = use schema default.",
      ...cat("Sort"),
    },
    defaultFilters: {
      control: "object",
      description:
        "Initial filters. Array of `{ column, operator, value }`. Each entry auto-gets a stable id.",
      ...cat("Filter"),
    },
    includes: {
      control: "object",
      description:
        "Override schema's `default_includes`. Empty array = use schema default.",
      ...cat("Includes"),
    },

    selectionMode: {
      control: "select",
      options: ["none", "single", "multiple"],
      ...cat("Selection"),
    },

    density: { control: "boolean", ...cat("Layout") },
    columnVisibility: { control: "boolean", ...cat("Layout") },
    refresh: { control: "boolean", ...cat("Layout") },
    stickyHeader: {
      control: "boolean",
      description: "Requires `maxHeight > 0`.",
      ...cat("Layout"),
    },
    footerHeader: { control: "boolean", ...cat("Layout") },
    maxHeight: {
      control: { type: "number", min: 0, max: 1200, step: 40 },
      description: "0 = no internal vertical scroll.",
      ...cat("Layout"),
    },
    variant: {
      control: "select",
      options: ["default", "bordered", "striped", "minimal"],
      ...cat("Layout"),
    },
    toolbarEndButton: { control: "boolean", ...cat("Layout") },
    bulkActionsBar: { control: "boolean", ...cat("Layout") },
    addColumns: {
      control: "object",
      description:
        "Extra columns. `{ field, type: 'select'|'drag'|'actions'|'expander', position: 'start'|'end', label?, width? }`. Actions render is provided in code.",
      ...cat("Layout"),
    },

    urlSync: { control: "boolean", ...cat("URL Sync") },
    urlSyncPrefix: { control: "text", ...cat("URL Sync") },

    debounce: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      ...cat("Lifecycle"),
    },
    keepPreviousData: { control: "boolean", ...cat("Lifecycle") },
    refetchOnFocus: { control: "boolean", ...cat("Lifecycle") },
    refetchOnReconnect: { control: "boolean", ...cat("Lifecycle") },
    refetchInterval: {
      control: { type: "number", min: 0, max: 600000, step: 5000 },
      description: "Polling interval in ms (0 = disabled).",
      ...cat("Lifecycle"),
    },
    retryCount: {
      control: { type: "number", min: 0, max: 5, step: 1 },
      ...cat("Lifecycle"),
    },

    optimisticUpdates: { control: "boolean", ...cat("Mutations") },
  },
};

export default meta;

export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => {
    const parsedHeaders = parseJsonObject<Record<string, string>>(
      args.headersJson,
      {},
    );
    const headers =
      Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined;

    const visibleColumns = safeArray<string>(args.visibleColumns);
    const hideColumns = safeArray<string>(args.hideColumns);

    const actionsRender = (
      _value: unknown,
      row: Article,
      ctx: { refresh: () => void },
    ) => (
      <div className="flex gap-1 justify-end">
        <button
          type="button"
          aria-label="View"
          onClick={() => alert(`View ${row.id}`)}
          className="inline-flex items-center justify-center size-7 rounded-sm border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          <Eye className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Edit"
          onClick={() => alert(`Edit ${row.id}`)}
          className="inline-flex items-center justify-center size-7 rounded-sm border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Delete"
          onClick={() => {
            alert(`Delete ${row.id}`);
            ctx.refresh();
          }}
          className="inline-flex items-center justify-center size-7 rounded-sm border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    );

    const addColumns = validAddColumns(args.addColumns).map((col) => ({
      ...col,
      render: col.type === "actions" ? actionsRender : undefined,
    }));

    const remountKey = JSON.stringify([
      args.endpoint,
      args.schemaEndpoint,
      args.urlSync,
      args.urlSyncPrefix,
    ]);

    return (
      <div className="p-6 max-w-screen-2xl mx-auto" key={remountKey}>
        <DataTable<Article>
          id="articles"
          title={args.title}
          description={args.description}

          endpoint={args.endpoint}
          schemaEndpoint={args.schemaEndpoint || undefined}
          headers={headers}

          visibleColumns={visibleColumns.length > 0 ? visibleColumns : undefined}
          hideColumns={hideColumns.length > 0 ? hideColumns : undefined}

          sortable={args.sortable}
          filters={args.filters}

          search={
            args.search
              ? {
                  placeholder: args.searchPlaceholder,
                  debounceMs: args.searchDebounceMs,
                }
              : false
          }

          pagination={
            args.paginationEnabled
              ? {
                  variant: args.paginationVariant,
                  showInfo: args.paginationShowInfo,
                }
              : false
          }
          defaultPageSize={
            args.defaultPageSize > 0 ? args.defaultPageSize : undefined
          }

          defaultSort={
            Array.isArray(args.defaultSort) && args.defaultSort.length > 0
              ? args.defaultSort
              : undefined
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultFilters={
            Array.isArray(args.defaultFilters) && args.defaultFilters.length > 0
              ? (args.defaultFilters as any)
              : undefined
          }
          includes={
            Array.isArray(args.includes) && args.includes.length > 0
              ? args.includes
              : undefined
          }

          density={args.density}
          columnVisibility={args.columnVisibility}
          refresh={args.refresh}
          stickyHeader={args.stickyHeader}
          footerHeader={args.footerHeader}
          maxHeight={args.maxHeight > 0 ? args.maxHeight : undefined}
          variant={args.variant}

          selection={
            args.selectionMode === "none"
              ? undefined
              : { mode: args.selectionMode }
          }

          urlSync={
            args.urlSync
              ? { paramPrefix: args.urlSyncPrefix, replace: true }
              : false
          }

          debounce={args.debounce}
          keepPreviousData={args.keepPreviousData}
          refetchOnFocus={args.refetchOnFocus}
          refetchOnReconnect={args.refetchOnReconnect}
          refetchInterval={
            args.refetchInterval > 0 ? args.refetchInterval : undefined
          }
          retry={{ count: args.retryCount, backoff: "exponential" }}

          optimisticUpdates={args.optimisticUpdates}

          customColumns={[
            {
              field: "cover_image",
              label: "",
              width: 56,
              hideable: false,
              render: (value) => (
                <img
                  src={String(value)}
                  alt=""
                  className="w-9 h-9 rounded-sm object-cover"
                  loading="lazy"
                />
              ),
            },
            {
              field: "title",
              label: "Title",
              minWidth: 280,
              render: (_value, row) => (
                <div className="flex flex-col gap-0.5 min-w-0 max-w-md">
                  <span className="font-medium text-zinc-900 truncate">
                    {row.title}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    {row.slug}
                  </span>
                </div>
              ),
            },
            {
              field: "category",
              label: "Category",
              accessor: (row) => row.category?.name,
              render: (value) =>
                value ? (
                  <span className="inline-flex items-center px-2 h-6 text-xs rounded-sm bg-zinc-100 text-zinc-700">
                    {String(value)}
                  </span>
                ) : (
                  <span className="text-zinc-400 text-xs">—</span>
                ),
            },
            {
              field: "author",
              label: "Author",
              accessor: (row) => row.author?.name,
            },
            {
              field: "status",
              label: "Status",
              render: (value) => {
                const s = String(value);
                const isPublished = s === "published";
                return (
                  <span
                    className={`inline-flex items-center px-2 h-6 text-[10px] font-medium uppercase tracking-wide rounded-sm ${
                      isPublished
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                    }`}
                  >
                    {s}
                  </span>
                );
              },
            },
            {
              field: "view_count",
              label: "Views",
              align: "right",
              render: (value) => (
                <span className="tabular-nums text-zinc-700">
                  {Number(value).toLocaleString()}
                </span>
              ),
            },
            {
              field: "published_at",
              label: "Published",
              render: (value) => {
                if (!value)
                  return <span className="text-zinc-400 text-xs">—</span>;
                const d = new Date(String(value));
                return (
                  <span className="text-zinc-600 tabular-nums whitespace-nowrap">
                    {d.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                );
              },
            },
          ]}

          addColumns={addColumns}

          bulkActions={
            args.bulkActionsBar
              ? ({ rows, clear }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => alert(`Archive ${rows.length} articles`)}
                      className="px-2 h-7 text-xs font-medium rounded-sm bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Export ${rows.length} articles`)}
                      className="px-2 h-7 text-xs font-medium rounded-sm bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      className="px-2 h-7 text-xs font-medium rounded-sm bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )
              : undefined
          }

          toolbarEnd={
            args.toolbarEndButton ? (
              <button
                type="button"
                onClick={() => alert("New article")}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-sm bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer"
              >
                <Plus className="size-3.5" />
                New article
              </button>
            ) : undefined
          }

          emptyState={({ search, hasFilters }) => (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-zinc-900">
                No articles found
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {search || hasFilters
                  ? "Try adjusting your search or filters."
                  : "Create your first article to get started."}
              </p>
            </div>
          )}
        />
      </div>
    );
  },
};
