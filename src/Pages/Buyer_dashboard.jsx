// buyer_dashboard.jsx - FIXED: Loading logic
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_dashboard.css";

const BuyerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [buyerId, setBuyerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalSpending, setTotalSpending] = useState(0);
  

  const fileInputRef = useRef(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    avatar: defaultAvatar
  });

  // ✅ FIXED: Single useEffect that handles everything
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const sessionStr = localStorage.getItem("buyer_session");

        if (!sessionStr) {
          console.log("❌ No session, redirecting to login");
          navigate("/login");
          return;
        }

        const session = JSON.parse(sessionStr);
        console.log("🔍 Session:", session);

        if (session.role !== "buyer" || !session.id) {
          console.log("❌ Invalid session, redirecting to login");
          navigate("/login");
          return;
        }

        const userId = session.id;
        setBuyerId(userId);
        
        // Fetch profile and orders
        await fetchProfile(userId);
        await fetchOrders(userId);
        
      } catch (error) {
        console.error("❌ Auth error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

    const fetchProfile = async (id) => {
    try {
      const response = await fetch(`http://localhost/hooper_fits_api/get_buyer_profile.php?id=${id}`);
      const data = await response.json();

      console.log("📡 Profile data:", data);

      if (!data.error) {
        // ✅ FIX: Build full URL path
        let avatarUrl = defaultAvatar;
        
        if (data.profile_image && data.profile_image !== 'default-avatar.png') {
          avatarUrl = `http://localhost/hooper_fits_api/uploads/profiles/${data.profile_image}`;
        }
          
        setProfile({
          name: data.name || "",
          avatar: avatarUrl
        });
        setEditedName(data.name || "");
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  // --- FETCH ORDERS ---
  const fetchOrders = async (id) => {
    try {
      console.log("📡 Fetching orders for:", id);
      
      const response = await fetch(`http://localhost/hooper_fits_api/get_orders.php?buyer_id=${id}`);
      const data = await response.json();
      
      console.log("📡 Orders response:", data);
      
      if (data.success && data.orders) {
        setOrders(data.orders);
        
        const total = data.orders.reduce((sum, order) => {
          return sum + Number(order.calculated_total || order.total_amount || 0);
        }, 0);
        
        setTotalSpending(total);
      } else {
        setOrders([]);
        setTotalSpending(0);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    logout();
    navigate("/login");
  };

    // --- FILE SELECT ---
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    console.log("📁 File selected:", file);
    
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        console.log("📡 FileReader result:", event.target.result.substring(0, 50) + "...");
        setPreviewImage(event.target.result);
      };
      reader.onerror = (error) => {
        console.error("❌ FileReader error:", error);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const openFileExplorer = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(profile.name);
  }, [profile.name]);

    const handleSaveProfile = useCallback(async () => {
    if (!buyerId) return;

    const newName = editedName && editedName.trim() ? editedName.trim() : profile.name;
    const newAvatar = previewImage || "";

    try {
      const response = await fetch("http://localhost/hooper_fits_api/update_buyer_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: buyerId,
          name: newName,
          profile_image: newAvatar
        })
      });

      const result = await response.json();
      console.log("📡 Save result:", result);

      if (result.status === "success") {
        let newAvatarUrl = profile.avatar;
        
        if (previewImage) {
          newAvatarUrl = previewImage;
        }
        
        setProfile({
          ...profile,
          name: newName,
          avatar: newAvatarUrl
        });
        
        await fetchProfile(buyerId);
      }
    } catch (err) {
      console.error("❌ Save error:", err);
    }

    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
  }, [buyerId, editedName, profile, previewImage]);

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  const getDisplayAvatar = useCallback(() => {
    return previewImage || profile.avatar || defaultAvatar;
  }, [previewImage, profile.avatar]);

  const getDisplayName = () => {
    return editedName || profile.name || "Buyer";
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#000', 
        color: '#fff',
        fontSize: '18px'
      }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    // ... your existing JSX stays the same ...
    <div className="buyer-dashboard-app">
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile} type="button">×</button>
            
                        <div 
              className="modal-image-upload" 
              onClick={openFileExplorer}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFileExplorer();
                }
              }}
            >
              {(previewImage || profile.avatar) ? (
                <img 
                  src={previewImage || profile.avatar} 
                  alt="Preview" 
                  style={{
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.log("❌ Image load error");
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="question-mark-avatar">?</div>';
                  }}
                />
              ) : (
                <div className="question-mark-avatar">?</div>
              )}
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
            
            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>
            
            <input type="text" value={editedName} onChange={handleNameChange} className="profile-name-input"
              placeholder="Enter your display name" autoComplete="off"/>

            <button className="get-image-btn" onClick={handleSaveProfile} type="button">💾 Save Changes</button>
            <button className="cancel-btn" onClick={handleCancelProfile} type="button">❌ Cancel</button>
          </div>
        </div>
      )}

      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)} title="Click to edit profile">
            {getDisplayAvatar() && getDisplayAvatar() !== defaultAvatar ? (
              <img src={getDisplayAvatar()} alt="Profile" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="question-mark-avatar">?</div>'; }}/>
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{getDisplayName() || "Set your name"}</p>
        </div>
        
        <ul>
          <li><a className="active" href="#">📊 Dashboard</a></li>
          <li><a href="#">📦 Orders</a></li>
          <li><a href="#">🛒 Cart</a></li>
          <li><a href="#" onClick={() => setShowMessageModal(true)}>💬 Messages</a></li>
          <li><a href="#">⚙️ Settings</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>

        <div className="sidebar-logo">
          <a onClick={() => navigate("/buyer_home")} style={{cursor: 'pointer'}}>
            <img src={logo} alt="Hoopers Fits Logo" />
          </a>
        </div>
      </div>

      <div className="main">
        <div className="top-bar"><h1>Dashboard Overview</h1></div>

        <div className="dashboard">
          <div className="left-stats">
            <div className="stat-card">
              <h3>{orders.length}</h3>
              <p>Total Orders</p>
            </div>
            <div className="stat-card">
              <h3>₱{totalSpending.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h3>
              <p>Total Spending</p>
            </div>
            <div className="stat-card">
              <h3>4.8</h3>
              <p>Avg Rating</p>
            </div>
            <div className="stat-card">
              <p>🔥 Recent Purchases</p>
              <ol>
                {orders.length > 0 ? orders.slice(0, 3).map(order => (<li key={order.id}>{order.product_display || 'Various Items'}</li>)) : (<li>No recent purchases</li>)}
              </ol>
            </div>
          </div>

          <div className="right-content">
            <div className="small-cards">
              <div className="small-card" onClick={() => setShowMessageModal(true)}>
                <h3>💬</h3><p>Need Help? Message Us</p>
              </div>
              <div className="small-card"><h3>⭐</h3><p>Review Orders</p></div>
            </div>
            <div className="activity"><h4>📈 Spending Trend</h4><div className="chart-placeholder">Spending Chart Coming Soon</div></div>
            <div className="orders">
              <h4>📦 Recent Orders</h4>
              <table>
                <thead><tr><th>Product</th><th>Date</th><th>Price</th><th>Payment</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.length > 0 ? orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.product_display || 'N/A'}</td>
                      <td>{order.date || 'N/A'}</td>
                      <td>₱{Number(order.calculated_total || order.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td>{order.payment_method || "COD"}</td>
                      <td><span style={{padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: order.status === 'pending' ? '#ffd700' : order.status === 'completed' ? '#90EE90' : order.status === 'cancelled' ? '#ff6b6b' : '#87CEEB', color: '#000'}}>{order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}</span></td>
                    </tr>
                  )) : (<tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No orders yet</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showMessageModal && (
        <div className="message-modal" onClick={() => setShowMessageModal(false)}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="message-modal-title">📱 Need Help?</h2>
            <p className="message-modal-text">Our support team is ready to assist you!</p>
            <div className="message-modal-buttons">
              <button className="message-modal-btn primary" onClick={() => window.open('mailto:support@hoopersfits.ph')}>📧 Email Support</button>
              <button className="message-modal-btn secondary" onClick={() => setShowMessageModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;