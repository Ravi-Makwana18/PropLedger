import React from 'react';
import logo from '../assets/logo.png';
import { FaInstagram, FaWhatsapp, FaFacebookF, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-premium">
      <div className="footer-premium-inner">

        {/* ── Column 1: Brand + Description + Social ── */}
        <div className="fp-col fp-col--brand">
          <div className="fp-logo-row">
            <img src={logo} alt="Destination Dholera Logo" className="fp-logo" />
            <span className="fp-brand-name">Destination Dholera</span>
          </div>
          <p className="fp-brand-desc">
            Your trusted partner for land and plot buying, selling, N.A. file processing,
            and complete property solutions in Dholera SIR, Gujarat.
          </p>
          <div className="fp-social-row">
            <span className="fp-social-label">Follow us</span>
            <div className="fp-social-icons">
              <a
                href="https://www.instagram.com/destination_dholera_3614?igsh=bGc0cmM5a3V1ODR3"
                target="_blank" rel="noopener noreferrer"
                className="fp-social-icon fp-social-icon--insta"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://wa.me/919714772250"
                target="_blank" rel="noopener noreferrer"
                className="fp-social-icon fp-social-icon--whatsapp"
                aria-label="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href="https://www.facebook.com/share/17ZLSKyDKn/"
                target="_blank" rel="noopener noreferrer"
                className="fp-social-icon fp-social-icon--fb"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
            </div>
          </div>
        </div>

        {/* ── Column 2: Contact Information ── */}
        <div className="fp-col">
          <h3 className="fp-col-heading">Contact Us</h3>

          {/* Shared Email */}
          <div className="fp-contact-item" style={{ marginBottom: '1.25rem' }}>
            <FaEnvelope className="fp-contact-icon" />
            <a href="mailto:destination.dholera3614@gmail.com" className="fp-contact-link">
              destination.dholera3614@gmail.com
            </a>
          </div>

          {/* Two office sub-columns */}
          <div className="fp-offices-grid">
            {/* Office 1 */}
            <div className="fp-office-col">
              <div className="fp-contact-item">
                <FaPhone className="fp-contact-icon" />
                <a href="tel:+919714772250" className="fp-contact-link">+91 9714772250</a>
              </div>
              <div className="fp-contact-item fp-contact-item--address">
                <FaMapMarkerAlt className="fp-contact-icon" />
                <span>Office No. 4, Dharmavir Complex, Dholera Chokdi, New Dholera Road, Dholera, Ahmedabad – 382455</span>
              </div>
            </div>

            {/* Office 2 */}
            <div className="fp-office-col">
              <div className="fp-contact-item">
                <FaPhone className="fp-contact-icon" />
                <a href="tel:+916353728205" className="fp-contact-link">+91 6353728205</a>
              </div>
              <div className="fp-contact-item fp-contact-item--address">
                <FaMapMarkerAlt className="fp-contact-icon" />
                <span>704-A, Infinity Tower, Anand Nagar, Near Ramada Hotel, Ahmedabad – 380015</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Column 3: Quick Links ── */}
        <div className="fp-col">
          <h3 className="fp-col-heading">Quick Links</h3>
          <ul className="fp-links-list">
            <li><a href="/" className="fp-quick-link">Home</a></li>
            <li><a href="#contact" className="fp-quick-link">Contact</a></li>
            <li><a href="/login" className="fp-quick-link">Login</a></li>
            <li><a href="/dashboard" className="fp-quick-link">Dashboard</a></li>
          </ul>
        </div>

      </div>

      {/* ── Bottom divider + copyright ── */}
      <div className="fp-bottom">
        <div className="fp-divider" />
        <p className="fp-copyright">
          © 2026 Destination Dholera Private Limited. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
