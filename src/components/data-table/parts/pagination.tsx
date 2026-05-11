"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useDataTableContext } from "../context";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "../icons";
import { Popover } from "./popover";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface DataTablePaginationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showInfo?: boolean;
  variant?: "full" | "simple";
}

export function DataTablePagination({
  className,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSize = true,
  showInfo = true,
  variant = "full",
  ...rest
}: DataTablePaginationProps) {
  const table = useDataTableContext();
  const { page, pageSize, pageCount, canPreviousPage, canNextPage } =
    table.pagination;
  const total = table.total;
  const isCursor = table.state.pagination.mode === "cursor";
  const start = total != null ? (page - 1) * pageSize + 1 : null;
  const endRaw = total != null ? Math.min(total, page * pageSize) : null;
  const end = endRaw != null && endRaw < (start ?? 0) ? null : endRaw;
  return (
    <div
      data-data-table-pagination=""
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-1",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        {showInfo &&
          (total != null ? (
            <span>
              Showing{" "}
              <span className="font-medium text-zinc-900 tabular-nums">
                {start ?? 0}-{end ?? 0}
              </span>{" "}
              of{" "}
              <span className="font-medium text-zinc-900 tabular-nums">
                {total}
              </span>
            </span>
          ) : (
            <span>
              Page{" "}
              <span className="font-medium text-zinc-900 tabular-nums">
                {page}
              </span>
            </span>
          ))}
        {showPageSize && (
          <Popover
            align="start"
            trigger={
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 px-2 h-7 text-xs rounded-sm",
                  "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
                  "cursor-pointer",
                )}
              >
                <span className="tabular-nums">{pageSize}</span>
                <span className="text-zinc-400">/ page</span>
              </button>
            }
          >
            {(close) => (
              <div className="py-1 min-w-[8rem]">
                {pageSizeOptions.map((opt) => {
                  const active = pageSize === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        table.pagination.setPageSize(opt);
                        close();
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm cursor-pointer",
                        active
                          ? "bg-zinc-100 text-zinc-900 font-medium"
                          : "text-zinc-700 hover:bg-zinc-50",
                      )}
                    >
                      {opt} per page
                    </button>
                  );
                })}
              </div>
            )}
          </Popover>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!isCursor && variant === "full" && (
          <PageButton
            ariaLabel="First page"
            disabled={!canPreviousPage}
            onClick={() => table.pagination.setPage(1)}
          >
            <ChevronsLeftIcon className="size-4" />
          </PageButton>
        )}
        <PageButton
          ariaLabel="Previous page"
          disabled={!canPreviousPage}
          onClick={() => table.pagination.previousPage()}
        >
          <ChevronLeftIcon className="size-4" />
        </PageButton>
        {!isCursor && variant === "full" && pageCount > 0 && (
          <PageNumbers
            page={page}
            pageCount={pageCount}
            onPageChange={(p) => table.pagination.setPage(p)}
          />
        )}
        <PageButton
          ariaLabel="Next page"
          disabled={!canNextPage}
          onClick={() => table.pagination.nextPage()}
        >
          <ChevronRightIcon className="size-4" />
        </PageButton>
        {!isCursor && variant === "full" && pageCount > 0 && (
          <PageButton
            ariaLabel="Last page"
            disabled={!canNextPage}
            onClick={() => table.pagination.setPage(pageCount)}
          >
            <ChevronsRightIcon className="size-4" />
          </PageButton>
        )}
      </div>
    </div>
  );
}
DataTablePagination.displayName = "DataTable.Pagination";

function PageButton({
  children,
  ariaLabel,
  disabled,
  onClick,
  active,
}: {
  children: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center min-w-8 h-8 px-2 text-xs rounded-sm",
        "border transition-colors tabular-nums",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        !disabled && "cursor-pointer",
      )}
    >
      {children}
    </button>
  );
}

function PageNumbers({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) {
  const pages = computePageList(page, pageCount);
  return (
    <>
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-xs text-zinc-400"
          >
            …
          </span>
        ) : (
          <PageButton
            key={p}
            ariaLabel={`Page ${p}`}
            active={p === page}
            onClick={() => onPageChange(p)}
          >
            {p}
          </PageButton>
        ),
      )}
    </>
  );
}

function computePageList(page: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(total - 1, page + 1);
  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}
