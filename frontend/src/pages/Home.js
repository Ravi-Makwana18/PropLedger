import React from 'react';
import ImageSlider from '../components/ImageSlider';
import logo from '../assets/logo.png';

const Home = () => {
  return (
    <div>
      {/* Welcome Section */}
      <div className="hero-section" style={{
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '4rem 1rem',
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
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '1.5rem',
            fontFamily: '"Bricolage Grotesque", sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            Welcome to Destination Dholera
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#4b5563',
            marginBottom: '0',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            Your trusted partner in real estate investments and property management.
          </p>
        </div>
      </div>

      {/* Image Slider Section */}
      <ImageSlider />
    </div>
  );
};

export default Home;
