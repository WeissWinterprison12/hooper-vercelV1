// Add error handling to your existing hook
const fetchProfile = useCallback(async (userId) => {
  try {
    const response = await fetch(`http://localhost/hooper_fits_api/get_profile.php?user_id=${userId}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error("Profile fetch failed:", data.error);
      return; // Don't update state on auth failure
    }
    
    // ... rest of your existing logic
  } catch (err) {
    console.error("Profile fetch error:", err);
  }
}, []);