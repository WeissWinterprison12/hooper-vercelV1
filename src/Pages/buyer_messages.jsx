// buyer_messages.jsx - NEW: Buyer messaging interface
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_messages.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerMessages = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [buyerId, setBuyerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    avatar: null
  });
  
  // Messages state
  const [inboxMessages, setInboxMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'sent'
  
  // Send message state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiver_id: "",
    message: ""
  });

  // Profile Modal State
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    document.title = "Messages - Hooper Fits";
  }, []);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        const sessionStr = localStorage.getItem("buyer_session");
        
        if (!sessionStr) {
          handleLogout();
          return;
        }

        const session = JSON.parse(sessionStr);

        if (session.role !== "buyer") {
          handleLogout();
          return;
        }

        setBuyerId(session.id);
        
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
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  // FETCH PROFILE
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
        
      setProfile({
        fullName: data.fullName || data.username || "Buyer",
        username: data.username || "buyer",
        avatar: avatarUrl
      });
      setEditedName(data.fullName || data.username || "Buyer");
      
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  // FETCH MESSAGES
  const fetchMessages = async (id) => {
    try {
      setLoadingMessages(true);
      
      // Fetch inbox (messages sent TO buyer)
      const inboxResponse = await fetch(`${BACKEND_URL}/api/messages/buyer/${id}`);
      const inboxResult = await inboxResponse.json();
      
      // Fetch sent (messages sent BY buyer)
      const sentResponse = await fetch(`${BACKEND_URL}/api/messages/buyer/${id}/sent`);
      const sentResult = await sentResponse.json();
      
      console.log("📡 Inbox data:", inboxResult);
      console.log("📡 Sent data:", sentResult);
      
      if (inboxResult.success) {
        setInboxMessages(inboxResult.messages || []);
      }
      
      if (sentResult.success) {
        setSentMessages(sentResult.messages || []);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      setInboxMessages([]);
      setSentMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // SEND MESSAGE
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.message.trim()) {
      alert("Please enter a message");
      return;
    }

    if (!buyerId) {
      alert("Session expired. Please login again.");
      return;
    }

    // For now, we'll send to the admin/seller (hardcoded for demo - you can make this dynamic)
    const adminId = "678f1a2b3c4d5e6f7g8h9i0a"; // Replace with actual admin/seller ID or fetch from API
    
    try {
      setSending(true);
      
      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: buyerId,
          receiver_id: adminId,
          message: newMessage.message.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("Message sent successfully!");
        setNewMessage({ receiver_id: "", message: "" });
        setShowSendModal(false);
        await fetchMessages(buyerId);
      } else {
        alert(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [newMessage, buyerId]);

  // PROFILE FUNCTIONS
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
    setEditedName(profile.fullName || profile.username);
  }, [profile.fullName, profile.username]);

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
      
      const response = await fetch(`${BACKEND_URL}/api/users/${buyerId}`, {
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

        const imageResponse = await fetch(`${BACKEND_URL}/api/users/${buyerId}/image`, {
          method: "PUT",
          body: imageFormData
        });

        if (!imageResponse.ok) {
          console.log("⚠️ Image upload failed, but name was saved");
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

  // HELPER FUNCTIONS
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

  const isMessageUnread = (message) => {
    return !message.is_read || message.status === 'unread';
  };

  // ✅ FIXED: Correct syntax without malformed comment
  const getDisplayAvatar = useCallback(() => {
    return previewImage || profile.avatar || defaultAvatar;
  }, [previewImage, profile.avatar]);

  // ✅ FIXED: Only mark as read for INBOX messages, not sent
  const handleMessageClick = async (message) => {
    console.log('💬 Message clicked:', message);
    
    // Only mark as read if it's an inbox message
    if (activeTab === 'inbox') {
      try {
        await fetch(`${BACKEND_URL}/api/messages/${message._id}/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyer_id: buyerId })
        });
        
        await fetchMessages(buyerId);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
    
    setSelectedMessage(message);
  };

  // =====================================================
  // ✅ UPDATED LOADING SCREEN (SAME AS BUYER_DASHBOARD)
  // =====================================================
  if (loading || !buyerId) {
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
        <span style={{ color: '#333', fontSize: '18px', fontWeight: '500' }}>Loading Messages...</span>
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

  const unreadCount = inboxMessages.filter(m => isMessageUnread(m)).length;
  const sentCount = sentMessages.length;

  // Determine which messages to display based on active tab
  const displayedMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;

  return (
    <div className="buyer-messages-app">
      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfileModal} type="button">×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {(previewImage || profile.avatar) ? (
                <img 
                  src={previewImage || profile.avatar} 
                  alt="Preview" 
                  style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} 
                  onError={handleAvatarError}
                />
              ) : (
                <div className="question-mark-avatar">?</div>
              )}
              
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>

            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>
            
            <div className="profile-name-input-container">
              <label className="profile-label">Display Name</label>
              <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="profile-name-input" placeholder="Enter your name" autoComplete="off" />
            </div>

            <button className="get-image-btn" onClick={handleSaveProfile} disabled={uploading}>
              {uploading ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <button className="cancel-btn" onClick={handleCancelProfileModal}>
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* SEND MESSAGE MODAL */}
      {showSendModal && (
        <div className="send-modal" onClick={() => setShowSendModal(false)}>
          <div className="send-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowSendModal(false)} type="button">×</button>
            
            <h2 className="send-modal-title">📤 Send Message</h2>
            <p className="send-modal-subtitle">Send a message to the seller/admin</p>
            
            <form onSubmit={handleSendMessage}>
              <div className="message-textarea-container">
                <label className="message-label">Your Message</label>
                <textarea 
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  className="message-textarea"
                  placeholder="Type your message here..."
                  rows="5"
                  required
                />
              </div>

                            <button type="submit" className="send-btn" disabled={sending}>
                {sending ? "⏳ Sending..." : "📤 Send Message"}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setShowSendModal(false)}>
                ❌ Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="buyer-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)} title="Click to edit profile">
            {getDisplayAvatar() && getDisplayAvatar() !== defaultAvatar ? (
              <img src={getDisplayAvatar()} alt="Profile" onError={handleAvatarError} />
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{profile.fullName || profile.username || "Set your name"}</p>
          <p className="profile-username">@{profile.username || "buyer"}</p>
        </div>
        
        <ul>
          <li><a href="/buyer_dashboard">📊 Dashboard</a></li>
          <li><a href="/buyer_orders">📦 Orders</a></li>
          <li><a href="/checkout">🛒 Cart</a></li>
          <li><a className="active" href="#">💬 Messages</a></li>
          <li><a href="/buyer_home">🏠 Home</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>

        <div className="sidebar-logo">
          <img src={logo} alt="Hoopers Fits" onClick={() => navigate("/buyer_home")} style={{cursor: 'pointer'}} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="top-bar">
          <div className="top-bar-left">
            <h1>💬 Messages</h1>
            <span className="total-messages">({displayedMessages.length} total)</span>
          </div>
          <button className="new-message-btn" onClick={() => setShowSendModal(true)}>
            ➕ New Message
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="messages-tabs">
          <button 
            className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            📥 Inbox ({unreadCount > 0 ? unreadCount : 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            📤 Sent ({sentCount})
          </button>
        </div>

        <div className="messages-container">
          {loadingMessages ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="no-messages">
              <div>{activeTab === 'inbox' ? '📭' : '📤'}</div>
              <h3>{activeTab === 'inbox' ? 'No messages received' : 'No messages sent'}</h3>
              <p>{activeTab === 'inbox' ? 'Messages from sellers will appear here.' : 'Your sent messages will appear here.'}</p>
            </div>
          ) : (
            <div className="messages-table">
              <div className="table-header">
                <div className="header-sender">{activeTab === 'inbox' ? 'From' : 'To'}</div>
                <div className="header-subject">Message</div>
                <div className="header-date">Date</div>
                <div className="header-status">Status</div>
              </div>
              
              {displayedMessages.map((message) => (
                <div 
                  key={message._id || message.id} 
                  className={`table-row ${activeTab === 'inbox' && isMessageUnread(message) ? 'unread-row' : ''}`}
                  onClick={() => handleMessageClick(message)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sender">
                    {activeTab === 'inbox' 
                      ? message.fullname || message.sender_username || `User #${message.sender_id}`
                      : message.fullname || message.sender_username || `Seller #${message.receiver_id}`
                    }
                  </div>
                  <div className="subject" title={message.message}>
                    {message.message?.length > 50 ? `${message.message.substring(0, 50)}...` : message.message || 'No message'}
                  </div>
                  <div className="date">{formatDate(message.sent_at || message.createdAt)}</div>
                  <div className={`status ${activeTab === 'inbox' && isMessageUnread(message) ? 'unread' : 'read'}`}>
                    {activeTab === 'inbox' 
                      ? (isMessageUnread(message) ? 'Unread' : 'Read')
                      : 'Sent'
                    }
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
                <p><strong>From:</strong> {activeTab === 'inbox' 
                  ? (selectedMessage.fullname || selectedMessage.sender_username || `User #${selectedMessage.sender_id}`)
                  : "You"
                }</p>
                <p><strong>To:</strong> {activeTab === 'sent'
                  ? (selectedMessage.fullname || selectedMessage.sender_username || `Seller #${selectedMessage.receiver_id}`)
                  : "You"
                }</p>
                <p><strong>Date:</strong> {new Date(selectedMessage.sent_at || selectedMessage.createdAt).toLocaleString()}</p>
              </div>
              <div className="message-actions">
                {activeTab === 'inbox' && (
                  <button className="reply-btn" onClick={() => {
                    setNewMessage({ ...newMessage, message: `Re: ${selectedMessage.message}\n\n` });
                    setShowSendModal(true);
                    setSelectedMessage(null);
                  }}>
                    💬 Reply
                  </button>
                )}
                <button className="close-btn" onClick={() => setSelectedMessage(null)}>
                  ❌ Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerMessages;