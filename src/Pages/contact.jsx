// Contact.jsx - FIXED: With page title
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

import logo from "../Images/HoopersFits.png";
import cartIcon from "../Images/Cart.png";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";
import defaultAvatar from "../Images/Man.png";

import "../components/contact.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const Contact = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // ✅ SET PAGE TITLE
  useEffect(() => {
    document.title = "Contact Us - Hooper Fits";
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
          
          setFormData(prev => ({
            ...prev,
            fullname: data.fullName || data.username || "",
            email: data.email || ""
          }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      handleLogout();
      return;
    }

    if (user.role !== "buyer") {
      handleLogout();
      return;
    }

    setLoading(false);
  }, [user]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  const handleFacebookRedirect = () => {
    window.open("https://www.facebook.com/share/1as5kdEkMr/", "_blank");
  };

  const handleLocationClick = () => {
    window.open("https://www.google.com/maps/place/14%C2%B025'47.2%22N+120%C2%B055'37.6%22E/@14.4297673,120.9264603,19z/data=!3m1!4b1!4m4!3m3!8m2!3d14.429766!4d120.927104?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D", "_blank");
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
      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sender_id: user.id,
          receiver_id: 1
        }),
      });
      
      const result = await response.json();
      
      if (result.success || result._id) {
        setSuccess(true);
        setFormData({ 
          fullname: userProfile?.fullName || userProfile?.username || "", 
          email: userProfile?.email || "", 
          message: "" 
        });
      } else {
        setError(result.error || result.message || "Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const userName = userProfile?.fullName || userProfile?.username || "Buyer";
  
  const userAvatar = userProfile?.profile_image 
    ? userProfile.profile_image
    : defaultAvatar;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.parentNode) {
      e.target.parentNode.innerHTML = '👤';
    }
  };

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
        
        .page-title {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
        }
        .page-title-logo {
          width: 60px;
          height: auto;
        }
        .page-title-text {
          font-size: 36px;
          font-weight: 700;
          color: #333;
          margin: 0;
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
              {userName}
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
            <div className="page-title">
              <img 
                src={logo} 
                className="page-title-logo" 
                alt="Hoopers Fits Logo" 
              />
              <h1 className="page-title-text">Contact Us</h1>
            </div>
            
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
                  <p 
                    onClick={handleLocationClick}
                    style={{
                      color: '#4267B2',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                    title="Click to view on Google Maps"
                  >
                    Imus City, Cavite
                  </p>
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