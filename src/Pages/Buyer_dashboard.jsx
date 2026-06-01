// buyer_dashboard.jsx - FIXED for MongoDB Backend (with FormData upload)
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_dashboard.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [buyerId, setBuyerId] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalSpending, setTotalSpending] = useState(0);
  
  const fileInputRef = useRef(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    avatar: defaultAvatar
  });

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
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

        const userId = session.id;
        setBuyerId(userId);
        
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

    // Fetch Profile from MongoDB
  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      
      const data = await response.json();
      console.log("📡 Profile data:", data);

      // ✅ Build correct avatar URL
      let avatarUrl = defaultAvatar;
      
      if (data.profile_image) {
        // If it's already a full URL, use it
        if (data.profile_image.startsWith("http")) {
          avatarUrl = data.profile_image;
        } 
        // If it's a relative path, add the backend URL
        else {
          avatarUrl = `https://hooper-renderv1-4.onrender.com${data.profile_image}`;
        }
      }
          
      setProfile({
        fullName: data.fullName || data.username || "",
        username: data.username || "",
        avatar: avatarUrl
      });
      setEditedName(data.fullName || data.username || "");
      setUsername(data.username || "");
      
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setProfile({ fullName: "", username: "", avatar: defaultAvatar });
    }
  };

  // Fetch Orders from MongoDB
  const fetchOrders = async (id) => {
    try {
      console.log("📡 Fetching orders for buyer:", id);
      
      const response = await fetch(`${BACKEND_URL}/api/orders/buyer/${id}`);
      const data = await response.json();
      
      console.log("📡 Orders response:", data);
      
      if (data.success && data.orders) {
        setOrders(data.orders);
        
        const total = data.orders.reduce((sum, order) => {
          return sum + Number(order.total_amount || 0);
        }, 0);
        
        setTotalSpending(total);
      } else {
        setOrders([]);
        setTotalSpending(0);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
      setTotalSpending(0);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    logout();
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    console.log("📁 File selected:", file);
    
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large! Please select an image under 2MB.");
        return;
      }
      
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
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
    setEditedName(profile.fullName || profile.username || "");
  }, [profile.fullName, profile.username]);

    // ✅ Save Profile - separate text and image
  const handleSaveProfile = useCallback(async () => {
    if (!buyerId) {
      alert("No user ID found. Please login again.");
      return;
    }

    const newName = editedName && editedName.trim() ? editedName.trim() : profile.fullName || profile.username;

    if (!newName) {
      alert("Please enter a name.");
      return;
    }

    console.log("📡 Saving profile...", { buyerId, newName });

    try {
      setUploading(true);
      
      // First, update the name (and any other text fields)
      const response = await fetch(`${BACKEND_URL}/api/users/${buyerId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: newName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to update name");
      }
      
      const result = await response.json();
      console.log("📡 Name saved:", result);

      // Then, if there's a file selected, upload the image separately
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append("profile_image", selectedFile);

        const imageResponse = await fetch(`${BACKEND_URL}/api/users/${buyerId}/image`, {
          method: "PUT",
          body: imageFormData
        });

        if (!imageResponse.ok) {
          console.log("⚠️ Image upload failed, but name was saved");
        } else {
          const imageResult = await imageResponse.json();
          console.log("📡 Image saved:", imageResult);
        }
      }
      
      await fetchProfile(buyerId);
      
      alert("Profile updated successfully!");
      
    } catch (err) {
      console.error("❌ Save error:", err);
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setUploading(false);
      setShowProfileModal(false);
      setSelectedFile(null);
      setPreviewImage(null);
    }
  }, [buyerId, editedName, profile, selectedFile, fetchProfile]);

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  const getDisplayAvatar = useCallback(() => {
    return previewImage || profile.avatar || defaultAvatar;
  }, [previewImage, profile.avatar]);

  const getDisplayName = () => {
    return editedName || profile.fullName || profile.username || "Buyer";
  };

  const getDisplayUsername = () => {
    return profile.username || "@user";
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
        }}>Loading Dashboard...</span>
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
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile} type="button">×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {(previewImage || profile.avatar) ? (
                <img src={previewImage || profile.avatar} alt="Preview" style={{
                  width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'
                }} onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="question-mark-avatar">?</div>';
                }}/>
              ) : (
                <div className="question-mark-avatar">?</div>
              )}
              
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
            
            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>
            
            <input type="text" value={editedName} onChange={handleNameChange} className="profile-name-input"
              placeholder="Enter your full name" autoComplete="off" />

            <button 
              className="get-image-btn" 
              onClick={handleSaveProfile} 
              type="button"
              disabled={uploading}
            >
              {uploading ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <button className="cancel-btn" onClick={handleCancelProfile} type="button">❌ Cancel</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)}>
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
          <p className="profile-username">{getDisplayUsername()}</p>
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
          <a onClick={() => navigate("/buyer_home")}>
            <img src={logo} alt="Hoopers Fits Logo" />
          </a>
        </div>
      </div>

      {/* MAIN CONTENT */}
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
                {orders.length > 0 ? orders.slice(0, 3).map(order => (
                  <li key={order._id}>Order #{order._id?.slice(-6)}</li>
                )) : (<li>No recent purchases</li>)}
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
                <thead>
                  <tr><th>Order ID</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? orders.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id?.slice(-6)}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>₱{Number(order.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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
                      <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGE MODAL */}
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