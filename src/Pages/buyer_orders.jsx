// buyer_orders.jsx - UPDATED: Added Profile Editing
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_dashboard.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerOrders = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [buyerId, setBuyerId] = useState(null); // Added to track ID for profile updates
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // --- NEW: Profile Edit States ---
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [uploading, setUploading] = useState(false);

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

        // Set buyer ID for API calls
        setBuyerId(session.id);

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
      const data = await response.json();

      let avatarUrl = defaultAvatar;
      
      if (data.profile_image) {
        if (data.profile_image.startsWith("http")) {
          avatarUrl = data.profile_image;
        } else {
          avatarUrl = `${BACKEND_URL}${data.profile_image}`;
        }
      }
          
      setUserProfile({
        fullName: data.fullName || data.username || "",
        username: data.username || "",
        avatar: avatarUrl
      });
      
      // Pre-fill the edit name field
      setEditedName(data.fullName || data.username || "");
      
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

  // --- Profile Handlers ---
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

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    // Reset edited name to current profile name
    setEditedName(userProfile?.fullName || userProfile?.username || "");
  }, [userProfile]);

  const handleAvatarError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!buyerId) {
      alert("No user ID found. Please login again.");
      return;
    }

    const newName = editedName && editedName.trim() ? editedName.trim() : userProfile?.fullName || userProfile?.username;

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

      // Step 2: Upload image if selected
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
  }, [buyerId, editedName, userProfile, selectedFile]); // Added fetchProfile dependency needs to be stable or inline

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  // --- Order Handlers ---
  const handleShowCancelModal = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
    setSelectedReason("");
    setOtherReason("");
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    setShowReasonModal(true);
  };

  const handleReasonSelect = (reason) => setSelectedReason(reason);

  const handleReasonClose = () => {
    setShowReasonModal(false);
    setSelectedReason("");
    setOtherReason("");
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !selectedReason) {
      alert("Please select a reason");
      return;
    }

    const reason = selectedReason === "others" && otherReason.trim() 
      ? otherReason 
      : selectedReason;

    try {
      setCancelling(true);
      
      const response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancellation_requested",
          cancel_reason: reason
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert("✅ Cancellation request submitted! Waiting for seller approval.");
        
        const session = JSON.parse(localStorage.getItem("buyer_session"));
        await fetchOrders(session.id);
        
        setShowReasonModal(false);
                setSelectedReason("");
        setOtherReason("");
        setSelectedOrder(null);
      } else {
        alert("❌ Failed to cancel order: " + result.message);
      }
    } catch (error) {
      console.error("❌ Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const getDisplayName = () => {
    return userProfile?.fullName || userProfile?.username || "Buyer";
  };

  const getDisplayUsername = () => {
    return userProfile?.username || "@user";
  };

  const getDisplayAvatar = () => {
    // Check for preview first, then profile avatar, then default
    return previewImage || userProfile?.avatar || defaultAvatar;
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'pending': return { text: 'Pending', color: '#ffd700' };
      case 'delivered': return { text: 'Delivered', color: '#ff9800' };
      case 'completed': return { text: 'Completed', color: '#90EE90' };
      case 'cancelled': return { text: 'Cancelled', color: '#ff6b6b' };
      case 'cancellation_requested': return { text: 'Cancellation Requested', color: '#FFA500' };
      default: return { text: status || 'Unknown', color: '#87CEEB' };
    }
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
        <span style={{ color: '#333', fontSize: '18px', fontWeight: '500' }}>Loading Orders...</span>
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

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile} type="button">×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {(previewImage || userProfile?.avatar) ? (
                <img 
                  src={previewImage || userProfile?.avatar} 
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
          <li><a href="/buyer_dashboard">📊 Dashboard</a></li>
          <li><a className="active" href="#">📦 Orders</a></li>
          <li><a href="/checkout">🛒 Cart</a></li>
          <li><a href="buyer_messages">💬 Messages</a></li>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map((order) => {
                const statusInfo = getStatusDisplay(order.status);
                return (
                  <tr 
                    key={order._id}
                    onMouseEnter={() => setHoveredOrder(order._id)}
                    onMouseLeave={() => setHoveredOrder(null)}
                  >
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
                        background: statusInfo.color,
                        color: '#000'
                      }}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td>
                      {hoveredOrder === order._id && 
                       order.status !== 'cancelled' && 
                       order.status !== 'completed' && 
                       order.status !== 'cancellation_requested' && (
                        <button
                          onClick={() => handleShowCancelModal(order)}
                          style={{
                            background: '#ff6b6b',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                          title="Cancel Order"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
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

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="message-modal" onClick={handleCloseCancelModal}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="message-modal-title">❌ Cancel Order?</h2>
            <p className="message-modal-text">
              Are you sure you want to cancel this order?
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
              Order #{selectedOrder?._id?.slice(-6)}
            </p>
            <div className="message-modal-buttons">
              <button 
                className="message-modal-btn secondary" 
                onClick={handleCloseCancelModal}
              >
                No, Keep Order
              </button>
              <button 
                className="message-modal-btn primary" 
                onClick={handleConfirmCancel}
                style={{ background: '#dc3545' }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL REASON MODAL */}
      {showReasonModal && (
        <div className="message-modal" onClick={handleReasonClose}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="message-modal-title">📝 Please state a reason</h2>
            <div className="reason-options" style={{ marginTop: '20px' }}>
              <label className="reason-option">
                <input 
                  type="radio" 
                  name="cancelReason" 
                  value="Need to change delivery address" 
                  checked={selectedReason === "Need to change delivery address"}
                  onChange={(e) => handleReasonSelect(e.target.value)} 
                />
                <span>Need to change delivery address</span>
              </label>
              <label className="reason-option">
                <input 
                  type="radio" 
                  name="cancelReason" 
                  value="Seller is not responsive to my inquiries" 
                  checked={selectedReason === "Seller is not responsive to my inquiries"}
                  onChange={(e) => handleReasonSelect(e.target.value)} 
                />
                <span>Seller is not responsive to my inquiries</span>
              </label>
              <label className="reason-option">
                <input 
                  type="radio" 
                  name="cancelReason" 
                  value="others" 
                  checked={selectedReason === "others"}
                  onChange={(e) => handleReasonSelect(e.target.value)} 
                />
                <span>Others:</span>
                {selectedReason === "others" && (
                  <input
                    type="text"
                    placeholder="Please specify..."
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      marginTop: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                )}
              </label>
            </div>
            <div className="message-modal-buttons">
              <button 
                className="message-modal-btn secondary" 
                onClick={handleReasonClose}
              >
                Back
              </button>
              <button 
                className="message-modal-btn primary" 
                onClick={handleCancelOrder}
                disabled={!selectedReason || (selectedReason === "others" && !otherReason.trim())}
                style={{ background: '#dc3545' }}
              >
                {cancelling ? "⏳ Cancelling..." : "Submit Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

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