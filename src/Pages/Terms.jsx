import React from "react";
import logo from "../Images/HoopersFits.png";
import heroBg from "../Images/sapatos.jpg";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";

const Terms = () => {
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

        /* ---------- TERMS BOX ---------- */
        .terms-section {
          width: 100%;
          max-width: 800px;
          background: rgba(255,255,255,0.95);
          color: #333;
          border-radius: 12px;
          padding: 30px;
          backdrop-filter: blur(6px);
          transition: all 0.4s ease;
        }

        .terms-section h1 {
          font-size: 28px;
          margin-bottom: 20px;
          text-align: center;
          color: #dc3545;
        }

        .terms-section h2 {
          font-size: 20px;
          margin-top: 20px;
          margin-bottom: 10px;
          color: #dc3545;
        }

        .terms-section p {
          margin-bottom: 15px;
          line-height: 1.6;
        }

        .terms-section ul {
          margin-bottom: 15px;
          padding-left: 20px;
        }

        .terms-section li {
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
          .terms-section {
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
          <div className="terms-section">
              <h1>TERMS & CONDITIONS</h1>

              <p>Welcome to our store. By accessing or using our website, you agree to be bound by these Terms and Conditions.</p>

              <h2>1. Use of the Website</h2>
              <p>You agree to use the website only for lawful purposes, and in a way that does not infringe the rights of others.</p>

              <h2>2. Products & Pricing</h2>
              <ul> 
                <li>We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site.</li>
                <li>Prices may change without prior notice.</li>
              </ul>

              <h2>3. Orders & Payment</h2>
              <ul>
                <li>Orders are confirmed upon successful payment.</li>
                <li>We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies, or errors in product or pricing information.</li>
              </ul>

              <h2>4. Shipping & Delivery</h2>
              <ul>
                <li>Delivery times may vary depending on shipping location. We are not responsible for delays beyond our control.</li>
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

export default Terms;