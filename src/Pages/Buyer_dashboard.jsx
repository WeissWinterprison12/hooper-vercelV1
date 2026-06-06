// buyer_dashboard.jsx - UPDATED: Same loading as buyer_orders.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Profile Modal Refs & State (SAME AS SELLER)
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

  // --- AUTH CHECK ---
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

  // --- FETCH PROFILE FROM MONGODB ---
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
          avatarUrl = `${BACKEND_URL}${data.profile_image}`;
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

  // --- FETCH ORDERS ---
  const fetchOrders = async (id) => {
    try {
      console.log("📡 Fetching orders for buyer:", id);
      
      const response = await fetch(`${BACKEND_URL}/api/orders/buyer/${id}`);
      const data = await response.json();
      
      console.log("📡 Orders response:", data);
      
      if (data.success && data.orders) {
        setOrders(data.orders);
        
        const total = data.orders.reduce((sum, order) => {
          return sum + Number(order.total_price || 0);
        }, 0);
        
        setTotalSpending(total);
        
        // Calculate monthly spending data
        const monthlyMap = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        monthNames.forEach((month, index) => {
          monthlyMap[index] = { month, spending: 0 };
        });
        
        data.orders.forEach(order => {
          if (order.createdAt) {
            const date = new Date(order.createdAt);
            const monthIndex = date.getMonth();
            if (monthlyMap[monthIndex]) {
              monthlyMap[monthIndex].spending += Number(order.total_price || 0);
            }
          }
        });
        
        const chartData = Object.values(monthlyMap);
        setMonthlyData(chartData);
        
      } else {
        setOrders([]);
        setTotalSpending(0);
        setMonthlyData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
      setTotalSpending(0);
      setMonthlyData([]);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    logout();
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  // --- FILE SELECT (SAME AS SELLER) ---
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    console.log("📁 File selected:", file);
    
    if (file) {
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

  // --- CANCEL PROFILE EDIT (SAME AS SELLER) ---
  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(profile.fullName || profile.username || "");
  }, [profile.fullName, profile.username]);

  // --- SAVE PROFILE (SAME AS SELLER - WITH IMAGE UPLOAD) ---
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
      
      // Step 1: Save the name first
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

      // Step 2: Upload image if selected (SAME AS SELLER)
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
      
      // Step 3: Refresh profile data
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

  // --- HANDLE IMAGE ERROR ---
  const handleAvatarError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
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

  // === UPDATED LOADING SCREEN (SAME AS BUYER_ORDERS) ===
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
        <span style={{ color: '#333', fontSize: '18px', fontWeight: '500' }}>Loading Dashboard...</span>
        <div style={{
          width: '30px',
          height: '30px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #dc3545',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="buyer-dashboard-app">
      {/* PROFILE MODAL (EXACTLY SAME AS SELLER_DASHBOARD) */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile} type="button">×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
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
                  onError={handleAvatarError}
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
            
            <input 
              type="text" 
              value={editedName} 
              onChange={handleNameChange} 
              className="profile-name-input"
              placeholder="Enter your display name" 
              autoComplete="off" 
            />

            <button 
              className="get-image-btn" 
              onClick={handleSaveProfile} 
              type="button"
              disabled={uploading}
            >
              {uploading ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <button 
              className="cancel-btn" 
              onClick={handleCancelProfile} 
              type="button"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="admin-profile">
          <div 
            className="profile-avatar" 
            onClick={() => setShowProfileModal(true)}
            title="Click to edit profile"
          >
            {getDisplayAvatar() && getDisplayAvatar() !== defaultAvatar ? (
              <img 
                src={getDisplayAvatar()} 
                alt="Profile" 
                onError={handleAvatarError}
              />
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{getDisplayName()}</p>
          <p className="profile-username">@{getDisplayUsername()}</p>
        </div>
        
        <ul>
          <li><a className="active" href="#">📊 Dashboard</a></li>
          <li><a href="/buyer_orders">📦 Orders</a></li>
          <li><a href="/checkout">🛒 Cart</a></li>
          <li><a href="/buyer_messages">💬 Messages</a></li>
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
                  <li key={order._id}>
                    {order.items?.[0]?.product_id?.product_name 
                      ? order.items[0].product_id.product_name 
                      : `Order #${order._id?.slice(-6)}`}
                  </li>
                )) : (<li>No recent purchases</li>)}
              </ol>
            </div>
          </div>

          <div className="right-content">
            <div className="small-cards">
              <div className="small-card" onClick={() => navigate('buyer_messages')}>
                <h3>💬</h3><p>Need Help? Message Us</p>
              </div>
              <div className="small-card" onClick={() => navigate('/buyer_orders')}>
                <h3>⭐</h3>
                <p>Review Orders</p>
              </div>
            </div>
            
            {/* SPENDING TREND LINE CHART */}
            <div className="activity">
              <h4>📈 Monthly Spending Trend</h4>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12}
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Spending']}
                      labelStyle={{ color: '#333' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spending" 
                      stroke="#dc3545" 
                      strokeWidth={3}
                      dot={{ fill: '#dc3545', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>No spending data yet</p>
                  <p style={{ color: '#999', fontSize: '12px' }}>Start shopping to see your trend!</p>
                </div>
              )}
            </div>
            
                        <div className="orders">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4>📦 Recent Orders</h4>
                {orders.length > 5 && (
                  <button 
                    onClick={() => navigate('/buyer_orders')}
                    style={{
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    View All ({orders.length}) →
                  </button>
                )}
              </div>
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
                  {orders.length > 0 ? orders.slice(0, 5).map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id?.slice(-6)}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        {order.items && order.items.length > 0 
                          ? order.items.map((item, idx) => (
                              <span key={idx} style={{ display: 'block', fontSize: '12px' }}>
                                {item.product_id?.product_name || "Product"} × {item.quantity}
                              </span>
                            ))
                          : 'N/A'}
                      </td>
                      <td style={{ fontWeight: '600' }}>₱{Number(order.total_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td>{order.payment_method || "COD"}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: 
                            order.status === 'pending' ? '#ffd700' : 
                            order.status === 'completed' ? '#90EE90' : 
                            order.status === 'cancelled' ? '#ff6b6b' : 
                            order.status === 'shipped' ? '#87CEEB' : '#ddd',
                          color: '#000'
                        }}>
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛒</div>
                        <p style={{ color: '#666', marginBottom: '5px' }}>No orders yet</p>
                        <p style={{ color: '#999', fontSize: '12px' }}>Start shopping to see your orders here!</p>
                      </td>
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
            <p className="message-modal-text">
              Our support team is ready to assist you!
            </p>
            <div className="message-modal-buttons">
              <button
                className="message-modal-btn primary"
                onClick={() => window.open("mailto:support@hoopersfits.ph")}
              >
                📧 Email Support
              </button>
              <button
                className="message-modal-btn secondary"
                onClick={() => setShowMessageModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;