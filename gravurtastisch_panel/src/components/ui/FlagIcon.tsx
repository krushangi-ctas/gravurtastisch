

interface FlagProps {
  className?: string;
}

export function FlagAU({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#00008B" />
      <g transform="scale(0.5)">
        <rect width="60" height="36" fill="#012169" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3.5" />
        <path d="M30,0 v36 M0,18 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
      <polygon points="15,22 16.5,25 20,25 17.5,27.5 18.5,31 15,29 11.5,31 12.5,27.5 10,25 13.5,25" fill="#ffffff" />
      <circle cx="45" cy="8" r="1.5" fill="#ffffff" />
      <circle cx="52" cy="14" r="1.5" fill="#ffffff" />
      <circle cx="52" cy="24" r="1.5" fill="#ffffff" />
      <circle cx="45" cy="30" r="1.5" fill="#ffffff" />
      <circle cx="48" cy="20" r="1" fill="#ffffff" />
    </svg>
  );
}

export function FlagBE({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="20" height="36" x="0" fill="#000000" />
      <rect width="20" height="36" x="20" fill="#FDDA24" />
      <rect width="20" height="36" x="40" fill="#EF3340" />
    </svg>
  );
}

export function FlagBR({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#009C3B" />
      <polygon points="30,4 56,18 30,32 4,18" fill="#FFDF00" />
      <circle cx="30" cy="18" r="7" fill="#002776" />
      <path d="M23,19 Q30,14 37,17" fill="none" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}

export function FlagCA({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
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

export function FlagEG({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="12" y="0" fill="#C8102E" />
      <rect width="60" height="12" y="12" fill="#FFFFFF" />
      <rect width="60" height="12" y="24" fill="#000000" />
      <path d="M28,15 L32,15 L33,21 L27,21 Z" fill="#C09A3E" />
    </svg>
  );
}

export function FlagFR({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="20" height="36" x="0" fill="#002395" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#ED2939" />
    </svg>
  );
}

export function FlagDE({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="12" y="0" fill="#000000" />
      <rect width="60" height="12" y="12" fill="#DD0000" />
      <rect width="60" height="12" y="24" fill="#FFCE00" />
    </svg>
  );
}

export function FlagIN({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="12" y="0" fill="#FF9933" />
      <rect width="60" height="12" y="12" fill="#FFFFFF" />
      <rect width="60" height="12" y="24" fill="#138808" />
      <circle cx="30" cy="18" r="4.5" fill="none" stroke="#000080" strokeWidth="1.2" />
      <circle cx="30" cy="18" r="1" fill="#000080" />
    </svg>
  );
}

export function FlagIE({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="20" height="36" x="0" fill="#169B62" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#FF883E" />
    </svg>
  );
}

export function FlagIT({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="20" height="36" x="0" fill="#009246" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#CE2B37" />
    </svg>
  );
}

export function FlagJP({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#FFFFFF" />
      <circle cx="30" cy="18" r="10" fill="#BC002D" />
    </svg>
  );
}

export function FlagMX({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="20" height="36" x="0" fill="#006847" />
      <rect width="20" height="36" x="20" fill="#FFFFFF" />
      <rect width="20" height="36" x="40" fill="#CE1126" />
      <ellipse cx="30" cy="18" rx="4" ry="3" fill="#8B5A2B" opacity="0.85" />
      <circle cx="30" cy="18" r="1.5" fill="#D4AF37" />
    </svg>
  );
}

export function FlagNL({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="12" y="0" fill="#AE1C28" />
      <rect width="60" height="12" y="12" fill="#FFFFFF" />
      <rect width="60" height="12" y="24" fill="#21468B" />
    </svg>
  );
}

export function FlagPL({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="18" y="0" fill="#FFFFFF" />
      <rect width="60" height="18" y="18" fill="#DC143C" />
    </svg>
  );
}

export function FlagSA({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#006C35" />
      <path d="M18,17 L42,17 M22,21 L38,21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <polygon points="38,21 34,19 34,23" fill="#ffffff" />
    </svg>
  );
}

export function FlagES({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="9" y="0" fill="#AA151B" />
      <rect width="60" height="18" y="9" fill="#F1BF00" />
      <rect width="60" height="9" y="27" fill="#AA151B" />
      <circle cx="18" cy="18" r="4.5" fill="#AA151B" opacity="0.85" />
    </svg>
  );
}

export function FlagSE({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#006AA7" />
      <rect width="8" height="36" x="18" fill="#FECC00" />
      <rect width="60" height="8" y="14" fill="#FECC00" />
    </svg>
  );
}

export function FlagSG({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="18" y="0" fill="#ED2939" />
      <rect width="60" height="18" y="18" fill="#FFFFFF" />
      <circle cx="14" cy="9" r="5" fill="#FFFFFF" />
      <circle cx="16" cy="9" r="4.5" fill="#ED2939" />
    </svg>
  );
}

export function FlagTR({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#E30A17" />
      <circle cx="26" cy="18" r="9" fill="#FFFFFF" />
      <circle cx="28.5" cy="18" r="7.2" fill="#E30A17" />
      <polygon points="37,18 41,19.2 39.5,15.5 41,16.8 37.5,18" fill="#FFFFFF" />
    </svg>
  );
}

export function FlagAE({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="12" y="0" fill="#00732F" />
      <rect width="60" height="12" y="12" fill="#FFFFFF" />
      <rect width="60" height="12" y="24" fill="#000000" />
      <rect width="16" height="36" x="0" fill="#FF0000" />
    </svg>
  );
}

export function FlagGB({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="36" fill="#012169" />
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30,0 v36 M0,18 h60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function FlagUS({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
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

export function FlagZA({ className = 'w-5 h-3.5' }: FlagProps) {
  return (
    <svg viewBox="0 0 60 36" className={`inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-slate-200/60 ${className}`}>
      <rect width="60" height="18" y="0" fill="#E03C31" />
      <rect width="60" height="18" y="18" fill="#001489" />
      <path d="M0,0 L24,18 L60,18 M0,36 L24,18" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinejoin="round" />
      <path d="M0,0 L24,18 L60,18 M0,36 L24,18" fill="none" stroke="#007749" strokeWidth="6" strokeLinejoin="round" />
      <polygon points="0,0 21,18 0,36" fill="#000000" />
      <polyline points="0,0 24,18 0,36" fill="none" stroke="#FFB81C" strokeWidth="2.5" />
    </svg>
  );
}

export function FlagIcon({
  code,
  country,
  className = 'w-5 h-3.5',
}: {
  code?: string;
  country?: string;
  className?: string;
}) {
  const raw = (code || country || '').toLowerCase().trim();

  if (raw === 'au' || raw === 'australia') return <FlagAU className={className} />;
  if (raw === 'be' || raw === 'belgium') return <FlagBE className={className} />;
  if (raw === 'br' || raw === 'brazil') return <FlagBR className={className} />;
  if (raw === 'ca' || raw === 'canada') return <FlagCA className={className} />;
  if (raw === 'eg' || raw === 'egypt') return <FlagEG className={className} />;
  if (raw === 'fr' || raw === 'france') return <FlagFR className={className} />;
  if (raw === 'de' || raw === 'germany') return <FlagDE className={className} />;
  if (raw === 'in' || raw === 'india') return <FlagIN className={className} />;
  if (raw === 'ie' || raw === 'ireland') return <FlagIE className={className} />;
  if (raw === 'it' || raw === 'italy') return <FlagIT className={className} />;
  if (raw === 'jp' || raw === 'japan') return <FlagJP className={className} />;
  if (raw === 'mx' || raw === 'mexico') return <FlagMX className={className} />;
  if (raw === 'nl' || raw === 'netherlands') return <FlagNL className={className} />;
  if (raw === 'pl' || raw === 'poland') return <FlagPL className={className} />;
  if (raw === 'sa' || raw === 'saudi arabia' || raw === 'saudi') return <FlagSA className={className} />;
  if (raw === 'es' || raw === 'spain') return <FlagES className={className} />;
  if (raw === 'se' || raw === 'sweden') return <FlagSE className={className} />;
  if (raw === 'sg' || raw === 'singapore') return <FlagSG className={className} />;
  if (raw === 'tr' || raw === 'turkey') return <FlagTR className={className} />;
  if (raw === 'ae' || raw === 'united arab emirates' || raw === 'uae') return <FlagAE className={className} />;
  if (raw === 'gb' || raw === 'uk' || raw === 'united kingdom' || raw === 'great britain') return <FlagGB className={className} />;
  if (raw === 'us' || raw === 'united states' || raw === 'usa' || raw === 'com') return <FlagUS className={className} />;
  if (raw === 'za' || raw === 'south africa') return <FlagZA className={className} />;

  return (
    <span className={`inline-flex items-center justify-center rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 ${className}`}>
      {code ? code.toUpperCase().slice(0, 2) : '🌐'}
    </span>
  );
}

export default FlagIcon;
