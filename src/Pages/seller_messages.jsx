import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../components/seller_messages.css';

const SellerMessages = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    avatar: null
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fileInputRef = useRef(null);

  // ✅ FIXED: Fetch real messages from API
  const fetchMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);
      const response = await fetch("http://localhost/hooper_fits_api/get_seller_messages.php");
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Fetched messages:', result.messages);
        setMessages(result.messages || []);
      } else {
        console.error('❌ No messages found:', result.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('💥 Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ✅ FIXED: Robust authentication with session verification
  useEffect(() => {
    const checkAuth = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 Auth check - LocalStorage user:', user);
      
      // Check if user exists and has user_id
      if (!user || !user.user_id) {
        console.log('❌ No valid user in localStorage');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      // ✅ Verify user role (seller/admin only)
      if (user.role !== 'seller' && user.role !== 'admin') {
        console.log('❌ User is not seller/admin:', user.role);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      try {
        // ✅ Double-check with API session verification
        const response = await fetch(`http://localhost/hooper_fits_api/verify_session.php?user_id=${user.user_id}`);
        const data = await response.json();
        
        if (!data.valid) {
          console.log('❌ Session invalid from API:', data.error);
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        console.log('✅ Session valid - User:', data.user);
        setCurrentUser(user);
        fetchProfile(user.user_id);
        fetchMessages();
      } catch (err) {
        console.error('❌ Session check failed, using localStorage fallback:', err);
        // Fallback to localStorage if API fails (offline mode)
        setCurrentUser(user);
        fetchProfile(user.user_id);
        fetchMessages();
      }
    };

    checkAuth();
  }, []);

  // ✅ Format date for display
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

  // ✅ Check if message is unread
  const isMessageUnread = (message) => {
    return !message.is_read || message.status === 'unread';
  };

  const getDisplayAvatar = useCallback(() => {
    if (previewImage) return previewImage;
    if (!adminProfile.avatar) return null;
    
    if (adminProfile.avatar.startsWith('http')) {
      return adminProfile.avatar;
    }
    
    const fullUrl = `http://localhost/hooper_fits_api/uploads/profiles/${adminProfile.avatar}`;
    return fullUrl;
  }, [previewImage, adminProfile.avatar]);

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost/hooper_fits_api/get_profile.php?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.success) {
        const avatarFilename = data.profile_image ? data.profile_image.split('/').pop() : null;
        
        const profileData = {
          name: data.name || "",
          avatar: avatarFilename
        };
        
        setAdminProfile(profileData);
        setEditedName(data.name || "");
        
        const updatedUser = {
          ...currentUser,
          name: profileData.name,
          profile_image: profileData.avatar
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Profile error:", err);
    }
  };

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

  // ✅ FIXED: Proper logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    
    fetch('http://localhost/hooper_fits_api/logout.php', { 
      method: 'POST',
      credentials: 'include' 
    }).catch(err => console.log('Logout API failed:', err));
    
    window.location.href = '/login';
  };

  const uploadImage = async () => {
    if (!selectedFile || !currentUser) return false;

    const userId = currentUser.user_id || currentUser.id;
    const formData = new FormData();
    formData.append("profile_image", selectedFile);
    formData.append("user_id", userId);

    try {
      const response = await fetch("http://localhost/hooper_fits_api/update_profile.php", {
        method: "POST",
        body: formData
      });
      
      const result = JSON.parse(await response.text());

      if (result.success && result.image) {
        const filename = result.image.split('/').pop();
        
        setAdminProfile(prev => ({
          ...prev,
          avatar: filename
        }));

        const updatedUser = {
          ...currentUser,
          profile_image: filename
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setSelectedFile(null);
        setPreviewImage(null);
        return true;
      } else {
        alert(`Upload failed: ${result.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert("Upload error");
      return false;
    }
  };

  const updateProfileName = async () => {
    if (!currentUser) return false;

    const userId = currentUser.user_id || currentUser.id;

    try {
      const response = await fetch("http://localhost/hooper_fits_api/update_profile_name.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: editedName.trim()
        })
      });
      
      const result = await response.json();

      if (result.success) {
        setAdminProfile(prev => ({ 
          ...prev, 
          name: editedName.trim() 
        }));

        const updatedUser = {
          ...currentUser,
          name: editedName.trim()
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        return true;
      } else {
        alert(`Name update failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Name update error:', error);
      alert("Name update error");
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
  }, [editedName, adminProfile.name, selectedFile, currentUser]);

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

  // ✅ FIXED: Mark message as read and show details
  const handleMessageClick = async (message) => {
    console.log('💬 Message clicked:', message);
    
    // Mark as read
    try {
      await fetch("http://localhost/hooper_fits_api/mark_message_read.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: message.id,
          seller_id: currentUser?.user_id || currentUser?.id
        })
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
    
    setSelectedMessage(message);
  };

  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="seller-messages-app">
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile}>×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {previewImage ? (
                <img src={previewImage} alt="Preview" style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}} />
              ) : getDisplayAvatar() ? (
                <img src={getDisplayAvatar()} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}} />
              ) : (
                <div className="no-image-placeholder">
                  <span>👤</span>
                  <p>Click to add profile image</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              {!previewImage && !getDisplayAvatar() && <div className="image-overlay">Click to upload</div>}
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
              />
            </div>

            <button className="get-image-btn" onClick={handleSaveProfile}>💾 Save Changes</button>
            <button className="cancel-btn" onClick={handleCancelProfile}>❌ Cancel</button>
          </div>
        </div>
      )}

      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)}>
            {getDisplayAvatar() ? (
              <img 
                src={getDisplayAvatar()}
                alt="Profile"
                style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
              />
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{adminProfile.name || currentUser?.name || "Loading..."}</p>
        </div>
        <ul>
          <li><a href="/seller_dashboard">📊 Dashboard</a></li>
          <li><a href="/seller_product">📦 Products</a></li>
          <li><a href="/seller_settings">⚙️ Settings</a></li>
          <li><a href="/seller_orders">📋 Orders</a></li>
          <li><a className="active" href="/seller_messages">💬 Messages</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={logout}>🚪 Logout</a></li>
        </ul>
      </div>

      <div className="main">
        <div className="top-bar">
          <h1>Messages ({messages.length})</h1>
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
                  key={message.id} 
                  className={`table-row ${isMessageUnread(message) ? 'unread-row' : ''}`}
                  onClick={() => handleMessageClick(message)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sender">
                    {message.fullname || message.sender_username || `User #${message.sender_id}`}
                  </div>
                  <div className="subject" title={message.message}>
                    {message.message?.length > 50 
                      ? `${message.message.substring(0, 50)}...` 
                      : message.message || 'No message'
                    }
                  </div>
                  <div className="date">{formatDate(message.created_at)}</div>
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
                <p><strong>👤 From:</strong> {selectedMessage.fullname || selectedMessage.sender_username || `User #${selectedMessage.sender_id}`}</p>
                <p><strong>📧 Email:</strong> {selectedMessage.email}</p>
                <p><strong>📅 Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
              <div className="message-actions">
                <button className="reply-btn">💬 Reply</button>
                <button className="delete-btn">🗑️ Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;