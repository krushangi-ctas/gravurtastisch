import React from "react";

interface FlagProps {
  className?: string;
}

export function FlagGB({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="36" fill="#012169" />
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30,0 v36 M0,18 h60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function FlagDE({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="12" y="0" fill="#000000" />
      <rect width="60" height="12" y="12" fill="#DD0000" />
      <rect width="60" height="12" y="24" fill="#FFCE00" />
    </svg>
  );
}

export function FlagFR({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="20" height="36" x="0" fill="#002395" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#ED2939" />
    </svg>
  );
}

export function FlagES({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="9" y="0" fill="#AA151B" />
      <rect width="60" height="18" y="9" fill="#F1BF00" />
      <rect width="60" height="9" y="27" fill="#AA151B" />
      <circle cx="18" cy="18" r="4.5" fill="#AA151B" opacity="0.85" />
    </svg>
  );
}

export function FlagIT({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="20" height="36" x="0" fill="#009246" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#CE2B37" />
    </svg>
  );
}

export function FlagUS({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="36" fill="#B22234" />
      <path d="M0,2.77 h60 M0,8.31 h60 M0,13.85 h60 M0,19.38 h60 M0,24.92 h60 M0,30.46 h60" stroke="#ffffff" strokeWidth="2.77" />
      <rect width="26" height="19.38" fill="#3C3B6E" />
      <circle cx="5" cy="4" r="1.1" fill="#ffffff" />
      <circle cx="13" cy="4" r="1.1" fill="#ffffff" />
      <circle cx="21" cy="4" r="1.1" fill="#ffffff" />
      <circle cx="9" cy="9.7" r="1.1" fill="#ffffff" />
      <circle cx="17" cy="9.7" r="1.1" fill="#ffffff" />
      <circle cx="5" cy="15.4" r="1.1" fill="#ffffff" />
      <circle cx="13" cy="15.4" r="1.1" fill="#ffffff" />
      <circle cx="21" cy="15.4" r="1.1" fill="#ffffff" />
    </svg>
  );
}

export function FlagIN({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="12" y="0" fill="#FF9933" />
      <rect width="60" height="12" y="12" fill="#FFFFFF" />
      <rect width="60" height="12" y="24" fill="#138808" />
      <circle cx="30" cy="18" r="4.5" fill="none" stroke="#000080" strokeWidth="1.2" />
      <circle cx="30" cy="18" r="1" fill="#000080" />
    </svg>
  );
}

export function FlagAE({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="12" y="0" fill="#00732F" />
      <rect width="60" height="12" y="12" fill="#FFFFFF" />
      <rect width="60" height="12" y="24" fill="#000000" />
      <rect width="16" height="36" x="0" fill="#FF0000" />
    </svg>
  );
}

export function FlagCA({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="15" height="36" x="0" fill="#FF0000" />
      <rect width="30" height="36" x="15" fill="#FFFFFF" />
      <rect width="15" height="36" x="45" fill="#FF0000" />
      <path
        d="M30,8 L32,14 L37,13 L34,17 L38,20 L33,21 L34,25 L30.5,23 L31,28 L29,28 L29.5,23 L26,25 L27,21 L22,20 L26,17 L23,13 L28,14 Z"
        fill="#FF0000"
      />
    </svg>
  );
}

export function FlagAU({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="36" fill="#00008B" />
      <g transform="scale(0.5)">
        <rect width="60" height="36" fill="#012169" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3.5" />
        <path d="M30,0 v36 M0,18 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
      <polygon points="15,22 16.5,26 21,26 17.5,28.5 19,32.5 15,30 11,32.5 12.5,28.5 9,26 13.5,26" fill="#ffffff" />
      <circle cx="45" cy="8" r="1.5" fill="#ffffff" />
      <circle cx="52" cy="14" r="1.5" fill="#ffffff" />
      <circle cx="52" cy="24" r="1.5" fill="#ffffff" />
      <circle cx="45" cy="30" r="1.5" fill="#ffffff" />
      <circle cx="48" cy="20" r="1" fill="#ffffff" />
    </svg>
  );
}

export function FlagJP({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="36" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.75" />
      <circle cx="30" cy="18" r="10.8" fill="#BC002D" />
    </svg>
  );
}

export function FlagMX({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="20" height="36" x="0" fill="#006847" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#CE1126" />
      <ellipse cx="30" cy="18" rx="4" ry="3" fill="#8B5A2B" opacity="0.8" />
      <circle cx="30" cy="18" r="1.5" fill="#D4AF37" />
    </svg>
  );
}

export function FlagZA({ className = "w-4 h-3" }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden ${className}`}>
      <rect width="60" height="18" y="0" fill="#E03C31" />
      <rect width="60" height="18" y="18" fill="#001489" />
      <path d="M0,0 L24,18 L60,18 M0,36 L24,18" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinejoin="round" />
      <path d="M0,0 L24,18 L60,18 M0,36 L24,18" fill="none" stroke="#007749" strokeWidth="6" strokeLinejoin="round" />
      <polygon points="0,0 21,18 0,36" fill="#000000" />
      <polyline points="0,0 24,18 0,36" fill="none" stroke="#FFB81C" strokeWidth="2.5" />
    </svg>
  );
}

export function FlagIcon({ code, className = "w-4 h-3" }: { code: string; className?: string }) {
  const normalized = code.toLowerCase();
  switch (normalized) {
    case "gb":
    case "uk":
    case "en":
      return <FlagGB className={className} />;
    case "de":
      return <FlagDE className={className} />;
    case "fr":
      return <FlagFR className={className} />;
    case "es":
      return <FlagES className={className} />;
    case "it":
      return <FlagIT className={className} />;
    case "us":
    case "com":
      return <FlagUS className={className} />;
    case "mx":
      return <FlagMX className={className} />;
    case "in":
      return <FlagIN className={className} />;
    case "ae":
      return <FlagAE className={className} />;
    case "ca":
      return <FlagCA className={className} />;
    case "au":
      return <FlagAU className={className} />;
    case "jp":
      return <FlagJP className={className} />;
    case "za":
      return <FlagZA className={className} />;
    default:
      return <FlagGB className={className} />;
  }
}
