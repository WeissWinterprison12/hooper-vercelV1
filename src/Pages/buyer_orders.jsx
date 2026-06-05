import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_dashboard.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerOrders = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    document.title = "My Orders - Hooper Fits";
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const sessionStr = localStorage.getItem("buyer_session");

        if (!sessionStr) {
          navigate("/login");
          return;
        }

        const session = JSON.parse(sessionStr);
        console.log("🔍 Session:", session);

        if (session.role !== "buyer" || !session.id) {
          navigate("/login");
          return;
        }

        await fetchProfile(session.id);
        await fetchOrders(session.id);
        
      } catch (error) {
        console.error("❌ Auth error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [navigate]);

  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      
      const data = await response.json();
      console.log("📡 Profile data:", data);

      let avatarUrl = defaultAvatar;
      
      if (data.profile_image) {
        if (data.profile_image.startsWith("http")) {
          avatarUrl = data.profile_image;
        } else {
          avatarUrl = `https://hooper-renderv1-4.onrender.com${data.profile_image}`;
        }
      }
          
      setUserProfile({
        fullName: data.fullName || data.username || "",
        username: data.username || "",
        avatar: avatarUrl
      });
      
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  const fetchOrders = async (id) => {
    try {
      console.log("📡 Fetching orders for buyer:", id);
      
      const response = await fetch(`${BACKEND_URL}/api/orders/buyer/${id}`);
      const data = await response.json();
      
      console.log("📡 Orders response:", data);
      
      if (data.success && data.orders) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    logout();
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  const getDisplayName = () => {
    return userProfile?.fullName || userProfile?.username || "Buyer";
  };

  const getDisplayUsername = () => {
    return userProfile?.username || "@user";
  };

  const getDisplayAvatar = () => {
    return userProfile?.avatar || defaultAvatar;
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        zIndex: 9999
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{
          color: '#333',
          fontSize: '18px',
          fontWeight: '500',
          fontFamily: 'Poppins, sans-serif'
        }}>Loading Orders...</span>
        <div style={{
          width: '30px',
          height: '30px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #dc3545',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="buyer-dashboard-app">

      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar">
            {getDisplayAvatar() && getDisplayAvatar() !== defaultAvatar ? (
              <img src={getDisplayAvatar()} alt="Profile" onError={(e) => { 
                e.target.style.display = 'none'; 
                e.target.parentNode.innerHTML = '<div class="question-mark-avatar">?</div>'; 
              }}/>
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{getDisplayName()}</p>
          <p className="profile-username">@{getDisplayUsername()}</p>
        </div>
        
        <ul>
          <li><a href="/buyer_dashboard">📊 Dashboard</a></li>
          <li><a className="active" href="#">📦 Orders</a></li>
          <li><a href="/checkout">🛒 Cart</a></li>
          <li><a href="#" onClick={() => setShowMessageModal(true)}>💬 Messages</a></li>
          <li><a href="/buyer_home">🏠 Home</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>

        <div className="sidebar-logo">
          <a onClick={() => navigate("/buyer_home")}>
            <img src={logo} alt="Hoopers Fits Logo" />
          </a>
        </div>
      </div>

      <div className="main">
        <div className="top-bar">
          <h1>My Orders</h1>
        </div>

        <div className="orders-section">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id?.slice(-6)}</td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {order.items && order.items.length > 0 
                      ? order.items.map(item => item.product_id?.product_name || "Product").join(", ")
                      : "No items"}
                  </td>
                  <td>₱{Number(order.total_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td>{order.payment_method || "COD"}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: order.status === 'pending' ? '#ffd700' : order.status === 'completed' ? '#90EE90' : order.status === 'cancelled' ? '#ff6b6b' : '#87CEEB',
                      color: '#000'
                    }}>
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>
                    <div style={{fontSize: '48px', marginBottom: '10px'}}>📦</div>
                    <p style={{color: '#666', fontSize: '16px'}}>No orders yet</p>
                    <button 
                      onClick={() => navigate('/buyer_shop')}
                      style={{
                        marginTop: '15px',
                        padding: '10px 20px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Start Shopping
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MESSAGE MODAL */}
      {showMessageModal && (
        <div className="message-modal" onClick={() => setShowMessageModal(false)}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="message-modal-title">📱 Need Help?</h2>
            <p className="message-modal-text">Our support team is ready to assist you!</p>
            <div className="message-modal-buttons">
              <button className="message-modal-btn primary" onClick={() => navigate('/contact')}>💬 Message Us</button>
              <button className="message-modal-btn secondary" onClick={() => setShowMessageModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;