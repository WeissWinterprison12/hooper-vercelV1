// buyer_shop.jsx - FIXED: Uses AuthContext + New Backend
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

import logo from "../Images/HoopersFits.png";
import cartIcon from "../Images/Cart.png";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";
import defaultAvatar from "../Images/Man.png";

import "../components/buyer_shop.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerShop = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // ✅ Fetch user profile to get fullName
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("📡 Buyer shop profile data:", data);
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

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
    fetchProducts();
  }, [user]);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate('/buyer_dashboard');
  };

  const handleCartClick = () => {
    const selectedProduct = sessionStorage.getItem('selectedProduct');
    if (selectedProduct) {
      navigate('/checkout');
    } else {
      alert('Please select a product first! 🛍️');
    }
  };

  const handleLogoClick = () => {
    navigate('/buyer_home');
  };

  const handleProductClick = (product) => {
    if (parseInt(product.stock || 0) > 0) {
      sessionStorage.setItem('selectedProduct', JSON.stringify(product));
      navigate('/checkout');
    } else {
      alert('This product is out of stock!');
    }
  };

  // ✅ FIXED - Use new backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle both array and {success, products} response
      if (Array.isArray(result)) {
        setProducts(result);
      } else if (result.success) {
        setProducts(result.products || []);
      } else {
        setError(result.error || 'No products found');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get name from userProfile (from database)
  const userName = userProfile?.fullName || userProfile?.username || "Buyer";
  
  // ✅ Build avatar URL - use full URL from backend
  const userAvatar = userProfile?.profile_image 
    ? userProfile.profile_image
    : defaultAvatar;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.parentNode) {
      e.target.parentNode.innerHTML = '👤';
    }
  };

  if (loading && !user) {
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
          <a href="/buyer_shop" className="active">Shop</a>
          <a href="#">New Fits</a>
          <a href="/contact">Contact Us</a>
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

          <div 
            className="cart-link"
            style={{
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={handleCartClick}
            title={sessionStorage.getItem('selectedProduct') ? 'Go to Checkout' : 'Select a product first'}
          >
            <img src={cartIcon} alt="Cart" style={{width: '22px'}} />
            {sessionStorage.getItem('selectedProduct') && (
              <span className="cart-badge">1</span>
            )}
          </div>
        </div>
        
        <span className="logout-btn" onClick={handleLogout}>Logout</span>
      </header>

      <section className="shop-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading shop products...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>⚠️ {error}</h3>
            <p>Please check your connection and try again</p>
            <button className="retry-btn" onClick={fetchProducts}>
              🔄 Reload Products
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">📦</div>
            <h2>No products available</h2>
            <p>Check back soon for new arrivals!</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, index) => {
              const stock = parseInt(product.stock || 0);
              const isInStock = stock > 0;
              
              // ✅ FIXED - Use backend URL for product images
              const productImage = product.image || product.product_image || "";
              const imageUrl = productImage && productImage.trim() && !productImage.startsWith("data:") && !productImage.startsWith("http")
                ? `${BACKEND_URL}/uploads/products/${productImage.trim()}`
                : productImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
              
              return (
                <div 
                  key={product._id || product.id || index} 
                  className="product-card"
                  onClick={() => handleProductClick(product)}
                >
                  <img 
                    src={imageUrl} 
                    alt={product.product_name || product.name}
                    className="product-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                  <div className="product-title">{product.product_name || product.name}</div>
                  <div className="product-price">
                    ₱{parseFloat(product.price || 0).toLocaleString('en-PH', { 
                      minimumFractionDigits: 2 
                    })}
                  </div>
                  <div className={`stock-badge ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                    {isInStock ? `In Stock (${stock})` : 'Out of Stock'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default BuyerShop;