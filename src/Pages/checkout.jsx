// Checkout.jsx - FIXED: Better Auth Handling
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import '../components/Checkout.css';
import logo from "../Images/HoopersFits.png";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";
import defaultAvatar from "../Images/Man.png";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const Checkout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  
  // ✅ FIXED: Get user from localStorage directly
  const [user, setUser] = useState(null);
  
  const [buyerInfo, setBuyerInfo] = useState({
    name: "",
    address: "",
    contact: ""
  });

  // ✅ FIXED: Initialize from localStorage first
  useEffect(() => {
    const sessionStr = localStorage.getItem("buyer_session");
    console.log("📡 Session from localStorage:", sessionStr);
    
    if (!sessionStr) {
      console.log("❌ No session found");
      handleLogout();
      return;
    }

    const session = JSON.parse(sessionStr);
    console.log("📡 Parsed session:", session);

    if (!session || session.role !== "buyer" || !session.id) {
      console.log("❌ Invalid session");
      handleLogout();
      return;
    }

    setUser(session);
    loadCartItems(session.id);
    fetchBuyerInfo(session.id);
  }, []);

  const fetchBuyerInfo = async (userId) => {
  try {
    console.log("📡 Fetching buyer info for:", userId);
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}`);
    const data = await response.json();
    
    console.log("📡 Buyer info:", data);
    
    if (data && !data.message) {
      setBuyerInfo({
        name: data.fullName || data.username || "Buyer",  // ✅ Full name!
        address: data.address || "No address provided",
        contact: data.contact || "No contact provided"
      });
      }
    } catch (err) {
      console.error("❌ Error fetching buyer info:", err);
    }
  };

  const loadCartItems = async (userId) => {
    try {
      console.log("📡 Loading cart for user:", userId);
      
      const response = await fetch(`${BACKEND_URL}/api/cart/${userId}`);
      const data = await response.json();
      
      console.log("📡 Cart data:", data);
      
      if (data && data.length > 0) {
        const items = data.map(cart => ({
          id: cart._id,
          product_id: cart.products?.[0]?.product_id?._id || cart.products?.[0]?.product_id,
          name: cart.products?.[0]?.product_id?.product_name || "Product",
          price: cart.products?.[0]?.product_id?.price || 0,
          quantity: cart.products?.[0]?.quantity || 1,
          image: cart.products?.[0]?.product_id?.image || '',
          seller_id: cart.products?.[0]?.product_id?.seller_id || null
        }));
        setCartItems(items);
        return;
      }
      
      // Fallback to sessionStorage
      const selectedProduct = sessionStorage.getItem('selectedProduct');
      
      if (selectedProduct) {
        try {
          const product = JSON.parse(selectedProduct);
          
          let imageUrl = product.image || '';
          
          if (!imageUrl || imageUrl === 'null' || imageUrl === '') {
            imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
          } else if (!imageUrl.startsWith('http')) {
            imageUrl = `${BACKEND_URL}/uploads/products/${imageUrl}`;
          }
          
          const cartItem = [{
            id: product._id || product.id || product.product_id,
            name: product.product_name,
            price: parseFloat(product.price),
            quantity: 1,
            image: imageUrl,
            seller_id: product.seller_id || null
          }];
          
          setCartItems(cartItem);
        } catch (e) {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      
    } catch (error) {
      console.error('❌ Cart load error:', error);
      setCartItems([]);
    }
  };

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 50.00;
  const total = subtotal + shipping;

  const handleLogoClick = () => {
    navigate('/buyer_home');
  };

  const handleProfileClick = () => {
    navigate('/buyer_dashboard');
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remove this item from your cart?')) {
      return;
    }

    const selectedProduct = sessionStorage.getItem('selectedProduct');
    if (selectedProduct) {
      const parsed = JSON.parse(selectedProduct);
      const productId = parsed._id || parsed.id || parsed.product_id;
      
      if (String(productId) === String(itemId)) {
        sessionStorage.removeItem('selectedProduct');
      }
    }

    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('No items in cart!');
      return;
    }

    if (!user?.id) {
      alert('No buyer ID found! Please login again.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        buyer_id: user.id,
        payment_method: "COD",
        items: cartItems.map(item => ({
          product_id: item.id || item.product_id,
          seller_id: item.seller_id || null,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      console.log("📡 Placing order:", orderData);
      
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      console.log("📡 Order result:", result);
      
      if (result.success) {
        alert('✅ Order placed successfully! Order ID: ' + result.order?._id);
        
        sessionStorage.removeItem('selectedProduct');
        setCartItems([]);
        navigate('/buyer_home');
      } else {
        alert('❌ Failed to place order: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirmNo = () => setShowCancelModal(false);
  const handleCancelConfirmYes = () => {
    setShowCancelModal(false);
    setShowReasonModal(true);
  };

  const handleReasonSelect = (reason) => setSelectedReason(reason);

  const handleReasonSubmit = async () => {
    if (!selectedReason) {
      alert('Please select a reason');
      return;
    }

    setShowReasonModal(false);
    setCartItems([]);
    sessionStorage.removeItem('selectedProduct');
    alert('Order cancelled successfully!');
    navigate('/buyer_home');
  };

  const handleReasonClose = () => {
    setShowReasonModal(false);
    setSelectedReason('');
  };

  // Avatar
  const userAvatar = user?.profile_image 
    ? (user.profile_image.startsWith('http') 
        ? user.profile_image 
        : `${BACKEND_URL}/uploads/profiles/${user.profile_image}`)
    : defaultAvatar;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.parentNode) {
      e.target.parentNode.innerHTML = '👤';
    }
  };

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
        }
        .user-avatar:hover { transform: scale(1.1); }
        .cancel-order-section {
          background: white !important;
          border: 1px solid #eee !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
        }
      `}</style>

      <header className="header">
        <img src={logo} className="logo" alt="Logo" onClick={handleLogoClick} title="Go to Home" />
        <div className="header-right">
          <img src={userAvatar} className="user-avatar" alt="Profile" onClick={handleProfileClick} onError={handleImageError} title="Go to Dashboard" />
          <span className="logout-btn" onClick={handleLogout}>Logout</span>
        </div>
      </header>

      <div className="checkout-container">
        <section className="section delivery-address">
          <h2>📍 Delivery Address</h2>
          <div className="address-info">
            <div className="address-column">
              <p><strong>{buyerInfo.name}</strong></p>
              <p>{buyerInfo.contact}</p>
            </div>
            <div className="address-column">
              <p>{buyerInfo.address}</p>
              <p>Metro Manila</p>
            </div>
            <div className="actions">
              <span>Default</span>
              <a href="#" className="change-link" onClick={() => navigate('/buyer_dashboard')}>Update in Profile</a>
            </div>
          </div>
        </section>

        <section className="section products-ordered">
          <h2>🛍️ Products Ordered</h2>
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div key={item.id} className="product-item">
                <div className="product-info">
                  <img src={item.image} alt={item.name} onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='} />
                  <div className="product-details"><p>{item.name}</p></div>
                </div>
                <div className="price-col">₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                <div className="qty-col">{item.quantity}</div>
                <div className="price-col">₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                <div className="remove-col">
                  <button className="remove-btn" onClick={() => handleRemoveItem(item.id)}>🗑️ Remove</button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-items">No items in cart. <a href="/buyer_shop" className="shop-link">Go to Shop →</a></p>
          )}
        </section>

        <div className="section payment-method">
          <h2>💳 Payment Method</h2>
          <p><strong>Cash on Delivery</strong></p>
        </div>

        <section className="section order-summary">
          <p>Subtotal: ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          <p>Shipping: ₱{shipping.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          <p className="total">Total: ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </section>

        <button className="place-order-btn" onClick={handlePlaceOrder} disabled={loading || cartItems.length === 0 || !user?.id}>
          {loading ? (<><div className="loading-spinner"></div> Processing...</>) : `Place Order (${cartItems.length} items)`}
        </button>

        <div className="cancel-order-section">
          <button className="cancel-order-btn" onClick={handleCancelOrder} disabled={cartItems.length === 0}>Cancel Order</button>
        </div>
      </div>

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="cancel-modal">
            <div className="modal-header"><h3>Are you sure you want to cancel this order?</h3></div>
            <div className="modal-body"><p>This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelConfirmNo}>No</button>
              <button className="btn btn-danger" onClick={handleCancelConfirmYes}>Yes, I want to cancel</button>
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="modal-overlay">
          <div className="cancel-reason-modal">
            <div className="modal-header">
              <h3>Please choose a reason why you want to cancel</h3>
            </div>
            <div className="modal-body">
              <div className="reason-options">
                <label className="reason-option">
                  <input type="radio" name="cancelReason" value="changed my mind" onChange={(e) => handleReasonSelect(e.target.value)} />
                  <span>Changed my mind</span>
                </label>
                <label className="reason-option">
                  <input type="radio" name="cancelReason" value="found better price elsewhere" onChange={(e) => handleReasonSelect(e.target.value)} />
                  <span>Found better price elsewhere</span>
                </label>
                                <label className="reason-option">
                  <input type="radio" name="cancelReason" value="no longer need it" onChange={(e) => handleReasonSelect(e.target.value)} />
                  <span>No longer need it</span>
                </label>
                <label className="reason-option">
                  <input type="radio" name="cancelReason" value="prefer different color/size" onChange={(e) => handleReasonSelect(e.target.value)} />
                  <span>Prefer different color/size</span>
                </label>
                <label className="reason-option">
                  <input type="radio" name="cancelReason" value="other" onChange={(e) => handleReasonSelect(e.target.value)} />
                  <span>Other</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleReasonClose}>Back</button>
              <button className="btn btn-danger" onClick={handleReasonSubmit} disabled={!selectedReason}>Submit Cancellation</button>
            </div>
          </div>
        </div>
      )}

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

export default Checkout;