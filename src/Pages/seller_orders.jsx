// seller_orders.jsx - UPDATED: Same auth as seller_dashboard + Profile update
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../components/seller_orders.css';
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";

const SellerOrders = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState({ name: "", avatar: null });
  
  // Files
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  
  // Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Orders (placeholder - will fetch from API)
  const [orders, setOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // =====================================================
  // ✅ SAME AUTH AS SELLER_DASHBOARD
  // =====================================================
  useEffect(() => {
    const initialize = async () => {
      try {
        const sessionStr = localStorage.getItem("seller_session");
        
        if (!sessionStr) {
          handleLogout();
          return;
        }

        const session = JSON.parse(sessionStr);

        if (session.role !== "seller") {
          handleLogout();
          return;
        }

        setSellerId(session.id);
        setAdminProfile(prev => ({ ...prev, name: session.name || "Seller" }));
        setEditedName(session.name || "Seller");
        
        await fetchProfile(session.id);
        await fetchOrders(session.id);
        
      } catch (error) {
        console.error("❌ Auth error:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };

  // =====================================================
  // ✅ FETCH PROFILE FROM DATABASE
  // =====================================================
  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`http://localhost/hooper_fits_api/get_seller_profile.php?id=${id}`);
      const data = await response.json();

      console.log("📡 Profile data:", data);

      if (!data.error) {
        let avatarUrl = defaultAvatar;
        
        if (data.profile_image && data.profile_image !== 'default-avatar.png') {
          avatarUrl = `http://localhost/hooper_fits_api/uploads/profiles/${data.profile_image}`;
        }
        
        setAdminProfile({
          name: data.name || "Seller",
          avatar: avatarUrl
        });
        setEditedName(data.name || "Seller");
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  // =====================================================
  // ✅ FETCH ORDERS
  // =====================================================
  const fetchOrders = async (id) => {
    try {
      const response = await fetch(`http://localhost/hooper_fits_api/get_seller_orders.php?seller_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setOrders([]);
    }
  };

  // =====================================================
  // ✅ PROFILE FUNCTIONS
  // =====================================================
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  }, []);

  const openFileExplorer = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const uploadImage = async () => {
    if (!selectedFile || !sellerId) return false;

    const formData = new FormData();
    formData.append("profile_image", selectedFile);
    formData.append("user_id", sellerId);

    try {
      const response = await fetch("http://localhost/hooper_fits_api/update_profile.php", {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();

      if (result.success && result.image) {
        const filename = result.image.split('/').pop();
        setAdminProfile(prev => ({
          ...prev,
          avatar: `http://localhost/hooper_fits_api/uploads/profiles/${filename}`
        }));
        // ✅ Update session
        updateUser({ profile_image: filename });
        setSelectedFile(null);
        setPreviewImage(null);
        return true;
      } else {
        alert(`Upload failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  };

  const updateProfileName = async () => {
    if (!sellerId) return false;

    try {
      const response = await fetch("http://localhost/hooper_fits_api/update_profile_name.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: sellerId,
          name: editedName.trim()
        })
      });
      
      const result = await response.json();

      if (result.success) {
        setAdminProfile(prev => ({ ...prev, name: editedName.trim() }));
        // ✅ Update session
        updateUser({ name: editedName.trim() });
        return true;
      } else {
        alert(`Name update failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Name update error:', error);
      return false;
    }
  };

  const handleSaveProfile = useCallback(async () => {
    const nameChanged = editedName.trim() !== adminProfile.name.trim();
    const imageChanged = !!selectedFile;

    if (!nameChanged && !imageChanged) {
      setShowProfileModal(false);
      return;
    }

    let success = true;

    if (nameChanged) {
      success = await updateProfileName();
    }

    if (imageChanged && success) {
      success = await uploadImage();
    }

    if (success) {
      setShowProfileModal(false);
      alert("✅ Profile updated successfully!");
    }
  }, [editedName, adminProfile.name, selectedFile]);

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  useEffect(() => {
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  // =====================================================
  // ✅ ORDERS SORTING
  // =====================================================
  const handleSort = (key) => {
    let sortedOrders = [...orders];
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      setSortConfig({ key: null, direction: null });
      return;
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      sortedOrders.sort((a, b) => {
        if (key === 'id') return parseInt(a.id) - parseInt(b.id);
        if (key === 'date') return new Date(a.date) - new Date(b.date);
        if (key === 'customer') return a.customer.localeCompare(b.customer);
        if (key === 'products') return a.products.localeCompare(b.products);
        if (key === 'total') return parseFloat(a.total) - parseFloat(b.total);
        return 0;
      });
      setSortConfig({ key, direction: 'asc' });
    } else {
      sortedOrders.sort((a, b) => {
        if (key === 'id') return parseInt(b.id) - parseInt(a.id);
        if (key === 'date') return new Date(b.date) - new Date(a.date);
        if (key === 'customer') return b.customer.localeCompare(a.customer);
        if (key === 'products') return b.products.localeCompare(a.products);
        if (key === 'total') return parseFloat(b.total) - parseFloat(a.total);
        return 0;
      });
      setSortConfig({ key, direction: 'desc' });
    }
    
    setOrders(sortedOrders);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕️';
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'shipped': return 'status-shipped';
      case 'completed': return 'status-completed';
      case 'returned': return 'status-returned';
      case 'refunded': return 'status-refunded';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-shipped';
    }
  };

  // Display avatar
  const displayAvatar = previewImage || adminProfile.avatar || defaultAvatar;

  // =====================================================
  // ✅ LOADING SCREEN
  // =====================================================
  if (loading || !sellerId) {
    return (
      <div className="seller-orders-app" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000', color: '#fff'}}>
        <div>⏳ Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="seller-orders-app">
      {/* =====================================================
          ✅ PROFILE MODAL
        ===================================================== */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile}>×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {previewImage ? (
                <img src={previewImage} alt="Preview" style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}} />
              ) : displayAvatar ? (
                <img src={displayAvatar} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}} />
              ) : (
                <div className="no-image-placeholder">
                  <span>👤</span>
                  <p>Click to add profile image</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>

            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>
            
            <div className="profile-name-input-container">
              <label className="profile-label">Profile Name</label>
              <input type="text" value={editedName} onChange={handleNameChange} className="profile-name-input" placeholder="Enter your name" autoComplete="off" />
            </div>

            <button className="get-image-btn" onClick={handleSaveProfile}>💾 Save Changes</button>
            <button className="cancel-btn" onClick={handleCancelProfile}>Cancel</button>
          </div>
        </div>
      )}

      {/* =====================================================
          ✅ SIDEBAR
        ===================================================== */}
      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profile" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="question-mark-avatar">?</div>'; }} />
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{adminProfile.name || "Set your name"}</p>
        </div>
        
        <ul>
          <li><a href="/seller_dashboard">📊 Dashboard</a></li>
          <li><a href="/seller_product">📦 Products</a></li>
          <li><a href="/seller_settings">⚙️ Settings</a></li>
          <li><a className="active" href="/seller_orders">📋 Orders</a></li>
          <li><a href="/seller_messages">💬 Messages</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>

        <div className="sidebar-logo">
          <img src={logo} alt="Hoopers Fits" />
        </div>
      </div>

      {/* =====================================================
          ✅ MAIN CONTENT
        ===================================================== */}
      <div className="main">
        <div className="top-bar">
          <h1>📋 Orders</h1>
        </div>

        <div className="orders">
          <h2>📦 Orders</h2>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div>📦</div>
              <h3>No orders yet</h3>
              <p>Orders will appear here when customers purchase your products.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className={sortConfig.key === 'id' ? 'sort-active' : ''}>
                    Order ID {getSortIcon('id')}
                  </th>
                  <th onClick={() => handleSort('date')} className={sortConfig.key === 'date' ? 'sort-active' : ''}>
                    Date {getSortIcon('date')}
                  </th>
                  <th onClick={() => handleSort('customer')} className={sortConfig.key === 'customer' ? 'sort-active' : ''}>
                    Customer {getSortIcon('customer')}
                  </th>
                  <th onClick={() => handleSort('products')} className={sortConfig.key === 'products' ? 'sort-active' : ''}>
                    Products {getSortIcon('products')}
                  </th>
                  <th onClick={() => handleSort('total')} className={sortConfig.key === 'total' ? 'sort-active' : ''}>
                    Total {getSortIcon('total')}
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id || index}>
                    <td>#{order.id}</td>
                    <td>{order.date || "N/A"}</td>
                    <td>{order.customer || "Unknown"}</td>
                    <td>{order.products || order.product_display || "N/A"}</td>
                    <td>₱{parseFloat(order.total || order.calculated_total || 0).toLocaleString()}</td>
                    <td className={getStatusClass(order.status)}>{order.status || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOrders;