import React from "react";

interface BrandLogoProps {
  className?: string;
  variant?: "dark" | "light" | "auto";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function BrandLogo({
  className = "",
  variant = "auto",
  size = "md",
  showTagline = false,
}: BrandLogoProps) {
  const isLight = variant === "light";

  const sizeStyles = {
    sm: {
      mark: "h-7 w-7 rounded-lg text-sm",
      text: "text-lg",
      tagline: "text-[8px] -mt-0.5",
      svg: 16,
    },
    md: {
      mark: "h-9 w-9 rounded-xl text-base",
      text: "text-xl",
      tagline: "text-[9px] -mt-0.5",
      svg: 20,
    },
    lg: {
      mark: "h-11 w-11 rounded-2xl text-lg",
      text: "text-2xl sm:text-[1.75rem]",
      tagline: "text-[10px] -mt-0.5",
      svg: 24,
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Tech Geometric Brand Mark */}
      <div
        className={`relative ${sizeStyles.mark} shrink-0 rounded-xl bg-gradient-to-br from-[#0032ab] via-[#2032b5] to-[#2563eb] p-[1.5px] shadow-[0_4px_14px_rgba(0,50,171,0.35)] transition-transform duration-300 group-hover:scale-105`}
      >
        <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-[#002888] to-[#001858] flex items-center justify-center relative overflow-hidden">
          {/* Subtle Ambient Laser Glow */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full blur-xs opacity-75" />

          {/* Stylized Modern "P" Vector Automation Mark */}
          <svg
            width={sizeStyles.svg}
            height={sizeStyles.svg}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            {/* Vertical Precision Stem */}
            <path
              d="M6 4.5C6 3.67 6.67 3 7.5 3H13C16.31 3 19 5.69 19 9C19 12.31 16.31 15 13 15H9V20C9 20.55 8.55 21 8 21C7.45 21 7 20.55 7 20V5.5C7 4.95 6.55 4.5 6 4.5Z"
              fill="url(#p-stem-grad)"
            />
            {/* Inner Precision Cutout */}
            <path
              d="M10 6.5H13C14.38 6.5 15.5 7.62 15.5 9C15.5 10.38 14.38 11.5 13 11.5H10V6.5Z"
              fill="#001858"
            />
            {/* Automation Cyan Laser Beam / Dot */}
            <circle cx="10" cy="9" r="1.75" fill="#38bdf8" />
            <path
              d="M10 9L18 9"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="1.5 1.5"
            />

            <defs>
              <linearGradient id="p-stem-grad" x1="6" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.45" stopColor="#93c5fd" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Styled Brand Typography */}
      <div className="flex flex-col text-left">
        <div className={`font-black tracking-tight leading-none ${sizeStyles.text}`}>
          <span
            className={
              isLight
                ? "text-white"
                : "text-[#0f172a] dark:text-white"
            }
          >
            Print
          </span>
          <span className="bg-gradient-to-r from-[#2563eb] via-[#4f6ef7] to-[#7c3aed] bg-clip-text text-transparent font-extrabold">
            omation
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-mono uppercase font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 ${sizeStyles.tagline}`}
          >
            B2B Automation
          </span>
        )}
      </div>
    </div>
  );
}
