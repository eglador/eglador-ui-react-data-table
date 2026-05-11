"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/utils";

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  /** Gap (px) between trigger and content. Default `4`. */
  sideOffset?: number;
  className?: string;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Position {
  top: number;
  left: number;
  /** Resolved side after viewport flipping. */
  side: "top" | "bottom";
}

const VIEWPORT_PADDING = 8;

/** Portal-based popover with viewport-aware positioning. Anchors to the
 *  trigger via `getBoundingClientRect`, renders into `document.body`, and
 *  flips above when there's not enough room below. Reposition on scroll
 *  (any scrollable ancestor) and resize. */
export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  className,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen != null;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<Position | null>(null);

  const updatePosition = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    const contentEl = contentRef.current;
    if (!triggerEl || !contentEl) return;

    const tr = triggerEl.getBoundingClientRect();
    const cr = contentEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Vertical placement — flip to the opposite side if preferred side
    // doesn't fit.
    let resolvedSide: "top" | "bottom" = side;
    if (side === "bottom") {
      const fitsBelow = tr.bottom + sideOffset + cr.height <= vh - VIEWPORT_PADDING;
      const fitsAbove = tr.top - sideOffset - cr.height >= VIEWPORT_PADDING;
      if (!fitsBelow && fitsAbove) resolvedSide = "top";
    } else {
      const fitsAbove = tr.top - sideOffset - cr.height >= VIEWPORT_PADDING;
      const fitsBelow = tr.bottom + sideOffset + cr.height <= vh - VIEWPORT_PADDING;
      if (!fitsAbove && fitsBelow) resolvedSide = "bottom";
    }

    const top =
      resolvedSide === "bottom"
        ? tr.bottom + sideOffset
        : tr.top - sideOffset - cr.height;

    // Horizontal alignment.
    let left: number;
    if (align === "start") left = tr.left;
    else if (align === "end") left = tr.right - cr.width;
    else left = tr.left + tr.width / 2 - cr.width / 2;

    // Clamp to viewport horizontally.
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, vw - cr.width - VIEWPORT_PADDING),
    );

    setPosition({ top, left, side: resolvedSide });
  }, [align, side, sideOffset]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    // First measure happens after the content has been laid out.
    updatePosition();
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    // Capture-phase listener catches scrolls on any ancestor (e.g. the
    // table's `overflow-x-auto` container, modal bodies, etc.).
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  const content =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={contentRef}
            role="dialog"
            data-popover-content=""
            data-side={position?.side ?? side}
            data-align={align}
            style={{
              position: "fixed",
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              // Hide on the first paint until position is computed.
              visibility: position ? "visible" : "hidden",
              zIndex: 2147483647,
            }}
            className={cn(
              "min-w-[12rem] rounded-sm border border-zinc-200 bg-white",
              "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.10),0_2px_4px_-1px_rgba(0,0,0,0.06)]",
              contentClassName,
            )}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
        )
      : null;

  return (
    <span ref={triggerRef} className={cn("inline-block", className)}>
      <span onClick={() => setOpen(!open)}>{trigger}</span>
      {content}
    </span>
  );
}
