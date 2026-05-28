// seller_dashboard.jsx - UPDATED: Shows only last 5 orders
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/seller_dashboard.css";

const SellerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Auth & Data State
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard Data
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [orders, setOrders] = useState([]);
  
  // ✅ NEW: Total orders count for "View All" button
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Profile Modal State
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    name: "",
    avatar: defaultAvatar
  });

  // ✅ FIXED: useEffect with navigate
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

        if (session.role !== "seller" || !session.id) {
          console.log("❌ Invalid session, redirecting to login");
          navigate("/login");
          return;
        }

        const id = session.id;
        console.log("✅ Seller authenticated:", id);
        setSellerId(id);

        // Fetch profile and dashboard data
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

  // --- FETCH PROFILE FROM DB ---
  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`http://localhost/hooper_fits_api/get_seller_profile.php?id=${id}`);
      const data = await response.json();

      console.log("📡 [SELLER] Profile data:", data);

      if (!data.error) {
        // ✅ FIX: Build full URL path
        let avatarUrl = defaultAvatar;
        
        if (data.profile_image && data.profile_image !== 'default-avatar.png') {
          avatarUrl = `http://localhost/hooper_fits_api/uploads/profiles/${data.profile_image}`;
        }
          
        setAdminProfile({
          name: data.name || "",
          avatar: avatarUrl
        });
        setEditedName(data.name || "");
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  // --- FETCH DASHBOARD DATA ---
const fetchDashboardData = async (id) => {
  try {
    const response = await fetch(`http://localhost/hooper_fits_api/seller_dashboard.php?user_id=${id}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    setTotalOrders(data.totalOrders || 0);
    setTotalSales(data.totalSales || 0);
    setTotalProducts(data.totalProducts || 0);
    setMonthlyRevenue(data.monthlyRevenue || 0);
    setNewCustomers(data.newCustomers || 0);
    
    const allOrders = data.orders || [];
    setTotalOrdersCount(allOrders.length);
    
    // ✅ FIXED: Get latest 5 orders (most recent)
    // If API returns oldest first, take first 5 and reverse
    // If API returns newest first, just take first 5
    const latest5 = allOrders.slice(0, 5).reverse();
    setOrders(latest5);
    
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
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;
        console.log("📡 FileReader result length:", result.length);
        
        // Force state update
        setPreviewImage(null);
        setTimeout(() => {
          setPreviewImage(result);
          console.log("✅ previewImage set!");
        }, 10);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const openFileExplorer = useCallback(() => {
    console.log("🔓 Opening file explorer");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  // --- SAVE PROFILE TO DATABASE ---
  const handleSaveProfile = useCallback(async () => {
    if (!sellerId) return;

    const newName = editedName && editedName.trim() ? editedName.trim() : adminProfile.name;
    const newAvatar = previewImage || "";

    try {
      const response = await fetch("http://localhost/hooper_fits_api/update_seller_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sellerId,
          name: newName,
          profile_image: newAvatar
        })
      });

      const result = await response.json();
      console.log("📡 Save result:", result);

      if (result.status === "success") {
        // Update local state
        setAdminProfile({
          ...adminProfile,
          name: newName,
          avatar: previewImage || adminProfile.avatar
        });
        
        // Refresh from DB
        await fetchProfile(sellerId);
      }
    } catch (err) {
      console.error("❌ Save error:", err);
    }

    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
  }, [sellerId, editedName, adminProfile, previewImage]);

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  const getDisplayAvatar = useCallback(() => {
    return previewImage || adminProfile.avatar || defaultAvatar;
  }, [previewImage, adminProfile.avatar]);

  const getDisplayName = () => {
    return editedName || adminProfile.name || "Seller";
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };

  // ✅ NEW: View All Orders
  const handleViewAllOrders = () => {
    navigate("/seller_orders");
  };

  if (loading) {
    return (
      <div
        className="seller-dashboard-app"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#000",
          color: "#fff",
          fontSize: "18px"
        }}
      >
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="seller-dashboard-app">
      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={handleCancelProfile}
              type="button"
            >
              ×
            </button>

            <div
              className="modal-image-upload"
              onClick={openFileExplorer}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  openFileExplorer();
                }
              }}
            >
              {(previewImage || adminProfile.avatar) ? (
                <img
                  src={previewImage || adminProfile.avatar}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
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
            >
              💾 Save Changes
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
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = '<div class="question-mark-avatar">?</div>';
                }}
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
          <li><a href="/seller_settings">⚙️ Settings</a></li>
          <li><a href="/seller_orders">📋 Orders</a></li>
          <li><a href="#" onClick={() => setShowMessageModal(true)}>💬 Messages</a></li>
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
                    <li key={index}>{order.product || "Various Items"}</li>
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

            <div className="activity">
              <h4>📈 Activity (Monthly Sales)</h4>
              <div className="chart-placeholder">Coming Soon</div>
            </div>

            {/* ✅ UPDATED: Latest Orders with View All button */}
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
                  {orders.map((order, index) => (
                    <tr key={order.id || index}>
                      <td>{order.product || "N/A"}</td>
                      <td>{order.date || "N/A"}</td>
                      <td>₱{Number(order.price || 0).toLocaleString()}</td>
                      <td>{order.payment || "COD"}</td>
                      <td className={`status ${order.status || "pending"}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown"}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
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