import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../components/seller_settings.css';

const SellerSettings = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    avatar: null
  });

  const fileInputRef = useRef(null);

  const settingsOptions = [
    {
      title: "Store Profile",
      description: "Manage your store name, logo, and business information."
    },
    {
      title: "Store Information Card",
      description: "Set up how you receive and manage your earnings."
    },
    {
      title: "Shipping Options",
      description: "Choose courier partners, define shipping rates, and manage delivery time estimates."
    },
    {
      title: "Notifications & Alerts",
      description: "Control what updates and alerts you receive from your dashboard."
    },
    {
      title: "Security & Access",
      description: "Manage your account's safety and access settings."
    }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('🔍 LocalStorage user:', user);
    
    if (user && (user.user_id || user.id)) {
      const userId = user.user_id || user.id;
      setCurrentUser(user);
      fetchProfile(userId);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const getDisplayAvatar = useCallback(() => {
    if (previewImage) return previewImage;
    if (!adminProfile.avatar) return null;
    
    if (adminProfile.avatar.startsWith('http')) {
      return adminProfile.avatar;
    }
    
    const fullUrl = `http://localhost/hooper_fits_api/uploads/profiles/${adminProfile.avatar}`;
    console.log('🖼️ Avatar URL:', fullUrl);
    return fullUrl;
  }, [previewImage, adminProfile.avatar]);

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost/hooper_fits_api/get_profile.php?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Raw profile response:', text);
      
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

  // ✅ FIXED: Stable callback with useCallback
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('✅ File selected:', file.name);
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  }, []);

  // ✅ FIXED: Single click handler with useRef
  const openFileExplorer = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

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
      
      const text = await response.text();
      console.log('Raw upload response:', text);
      
      const result = JSON.parse(text);

      if (result.success && result.image) {
        const filename = result.image.split('/').pop();
        console.log('✅ NEW AVATAR FILENAME:', filename);
        
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
      console.error('💥 Upload error:', error);
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
      
      if (currentUser) {
        const userId = currentUser.user_id || currentUser.id;
        fetchProfile(userId);
      }
    }
  }, [editedName, adminProfile.name, selectedFile, currentUser]);

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  // ✅ FIXED: Stable input handler
  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  useEffect(() => {
    setEditedName(adminProfile.name);
  }, [adminProfile.name]);

  const handleSettingClick = (setting) => {
    alert(`${setting.title} clicked!`);
  };

  return (
    <div className="seller-settings-app">
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
            
            {/* ✅ FIXED: Single click handler + useRef */}
            <div 
              className="modal-image-upload" 
              onClick={openFileExplorer}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFileExplorer();
                }
              }}
            >
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Profile Preview"
                  style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}}
                />
              ) : getDisplayAvatar() ? (
                <img 
                  src={getDisplayAvatar()} 
                  alt="Current Profile"
                  style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}}
                />
              ) : (
                <div className="no-image-placeholder">
                  <span>👤</span>
                  <p>Click to add profile image</p>
                </div>
              )}
              {/* ✅ FIXED: Use useRef */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {!previewImage && !getDisplayAvatar() && (
                <div className="image-overlay">Click to upload</div>
              )}
            </div>

            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>
            
            <div className="profile-name-input-container">
              <label className="profile-label">Profile Name</label>
              {/* ✅ FIXED: Stable onChange */}
              <input 
                type="text" 
                value={editedName} 
                onChange={handleNameChange}
                className="profile-name-input"
                placeholder="Enter your name"
                autoComplete="off"
              />
            </div>

            {/* ✅ FIXED: Proper button handlers */}
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

      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)}>
            {getDisplayAvatar() ? (
              <img 
                src={getDisplayAvatar()}
                alt="Profile"
                style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
              />
            ) : null}
            <div className="question-mark-avatar" style={{display: getDisplayAvatar() ? 'none' : 'flex'}}>
              ?
            </div>
          </div>
          <p className="profile-name">{adminProfile.name || currentUser?.name || "Loading..."}</p>
        </div>
        <ul>
          <li><a href="/seller_dashboard">📊 Dashboard</a></li>
          <li><a href="/seller_product">📦 Products</a></li>
          <li><a className="active" href="/seller_settings">
          ⚙️ Settings</a></li>
          <li><a href="/seller_orders">📋 Orders</a></li>
          <li><a href="/seller_messages">💬 Messages</a></li>
          <br /><br /><br />
          <li><a href="/login">🚪 Logout</a></li>
        </ul>
      </div>

      <div className="main">
        <div className="top-bar">
          <h1>Settings</h1>
        </div>

        <div className="settings-container">
          <h2>⚙️ ACCOUNT SETTINGS</h2>
          <p>Manage your personal and store details.</p>

          <div className="settings-grid">
            {settingsOptions.map((setting, index) => (
              <div 
                key={index} 
                className="setting-option"
                onClick={() => handleSettingClick(setting)}
              >
                <h3>
                  {index === 0 && <span className="store-icon">🏪</span>}
                  {index === 1 && <span className="payment-icon">💳</span>}
                  {index === 2 && <span className="shipping-icon">🚚</span>}
                  {index === 3 && <span className="notification-icon">🔔</span>}
                  {index === 4 && <span className="security-icon">🔒</span>}
                  {setting.title}
                </h3>
                <p>{setting.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;