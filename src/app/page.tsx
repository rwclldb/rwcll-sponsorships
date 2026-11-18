import type { ReactNode } from "react";
import Image from "next/image";

const navigation = [
  { label: "Overview", href: "#overview", icon: "◫" },
  { label: "Sponsors", href: "#sponsors", icon: "♙" },
  { label: "Packages", href: "#packages", icon: "◇" },
  { label: "Payments", href: "#payments", icon: "$" },
  { label: "Artwork", href: "#artwork", icon: "▧" },
  { label: "Fulfillment", href: "#fulfillment", icon: "✓" },
];

const workItems = [
  {
    number: "01",
    title: "Sponsor management",
    description: "Track sponsor contacts, registrations, and approval status.",
    status: "Planned",
    href: "#sponsors",
  },
  {
    number: "02",
    title: "Packages & invoicing",
    description: "Configure season packages and create invoices after approval.",
    status: "Planned",
    href: "#packages",
  },
  {
    number: "03",
    title: "Artwork & fulfillment",
    description: "Review logo files, approve artwork, and track banner placement.",
    status: "Planned",
    href: "#fulfillment",
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label">{children}</p>;
}

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a
          className="brand-logo-card"
          href="#overview"
          aria-label="Redwood City Little League sponsorship overview"
        >
          <Image
            src="/rwcll-logo.png"
            alt="Redwood City Little League"
            width={500}
            height={491}
            priority
            className="league-logo"
          />
        </a>

        <div className="sidebar-divider" />

        <p className="nav-heading">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item, index) => (
            <a
              className={`nav-link${index === 0 ? " active" : ""}`}
              href={item.href}
              key={item.label}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {index === 0 && <span className="active-dot" />}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="season-mini">
            <span className="season-mini-dot" />
            <div>
              <small>WORKING SEASON</small>
              <strong>Spring 2027</strong>
            </div>
          </div>
          <p className="sidebar-note">
            A volunteer-powered league, made possible by our community.
          </p>
          <span className="sidebar-version">LOCAL DEVELOPMENT</span>
        </div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar">
          <div className="breadcrumb">
            <span>RWCLL</span>
            <span className="breadcrumb-slash">/</span>
            <strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <span className="environment-pill">
              <span /> Prototype
            </span>
            <div className="avatar" aria-label="Administrator placeholder">A</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <SectionLabel>LEAGUE OPERATIONS</SectionLabel>
              <h1>Good morning, <span>RWCLL.</span></h1>
              <p className="welcome-copy">
                Every sponsor helps make the season a little more special.
                Here’s your sponsorship workspace.
              </p>
            </div>
            <div className="season-badge">
              <span className="season-badge-icon">✳</span>
              <div>
                <small>ACTIVE WORKSPACE</small>
                <strong>Spring 2027</strong>
              </div>
              <span className="chevron">⌄</span>
            </div>
          </section>

          <section className="hero-banner">
            <div className="hero-content">
              <span className="hero-kicker">THE COMMUNITY BEHIND THE GAME</span>
              <h2>Big seasons start<br />with <em>great partners.</em></h2>
              <p>
                One place to manage sponsorships, from the first conversation
                to the final banner on the field.
              </p>
              <a className="hero-link" href="#work">
                Explore your workspace <span>→</span>
              </a>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-sun" />
              <div className="hero-circle hero-circle-one" />
              <div className="hero-circle hero-circle-two" />
              <div className="baseball">
                <span className="baseball-stitch stitch-one" />
                <span className="baseball-stitch stitch-two" />
              </div>
              <div className="field-line field-line-one" />
              <div className="field-line field-line-two" />
              <div className="hero-tag">PLAY BALL</div>
            </div>
            <div className="hero-watermark">RW</div>
          </section>

          <section className="stats-section" aria-label="Season summary">
            <div className="section-heading-row">
              <div>
                <SectionLabel>AT A GLANCE</SectionLabel>
                <h2>Your season snapshot</h2>
              </div>
              <span className="sample-label">SAMPLE DATA</span>
            </div>
            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon stat-icon-blue">♙</span>
                  <span className="stat-caption">RELATIONSHIPS</span>
                </div>
                <strong className="stat-number">—</strong>
                <span className="stat-title">Sponsors</span>
                <span className="stat-foot">Awaiting database setup</span>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon stat-icon-gold">◇</span>
                  <span className="stat-caption">OPPORTUNITIES</span>
                </div>
                <strong className="stat-number">—</strong>
                <span className="stat-title">Available packages</span>
                <span className="stat-foot">Season packages to be configured</span>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon stat-icon-green">$</span>
                  <span className="stat-caption">FINANCIALS</span>
                </div>
                <strong className="stat-number">—</strong>
                <span className="stat-title">Payments recorded</span>
                <span className="stat-foot">No live financial data connected</span>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon stat-icon-purple">▧</span>
                  <span className="stat-caption">DELIVERABLES</span>
                </div>
                <strong className="stat-number">—</strong>
                <span className="stat-title">Artwork approvals</span>
                <span className="stat-foot">Approval workflow to be built</span>
              </article>
            </div>
          </section>

          <section className="work-section" id="work">
            <div className="section-heading-row">
              <div>
                <SectionLabel>YOUR WORKSPACE</SectionLabel>
                <h2>Everything in one place</h2>
              </div>
              <span className="muted-count">03 WORK AREAS</span>
            </div>
            <div className="work-list">
              {workItems.map((item) => (
                <a className="work-card" href={item.href} key={item.number}>
                  <span className="work-number">{item.number}</span>
                  <div className="work-copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="planned-pill">{item.status}</span>
                  <span className="work-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </section>

          <section className="bottom-grid">
            <article className="info-panel" id="sponsors">
              <div className="panel-heading">
                <div>
                  <SectionLabel>SPONSOR RELATIONSHIPS</SectionLabel>
                  <h2>Built around community</h2>
                </div>
                <span className="panel-symbol">♡</span>
              </div>
              <p>
                Keep sponsor details, package selections, approvals, and
                communications organized throughout the season.
              </p>
              <span className="panel-footnote">Sponsor directory · Planned</span>
            </article>
            <article className="info-panel gold-panel" id="fulfillment">
              <div className="panel-heading">
                <div>
                  <SectionLabel>FROM PROMISE TO FIELD</SectionLabel>
                  <h2>Make every thank-you count</h2>
                </div>
                <span className="panel-symbol">✳</span>
              </div>
              <p>
                Connect approved artwork, league-assigned teams, banner
                locations, and fulfillment tracking.
              </p>
              <span className="panel-footnote">Artwork & fulfillment · Planned</span>
            </article>
          </section>

          <div className="prototype-note" id="packages">
            <span className="prototype-note-icon">i</span>
            <p>
              <strong>Development preview.</strong> This page is a visual starting
              point. Sponsor records, invoices, payment tracking, artwork, and
              fulfillment will be connected after the database and access
              controls are implemented.
            </p>
          </div>

          <footer className="page-footer">
            <span>RWCLL · SPONSORSHIP MANAGEMENT</span>
            <span>Supporting the next generation, one season at a time.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
