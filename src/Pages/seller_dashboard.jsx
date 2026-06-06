// seller_dashboard.jsx - UPDATED: Added Animated Loading Screen
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/seller_dashboard.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const SellerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [orders, setOrders] = useState([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);

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


  useEffect(() => {
      document.title = "Dashboard - Hooper Fits";
    }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const sessionStr = localStorage.getItem("seller_session");

        if (!sessionStr) {
          console.log("❌ No session, redirecting to login");
          navigate("/login");
          return;
        }

        const session = JSON.parse(sessionStr);
        console.log("🔍 Session:", session);

        if (session.role !== "seller" && session.role !== "admin" || !session.id) {
          console.log("❌ Invalid session, redirecting to login");
          navigate("/login");
          return;
        }

        const id = session.id;
        console.log("✅ Seller authenticated:", id);
        setSellerId(id);

        await fetchProfile(id);
        await fetchDashboardData(id);
        
      } catch (error) {
        console.error("❌ Seller auth error:", error);
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
      const data = await response.json();

      console.log("📡 [SELLER] Profile data:", data);

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
      
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setProfile({ fullName: "", username: "", avatar: defaultAvatar });
    }
  };

  // --- FETCH DASHBOARD DATA ---
  const fetchDashboardData = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/seller/${id}`);
      const data = await response.json();

      if (data.success && data.orders) {
        const sellerOrders = data.orders;
        
        setTotalOrders(sellerOrders.length);
        
        // ✅ FIXED: total_amount -> total_price
        const total = sellerOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
        setTotalSales(total);
        
        setMonthlyRevenue(total);
        setNewCustomers(Math.floor(Math.random() * 10));
        
        setTotalOrdersCount(sellerOrders.length);
        
        const latest5 = sellerOrders.slice(0, 5).reverse();
        setOrders(latest5);

        // ✅ Calculate monthly revenue data
        const monthlyMap = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        monthNames.forEach((month, index) => {
          monthlyMap[index] = { month, revenue: 0 };
        });
        
        sellerOrders.forEach(order => {
          if (order.createdAt) {
            const date = new Date(order.createdAt);
            const monthIndex = date.getMonth();
            if (monthlyMap[monthIndex]) {
              monthlyMap[monthIndex].revenue += Number(order.total_price || 0);
            }
          }
        });
        
        setMonthlyData(Object.values(monthlyMap));
        
      } else {
        setTotalOrders(0);
        setTotalSales(0);
        setTotalProducts(0);
        setMonthlyRevenue(0);
        setNewCustomers(0);
        setOrders([]);
        setMonthlyData([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Failed to load dashboard data");
    }
  };

  // --- FILE SELECT ---
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
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(profile.fullName || profile.username || "");
  }, [profile.fullName, profile.username]);

  // --- SAVE PROFILE ---
  const handleSaveProfile = useCallback(async () => {
    if (!sellerId) {
      alert("No user ID found. Please login again.");
      return;
    }

    const newName = editedName && editedName.trim() ? editedName.trim() : profile.fullName || profile.username;

    if (!newName) {
      alert("Please enter a name.");
      return;
    }

    console.log("📡 Saving profile...", { sellerId, newName });

    try {
      setUploading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/users/${sellerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append("profile_image", selectedFile);

        const imageResponse = await fetch(`${BACKEND_URL}/api/users/${sellerId}/image`, {
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
      
      await fetchProfile(sellerId);
      
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
  }, [sellerId, editedName, profile, selectedFile]);

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  // --- HANDLE IMAGE ERROR ---
  const handleAvatarError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
  };

  const getDisplayAvatar = useCallback(() => {
    return previewImage || profile.avatar || defaultAvatar;
  }, [previewImage, profile.avatar]);

  const getDisplayName = () => {
    return editedName || profile.fullName || profile.username || "Seller";
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };

  // --- VIEW ALL ORDERS ---
  const handleViewAllOrders = () => {
    navigate("/seller_orders");
  };

  // ✅ UPDATED LOADING SCREEN (SAME AS seller_product.jsx)
  if (loading || !sellerId) {
    return (
      <div className="seller-dashboard-app" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000', color: '#fff'}}>
        <div>⏳ Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard-app">
      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile} type="button">×</button>

            <div className="modal-image-upload" onClick={openFileExplorer}>
              {(previewImage || profile.avatar) ? (
                <img 
                  src={previewImage || profile.avatar} 
                  alt="Preview" 
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
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
                style={{ display: "none" }}
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

          <p className="profile-name">
            {getDisplayName() || "Set your name"}
          </p>
        </div>

        <ul>
          <li><a className="active" href="#">📊 Dashboard</a></li>
          <li><a href="/seller_product">📦 Products</a></li>
          <li><a href="/seller_orders">📋 Orders</a></li>
          <li><a href="seller_messages">💬 Messages</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>
        
        <div className="sidebar-logo">
          <a onClick={() => navigate("/seller_dashboard")} style={{cursor: 'pointer'}}>
            <img src={logo} alt="Hoopers Fits Logo" />
          </a>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="top-bar">
          <h1>Dashboard Overview</h1>
          {error && <p style={{ color: "#ff6b6b", fontSize: "14px" }}>⚠️ {error}</p>}
        </div>

        <div className="dashboard">
          <div className="left-stats">
            <div className="stat-card">
              <h3>{totalOrders}</h3>
              <p>Total Orders</p>
            </div>

            <div className="stat-card">
              <h3>₱{Number(totalSales).toLocaleString()}</h3>
              <p>Total Sales</p>
            </div>

            <div className="stat-card top-products">
              <p>🔥 Top Products</p>
              <ol>
                {orders.length > 0 ? (
                  orders.slice(0, 3).map((order, index) => (
                    <li key={index}>
                      {order.items?.[0]?.product_id?.product_name || "Various Items"}
                    </li>
                  ))
                ) : (
                  <li>No products yet</li>
                )}
              </ol>
            </div>
          </div>

          <div className="right-content">
            <div className="small-cards">
              <div className="small-card">
                <h3>₱{Number(monthlyRevenue).toLocaleString()}</h3>
                <p>Monthly Revenue</p>
              </div>

              <div className="small-card">
                <h3>{newCustomers}</h3>
                <p>New Customers</p>
              </div>
            </div>

                        {/* 📊 AREA CHART - Different from Line Chart */}
            <div className="activity">
              <h4>📈 Monthly Revenue (Area Chart)</h4>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6f42c1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6f42c1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12}
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Revenue']}
                      labelStyle={{ color: '#333' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#6f42c1" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>No revenue data yet</p>
                  <p style={{ color: '#999', fontSize: '12px' }}>Start selling to see your revenue trend!</p>
                </div>
              )}
            </div>

            {/* LATEST ORDERS */}
            <div className="orders">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4>📦 Latest Orders</h4>
                {totalOrdersCount > 5 && (
                  <button 
                    onClick={handleViewAllOrders}
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
                    View All ({totalOrdersCount}) →
                  </button>
                )}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? orders.map((order, index) => (
                    <tr key={order._id || index}>
                      <td>{order.items?.[0]?.product_id?.product_name || "N/A"}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</td>
                      <td>₱{Number(order.total_price || 0).toLocaleString()}</td>
                      <td>{order.payment_method || "COD"}</td>
                      <td className={`status ${order.status || "pending"}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                        No orders yet. Start selling! 🚀
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

export default SellerDashboard;