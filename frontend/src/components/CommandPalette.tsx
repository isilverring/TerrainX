import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { useData } from "../lib/data";

export const PALETTE_EVENT = "terrainx:palette";
export const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

type Item = {
  id: string;
  group: string;
  label: string;
  hint: string;
  to: string;
  keywords: string;
};

const PAGES: [string, string, string][] = [
  [
    "/guide?cohort=expanded&polar=none",
    "Judge path",
    "Five decisions from the challenge to a sourced field proposal",
  ],
  [
    "/explorer",
    "Discovery atlas",
    "Map, shortlist and evidence for both missions",
  ],
  ["/frontier", "Discovery Frontier", "What missing evidence could change"],
  [
    "/research-lab",
    "Mission Research Lab",
    "Minerals, sunlight, ice, dust, biosignatures, caves and terrain experiments",
  ],
  ["/lenses", "Discovery lenses", "Six declared re-rankings of the shortlist"],
  [
    "/cells",
    "Search every cell",
    "Mission-aware ranking of all 130 screened cells",
  ],
  [
    "/lunar-pole",
    "Lunar south pole",
    "LOLA terrain at Artemis III region features",
  ],
  [
    "/challenge",
    "Challenge fit",
    "Space Apps dimensions mapped to TerrainX, gaps included",
  ],
  ["/cases", "Case studies", "Three scientific decisions, source-scoped"],
  [
    "/what-if",
    "What if the mission changes?",
    "Adjust α, weights and tolerances",
  ],
  [
    "/transfer-lab",
    "Planetary Transfer Lab",
    "Gravity, Froude and dynamic pressure",
  ],
  ["/worlds", "Compare Worlds", "Original NASA imagery side by side"],
  ["/terrain-pilot", "Terrain pilot", "Common-support Copernicus vs MOLA/LOLA"],
  ["/methodology", "Methodology", "Equations, sources and limits"],
  ["/research", "Research workspace", "Pinned, reproducible snapshots"],
  [
    "/field-study",
    "Field Study Builder",
    "Stations, traverse, GPX and field book",
  ],
  ["/offline", "Offline demo", "Prepare a verified offline presentation"],
  ["/compare", "Compare candidates", "Up to three side by side"],
];

/** Loose subsequence match with a contiguous-substring bonus; returns -1 when absent. */
export function matchScore(query: string, text: string) {
  const q = query.toLowerCase().trim(),
    t = text.toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx >= 0) return 100 - Math.min(idx, 50);
  let ti = 0,
    gaps = 0;
  for (const ch of q.replace(/\s+/g, "")) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return -1;
    gaps += found - ti;
    ti = found + 1;
  }
  return Math.max(1, 50 - gaps);
}

export default function CommandPalette() {
  const data = useData(),
    navigate = useNavigate(),
    [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0),
    input = useRef<HTMLInputElement>(null),
    modal = useRef<HTMLDialogElement>(null),
    returnFocus = useRef<HTMLElement | null>(null);

  const items = useMemo<Item[]>(() => {
    const pages = PAGES.map(([to, label, hint]) => ({
      id: `page:${to}`,
      group: "Pages",
      label,
      hint,
      to,
      keywords: `${label} ${hint}`,
    }));
    const candidates = data.candidates.flatMap((c) => {
      const kind = c.benchmark ? "reference analog" : c.status.toLowerCase();
      return [
        {
          id: `dna:${c.id}`,
          group: "Candidates",
          label: c.name,
          hint: `Analog DNA · ${kind}`,
          to: `/site/${c.id}`,
          keywords: `${c.name} ${c.region_id} dna dossier`,
        },
        {
          id: `fs:${c.id}`,
          group: "Candidates",
          label: `${c.name} — plan field study`,
          hint: "Field Study Builder",
          to: `/field-study?id=${c.id}`,
          keywords: `${c.name} ${c.region_id} field study plan stations`,
        },
        {
          id: `pp:${c.id}`,
          group: "Candidates",
          label: `${c.name} — passport`,
          hint: "Printable Analog Passport",
          to: `/passport/${c.id}`,
          keywords: `${c.name} ${c.region_id} passport print`,
        },
      ];
    });
    return [...pages, ...candidates];
  }, [data]);

  const results = useMemo(() => {
    if (!query.trim())
      return items
        .filter((i) => i.group === "Pages" || i.id.startsWith("dna:"))
        .slice(0, 12);
    return items
      .map((i) => ({ i, s: matchScore(query, i.keywords) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.i.label.localeCompare(b.i.label))
      .slice(0, 12)
      .map((x) => x.i);
  }, [items, query]);

  useEffect(() => {
    const show = () => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      setQuery("");
      setActive(0);
    };
    const key = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(
        (e.target as HTMLElement)?.tagName ?? "",
      );
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        returnFocus.current?.focus?.();
      } else if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        show();
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(PALETTE_EVENT, show);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener(PALETTE_EVENT, show);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  useEffect(() => {
    if (open) {
      modal.current?.showModal();
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);
  useEffect(() => setActive(0), [query]);

  const close = () => {
    modal.current?.close();
    setOpen(false);
    returnFocus.current?.focus?.();
  };
  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    navigate(item.to);
  };
  if (!open) return null;
  let lastGroup = "";
  return (
    <dialog
      ref={modal}
      aria-label="Jump to a page or candidate"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="palette-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="palette">
        <div className="palette-input">
          <Search size={17} aria-hidden="true" />
          <input
            ref={input}
            value={query}
            placeholder="Jump to a page or candidate…"
            role="combobox"
            aria-label="Search pages and candidates"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={
              results[active] ? `palette-${active}` : undefined
            }
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              } else if (e.key === "Tab") {
                e.preventDefault();
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" aria-label="Results">
          {results.length === 0 && (
            <li className="palette-empty">
              No page or candidate matches “{query}”.
            </li>
          )}
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            return (
              <li key={r.id} role="presentation">
                {header && <p className="palette-group">{header}</p>}
                <div
                  id={`palette-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`palette-item ${i === active ? "active" : ""}`}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(r)}
                >
                  <span>
                    <strong>{r.label}</strong>
                    <small>{r.hint}</small>
                  </span>
                  {i === active && (
                    <CornerDownLeft size={14} aria-hidden="true" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <footer>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Ctrl</kbd>
            <kbd>K</kbd> or <kbd>/</kbd> anywhere
          </span>
        </footer>
      </div>
    </dialog>
  );
}
