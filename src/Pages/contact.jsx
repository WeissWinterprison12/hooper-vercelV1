// Contact.jsx - SIMPLIFIED: Uses AuthContext
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

import logo from "../Images/HoopersFits.png";
import cartIcon from "../Images/Cart.png";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";
import defaultAvatar from "../Images/Man.png";

import "../components/contact.css";

const Contact = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

    // Pre-fill form with user data
    setFormData(prev => ({
      ...prev,
      fullname: user.name || "",
      email: ""
    }));

    setLoading(false);
  }, [user]);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };

  const handleFacebookRedirect = () => {
    window.open("https://www.facebook.com/share/1as5kdEkMr/", "_blank");
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError("");
  };

  const handleLogoClick = () => {
    navigate('/buyer_home');
  };

  const handleProfileClick = () => {
    navigate('/buyer_dashboard');
  };

  const handleCartClick = () => {
    navigate('/checkout');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost/hooper_fits_api/process_contact.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sender_id: parseInt(user.id),
          receiver_id: 1 // Admin ID
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setFormData({ fullname: user.name, email: formData.email, message: "" });
      } else {
        setError(result.error || "Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Contact form error:", err);
    } finally {
      setSubmitting(false);
    }
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

  // ✅ Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#000', 
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  if (success) {
    return (
      <>
        <style>{`
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
        `}</style>

        <header className="header">
          <img 
            src={logo} 
            className="logo" 
            alt="Hoopers Fits Logo" 
            onClick={handleLogoClick}
            style={{cursor: 'pointer'}}
          />
          <nav className="nav">
            <a href="/buyer_home">Home</a>
            <a href="/buyer_shop">Shop</a>
            <a href="#">New Fits</a>
            <a href="/contact" className="active">Contact Us</a>
          </nav>
          <div className="search-bar">
            <input type="text" placeholder="Search products..." />
          </div>
          <div className="icons">
            <img 
              src={userAvatar} 
              className="user-avatar"
              alt="Profile"
              title="Go to Dashboard"
              onClick={handleProfileClick}
              onError={handleImageError}
            />
            <a href="/checkout" onClick={handleCartClick}>
              <img src={cartIcon} alt="Cart" title="Cart" />
            </a>
          </div>
          <span className="logout-btn" onClick={handleLogout}>Logout</span>
        </header>
        
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1 className="success-title">Message Sent Successfully!</h1>
          <p className="success-message">
            Thank you for reaching out! We'll get back to you within 24-48 hours.
          </p>
          <button className="continue-btn" onClick={() => setSuccess(false)}>
            Send Another Message
          </button>
        </div>
        
        <footer className="footer">
          <p>
            <a href="/privacy" className="footer-link">Privacy Policy</a> | 
            <a href="/terms" className="footer-link">Terms and Conditions</a>
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
  }

  return (
    <>
      <style>{`
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
      `}</style>

      <header className="header">
        <img 
          src={logo} 
          className="logo" 
          alt="Hoopers Fits Logo" 
          onClick={handleLogoClick}
          style={{cursor: 'pointer'}}
        />
        <nav className="nav">
          <a href="/buyer_home">Home</a>
          <a href="/buyer_shop">Shop</a>
          <a href="#">New Fits</a>
          <a href="/contact" className="active">Contact Us</a>
        </nav>
        <div className="search-bar">
          <input type="text" placeholder="Search products..." />
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
            <img src={cartIcon} alt="Cart" title="Cart" />
          </a>
        </div>
        
        <span className="logout-btn" onClick={handleLogout}>Logout</span>
      </header>

      <section className="contact-container">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        
        <div className="contact-section">
          <div className="contact-info">
            <h1>Get In Touch.</h1>
            <p>Have a question about our products? Need help with your order? We're here to help!</p>
            
            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-text">
                  <h3>Email</h3>
                  <p>
                    <span 
                      className="clickable-email"
                      onClick={handleFacebookRedirect}
                      style={{
                        color: '#4267B2',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                      title="Click to message us on Facebook"
                    >
                      support@hoopersfits.ph
                    </span>
                  </p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div className="contact-text">
                  <h3>Phone</h3>
                  <p>(+63) 939 601 4810</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-text">
                  <h3>Location</h3>
                  <p>Imus City, Cavite</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullname">Full Name</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Tell us about your inquiry..."
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Sending Message...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>
          <a href="/privacy" className="footer-link">Privacy Policy</a> | 
          <a href="/terms" className="footer-link">Terms and Conditions</a>
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

export default Contact;