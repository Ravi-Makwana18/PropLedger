import React from 'react';
import ImageSlider from '../components/ImageSlider';
import EnquirySection from '../components/EnquirySection';

const TRUST_ITEMS = [
  {
    emoji: '✅',
    color: '#059669',
    bgColor: '#ecfdf5',
    title: 'Verified Land Deals',
    desc: 'Every listing is thoroughly vetted for legal clarity, ownership authenticity, and title purity.',
  },
  {
    emoji: '📄',
    color: '#2563eb',
    bgColor: '#eff6ff',
    title: 'Legal N.A. File Assistance',
    desc: 'End-to-end support for Non-Agricultural conversion with expert legal and government guidance.',
  },
  {
    emoji: '📈',
    color: '#d97706',
    bgColor: '#fffbeb',
    title: 'Expert Investment Guidance',
    desc: "Strategic advice from seasoned professionals to maximise your Dholera SIR returns.",
  },
];

const Home = () => {
  return (
    <div className="home-page">

      {/* ── HERO SECTION ──────────────────────────────────── */}
      <section className="hero-premium">
        {/* Slider fills the background */}
        <div className="hero-slider-bg">
          <ImageSlider />
        </div>

        {/* Dark gradient overlay for readability */}
        <div className="hero-overlay" />

        {/* Hero text content */}
        <div className="hero-content-wrap">
          <div className="hero-eyebrow">Dholera - India's First Greenfield Smart City</div>

          <h1 className="hero-headline">
            Welcome to<br />
            <span className="hero-headline-brand">Destination Dholera Private Limited</span>
          </h1>

          <p className="hero-sub">
            Your trusted partner for land buying, selling, N.A. file processing,
            and complete property solutions in Dholera SIR.
          </p>

          <div className="hero-cta-row">
            <a href="#contact" className="cta-btn cta-btn--solid">
              Explore Properties
            </a>
            <a href="#contact" className="cta-btn cta-btn--ghost">
              Contact Us
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint">
          <span className="scroll-line" />
          <span className="scroll-label">Scroll</span>
        </div>
      </section>

      {/* ── TRUST / ABOUT SECTION ─────────────────────────── */}
      <section className="trust-section">
        <div className="trust-container">
          <p className="trust-eyebrow">Why Choose Us</p>
          <h2 className="trust-heading">Transparent · Verified · Trusted</h2>
          <p className="trust-subtext">
            We deliver transparent guidance, verified properties, legal expertise,
            and secure investment opportunities across Dholera SIR.
          </p>

          <div className="trust-cards">
            {TRUST_ITEMS.map((item, i) => (
              <div className="trust-card" key={i}>
                <div
                  className="trust-card-icon"
                  style={{ background: item.bgColor, color: item.color }}
                >
                  <span>{item.emoji}</span>
                </div>
                <h3 className="trust-card-title">{item.title}</h3>
                <p className="trust-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENQUIRY SECTION ────────────────────────────────── */}
      <div id="contact">
        <EnquirySection />
      </div>

    </div>
  );
};

export default Home;
