import type { ReactNode } from "react";
import { Info } from "lucide-react";

/**
 * A scientific limit kept short on first view: the lead sentence is always visible, and
 * the full statement opens on demand. It is still in the DOM, so print, search and
 * screen readers get the complete text.
 */
export default function Limits({
  lead,
  children,
  className = "",
}: {
  lead: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  if (!children)
    return (
      <p className={`limits limits-lead-only ${className}`}>
        <Info size={13} aria-hidden="true" />
        <span>{lead}</span>
      </p>
    );
  return (
    <details className={`limits ${className}`}>
      <summary>
        <Info size={13} aria-hidden="true" />
        <span>{lead}</span>
        <em>Limits</em>
      </summary>
      <div className="limits-body">{children}</div>
    </details>
  );
}
