import React, { useState, useEffect } from 'react';

// ── Slide image assets ─────────────────────────────────────────────────────
import slider1 from '../assets/slider1.jpg';
import slider2 from '../assets/slider2.jpg';
import slider3 from '../assets/slider3.jpg';
import slider6 from '../assets/slider6.jpg';
import slider7 from '../assets/slider7.jpg';
import slider8 from '../assets/slider8.jpg';
import slider9 from '../assets/slider9.jpg';
import slider10 from '../assets/slider10.jpg';
import slider11 from '../assets/slider11.jpg';

// ── Slide definitions (url + accessibility alt + visible title) ───────────
const slides = [
  { url: slider1, alt: 'Modern Smart City Development', title: 'Dholera Smart City' },
  { url: slider2, alt: 'Luxury Residential Properties', title: 'Premium Properties' },
  { url: slider3, alt: 'Modern Architecture', title: 'Modern Living' },
  { url: slider6, alt: 'Aerial Smart City Township', title: 'Planned Township' },
  { url: slider7, alt: 'Dholera SIR Plot Development', title: 'Prime Plots Available' },
  { url: slider8, alt: 'Dholera Industrial Skyline', title: 'Investment Opportunity' },
  { url: slider9, alt: 'Dholera Smart City View', title: 'Smart City Living' },
  { url: slider10, alt: 'Dholera Real Estate', title: 'Your Dream Investment' },
  { url: slider11, alt: 'Dholera Development', title: 'Future of Gujarat' },
];

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 3 s; pauses on mouse hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Navigate to the previous slide (wraps around)
  const goToPrevious = () =>
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));

  // Navigate to the next slide (wraps around)
  const goToNext = () =>
    setCurrentSlide(prev => (prev + 1) % slides.length);

  return (
    <section className="hero-slider-section">
      <div
        className="image-slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* ── Slide backgrounds ── */}
        <div className="slider-wrapper">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slider-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.42) 100%), url(${slide.url})`,
              }}
            />
          ))}
        </div>

        {/* ── Overlaid hero text ── */}
        <div className="hero-slider-overlay">
          <h1 className="hero-slider-title">Welcome to Destination Dholera</h1>
          <div className="hero-slider-subtitle">Land, Plots, N.A. File Processing &amp; Property Solutions</div>
        </div>

        {/* ── Previous / Next arrow buttons ─────────────────────────────────
            onTouchEnd is used alongside onClick to guarantee response
            on mobile browsers that may suppress click during scroll detection. ── */}
        <button
          className="slider-arrow slider-arrow-left"
          onClick={goToPrevious}
          onTouchEnd={e => { e.preventDefault(); goToPrevious(); }}
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          className="slider-arrow slider-arrow-right"
          onClick={goToNext}
          onTouchEnd={e => { e.preventDefault(); goToNext(); }}
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* ── Dot navigation indicators ── */}
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageSlider;
