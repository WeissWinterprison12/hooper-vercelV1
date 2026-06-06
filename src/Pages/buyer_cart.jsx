// buyer_cart.jsx - UPDATED WITH PROFILE EDIT FUNCTIONALITY
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_dashboard.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerCart = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Profile Modal Refs & State
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    avatar: defaultAvatar
  });

  // --- AUTH CHECK ---
  useEffect(() => {
    const initializeCart = async () => {
      try {
        const sessionStr = localStorage.getItem("buyer_session");
        if (!sessionStr) {
          navigate("/login");
          return;
        }

        const session = JSON.parse(sessionStr);
        if (session.role !== "buyer" || !session.id) {
          navigate("/login");
          return;
        }

        setUserId(session.id);
        await fetchProfile(session.id);
        await fetchCartItems(session.id);
      } catch (error) {
        console.error("❌ Auth error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [navigate]);

  // --- FETCH PROFILE FROM MONGODB ---
  const fetchProfile = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      
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
        fullName: data.fullName || data.username || "",
        username: data.username || "",
        avatar: avatarUrl
      });
      setEditedName(data.fullName || data.username || "");
      
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setProfile({ fullName: "", username: "", avatar: defaultAvatar });
    }
  };

  // --- FETCH CART ITEMS ---
  const fetchCartItems = async (id) => {
    try {
      setLoading(true);
      console.log("📡 Fetching cart for user:", id);
      
      const response = await fetch(`${BACKEND_URL}/api/cart/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      console.log("📡 Cart response:", data);

      // Handle the response structure from backend
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setCartItems(data.items);
        calculateTotal(data.items);
      } else {
        setCartItems([]);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATE TOTAL ---
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      // Handle nested product_id structure
      const price = Number(item.product_id?.price || item.price || 0);
      const qty = Number(item.quantity || 0);
      return sum + (price * qty);
    }, 0);
    setTotalPrice(total);
  };

  // --- UPDATE QUANTITY ---
  const handleQuantityChange = useCallback(async (itemId, newQuantity, currentQty) => {
    if (newQuantity < 1) return;
    if (processing) return;

    // Optimistic UI Update
    const updatedItems = cartItems.map(item => 
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    calculateTotal(updatedItems);

    try {
      setProcessing(true);
      const response = await fetch(`${BACKEND_URL}/api/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          itemId: itemId, 
          quantity: newQuantity,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }
      
      const data = await response.json();
      if (!data.success) {
        console.error("Backend error updating qty:", data.message);
        // Revert on error
        const revertedItems = cartItems.map(item => 
          item._id === itemId ? { ...item, quantity: currentQty } : item
        );
        setCartItems(revertedItems);
        calculateTotal(revertedItems);
      }
    } catch (error) {
      console.error("❌ Error updating qty:", error);
      alert("Failed to update quantity. Please try again.");
      // Revert state on error
      const revertedItems = cartItems.map(item => 
        item._id === itemId ? { ...item, quantity: currentQty } : item
      );
      setCartItems(revertedItems);
      calculateTotal(revertedItems);
    } finally {
      setProcessing(false);
    }
  }, [cartItems, userId, processing]);

  // --- REMOVE ITEM ---
  const handleRemoveItem = useCallback(async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) return;
    if (processing) return;

    try {
      setProcessing(true);
      const response = await fetch(`${BACKEND_URL}/api/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId })
      });

      if (response.ok) {
        const newItems = cartItems.filter(item => item._id !== itemId);
        setCartItems(newItems);
        calculateTotal(newItems);
      } else {
        throw new Error("Failed to remove");
      }
    } catch (error) {
      console.error("❌ Error removing item:", error);
      alert("Failed to remove item. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [cartItems, userId, processing]);

  // --- CHECKOUT HANDLER ---
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate("/checkout");
  };

  // --- HANDLE IMAGE ERROR HELPER ---
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://via.placeholder.com/150?text=No+Image";
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    logout();
    localStorage.removeItem("buyer_session");
    navigate("/login");
  };

  // --- FILE SELECT ---
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

  // --- CANCEL PROFILE EDIT ---
  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(profile.fullName || profile.username || "");
  }, [profile.fullName, profile.username]);

  // --- SAVE PROFILE ---
  const handleSaveProfile = useCallback(async () => {
    if (!userId) {
      alert("No user ID found. Please login again.");
      return;
    }

    const newName = editedName && editedName.trim() ? editedName.trim() : profile.fullName || profile.username;

    if (!newName) {
      alert("Please enter a name.");
      return;
    }

    console.log("📡 Saving profile...", { userId, newName });

    try {
      setUploading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
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

      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append("profile_image", selectedFile);

        const imageResponse = await fetch(`${BACKEND_URL}/api/users/${userId}/image`, {
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
      
      await fetchProfile(userId);
      
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
  }, [userId, editedName, profile, selectedFile]);

  const handleNameChange = useCallback((e) => {
    setEditedName(e.target.value);
  }, []);

  const handleAvatarError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
  }, []);

  const getDisplayAvatar = useCallback(() => {
    return previewImage || profile.avatar || defaultAvatar;
  }, [previewImage, profile.avatar]);

  const getDisplayName = () => {
    return editedName || profile.fullName || profile.username || "Buyer";
  };

  const getDisplayUsername = () => {
    return profile.username || "@user";
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: '15px', zIndex: 9999
      }}>
        <span style={{ color: '#333', fontSize: '18px', fontWeight: '500' }}>Loading Cart...</span>
        <div style={{
          width: '30px', height: '30px', border: '4px solid #f3f3f3',
          borderTop: '4px solid #dc3545', borderRadius: '50%', animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
              {(previewImage || profile.avatar) ? (
                <img 
                  src={previewImage || profile.avatar} 
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
          <p className="profile-name">{getDisplayName()}</p>
          <p className="profile-username">@{getDisplayUsername()}</p>
        </div>
        
        <ul>
          <li><a href="/buyer_dashboard">📊 Dashboard</a></li>
          <li><a href="/buyer_orders">📦 Orders</a></li>
          <li><a href="#" className="active">🛒 Cart</a></li>
          <li><a href="/buyer_messages">💬 Messages</a></li>
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

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="top-bar">
            <h1>Shopping Cart</h1>
            <span style={{ color: '#666', fontSize: '14px' }}>
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
            </span>
        </div>

        <div className="cart-container">
            {cartItems.length > 0 ? (
                <div className="cart-layout">
                    {/* CART ITEMS LIST */}
                    <div className="cart-items-list">
                        <table className="cart-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:'left'}}>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                                <img 
                                                    src={item.product_id?.image || item.image || "https://via.placeholder.com/60"} 
                                                    alt="Product"
                                                    style={{width:'60px', height:'60px', borderRadius:'8px', objectFit:'cover', border:'1px solid #eee'}}
                                                    onError={handleImageError}
                                                />
                                                <div>
                                                    <h4 style={{margin:'0 0 5px 0', fontSize:'14px', fontWeight:'600'}}>
                                                        {item.product_id?.product_name || item.product_name || "Unknown Product"}
                                                    </h4>
                                                    <p style={{margin:0, fontSize:'12px', color:'#888'}}>
                                                        {item.product_id?.size ? `Size: ${item.product_id.size}` : ''} {item.product_id?.color ? ` | Color: ${item.product_id.color}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{textAlign:'center'}}>
                                            ₱{Number(item.product_id?.price || item.price || 0).toLocaleString()}
                                        </td>
                                        <td>
                                            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                                                <button 
                                                    onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.quantity)}
                                                    disabled={processing || item.quantity <= 1}
                                                    style={{width:'28px', height:'28px', borderRadius:'50%', border:'1px solid #ddd', background:'#fff', cursor:'pointer'}}
                                                >
                                                    -
                                                </button>
                                                <span style={{fontWeight:'600', minWidth:'20px', textAlign:'center'}}>{item.quantity}</span>
                                                <button 
                                                    onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.quantity)}
                                                    disabled={processing}
                                                    style={{width:'28px', height:'28px', borderRadius:'50%', border:'1px solid #ddd', background:'#fff', cursor:'pointer'}}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{textAlign:'center', fontWeight:'bold', color:'#dc3545'}}>
                                            ₱{((item.product_id?.price || item.price || 0) * item.quantity).toLocaleString()}
                                        </td>
                                        <td style={{textAlign:'center'}}>
                                            <button 
                                                onClick={() => handleRemoveItem(item._id)}
                                                disabled={processing}
                                                title="Remove Item"
                                                style={{background:'transparent', border:'none', color:'#dc3545', cursor:'pointer', fontSize:'18px'}}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* CART SUMMARY */}
                    <div className="cart-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₱{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>₱{totalPrice.toLocaleString()}</span>
                        </div>
                        
                        <button 
                            className="checkout-btn" 
                            onClick={handleCheckout}
                            disabled={processing}
                        >
                            {processing ? "Processing..." : "Proceed to Checkout"}
                        </button>

                        <button 
                            className="continue-shopping-btn" 
                            onClick={() => navigate('/buyer_shop')}
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            ) : (
                <div className="empty-cart">
                    <div style={{fontSize:'60px'}}>🛒</div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <button onClick={() => navigate('/buyer_shop')}>Start Shopping</button>
                </div>
            )}
        </div>
      </div>
      
      <style>{`
        .cart-container {
            background: #fff;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
            border: 1px solid rgba(220, 53, 69, 0.1);
            min-height: 60vh;
        }
        
        .cart-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }

        @media (max-width: 768px) {
            .cart-layout {
                grid-template-columns: 1fr;
            }
        }

        .cart-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 15px;
        }

        .cart-table th {
            text-align: left;
            color: #666;
            font-weight: 600;
            padding: 10px 15px;
            border-bottom: 2px solid #eee;
        }

        .cart-table tbody tr {
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
        }
        
        .cart-table tbody tr:hover {
            transform: translateY(-2px);
        }

        .cart-table td {
            padding: 15px;
            background: #fff;
            border-top: 1px solid #f5f5f5;
            border-bottom: 1px solid #f5f5f5;
        }
        
        .cart-table td:first-child {
            border-left: 1px solid #f5f5f5;
            border-radius: 8px 0 0 8px;
        }
        
        .cart-table td:last-child {
            border-right: 1px solid #f5f5f5;
            border-radius: 0 8px 8px 0;
        }

        .cart-summary {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 30px;
            border-radius: 16px;
            height: fit-content;
            position: sticky;
            top: 20px;
            border: 1px solid rgba(220, 53, 69, 0.1);
            margin-bottom: 20px;
            color: #1a1a1a;
            font-weight: 700;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
        }

        .summary-row.total {
            font-size: 20px;
            font-weight: 700;
            color: #dc3545;
            margin-top: 15px;
        }

        .summary-divider {
            height: 1px;
            background: #dee2e6;
            margin: 15px 0;
        }

        .checkout-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #dc3545, #b02a37);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
            box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
        }

        .checkout-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.4);
        }

        .checkout-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            box-shadow: none;
        }

        .continue-shopping-btn {
            width: 100%;
            padding: 14px;
            background: transparent;
            color: #666;
            border: 2px solid #dee2e6;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .continue-shopping-btn:hover {
            background: #f8f9fa;
            border-color: #adb5bd;
        }

        /* Empty Cart State */
        .empty-cart {
            text-align: center;
            padding: 60px 20px;
        }

        .empty-cart h2 {
            margin: 20px 0 10px 0;
            color: #1a1a1a;
        }

        .empty-cart p {
            color: #666;
            margin-bottom: 30px;
        }

        .empty-cart button {
            padding: 14px 30px;
            background: linear-gradient(135deg, #dc3545, #b02a37);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
        }

        .empty-cart button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.4);
        }
      `}</style>
    </div>
  );
};

export default BuyerCart;