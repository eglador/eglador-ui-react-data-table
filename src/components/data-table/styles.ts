"use client";

const STYLE_ID = "eglador-data-table-styles";

const STYLES = `
@keyframes eglador-dt-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.eglador-dt-spin {
  animation: eglador-dt-spin 0.8s linear infinite;
}

@keyframes eglador-dt-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.25; }
}
.eglador-dt-pulse {
  animation: eglador-dt-pulse 1.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .eglador-dt-spin,
  .eglador-dt-pulse {
    animation: none !important;
  }
}
`;

export function ensureDataTableStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLES;
  document.head.appendChild(el);
}
