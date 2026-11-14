import {
  ArrowUpRight,
  ArrowLeft,
  Orbit,
  FileText,
  Microscope,
  Play,
  Menu,
  Search,
  X,
} from "lucide-react";
import { openPalette } from "./CommandPalette";
import { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { number } from "../lib/data";
import type { Assessment, Mission } from "../lib/models";
export function Header({
  presentation = false,
  onStartPresentation = () => {},
  onEndPresentation = () => {},
}: {
  presentation?: boolean;
  onStartPresentation?: () => void;
  onEndPresentation?: () => void;
}) {
  const location = useLocation(),
    landing = location.pathname === "/",
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [location.pathname]);
  const groups = [
    {
      name: "Discover",
      links: [
        ["/explorer", "Discovery"],
        ["/frontier", "Frontier"],
        ["/lenses", "Lenses"],
        ["/cases", "Cases"],
      ],
    },
    {
      name: "Investigate",
      links: [
        ["/what-if", "What if"],
        ["/transfer-lab", "Transfer Lab"],
        ["/worlds", "Worlds"],
        ["/terrain-pilot", "Terrain pilot"],
        ["/methodology", "Methodology"],
      ],
    },
    {
      name: "Prepare",
      links: [
        ["/research", "Research"],
        ["/field-study", "Field study"],
        ["/offline", "Offline"],
      ],
    },
  ];
  return (
    <header
      className={`app-header ${landing ? "landing-header" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const main =
            document.querySelector<HTMLElement>("main,[role=dialog]");
          main?.setAttribute("tabindex", "-1");
          main?.focus();
        }}
      >
        Skip to main content
      </a>
      <Link
        className="brand"
        to={presentation ? "/?presentation=0" : "/"}
        aria-label="TerrainX home"
        onClick={onEndPresentation}
      >
        <img
          className="brand-mark"
          src="/brand/terrainx-mark.svg"
          alt=""
          width="42"
          height="38"
        />
        <span>
          Terrain<span className="brand-x">X</span>
          {presentation ? (
            <small className="brand-mode">
              Presenting · research preserved
            </small>
          ) : null}
        </span>
      </Link>
      <nav
        id="journey-navigation"
        className={`journey-nav ${open ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        {groups.map((group) => (
          <div className="journey-group" key={group.name}>
            <span>{group.name}</span>
            <div>
              {group.links.map(([path, label]) => (
                <NavLink key={path} to={path}>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <button
        ref={toggle}
        className="mobile-nav-button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="journey-navigation"
        onClick={() => setOpen((x) => !x)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="header-actions">
        <button
          className="palette-launch"
          onClick={openPalette}
          aria-label="Search pages and candidates (Ctrl+K)"
          title="Search pages and candidates (Ctrl+K or /)"
        >
          <Search size={15} />
          <kbd>⌘K</kbd>
        </button>
        {presentation ? (
          <Link
            className="demo-launch"
            to="/explorer?presentation=0"
            aria-label="Exit presentation"
            onClick={onEndPresentation}
          >
            <X size={14} /> Exit presentation
          </Link>
        ) : (
          <Link
            className="demo-launch"
            to="/demo?presentation=1"
            onClick={onStartPresentation}
          >
            <Play size={14} /> Guided demo
          </Link>
        )}
      </div>
    </header>
  );
}
export function EvidenceTag({ kind }: { kind: string }) {
  return (
    <span className={`evidence-tag tag-${kind.toLowerCase()}`}>{kind}</span>
  );
}
export function ScoreStrip({
  assessment,
  compact = false,
}: {
  assessment: Assessment;
  compact?: boolean;
}) {
  return (
    <div className={`score-strip ${compact ? "compact" : ""}`}>
      <div
        title={
          assessment.fidelity.reason ?? "Exploratory physical terrain fidelity"
        }
      >
        <span>
          <b>F</b> fidelity
        </span>
        <strong>{number(assessment.fidelity.value, 0)}</strong>
      </div>
      <div title="Declared model of Earth experiment suitability">
        <span>
          <b>U</b> utility
        </span>
        <strong>{number(assessment.utility.value, 0)}</strong>
      </div>
      <div title="Assessed share of mission criterion weights">
        <span>
          <b>C</b> coverage
        </span>
        <strong>
          {number(100 * assessment.utility.coverage, 0)}
          <small>%</small>
        </strong>
      </div>
    </div>
  );
}
export function SourceLink({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <a className="source-link" href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={13} />
    </a>
  );
}
export function BackLink({ mission }: { mission: Mission }) {
  return (
    <Link className="back-link" to={`/explorer?mission=${mission}`}>
      <ArrowLeft size={16} />
      Discovery atlas
    </Link>
  );
}
export function SiteActions({ id, mission }: { id: string; mission: Mission }) {
  return (
    <div className="site-actions">
      <Link className="button primary" to={`/site/${id}?mission=${mission}`}>
        <Microscope size={17} />
        Analog DNA
      </Link>
      <Link
        className="button outline"
        to={`/passport/${id}?mission=${mission}`}
      >
        <FileText size={17} />
        Analog Passport
      </Link>
    </div>
  );
}
export function Loading({
  message = "Loading scientific workspace…",
}: {
  message?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <Orbit size={32} />
      <p>{message}</p>
    </div>
  );
}
