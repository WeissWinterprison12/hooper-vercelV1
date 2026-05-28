// buyer_home.jsx - SIMPLIFIED: Uses AuthContext
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; 
import logo from "../Images/HoopersFits.png";
import profileIcon from "../Images/Profile.png";
import cartIcon from "../Images/Cart.png";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";
import defaultAvatar from "../Images/Man.png";

import img1 from "../Images/Black simple caps fashion promotion - instagram post.jpg";
import img2 from "../Images/cdg.jpg";
import img3 from "../Images/fireeee.jpg";

const BuyerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);

  // ✅ USE AUTHCONTEXT (NO API CALL!)
  useEffect(() => {
    if (!user) {
      handleLogout();
      return;
    }

    if (user.role !== "buyer") {
      handleLogout();
      return;
    }

    console.log("✅ User:", user);
    setLoading(false);
  }, [user]);
  
  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };
  
  const handleProfileClick = () => {
    navigate('/buyer_dashboard');
  };

  const handleCartClick = () => {
    navigate('/checkout');
  };

  // ✅ Get name from session
  const userName = user?.name || "Buyer";
  
  // ✅ Build avatar URL from session
  const userAvatar = user?.profile_image 
    ? `http://localhost/hooper_fits_api/uploads/profiles/${user.profile_image}`
    : defaultAvatar;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.parentNode) {
      e.target.parentNode.innerHTML = '👤';
    }
  };

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff'}}>
        Loading...
      </div>
    );
  }

  return (
    <> 
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background-color: #fff;
          color: #000;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 50px;
          border-bottom: 1px solid #ddd;
          background-color: #000;
        }

        .logo {
          width: 110px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .nav a {
          color: #fff;
          text-decoration: none;
          font-size: 14px;
        }

        .nav a:hover,
        .nav a.active {
          color: #dc3545;
          font-weight: 600;
        }

        .search-bar input {
          background: #333;
          border: 1px solid #555;
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          width: 200px;
          outline: none;
        }

        .icons {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #dc3545;
          object-fit: cover;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .user-avatar:hover {
          transform: scale(1.1);
        }

        .icons img {
          width: 22px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .icons img:hover {
          transform: scale(1.15);
        }

        .logout-btn {
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          margin-left: 15px;
          transition: color 0.3s ease;
          cursor: pointer;
        }

        .logout-btn:hover {
          color: #dc3545;
          font-weight: 600;
        }

        .user-greeting {
          color: #fff;
          font-size: 14px;
          margin-right: 10px;
        }

        .user-greeting span {
          color: #dc3545;
          font-weight: 600;
        }

        .home-container {
          padding: 50px 50px 20px 50px;
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
        }

        .featured-card {
          background: #f0f0f0;
          border-radius: 10px;
          height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #777;
          font-size: 14px;
          text-transform: uppercase;
          overflow: hidden;
        }

        .featured-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }

        .home-arrows {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin: 20px 0;
          font-size: 24px;
          cursor: pointer;
          color: #000;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 50px;
          font-size: 12px;
          border-top: 1px solid #ddd;
          background-color: #000;
          color: #fff;
        }

        .footer-link {
          color: #fff;
          text-decoration: none;
          margin: 0 5px;
        }

        .footer-link:hover {
          color: #dc3545;
        }

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
          .featured-grid {
            grid-template-columns: 1fr;
          }

          .home-container {
            padding: 20px;
          }
        }
      `}</style>

      <header className="header">
        <img src={logo} className="logo" alt="Hoopers Fits Logo" />

        <nav className="nav">
          <a href="/buyer_home" className="active">Home</a>
          <a href="/buyer_shop">Shop</a>
          <a href="#">New Fits</a>
          <a href="/contact">Contact Us</a>
        </nav>

        <div className="search-bar">
          <input type="text" placeholder="Search" />
        </div>

        <div className="icons">
          <span style={{color: '#fff', fontSize: '14px', marginRight: '10px'}}>
            Hi, <a 
              onClick={() => navigate('/buyer_dashboard')}
              style={{
                color: '#dc3545', 
                fontWeight: '600', 
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              title="Go to Dashboard"
            >
              {userName.split(' ')[0]}
            </a>!
          </span>
          
          <img 
            src={userAvatar} 
            className="user-avatar"
            alt="Profile"
            title="Go to Dashboard"
            onClick={handleProfileClick}
            onError={handleImageError}
          />

          <a href="/checkout" onClick={handleCartClick}>
            <img src={cartIcon} alt="Cart" title="Checkout" />
          </a>
        </div>

        <span className="logout-btn" onClick={handleLogout}>
          Logout
        </span>
      </header>

      <section className="home-container">
        <div className="featured-grid">
          <div className="featured-card">
            <img src={img1} alt="Discount" />
          </div>

          <div className="featured-card">
            <img src={img2} alt="Lifestyle" />
          </div>

          <div className="featured-card">
            <img src={img3} alt="Outfit" />
          </div>
        </div>

        <div className="home-arrows">← →</div>
      </section>

      <footer className="footer">
        <p>
          <a href="/privacy" className="footer-link">Privacy Policy</a> |
          <a href="/terms" className="footer-link">Terms and Conditions</a>
        </p>

        <div>
          Follow us on:
          <span className="social-icons">
            <a href="https://www.facebook.com/share/1as5kdEkMr/">
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

export default BuyerHome;