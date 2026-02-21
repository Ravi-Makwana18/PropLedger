import React from 'react';
import ImageSlider from '../components/ImageSlider';
import logo from '../assets/logo.png';

const Home = () => {
  return (
    <div>
      {/* Image Slider Section (now at top) */}
      <ImageSlider />
      {/* Welcome Section (now below slider) */}
      <div className="hero-section" style={{
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 1rem 3rem 1rem',
        backgroundColor: '#f8f9fa',
        overflow: 'hidden'
      }}>
        {/* Background Logo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.08,
          zIndex: 0
        }}>
          <img 
            src={logo} 
            alt="" 
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
        {/* Content */}
        <div className="container" style={{ maxWidth: '820px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          
          <hr style={{
            border: 'none',
            borderTop: '1.5px solid #e5e7eb',
            margin: '1.2rem auto 1.2rem auto',
            width: '60%'
          }} />
          <p style={{
            fontSize: '1.22rem',
            color: '#374151',
            marginBottom: '0',
            lineHeight: '1.7',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif'
          }}>
            Your trusted partner for land buying, selling, N.A. file processing, and complete property solutions in Dholera SIR.<br />
            We deliver transparent guidance, verified properties, legal expertise, and secure investment opportunities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
