// seller_messages.jsx - UPDATED: MongoDB Backend + Same profile modal as seller dashboard
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/seller_messages.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const SellerMessages = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    avatar: null
  });
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Profile Modal State (SAME AS SELLER DASHBOARD)
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [uploading, setUploading] = useState(false);

  // =====================================================
  // ✅ AUTH CHECK
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

        if (session.role !== "seller" && session.role !== "admin") {
          handleLogout();
          return;
        }

        setSellerId(session.id);
        
        await fetchProfile(session.id);
        await fetchMessages(session.id);
        
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

  // =====================================================
  // ✅ FETCH PROFILE FROM MONGODB
  // =====================================================
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

  // =====================================================
  // ✅ FETCH MESSAGES FROM MONGODB
  // =====================================================
  const fetchMessages = async (id) => {
    try {
      setLoadingMessages(true);
      // Fetch messages for this seller
      const response = await fetch(`${BACKEND_URL}/api/messages/seller/${id}`);
      const result = await response.json();
      
      console.log("📡 Messages data:", result);
      
      if (result.success && result.messages) {
        setMessages(result.messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // =====================================================
  // ✅ PROFILE FUNCTIONS (SAME AS SELLER DASHBOARD)
  // =====================================================
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

  // --- HANDLE IMAGE ERROR ---
  const handleAvatarError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
  }, []);

  // --- CANCEL PROFILE EDIT ---
  const handleCancelProfileModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  // --- SAVE PROFILE (SAME AS SELLER DASHBOARD) ---
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
      
      // Step 1: Save the name first
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

      // Step 2: Upload image if selected
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
      
      // Step 3: Refresh profile data
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

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  // =====================================================
  // ✅ HELPER FUNCTIONS
  // =====================================================
  
  // --- Format date for display ---
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // --- Check if message is unread ---
  const isMessageUnread = (message) => {
    return !message.is_read || message.status === 'unread';
  };

  // --- Display avatar ---
  const getDisplayAvatar = useCallback(() => {
    return previewImage || adminProfile.avatar || defaultAvatar;
  }, [previewImage, adminProfile.avatar]);

  // --- Mark message as read ---
  const handleMessageClick = async (message) => {
    console.log('💬 Message clicked:', message);
    
    // Mark as read
    try {
      await fetch(`${BACKEND_URL}/api/messages/${message._id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId })
      });
      
      // Refresh messages
      await fetchMessages(sellerId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
    
    setSelectedMessage(message);
  };

  // =====================================================
  // ✅ LOADING SCREEN
  // =====================================================
  if (loading || !sellerId) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        background: '#000', 
        color: '#fff'
      }}>
        <div>⏳ Loading messages...</div>
      </div>
    );
  }

  // Count unread messages
  const unreadCount = messages.filter(m => isMessageUnread(m)).length;

  return (
    <div className="seller-messages-app">
      {/* PROFILE MODAL (EXACTLY SAME AS SELLER DASHBOARD) */}
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
                onChange={handleNameChange}
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
          <p className="profile-name">{adminProfile.name || "Set your name"}</p>
        </div>
        
        <ul>
          <li><a href="/seller_dashboard">📊 Dashboard</a></li>
          <li><a href="/seller_product">📦 Products</a></li>
          <li><a href="/seller_orders">📋 Orders</a></li>
          <li><a className="active" href="/seller_messages">💬 Messages</a></li>
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

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="top-bar">
          <h1>💬 Messages ({messages.length})</h1>
          {unreadCount > 0 && (
            <span style={{
              background: '#dc3545',
              color: '#fff',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              marginLeft: '10px'
            }}>
              {unreadCount} Unread
            </span>
          )}
        </div>

        <div className="messages-container">
          <h2>💬 INBOX</h2>
          <p>Manage your customer inquiries and messages.</p>

          {loadingMessages ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <div>📭</div>
              <h3>No messages yet</h3>
              <p>Messages from customers will appear here when they contact you.</p>
            </div>
          ) : (
            <div className="messages-table">
              <div className="table-header">
                <div className="header-sender">Sender</div>
                <div className="header-subject">Message</div>
                <div className="header-date">Date</div>
                <div className="header-status">Status</div>
              </div>
              
              {messages.map((message) => (
                <div 
                  key={message._id || message.id} 
                  className={`table-row ${isMessageUnread(message) ? 'unread-row' : ''}`}
                  onClick={() => handleMessageClick(message)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sender">
                    {message.fullname || message.sender_username || message.name || `User #${message.sender_id}`}
                  </div>
                  <div className="subject" title={message.message}>
                    {message.message?.length > 50 
                      ? `${message.message.substring(0, 50)}...` 
                      : message.message || 'No message'
                    }
                  </div>
                  <div className="date">{formatDate(message.createdAt || message.created_at)}</div>
                  <div className={`status ${isMessageUnread(message) ? 'unread' : 'read'}`}>
                    {isMessageUnread(message) ? 'Unread' : 'Read'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message details modal */}
        {selectedMessage && (
          <div className="message-modal" onClick={() => setSelectedMessage(null)}>
            <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="message-header">
                <h3>{selectedMessage.message}</h3>
                <button className="close-message" onClick={() => setSelectedMessage(null)}>×</button>
              </div>
              <div className="message-details">
                <p><strong>👤 From:</strong> {selectedMessage.fullname || selectedMessage.sender_username || selectedMessage.name || `User #${selectedMessage.sender_id}`}</p>
                <p><strong>📧 Email:</strong> {selectedMessage.email}</p>
                <p><strong>📅 Date:</strong> {new Date(selectedMessage.createdAt || selectedMessage.created_at).toLocaleString()}</p>
              </div>
              <div className="message-actions">
                <button className="reply-btn" onClick={() => {
                  alert("Reply功能开发中... Reply feature coming soon!");
                }}>💬 Reply</button>
                <button className="delete-btn" onClick={() => {                  alert("Delete functionality coming soon!");
                }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;