import React from 'react';

interface BugSolutionsLogoProps {
  className?: string;
  showTagline?: boolean;
  variant?: 'full' | 'compact' | 'icon-only' | 'badge';
  height?: number | string;
  inverted?: boolean; // When placed on dark backgrounds like Navy Blue banners
}

export const BugSolutionsLogo: React.FC<BugSolutionsLogoProps> = ({
  className = '',
  showTagline = true,
  variant = 'full',
  height = 44,
  inverted = false,
}) => {
  const orange = '#F05A28';
  const blue = inverted ? '#FFFFFF' : '#164EA7';
  const taglineColor = inverted ? '#93C5FD' : '#164EA7';

  // 1. Stylized Iconic "B" Monogram with two upward chevrons (แบบสมบูรณ์ ไร้รอยขาด)
  const renderIconMark = () => (
    <g id="b-monogram">
      {/* Outer B Shape with rounded corners */}
      <path
        d="M 12 12 L 48 12 C 68 12, 84 24, 84 41 C 84 55, 72 64, 52 64 L 54 64 C 74 64, 88 74, 88 91 C 88 108, 70 118, 48 118 L 12 118 Z"
        fill="none"
        stroke={orange}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Upper Chevron Arrow (Pointing Up) */}
      <path
        d="M 24 50 L 48 26 L 72 50"
        fill="none"
        stroke={orange}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower Chevron Arrow (Pointing Up) */}
      <path
        d="M 24 102 L 48 78 L 72 102"
        fill="none"
        stroke={orange}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );

  // Variant: Icon Only
  if (variant === 'icon-only') {
    return (
      <svg
        viewBox="0 0 100 130"
        style={{ height }}
        className={`w-auto shrink-0 select-none ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BUG SOLUTIONS Icon"
      >
        {renderIconMark()}
      </svg>
    );
  }

  // Variant: Badge (Encapsulated in a clean white rounded card with soft border & shadow)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs ${className}`}>
        <BugSolutionsLogo
          variant="full"
          height={typeof height === 'number' ? height - 12 : height}
          showTagline={showTagline}
          inverted={false}
        />
      </div>
    );
  }

  // Variant: Full Corporate Logo (Official BUG SOLUTIONS - Building Ultimate Growth)
  // Perfectly proportioned, continuous typography with NO broken gaps
  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        viewBox={showTagline ? "0 0 680 135" : "0 0 680 100"}
        style={{ height }}
        className="w-auto max-w-full select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BUG SOLUTIONS - Building Ultimate Growth"
      >
        {/* ICON MARK: B on the left */}
        <g transform="translate(6, 2) scale(0.68)">
          {renderIconMark()}
        </g>

        {/* LOGO TEXT: Seamless Typography Group */}
        <g transform="translate(82, 62)">
          {/* "BUG" in Vibrant Corporate Orange */}
          <text
            x="0"
            y="0"
            fill={orange}
            style={{
              fontFamily: "'Prompt', 'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 800,
              fontSize: '44px',
              letterSpacing: '-0.5px'
            }}
          >
            UG
          </text>

          {/* "SOLUTIONS" in Royal Navy Blue (or Crisp White if inverted) */}
          {/* Rendered as one continuous string with the iconic orange growth arrow precisely placed */}
          <text
            x="76"
            y="0"
            fill={blue}
            style={{
              fontFamily: "'Prompt', 'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 800,
              fontSize: '44px',
              letterSpacing: '-0.2px'
            }}
          >
            SOLUT
          </text>

          {/* Combined 'I' and 'O' with Top-Right Orange Growth Arrow */}
          <g transform="translate(254, -36)">
            {/* Blue Lower Stem of I */}
            <rect
              x="0"
              y="14"
              width="9.5"
              height="22"
              fill={blue}
              rx="1.5"
            />
            {/* Orange Growth Arrow Pin atop the letter I */}
            <polygon
              points="0,-1 14,-1 14,13"
              fill={orange}
            />
            {/* Inner White Notch detail on arrow */}
            <polygon
              points="3,2 10,2 10,9"
              fill={inverted ? '#1E3A8A' : '#FFFFFF'}
            />
          </g>

          {/* 'ONS' finishing the word with zero artificial gap */}
          <text
            x="272"
            y="0"
            fill={blue}
            style={{
              fontFamily: "'Prompt', 'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 800,
              fontSize: '44px',
              letterSpacing: '-0.2px'
            }}
          >
            ONS
          </text>
        </g>

        {/* TAGLINE: "Building Ultimate Growth" */}
        {showTagline && (
          <text
            x="300"
            y="98"
            textAnchor="middle"
            fill={taglineColor}
            style={{
              fontFamily: "'Prompt', 'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 700,
              fontSize: '17px',
              letterSpacing: '0.8px'
            }}
          >
            Building Ultimate Growth
          </text>
        )}
      </svg>
    </div>
  );
};

export default BugSolutionsLogo;
