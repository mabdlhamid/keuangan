const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconHome = () => (
  <svg {...base}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10.5V20h13v-9.5" />
  </svg>
);

export const IconList = () => (
  <svg {...base}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);

export const IconPocket = () => (
  <svg {...base}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
    <path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5Z" />
    <circle cx="16" cy="13.5" r="1.2" />
  </svg>
);

export const IconChart = () => (
  <svg {...base}>
    <path d="M5 20V11M12 20V4M19 20v-6" />
  </svg>
);

export const IconPlus = () => (
  <svg {...base} width={26} height={26} strokeWidth={2.6}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconEye = () => (
  <svg {...base} width={20} height={20}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = () => (
  <svg {...base} width={20} height={20}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const IconSettings = () => (
  <svg {...base} width={20} height={20}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);

export const IconChevron = () => (
  <svg {...base} width={18} height={18}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconBack = () => (
  <svg {...base} width={20} height={20}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const IconDown = () => (
  <svg {...base} width={20} height={20}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const IconUp = () => (
  <svg {...base} width={20} height={20}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
