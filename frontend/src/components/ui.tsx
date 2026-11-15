import {
  ArrowUpRight,
  ArrowLeft,
  ChevronDown,
  Orbit,
  FileText,
  Microscope,
  Play,
  Menu,
  Search,
  X,
} from "lucide-react";
import { openPalette } from "./CommandPalette";
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { number } from "../lib/data";
import { studyPath } from "../lib/collections";
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
    [researchOpen, setResearchOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    setOpen(false);
    setResearchOpen(false);
  }, [location.pathname]);
  // A click anywhere outside the header closes the research menu.
  useEffect(() => {
    if (!researchOpen) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(".app-header")) setResearchOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [researchOpen]);
  const groups = [
    {
      name: "Discover",
      links: [
        ["/explorer", "Discovery"],
        ["/frontier", "Frontier"],
        ["/lenses", "Lenses"],
        ["/cells", "All cells"],
        ["/cases", "Cases"],
      ],
    },
    {
      name: "Investigate",
      links: [
        ["/what-if", "What if"],
        ["/research-lab", "Research Lab"],
        ["/challenge", "Challenge fit"],
        ["/transfer-lab", "Transfer Lab"],
        ["/worlds", "Worlds"],
        ["/lunar-pole", "Lunar pole"],
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
  const selectedSite =
    location.pathname.match(/^\/(?:site|passport|expedition)\/([^/]+)$/)?.[1] ??
    new URLSearchParams(location.search).get("id") ??
    new URLSearchParams(location.search).get("atlas_id");
  return (
    <header
      className={`app-header ${landing ? "landing-header" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          setResearchOpen(false);
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
        to={
          presentation
            ? "/?presentation=0&cohort=original&polar=none"
            : "/?cohort=original&polar=none"
        }
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
        <div className="journey-group">
          <span>Mission workflow</span>
          <div>
            {[
              ["/guide?cohort=expanded&polar=none", "Start here"],
              ["/explorer", "Discovery"],
              ["/cells", "All cells"],
              ["/cases", "Cases"],
              ["/field-study", "Field study"],
            ].map(([path, label]) => (
              <NavLink
                key={path}
                to={studyPath(
                  path === "/field-study" && selectedSite
                    ? `${path}?id=${encodeURIComponent(selectedSite)}`
                    : path,
                  location.search,
                )}
              >
                {label}
              </NavLink>
            ))}
            <button
              className="research-toggle"
              aria-expanded={researchOpen}
              aria-controls="research-navigation"
              onClick={() => setResearchOpen((v) => !v)}
            >
              Research tools
              <ChevronDown size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>
      <nav
        id="research-navigation"
        className="research-menu"
        aria-label="Research tools"
        hidden={!researchOpen}
      >
        <button
          className="research-close"
          aria-label="Close research tools"
          onClick={() => setResearchOpen(false)}
        >
          <X size={18} />
        </button>
        {groups.map((group) => (
          <div className="journey-group" key={group.name}>
            <span>{group.name}</span>
            <div>
              {group.links
                .filter(
                  ([path]) =>
                    !["/explorer", "/cells", "/cases", "/field-study"].includes(
                      path,
                    ),
                )
                .map(([path, label]) => (
                  <NavLink key={path} to={studyPath(path, location.search)}>
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
  const location = useLocation();
  const { id } = useParams();
  return (
    <Link
      className="back-link"
      to={studyPath(
        `/explorer?mission=${mission}${id ? `&id=${encodeURIComponent(id)}&atlas_id=${encodeURIComponent(id)}` : ""}`,
        location.search,
      )}
    >
      <ArrowLeft size={16} />
      Discovery atlas
    </Link>
  );
}
export function SiteActions({ id, mission }: { id: string; mission: Mission }) {
  const location = useLocation();
  return (
    <div className="site-actions">
      <Link
        className="button primary"
        to={studyPath(
          `/site/${id}?mission=${mission}&atlas_id=${encodeURIComponent(id)}`,
          location.search,
        )}
      >
        <Microscope size={17} />
        Analog DNA
      </Link>
      <Link
        className="button outline"
        to={studyPath(
          `/passport/${id}?mission=${mission}&atlas_id=${encodeURIComponent(id)}`,
          location.search,
        )}
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
