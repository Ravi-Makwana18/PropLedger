import React, { useState, useEffect } from 'react';
import slider1 from '../assets/slider1.jpg';
import slider2 from '../assets/slider2.jpg';
import slider3 from '../assets/slider3.jpg';
import slider4 from '../assets/slider4.jpg';
import slider5 from '../assets/slider5.jpg';

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Real estate images for Dholera Smart City
  const slides = [
    {
      url: slider1,
      alt: 'Modern Smart City Development',
      title: 'Dholera Smart City'
    },
    {
      url: slider2,
      alt: 'Luxury Residential Properties',
      title: 'Premium Properties'
    },
    {
      url: slider3,
      alt: 'Modern Architecture',
      title: 'Modern Living'
    },
    {
      url: slider4,
      alt: 'Commercial Spaces',
      title: 'Commercial Opportunities'
    },
    {
      url: slider5,
      alt: 'Sustainable Development',
      title: 'Sustainable Future'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 3000); // Change slide every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isPaused, slides.length]);

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="hero-slider-section">
      <div 
        className="image-slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slides Container with overlay */}
        <div className="slider-wrapper">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slider-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), url(${slide.url})`,
              }}
            />
          ))}
        </div>
        {/* Overlayed hero content */}
        <div className="hero-slider-overlay">
          <h1 className="hero-slider-title">Welcome to Destination Dholera</h1>
          <div className="hero-slider-subtitle">Land, Plots, N.A. File Processing & Property Solutions</div>
        </div>
        {/* Navigation Arrows */}
        <button 
          className="slider-arrow slider-arrow-left" 
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button 
          className="slider-arrow slider-arrow-right" 
          onClick={goToNext}
          aria-label="Next slide"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        {/* Dots Navigation */}
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageSlider;
