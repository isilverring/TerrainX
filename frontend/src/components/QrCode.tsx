import qrcode from "qrcode-generator";

/** Crisp, offline QR code as inline SVG (prints without external images). */
export default function QrCode({
  value,
  size = 96,
  label,
}: {
  value: string;
  size?: number;
  label: string;
}) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount(),
    quiet = 4;
  let d = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
  return (
    <svg
      className="qr-code"
      width={size}
      height={size}
      viewBox={`0 0 ${n + 2 * quiet} ${n + 2 * quiet}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#0b1322" />
    </svg>
  );
}
