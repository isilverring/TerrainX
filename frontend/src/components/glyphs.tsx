/** Small, original planetary glyphs. Decorative only; not to scale. */
export function MarsGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="planet-glyph mars-glyph"
    >
      <circle cx="12" cy="12" r="9.2" fill="#F17E5A" opacity=".18" />
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="#F17E5A" strokeWidth="1.6" />
      <path
        d="M4.3 9.2c3 .9 5.6.6 8.1-.4 2.2-.9 4.4-1 7.2-.2M3.4 13.6c2.6.5 4.9.1 7.4-.8 2.7-1 5.6-1.1 9.8.1"
        fill="none"
        stroke="#F17E5A"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity=".75"
      />
      <ellipse cx="15.6" cy="16.6" rx="1.7" ry="1.1" fill="#F17E5A" opacity=".75" />
      <path d="M9.4 4.1c1.6-.5 3.6-.5 5.2 0" stroke="#F2F5FA" strokeWidth="1.3" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}
export function MoonGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="planet-glyph moon-glyph"
    >
      <circle cx="12" cy="12" r="9.2" fill="#C6D7E8" opacity=".14" />
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="#C6D7E8" strokeWidth="1.6" />
      <path
        d="M7.2 8.4c1.6-1.7 4.4-2.1 5.9-.6 1.3 1.3.7 3.4-1.1 4.1-1.5.6-2.6 1.9-4 1.7-1.9-.3-2.2-3.6-.8-5.2Z"
        fill="#C6D7E8"
        opacity=".55"
      />
      <circle cx="15.8" cy="14.8" r="2.1" fill="none" stroke="#C6D7E8" strokeWidth="1.1" opacity=".85" />
      <circle cx="10.4" cy="17.2" r="1.1" fill="none" stroke="#C6D7E8" strokeWidth="1" opacity=".7" />
      <circle cx="16.6" cy="8.2" r=".9" fill="#C6D7E8" opacity=".7" />
    </svg>
  );
}
