import React from "react";

interface IconProps {
  className?: string;
  glow?: boolean;
}

/**
 * Official Amazon Logo SVG from public folder (/amazon-logo.svg)
 */
export function AmazonLogoSvg({
  className = "w-5 h-5",
  alt = "Amazon",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/amazon-logo.svg"
      alt={alt}
      className={`inline-block rounded-[4px] object-contain shrink-0 ${className}`}
      loading="lazy"
    />
  );
}

/**
 * Official Amazon White Wordmark from public folder (/amazon-white.svg)
 */
export function AmazonWordmarkWhite({
  className = "h-5 w-auto",
  alt = "Amazon",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/amazon-white.svg"
      alt={alt}
      className={`inline-block object-contain shrink-0 ${className}`}
      loading="lazy"
    />
  );
}

/**
 * Official Amazon SP-API Partner Cloud Shield Badge (Animated)
 */
export function AmazonSpApiBadge({ className = "w-12 h-12" }: IconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="spShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="spBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#FF9900" />
          </linearGradient>
        </defs>

        {/* Shield background */}
        <path
          d="M32 6 L12 15 V31 C12 43.5 20.5 54.8 32 58 C43.5 54.8 52 43.5 52 31 V15 L32 6 Z"
          fill="url(#spShieldGrad)"
          stroke="#2563EB"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Inner SP-API Nodes / Checkmark */}
        <path
          d="M23 32 L29 38 L41 26"
          stroke="#FF9900"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw-line"
        />

        {/* Pulse Core Dot */}
        <circle cx="32" cy="18" r="2.5" fill="#38BDF8" className="animate-pulse" />
      </svg>
    </div>
  );
}

/**
 * 100% Amazon Policy-Safe & TOS Guard Shield (Animated)
 */
export function AmazonTOSSafeShield({ className = "w-10 h-10" }: IconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="tosShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Shield Frame */}
        <path
          d="M24 4 L7 11.5 V23.5 C7 33.5 14.2 42.5 24 45 C33.8 42.5 41 33.5 41 23.5 V11.5 L24 4 Z"
          fill="url(#tosShield)"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Animated Check */}
        <path
          d="M17 24 L22 29 L31 19"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw-line"
        />

        {/* Satellite Shield Sparks */}
        <circle cx="24" cy="11" r="1.5" fill="#34D399" className="animate-ping" style={{ animationDuration: "3s" }} />
      </svg>
    </div>
  );
}

/**
 * Amazon Strict 5-30 Day Policy Window Timer (Animated Calendar & Clock)
 */
export function AmazonWindowTimer({ className = "w-10 h-10" }: IconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Calendar Frame */}
        <rect
          x="6"
          y="10"
          width="36"
          height="32"
          rx="6"
          fill="url(#timerGrad)"
          stroke="#10B981"
          strokeWidth="2"
        />
        {/* Calendar Header Bar */}
        <path d="M6 18 H42" stroke="#10B981" strokeWidth="1.75" />
        {/* Binder Rings */}
        <path d="M14 6 V12" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 6 V12" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center Clock Dial */}
        <circle cx="24" cy="30" r="9" stroke="#10B981" strokeWidth="1.75" fill="#047857" fillOpacity="0.15" />
        {/* Clock Hands */}
        <path d="M24 25 V30 L28 32" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />

        {/* Pulsing Target Dot */}
        <circle cx="24" cy="30" r="1.5" fill="#10B981" className="animate-ping" style={{ animationDuration: "2.5s" }} />
      </svg>
    </div>
  );
}

/**
 * Amazon FBA Parcel Box with Dispatch Waves (Animated)
 */
export function AmazonFbaDeliveryBox({ className = "w-10 h-10" }: IconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Isometric 3D Delivery Box */}
        <path
          d="M24 6 L40 15 V33 L24 42 L8 33 V15 L24 6 Z"
          fill="url(#boxGrad)"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M24 24 L40 15" stroke="#F59E0B" strokeWidth="1.75" />
        <path d="M24 24 V42" stroke="#F59E0B" strokeWidth="1.75" />
        <path d="M24 24 L8 15" stroke="#F59E0B" strokeWidth="1.75" />

        {/* FBA Tape Strip on top flap */}
        <path d="M16 10.5 L32 19.5" stroke="#FF9900" strokeWidth="2.5" strokeDasharray="3 2" />

        {/* Smile curve across the box face */}
        <path d="M13 25 C 17 31, 21 31, 23 27" stroke="#FF9900" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Amazon Buy Box Crown & Win Rate Multiplier (Animated)
 */
export function AmazonBuyBoxCrown({ className = "w-10 h-10" }: IconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Crown Body */}
        <path
          d="M8 35 L12 16 L20 25 L24 13 L28 25 L36 16 L40 35 H8 Z"
          fill="url(#crownGrad)"
          fillOpacity="0.25"
          stroke="url(#crownGrad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Crown Base */}
        <path d="M8 38 H40" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />

        {/* Crown Gem Jewels */}
        <circle cx="12" cy="16" r="2" fill="#F59E0B" className="animate-pulse" />
        <circle cx="24" cy="13" r="2.5" fill="#FF9900" className="animate-ping" style={{ animationDuration: "2s" }} />
        <circle cx="36" cy="16" r="2" fill="#F59E0B" className="animate-pulse" />
      </svg>
    </div>
  );
}

/**
 * Amazon 5-Star Rating Cluster (Animated)
 */
export function Amazon5StarRating({ className = "w-24 h-5" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="w-4 h-4 text-[#FFA41C] fill-current drop-shadow-xs transition-transform hover:scale-125"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
