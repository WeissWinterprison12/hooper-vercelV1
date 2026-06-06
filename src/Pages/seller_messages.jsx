// seller_messages.jsx - FULLY FIXED
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
  const [adminProfile, setAdminProfile] = useState({ name: "", avatar: null });
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Profile Modal State
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Send Message Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState({ message: "" });
  const [replyToBuyer, setReplyToBuyer] = useState(null);

  useEffect(() => { document.title = "Messages - Hooper Fits"; }, []);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        const sessionStr = localStorage.getItem("seller_session");
        if (!sessionStr) { handleLogout(); return; }

        const session = JSON.parse(sessionStr);
        if (session.role !== "seller" && session.role !== "admin") { handleLogout(); return; }

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
    logout();
    localStorage.removeItem("seller_session");
    navigate("/login");
  };

  // FETCH PROFILE
  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
      const data = await response.json();
      let avatarUrl = defaultAvatar;
      
      if (data.profile_image) {
        avatarUrl = data.profile_image.startsWith("http") 
          ? data.profile_image 
          : `${BACKEND_URL}${data.profile_image}`;
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

  // FETCH MESSAGES
  const fetchMessages = async (id) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`${BACKEND_URL}/api/messages/seller/${id}`);
      const result = await response.json();
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

  // PROFILE FUNCTIONS
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large! Please select an image under 2MB.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => { setPreviewImage(event.target.result); };
      reader.readAsDataURL(file);
    }
  }, []);

  const openFileExplorer = useCallback(() => {
    if (fileInputRef.current) { fileInputRef.current.click(); }
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
    if (!sellerId) { alert("No user ID found. Please login again."); return; }
    const newName = editedName && editedName.trim() ? editedName.trim() : adminProfile.name;
    if (!newName) { alert("Please enter a name."); return; }

    try {
      setUploading(true);
      const response = await fetch(`${BACKEND_URL}/api/users/${sellerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: newName })
      });

      if (!response.ok) throw new Error("Failed to update name");
      
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append("profile_image", selectedFile);
        await fetch(`${BACKEND_URL}/api/users/${sellerId}/image`, {
          method: "PUT",
          body: imageFormData
        });
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
  }, [sellerId, editedName, adminProfile.name, selectedFile]);

  // SEND MESSAGE FUNCTION
const handleSendMessage = useCallback(async (e) => {
  e.preventDefault();
  
  console.log("🔍 DEBUG - Sending with:", {
    newMessage: newMessage.message,
    sellerId: sellerId,
    replyToBuyer: replyToBuyer,
    replyToBuyerType: typeof replyToBuyer
  });
  
  if (!newMessage.message.trim()) { 
    alert("Please enter a message"); 
    return; 
  }
  
  if (!sellerId || !replyToBuyer) { 
    alert("Session expired. Please login again."); 
    return; 
  }

  try {
    setSending(true);
    const response = await fetch(`${BACKEND_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: sellerId,
        receiver_id: replyToBuyer, 
        message: newMessage.message.trim()
      })
    });

    const result = await response.json();
    console.log("📡 Response:", response.status, result);

    if (!response.ok) {
      throw new Error(result.message || `Server error: ${response.status}`);
    }
    
    alert("Message sent successfully!");
    setNewMessage({ message: "" });
    setReplyToBuyer(null);
    setShowSendModal(false);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    alert(`Failed to send message: ${error.message}`);
  } finally {
    setSending(false);
  }
}, [newMessage, sellerId, replyToBuyer]);

  const handleDeleteMessage = useCallback(async () => {
    if (!selectedMessage || !selectedMessage._id) { alert("No message selected."); return; }
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/messages/${selectedMessage._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to delete message");
      
      alert("Message deleted successfully!");
      setSelectedMessage(null);
      await fetchMessages(sellerId);
    } catch (error) {
      console.error("❌ Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  }, [selectedMessage, sellerId]);

const handleOpenReply = useCallback(() => {
  if (!selectedMessage) return;
  
  let buyerId;
  
  if (typeof selectedMessage.sender_id === 'object' && selectedMessage.sender_id !== null) {
    buyerId = selectedMessage.sender_id._id?.toString() || 
              selectedMessage.sender_id.id?.toString() || 
              String(selectedMessage.sender_id);
  } else if (typeof selectedMessage.sender_id === 'string') {
    buyerId = selectedMessage.sender_id;
  } else {
    buyerId = String(selectedMessage.sender_id);
  }
  
  buyerId = buyerId.trim();
  
  console.log("🔍 DEBUG - Buyer ID extracted:", buyerId, "Type:", typeof buyerId);
  
  if (!buyerId || buyerId === 'undefined' || buyerId === 'null') { 
    console.log("❌ No buyer ID found:", selectedMessage);
    alert("Cannot reply: No buyer ID found."); 
    return; 
  }
  
  setReplyToBuyer(buyerId);
  setNewMessage({ message: "" });
  setShowSendModal(true);
  setSelectedMessage(null);
}, [selectedMessage]);


  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const isMessageUnread = (message) => !message.is_read || message.status === 'unread';

  const getDisplayAvatar = useCallback(() => previewImage || adminProfile.avatar || defaultAvatar, [previewImage, adminProfile.avatar]);

  const handleMessageClick = async (message) => {
    try {
      await fetch(`${BACKEND_URL}/api/messages/${message._id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId })
      });
      await fetchMessages(sellerId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
    setSelectedMessage(message);
  };

  if (loading || !sellerId) {
    return (
      <div className="seller-messages-app" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000', color: '#fff'}}>
        <div>⏳ Loading your messages...</div>
      </div>
    );
  }

  const unreadCount = messages.filter(m => isMessageUnread(m)).length;

  return (
    <div className="seller-messages-app">
      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfileModal}>×</button>
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {(previewImage || adminProfile.avatar) ? (
                <img src={previewImage || adminProfile.avatar} alt="Preview" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} onError={handleAvatarError} />
              ) : (
                <div className="question-mark-avatar">?</div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>
            <div className="profile-name-input-container">
              <label className="profile-label">Profile Name</label>
              <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="profile-name-input" placeholder="Enter your name" autoComplete="off" />
            </div>
            <button className="get-image-btn" onClick={handleSaveProfile} disabled={uploading}>
              {uploading ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <button className="cancel-btn" onClick={handleCancelProfileModal}>❌ Cancel</button>
          </div>
        </div>
      )}

      {/* SEND MESSAGE MODAL */}
      {showSendModal && (
        <div className="send-modal" onClick={() => { setShowSendModal(false); setReplyToBuyer(null); }}>
          <div className="send-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => { setShowSendModal(false); setReplyToBuyer(null); }}>×</button>
            <h2 className="send-modal-title">📤 Send Message</h2>
            <p className="send-modal-subtitle">
              Replying to: {messages.find(m => {
                const mId = typeof m.sender_id === 'object' ? m.sender_id._id : m.sender_id;
                return mId === replyToBuyer;
              })?.fullname || `User #${replyToBuyer}`}
            </p>
            <form onSubmit={handleSendMessage}>
              <div className="message-textarea-container">
                <label className="message-label">Your Message</label>
                <textarea 
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  className="message-textarea"
                  placeholder="Type your reply here..."
                  rows="5"
                  required
                />
              </div>
              <button type="submit" className="send-btn" disabled={sending}>
                {sending ? "⏳ Sending..." : "📤 Send Reply"}
              </button>
              <button type="button" className="cancel-btn" onClick={() => { setShowSendModal(false); setReplyToBuyer(null); }}>❌ Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)} title="Click to edit profile">
            {getDisplayAvatar() && getDisplayAvatar() !== defaultAvatar ? (
              <img src={getDisplayAvatar()} alt="Profile" onError={handleAvatarError} />
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
          <img src={logo} alt="Hoopers Fits" onClick={() => navigate("/seller_dashboard")} style={{cursor: 'pointer'}} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="top-bar">
          <h1>💬 Messages ({messages.length})</h1>
          {unreadCount > 0 && (
            <span style={{background: '#dc3545', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', marginLeft: '10px'}}>
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
              <p>Messages from customers will appear here.</p>
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
                {message.fullname || message.sender_username || message.name || `User #${typeof message.sender_id === 'object' ? message.sender_id._id : message.sender_id}`}
              </div>
              <div className="subject" title={message.message}>
                {message.message?.length > 50 ? `${message.message.substring(0, 50)}...` : message.message || 'No message'}
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
    {selectedMessage && !showSendModal && (
      <div className="message-modal" onClick={() => setSelectedMessage(null)}>
        <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="message-header">
            <h3>{selectedMessage.message}</h3>
            <button className="close-message" onClick={() => setSelectedMessage(null)}>×</button>
          </div>
          <div className="message-details">
            <p>
              <strong>👤 From:</strong> {
                selectedMessage.fullname || 
                selectedMessage.sender_username || 
                selectedMessage.name || 
                `User #${
                  typeof selectedMessage.sender_id === 'object' 
                    ? selectedMessage.sender_id._id 
                    : selectedMessage.sender_id
                }`
              }
            </p>
            <p><strong>📧 Email:</strong> {selectedMessage.email}</p>
            <p><strong>📅 Date:</strong> {new Date(selectedMessage.createdAt || selectedMessage.created_at).toLocaleString()}</p>
          </div>
          <div className="message-actions">
            <button className="reply-btn" onClick={handleOpenReply}>💬 Reply</button>
            <button className="delete-btn" onClick={handleDeleteMessage}>🗑️ Delete</button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
); };

export default SellerMessages;