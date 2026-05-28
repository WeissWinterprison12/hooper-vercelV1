// utils/profileSync.js
let profileCache = null;
let cacheTimeout = null;

export const syncProfile = async (setAdminProfile, setEditedName, userId) => {
  // ✅ CACHE - NO REPEATED CALLS
  if (profileCache && Date.now() - profileCache.timestamp < 30000) {
    setAdminProfile(profileCache.data);
    setEditedName(profileCache.data.name);
    return;
  }

  try {
    const response = await fetch(`http://localhost/hooper_fits_api/get_profile.php?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      const avatarFilename = data.profile_image ? data.profile_image.split('/').pop() : null;
      const profileData = {
        name: data.name || "",
        avatar: avatarFilename
      };
      
      profileCache = { data: profileData, timestamp: Date.now() };
      clearTimeout(cacheTimeout);
      cacheTimeout = setTimeout(() => profileCache = null, 30000);
      
      setAdminProfile(profileData);
      setEditedName(data.name || "");
    }
  } catch (err) {
    console.error("Profile sync failed:", err);
  }
};

export const getDisplayAvatar = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `http://localhost/hooper_fits_api/uploads/profiles/${avatar}`;
};

export const revokePreviewUrls = (previewImage) => {
  if (previewImage) URL.revokeObjectURL(previewImage);
};