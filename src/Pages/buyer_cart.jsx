// buyer_cart.jsx - UPDATED TO MATCH BACKEND
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";
import "../components/buyer_dashboard.css";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const BuyerCart = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null); // Changed from buyerId to userId
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [processing, setProcessing] = useState(false);

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

        setUserId(session.id); // Set userId from session
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
          userId: userId // Changed from buyerId to userId
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
        body: JSON.stringify({ userId: userId }) // Changed from buyerId to userId
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
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" title="Profile">
             <img src={defaultAvatar} alt="User" />
          </div>
          <p className="profile-name">My Cart</p>
          <p className="profile-username">Shopping</p>
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