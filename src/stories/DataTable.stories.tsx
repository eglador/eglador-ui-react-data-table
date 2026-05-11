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

const ARTICLE_STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

// === Storybook arg / control helpers ================================

const cat = (name: string) => ({ table: { category: name } });

function safeArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

function safeStringMap(
  v: unknown,
  fallback: Record<string, string> = {},
): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return fallback;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

function validSorts(
  v: unknown,
): { column: string; direction: "asc" | "desc" }[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (s): s is { column: string; direction: "asc" | "desc" } =>
      !!s &&
      typeof s === "object" &&
      typeof (s as { column?: unknown }).column === "string" &&
      ((s as { direction?: unknown }).direction === "asc" ||
        (s as { direction?: unknown }).direction === "desc"),
  );
}

function validFilters(
  v: unknown,
): { id?: string; column: string; operator: string; value: unknown }[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (f): f is { column: string; operator: string; value: unknown } =>
      !!f &&
      typeof f === "object" &&
      typeof (f as { column?: unknown }).column === "string" &&
      typeof (f as { operator?: unknown }).operator === "string",
  );
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

// === Args ==========================================================

type PlaygroundArgs = {
  // Identity
  title: string;
  description: string;

  // Backend
  endpoint: string;
  headersJson: string;
  paramNames: Record<string, string>;
  responseShape: { rows?: string };
  sparseFields: Record<string, string[]>;

  // Columns
  visibleColumns: string[];
  hideColumns: string[];

  // Sort
  sortable: boolean;
  allowedSorts: string[];
  defaultSort: { column: string; direction: "asc" | "desc" }[];

  // Filter
  filters: boolean;
  allowedFilters: string[];
  defaultFilters: {
    id?: string;
    column: string;
    operator: string;
    value: unknown;
  }[];

  // Includes
  allowedIncludes: string[];
  includes: string[];

  // Search
  search: boolean;
  searchPlaceholder: string;
  searchDebounceMs: number;

  // Pagination
  paginationEnabled: boolean;
  paginationVariant: "full" | "simple";
  paginationShowInfo: boolean;
  defaultPageSize: number;
  pageSizeOptions: number[];
  paginationOptions: Record<string, string>;

  // Selection
  selectionMode: "none" | "single" | "multiple";

  // Layout
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

  // URL Sync
  urlSync: boolean;
  urlSyncPrefix: string;

  // Lifecycle
  debounce: number;
  keepPreviousData: boolean;
  refetchOnFocus: boolean;
  refetchOnReconnect: boolean;
  refetchInterval: number;
  retryCount: number;

  // Mutations
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
          "Schema-driven `<DataTable>` against the live Laravel articles endpoint at `cms-api-mockdata.bitem.tr/api/v1/articles`. Every flag in the Controls panel wires straight to a component prop — toggle them to see how the table reshapes itself. Controls are grouped by concern (Identity, Backend, Columns, Sort, Filter, …).",
      },
    },
  },
  args: {
    // Identity
    title: "Articles",
    description: "Live Laravel endpoint — 550 records, fully prop-driven.",

    // Backend
    endpoint: "https://cms-api-mockdata.bitem.tr/api/v1/articles",
    headersJson: "",
    paramNames: {
      page: "page[number]",
      pageSize: "page[size]",
      sort: "sort",
      search: "filter[search]",
      include: "include",
    },
    responseShape: { rows: "data" },
    sparseFields: {},

    // Columns
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

    // Sort
    sortable: true,
    allowedSorts: ["title", "published_at", "view_count", "reading_time"],
    defaultSort: [{ column: "published_at", direction: "desc" }],

    // Filter — matches the Spatie API filter list:
    // category_id, user_id, status, title, featured, breaking, trending,
    // search, tag, published_after, published_before
    filters: true,
    allowedFilters: [
      "category_id",
      "user_id",
      "status",
      "title",
      "featured",
      "breaking",
      "trending",
      "tag",
      "published_after",
      "published_before",
    ],
    defaultFilters: [],

    // Includes — Spatie allows: category, author, tags, media
    allowedIncludes: ["category", "author", "tags", "media"],
    includes: ["category", "author"],

    // Search
    search: true,
    searchPlaceholder: "Search articles…",
    searchDebounceMs: 250,

    // Pagination
    paginationEnabled: true,
    paginationVariant: "full",
    paginationShowInfo: true,
    defaultPageSize: 15,
    pageSizeOptions: [10, 25, 50, 100],
    paginationOptions: {
      currentPage: "meta.current_page",
      lastPage: "meta.last_page",
      perPage: "meta.per_page",
      total: "meta.total",
      path: "meta.path",
      from: "meta.from",
      to: "meta.to",
      links: "links",
    },

    // Selection
    selectionMode: "multiple",

    // Layout
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

    // URL Sync
    urlSync: false,
    urlSyncPrefix: "articles_",

    // Lifecycle
    debounce: 300,
    keepPreviousData: true,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
    retryCount: 1,

    // Mutations
    optimisticUpdates: true,
  },
  argTypes: {
    // === Identity ===
    title: { control: "text", ...cat("Identity") },
    description: { control: "text", ...cat("Identity") },

    // === Backend ===
    endpoint: {
      control: "text",
      description: "API endpoint URL.",
      ...cat("Backend"),
    },
    headersJson: {
      control: "text",
      description:
        'JSON object string — e.g. `{"Authorization": "Bearer token"}`. Empty = none.',
      ...cat("Backend"),
    },
    paramNames: {
      control: "object",
      description:
        "Query-string param name overrides (page, pageSize, sort, sortDirection, search).",
      ...cat("Backend"),
    },
    responseShape: {
      control: "object",
      description: "Path map for extracting the row array from the response.",
      ...cat("Backend"),
    },
    sparseFields: {
      control: "object",
      description:
        'Spatie sparse fieldsets — `?fields[resource]=id,title,…`. Example: `{ "articles": ["id","title","slug"] }`.',
      ...cat("Backend"),
    },

    // === Columns ===
    visibleColumns: {
      control: "object",
      description:
        "Whitelist + order. Array of field ids. Empty = show all auto-discovered.",
      ...cat("Columns"),
    },
    hideColumns: {
      control: "object",
      description:
        "Blacklist. Array of field ids. Ignored when `visibleColumns` is non-empty.",
      ...cat("Columns"),
    },

    // === Sort ===
    sortable: {
      control: "boolean",
      description: "Enable header sort buttons.",
      ...cat("Sort"),
    },
    allowedSorts: {
      control: "object",
      description: "Array of server-side sortable column ids.",
      ...cat("Sort"),
    },
    defaultSort: {
      control: "object",
      description: "Initial sort. Array of `{ column, direction }`.",
      ...cat("Sort"),
    },

    // === Filter ===
    filters: {
      control: "boolean",
      description: "Filter chips bar + add-filter button.",
      ...cat("Filter"),
    },
    allowedFilters: {
      control: "object",
      description: "Array of server-side filterable column ids.",
      ...cat("Filter"),
    },
    defaultFilters: {
      control: "object",
      description:
        "Initial filters. Array of `{ column, operator, value }`. Each filter auto-gets a stable id.",
      ...cat("Filter"),
    },

    // === Includes ===
    allowedIncludes: {
      control: "object",
      description: "Whitelisted relations the user may eager-load.",
      ...cat("Includes"),
    },
    includes: {
      control: "object",
      description: "Relations always sent on every request.",
      ...cat("Includes"),
    },

    // === Search ===
    search: {
      control: "boolean",
      description: "Toolbar search input.",
      ...cat("Search"),
    },
    searchPlaceholder: { control: "text", ...cat("Search") },
    searchDebounceMs: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      ...cat("Search"),
    },

    // === Pagination ===
    paginationEnabled: { control: "boolean", ...cat("Pagination") },
    paginationVariant: {
      control: "select",
      options: ["full", "simple"],
      ...cat("Pagination"),
    },
    paginationShowInfo: {
      control: "boolean",
      description: "Show `Showing X-Y of Z` info.",
      ...cat("Pagination"),
    },
    defaultPageSize: {
      control: { type: "number", min: 5, max: 100, step: 5 },
      ...cat("Pagination"),
    },
    pageSizeOptions: {
      control: "object",
      description: "Array of allowed page sizes in the size dropdown.",
      ...cat("Pagination"),
    },
    paginationOptions: {
      control: "object",
      description:
        "Response path map for pagination meta (currentPage, lastPage, total, etc.).",
      ...cat("Pagination"),
    },

    // === Selection ===
    selectionMode: {
      control: "select",
      options: ["none", "single", "multiple"],
      ...cat("Selection"),
    },

    // === Layout ===
    density: {
      control: "boolean",
      description: "Toolbar density toggle.",
      ...cat("Layout"),
    },
    columnVisibility: {
      control: "boolean",
      description: "Toolbar column visibility menu.",
      ...cat("Layout"),
    },
    refresh: {
      control: "boolean",
      description: "Toolbar refresh button.",
      ...cat("Layout"),
    },
    stickyHeader: {
      control: "boolean",
      description: "Header sticks while body scrolls (needs `maxHeight > 0`).",
      ...cat("Layout"),
    },
    footerHeader: {
      control: "boolean",
      description: "Mirror the header at the bottom (sticky-bottom).",
      ...cat("Layout"),
    },
    maxHeight: {
      control: { type: "number", min: 0, max: 1200, step: 40 },
      description: "0 = no internal vertical scroll (page scrolls instead).",
      ...cat("Layout"),
    },
    variant: {
      control: "select",
      options: ["default", "bordered", "striped", "minimal"],
      ...cat("Layout"),
    },
    toolbarEndButton: {
      control: "boolean",
      description: '"+ New article" button in `toolbarEnd` slot.',
      ...cat("Layout"),
    },
    bulkActionsBar: {
      control: "boolean",
      description: "Render the bulk-actions bar when rows are selected.",
      ...cat("Layout"),
    },
    addColumns: {
      control: "object",
      description:
        "Extra columns not in the API response. Each entry: `{ field, type: 'select' | 'drag' | 'actions' | 'expander', position: 'start' | 'end', label?, width? }`. The `actions` render is provided in code.",
      ...cat("Layout"),
    },

    // === URL Sync ===
    urlSync: {
      control: "boolean",
      description: "Persist sort/filter/page state to the URL.",
      ...cat("URL Sync"),
    },
    urlSyncPrefix: {
      control: "text",
      description: "Param prefix for this table — e.g. `articles_page`.",
      ...cat("URL Sync"),
    },

    // === Lifecycle ===
    debounce: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      description: "ms delay before re-fetching on filter/sort/search change.",
      ...cat("Lifecycle"),
    },
    keepPreviousData: {
      control: "boolean",
      description: "Stale-while-revalidate — show old data during refetch.",
      ...cat("Lifecycle"),
    },
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

    // === Mutations ===
    optimisticUpdates: {
      control: "boolean",
      description: "Apply mutations optimistically (revert on error).",
      ...cat("Mutations"),
    },
  },
};

export default meta;

export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => {
    const parsedHeaders = parseJsonObject<Record<string, string>>(
      args.headersJson,
      {},
    );
    const headers = Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined;

    const paramNames = safeStringMap(args.paramNames);
    const responseShape = safeStringMap(args.responseShape) as {
      rows?: string;
    };
    const paginationOptions = safeStringMap(args.paginationOptions);
    const pageSizeOptions = safeArray<number>(args.pageSizeOptions, [10, 25, 50, 100])
      .filter((n) => typeof n === "number" && n > 0);

    const visibleColumns = safeArray<string>(args.visibleColumns);
    const hideColumns = safeArray<string>(args.hideColumns);
    const allowedSorts = safeArray<string>(args.allowedSorts);
    const allowedFilters = safeArray<string>(args.allowedFilters);
    const allowedIncludes = safeArray<string>(args.allowedIncludes);
    const includes = safeArray<string>(args.includes);
    const defaultSort = validSorts(args.defaultSort);
    const defaultFilters = validFilters(args.defaultFilters);

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
      // The `actions` type carries a code-defined renderer (JSX can't survive
      // JSON serialization). All other built-in types render their own UI.
      render: col.type === "actions" ? actionsRender : undefined,
    }));

    const remountKey = JSON.stringify([
      args.endpoint,
      defaultSort,
      defaultFilters,
      includes,
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
          headers={headers}
          paramNames={paramNames}
          responseShape={responseShape}
          sparseFields={args.sparseFields}

          visibleColumns={visibleColumns.length > 0 ? visibleColumns : undefined}
          hideColumns={hideColumns.length > 0 ? hideColumns : undefined}

          sortable={args.sortable}
          allowedSorts={allowedSorts.length > 0 ? allowedSorts : undefined}
          defaultSort={defaultSort}

          filters={args.filters}
          allowedFilters={allowedFilters.length > 0 ? allowedFilters : undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultFilters={defaultFilters as any}

          allowedIncludes={
            allowedIncludes.length > 0 ? allowedIncludes : undefined
          }
          includes={includes}

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
                  pageSizeOptions,
                  variant: args.paginationVariant,
                  showInfo: args.paginationShowInfo,
                  options: paginationOptions,
                }
              : false
          }
          defaultPageSize={args.defaultPageSize}

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
              filter: { type: "text", defaultOperator: "contains" },
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
              // Server filter: `?filter[category_id]=5`
              filterKey: "category_id",
              filter: { type: "number" },
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
              // Server filter: `?filter[user_id]=12`
              filterKey: "user_id",
              filter: { type: "number" },
            },
            {
              field: "status",
              label: "Status",
              filter: { type: "select", options: ARTICLE_STATUS_OPTIONS },
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
              filter: { type: "date" },
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
