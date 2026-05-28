import React from "react";
import logo from "../Images/HoopersFits.png";
import heroBg from "../Images/sapatos.jpg";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";

const Privacy = () => {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        html, body {
          width: 100vw;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background-color: #000;
          color: #fff;
          overflow-x: hidden;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 50px;
          background-color: #000; 
          z-index: 10;
        }

        .logo { width: 100px; }

        .nav a {
          color: #fff;
          text-decoration: none;
          margin-left: 20px;
          font-size: 14px;
        }

        .nav a:hover { color: #dc3545; }

        .hero {
          position: relative;
          width: 100vw;
          min-height: 80vh;
          overflow: hidden;
        }

        .hero::before {
          content: "";
          position: absolute;
          top: -10%;
          left: -5%;
          width: 110%;
          height: 130%;
          background:
            linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
            url(${heroBg}) no-repeat center center / cover;
          transform: skewY(-5deg);
          transform-origin: top left;
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          padding: 0 80px;
        }

        /* ---------- PRIVACY BOX ---------- */
        .privacy-section {
          width: 100%;
          max-width: 800px;
          background: rgba(255,255,255,0.95);
          color: #333;
          border-radius: 12px;
          padding: 30px;
          backdrop-filter: blur(6px);
          transition: all 0.4s ease;
        }

        .privacy-section h1 {
          font-size: 28px;
          margin-bottom: 20px;
          text-align: center;
          color: #dc3545;
        }

        .privacy-section h2 {
          font-size: 20px;
          margin-top: 20px;
          margin-bottom: 10px;
          color: #dc3545;
        }

        .privacy-section p {
          margin-bottom: 15px;
          line-height: 1.6;
        }

        .privacy-section ul {
          margin-bottom: 15px;
          padding-left: 20px;
        }

        .privacy-section li {
          margin-bottom: 10px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 50px;
          font-size: 12px;
        }

        .footer-link {
          color: #fff;
          text-decoration: none;
          margin: 0 5px;
        }

        .footer-link:hover { color: #dc3545; }

        .social-icons a img {
          width: 20px;
          margin-left: 10px;
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .social-icons a:hover img {
          transform: scale(1.2);
          filter: brightness(1.5);
        }

        @media (max-width: 900px) {
          .hero-content {
            padding: 0 20px;
          }
          .privacy-section {
            padding: 20px;
          }
        }
      `}</style>

      <div className="header">
        <img src={logo} className="logo" alt="Hoopers Fits Logo" />
        <nav className="nav">
          <a href="/login">HOME</a>
          <a href="/login">PRODUCT</a>
          <a href="/login">ABOUT</a>
          <a href="/login">CONTACT</a>
        </nav>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="privacy-section">
            <h1>PRIVACY POLICY</h1>

            <p>Your privacy is important to us. This Privacy Policy explains how we collect and use your information.</p>

            <h2>1. Information We Collect</h2>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Personal data (processed securely and only for data analysis purposes)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>A. View item likes</p>
            <p>B. Data Protection</p>
            <ul>
              <li>To process, summarize</li>
              <li>To enrich profile insights</li>
              <li>Greater user insights, create your learning experience</li>
            </ul>

            <p>We only store your uploaded data live only for the years you provide them.</p>

            <h2>3. Data Protection</h2>
            <ul>
              <li>Assist in protecting data when they require data-related protection.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>
          <a href="/privacy" className="footer-link">Privacy Policy</a> |
          <a href="/terms" className="footer-link">Terms & Conditions</a>
        </p>
        <div>
          Follow us on:
            <span className="social-icons">
              <a href="https://www.facebook.com/share/1as5kdEkMr/" target="_blank" rel="noopener noreferrer">
                <img src={facebookIcon} alt="Facebook" />
              </a>
              <a href="https://www.instagram.com/hoopersfits.ph?igsh=ZTFtNmw1YTR0OGZ6" target="_blank" rel="noopener noreferrer">
                <img src={instagramIcon} alt="Instagram" />
              </a>
            </span>
        </div>
      </footer>
    </>
  );
};

export default Privacy;