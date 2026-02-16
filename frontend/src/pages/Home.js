import React from 'react';
import ImageSlider from '../components/ImageSlider';

const Home = () => {
  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '4rem 1rem'
      }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '1.5rem',
            fontFamily: '"Bricolage Grotesque", sans-serif'
          }}>
            Welcome to Destination Dholera
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0',
            lineHeight: '1.6'
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
