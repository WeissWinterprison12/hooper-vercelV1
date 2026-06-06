import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/seller_orders.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const SellerOrders = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState({ name: "", avatar: null });
  const [orders, setOrders] = useState([]);
  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelAction, setCancelAction] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploading, setUploading] = useState(false);


  useEffect(() => {
    document.title = "Orders - Hooper Fits";
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const sessionStr = localStorage.getItem("seller_session");
        
        if (!sessionStr) {
          handleLogout();
          return;
        }

        const session = JSON.parse(sessionStr);

        if (session.role !== "seller" && session.role !== "admin") {
          handleLogout();
          return;
        }

        setSellerId(session.id);
        
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
  }, [navigate]);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    localStorage.removeItem("seller_session");
    navigate("/login");
  };

  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
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
        
      setAdminProfile({
        name: data.fullName || data.username || "Seller",
        avatar: avatarUrl
      });
      setEditedName(data.fullName || data.username || "Seller");
      
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  const fetchOrders = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/seller/${id}`);
      const data = await response.json();
      
      console.log("📡 Orders data:", data);
      
      if (data.success && data.orders) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setOrders([]);
    }
  };

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

  const handleAvatarError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
  }, []);

  const handleCancelProfileModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  const handleSaveProfile = useCallback(async () => {
    if (!sellerId) {
      alert("No user ID found. Please login again.");
      return;
    }

    const newName = editedName && editedName.trim() ? editedName.trim() : adminProfile.name;

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
        body: JSON.stringify({ fullName: newName })
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
  }, [sellerId, editedName, adminProfile.name, selectedFile, fetchProfile]);

  const handleShowActionModal = (order, action) => {
    setSelectedOrder(order);
    setCancelAction(action);
    setShowReasonModal(true);
  };

  const handleCloseReasonModal = () => {
    setShowReasonModal(false);
    setSelectedOrder(null);
    setCancelAction(null);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !cancelAction) return;

    let newStatus, successMessage;
    
    switch(cancelAction) {
      case 'approve':
        newStatus = 'cancelled';
        successMessage = "✅ Order cancelled successfully!";
        break;
      case 'reject':
        newStatus = 'pending';
        successMessage = "✅ Cancellation request rejected! Order is back to pending.";
        break;
      case 'shipOut':
        newStatus = 'shipped_out';
        successMessage = "✅ Order shipped out!";
        break;
      case 'deliver':
        newStatus = 'delivered';
        successMessage = "✅ Order marked as delivered!";
        break;
      case 'complete':
        newStatus = 'completed';
        successMessage = "✅ Order marked as completed!";
        break;
      default:
        return;
    }

    try {
      setUpdating(true);
      
      const response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          cancellation_approved: cancelAction === 'approve'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(successMessage);
        await fetchOrders(sellerId);
        handleCloseReasonModal();
      } else {
        alert("❌ Failed to update order: " + result.message);
      }
    } catch (error) {
      console.error("❌ Error updating order:", error);
      alert("Failed to update order. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'shipped_out': return 'status-shipped';
      case 'delivered': return 'status-shipped';
      case 'completed': return 'status-completed';
      case 'returned': return 'status-returned';
      case 'refunded': return 'status-refunded';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'cancellation_requested': return 'status-pending';
      default: return 'status-shipped';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'shipped_out': return 'Shipped Out';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      case 'cancellation_requested': return 'Cancellation Requested';
      default: return status || 'Pending';
    }
  };

  const getDisplayAvatar = useCallback(() => {
    return previewImage || adminProfile.avatar || defaultAvatar;
  }, [previewImage, adminProfile.avatar]);

  if (loading || !sellerId) {
    return (
      <div className="seller-orders-app" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000', color: '#fff'}}>
        <div>⏳ Loading your orders...</div>
      </div>
    );
  }

  const cancellationRequests = orders.filter(o => o.status === 'cancellation_requested').length;

  return (
    <div className="seller-orders-app">
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfileModal} type="button">×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {(previewImage || adminProfile.avatar) ? (
                <img 
                  src={previewImage || adminProfile.avatar} 
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
            
            <div className="profile-name-input-container">
              <label className="profile-label">Profile Name</label>
              <input 
                type="text" 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)} 
                className="profile-name-input" 
                placeholder="Enter your name" 
                autoComplete="off" 
              />
            </div>

            <button 
              className="get-image-btn" 
              onClick={handleSaveProfile}
              disabled={uploading}
              type="button"
            >
              {uploading ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <button 
              className="cancel-btn" 
              onClick={handleCancelProfileModal}
              type="button"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="profile-modal" onClick={handleCloseReasonModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseReasonModal}>×</button>
            
            <h2 className="modal-title">
              {cancelAction === 'approve' ? '❌ Cancel Order?' : 
               cancelAction === 'reject' ? '✅ Keep Order?' :
               cancelAction === 'shipOut' ? '📦 Ship Order?' :
               cancelAction === 'deliver' ? '📦 Mark Delivered?' :
               cancelAction === 'complete' ? '✅ Complete Order?' : '❓ Confirm?'}
            </h2>
            
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {cancelAction === 'approve' 
                ? `This will CANCEL order #${selectedOrder?._id?.slice(-6)}`
                : cancelAction === 'reject'
                ? `This will KEEP order #${selectedOrder?._id?.slice(-6)} ACTIVE and set status back to pending`
                : cancelAction === 'shipOut'
                ? `This will mark order #${selectedOrder?._id?.slice(-6)} as SHIPPED OUT`
                : cancelAction === 'deliver'
                ? `Mark order #${selectedOrder?._id?.slice(-6)} as delivered?`
                : `Mark order #${selectedOrder?._id?.slice(-6)} as completed?`}
            </p>

            {selectedOrder?.cancel_reason && (cancelAction === 'approve' || cancelAction === 'reject') && (
              <div style={{ 
                background: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <strong>Buyer's reason:</strong>
                <p style={{ marginTop: '5px', color: '#333' }}>
                  {selectedOrder.cancel_reason}
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="cancel-btn" 
                onClick={handleCloseReasonModal}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="get-image-btn" 
                onClick={handleUpdateOrderStatus}
                disabled={updating}
                style={{ 
                  flex: 1,
                  background: cancelAction === 'approve' ? '#dc3545' : 
                           cancelAction === 'reject' ? '#28a745' :
                           cancelAction === 'shipOut' ? '#6f42c1' :
                                                      cancelAction === 'deliver' ? '#ff9800' :
                           cancelAction === 'complete' ? '#28a745' : '#6f42c1'
                }}
              >
                {updating 
                  ? "⏳ Updating..." 
                  : cancelAction === 'approve' 
                    ? "❌ Yes, Cancel" 
                    : cancelAction === 'reject'
                    ? "✅ Keep Order"
                    : cancelAction === 'shipOut'
                    ? "📦 Yes, Ship Out"
                    : cancelAction === 'deliver'
                    ? "📦 Mark Delivered"
                    : "✅ Complete"}
              </button>
            </div>
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
          <p className="profile-name">{adminProfile.name || "Set your name"}</p>
        </div>
        
        <ul>
          <li><a href="/seller_dashboard">📊 Dashboard</a></li>
          <li><a href="/seller_product">📦 Products</a></li>
                    <li><a className="active" href="/seller_orders">📋 Orders</a></li>
          <li><a href="/seller_messages">💬 Messages</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>

        <div className="sidebar-logo">
          <img 
            src={logo} 
            alt="Hoopers Fits" 
            onClick={() => navigate("/seller_dashboard")} 
            style={{cursor: 'pointer'}} 
          />
        </div>
      </div>

      <div className="main">
        <div className="top-bar">
          <h1>📋 Orders</h1>
          {cancellationRequests > 0 && (
            <span style={{
              background: '#ff6b6b',
              color: '#fff',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              marginLeft: '10px'
            }}>
              {cancellationRequests} Cancellation Request{cancellationRequests > 1 ? 's' : ''}
            </span>
          )}
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
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Buyer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr 
                    key={order._id || index}
                    onMouseEnter={() => setHoveredOrder(order._id)}
                    onMouseLeave={() => setHoveredOrder(null)}
                  >
                    <td>#{order._id?.slice(-6)}</td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {order.items && order.items.length > 0
                        ? order.items.map(item => item.product_id?.product_name || "Product").join(", ")
                        : "N/A"}
                    </td>
                    <td>{order.buyer_id || "Unknown"}</td>
                    <td>₱{Number(order.total_price || 0).toLocaleString()}</td>
                    <td className={getStatusClass(order.status)}>
                      {getStatusText(order.status)}
                    </td>
                    <td>
                      {hoveredOrder === order._id && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          
                          {order.status === 'cancellation_requested' && (
                            <>
                              <button
                                onClick={() => handleShowActionModal(order, 'approve')}
                                style={{
                                  background: '#dc3545',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Approve Cancellation"
                              >
                                ❌
                              </button>
                              <button
                                onClick={() => handleShowActionModal(order, 'reject')}
                                style={{
                                  background: '#28a745',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Reject Cancellation"
                              >
                                ✓
                              </button>
                            </>
                          )}
                        
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleShowActionModal(order, 'shipOut')}
                                style={{
                                  background: '#6f42c1',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Ship Out"
                              >
                                📦
                              </button>
                              <button
                                onClick={() => handleShowActionModal(order, 'complete')}
                                style={{
                                  background: '#28a745',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Complete Order"
                              >
                                ✓
                              </button>
                            </>
                          )}
                          
                          {/* Shipped Out - Deliver & Complete */}
                          {order.status === 'shipped_out' && (
                            <>
                              <button
                                onClick={() => handleShowActionModal(order, 'deliver')}
                                style={{
                                  background: '#ff9800',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Mark Delivered"
                              >
                                📦
                              </button>
                              <button
                                onClick={() => handleShowActionModal(order, 'complete')}
                                style={{
                                  background: '#28a745',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Complete Order"
                              >
                                ✓
                              </button>
                            </>
                          )}
                          
                          {/* Delivered Orders - Complete */}
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => handleShowActionModal(order, 'complete')}
                              style={{
                                background: '#28a745',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              title="Complete Order"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      )}
                    </td>
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