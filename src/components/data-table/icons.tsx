import * as React from "react";

type IconProps = React.SVGAttributes<SVGSVGElement>;

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const ChevronUpIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ChevronsLeftIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m11 17-5-5 5-5" />
    <path d="m18 17-5-5 5-5" />
  </svg>
);

export const ChevronsRightIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </svg>
);

export const ChevronsUpDownIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const FilterIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 6h18" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </svg>
);

export const InboxIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const AlertCircleIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const RefreshIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Rows2Icon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M21 12H3" />
  </svg>
);

export const Rows3Icon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M21 9H3" />
    <path d="M21 15H3" />
  </svg>
);

export const Rows4Icon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M21 7.5H3" />
    <path d="M21 12H3" />
    <path d="M21 16.5H3" />
  </svg>
);

export const MoreVerticalIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const GripVerticalIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const MinusIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M5 12h14" />
  </svg>
);

export const LoaderIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.9-2.9" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.9 2.9" />
    <path d="M12 18v4" />
    <path d="m4.9 19.1 2.9-2.9" />
    <path d="M2 12h4" />
    <path d="m4.9 4.9 2.9 2.9" />
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
