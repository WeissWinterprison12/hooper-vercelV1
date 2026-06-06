import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import "../components/seller_product.css";
import logo from "../Images/HoopersFits.png";
import defaultAvatar from "../Images/Man.png";

const BACKEND_URL = "https://hooper-renderv1-4.onrender.com";

const SellerProduct = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    avatar: defaultAvatar
  });
  
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [newProduct, setNewProduct] = useState({ product_name: '', description: '', category: '', price: '', stock: '' });
  const [newProductPrice, setNewProductPrice] = useState('0.00');
  const [newProductPriceDisplay, setNewProductPriceDisplay] = useState('0.00');
  const [newProductPreview, setNewProductPreview] = useState(null);
  const [newProductHasImage, setNewProductHasImage] = useState(false);
  
  const [editProduct, setEditProduct] = useState({ id: '', product_name: '', description: '', category: '', price: '', stock: '', image: '' });
  const [editProductPrice, setEditProductPrice] = useState('0.00');
  const [editProductPriceDisplay, setEditProductPriceDisplay] = useState('0.00');
  const [editProductPreview, setEditProductPreview] = useState(null);
  const [editProductHasImage, setEditProductHasImage] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    document.title = "Products - Hooper Fits";
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

        const id = session.id;
        setSellerId(id);
        
        await fetchProfile(id);
        await fetchProducts(id);
        
      } catch (error) {
        console.error("❌ Auth error:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    logout();
    navigate("/login");
  };

  // ✅ FETCH PROFILE FROM MONGODB
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

  const fetchProducts = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/seller/${id}`);
      const result = await response.json();
      
      console.log("📡 Products:", result);
      
      if (result.success) {
        setProducts(result.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setProducts([]);
    }
  };

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    
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
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleCancelProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedFile(null);
    setPreviewImage(null);
    setEditedName(profile.fullName || profile.username || "");
  }, [profile.fullName, profile.username]);

  const handleSaveProfile = useCallback(async () => {
    if (!sellerId) {
      alert("No user ID found. Please login again.");
      return;
    }

    const newName = editedName && editedName.trim() ? editedName.trim() : profile.fullName || profile.username;

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
  }, [sellerId, editedName, profile, selectedFile]);

  // ✅ PRODUCT FUNCTIONS
  const handleProductFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProductPreview(URL.createObjectURL(file));
      setNewProductHasImage(true);
    }
  };

  const handleEditProductFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditProductPreview(URL.createObjectURL(file));
      setEditProductHasImage(true);
    }
  };

  const handlePriceInput = (inputValue, setPriceState, setDisplayState) => {
    const input = inputValue.replace(/[^0-9]/g, '');
    if (input === '') {
      setPriceState('0.00');
      if (setDisplayState) setDisplayState('0.00');
      return;
    }

    let newPrice;
    if (input.length === 1) {
      newPrice = `0.0${input}`;
    } else if (input.length === 2) {
      newPrice = `0.${input}`;
    } else {
      const dollars = input.slice(0, -2);
      const cents = input.slice(-2);
      newPrice = dollars ? `${dollars}.${cents}` : `0.${cents}`;
    }

    const formattedPrice = parseFloat(newPrice).toFixed(2);
    setPriceState(formattedPrice);
    if (setDisplayState) setDisplayState(formattedPrice);
  };

  const handleNumberChange = (value, min = 1) => {
    const numValue = parseFloat(value) || 0;
    return Math.max(min, numValue).toString();
  };

  const showSuccessModalFunc = (message) => {
    setNotificationMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2500);
  };

  const showErrorModalFunc = (message) => {
    setNotificationMessage(message);
    setShowErrorModal(true);
    setTimeout(() => setShowErrorModal(false), 3500);
  };

  const handleAddProduct = async () => {
    if (!newProduct.product_name?.trim()) {
      showErrorModalFunc("❌ Product name is required");
      return;
    }
    if (!newProductPrice || parseFloat(newProductPrice) <= 0) {
      showErrorModalFunc("❌ Price must be greater than 0");
      return;
    }
    const stockValue = parseInt(newProduct.stock) || 0;
    if (!newProduct.stock || stockValue <= 0) {
      showErrorModalFunc("❌ Stock must be greater than 0");
      return;
    }

    const formData = new FormData();
    formData.append('seller_id', sellerId);
    formData.append('product_name', newProduct.product_name);
    formData.append('description', newProduct.description);
    formData.append('category', newProduct.category || 'general');
    formData.append('price', newProductPrice);
    formData.append('stock', newProduct.stock);
    
    const fileInput = document.getElementById('product-image');
    if (fileInput?.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    for (let pair of formData.entries()) {
      console.log("📤 FormData:", pair[0], pair[1]);
    }

    try {
      setLoading(true);
      
      console.log("📤 Sending to:", `${BACKEND_URL}/api/products`);
      
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      console.log("📥 Response:", result);
      
      if (result.success && result.product) {
        closeAddProductModal();
        await fetchProducts(sellerId);
        showSuccessModalFunc('✅ Product added!');
      } else {
        showErrorModalFunc(`❌ ${result.message || "Failed to add product"}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      showErrorModalFunc('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditProduct({
      id: product._id || product.id,
      product_name: product.product_name || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price || '',
      stock: product.stock || '',
      image: product.image || ''
    });
    
    const priceStr = (product.price || '0').toString();
    setEditProductPrice(priceStr);
    setEditProductPriceDisplay(priceStr); 
    
    let imageUrl = null;
    if (product.image) {
      if (product.image.startsWith("http")) {
        imageUrl = product.image;
      } else {
        imageUrl = `${BACKEND_URL}${product.image}`;
      }
    }
    setEditProductPreview(imageUrl);
    setEditProductHasImage(!!imageUrl);
    
    setShowEditProductModal(true);
  };

  const handleEditProduct = async () => {
    if (!editProduct.product_name?.trim()) {
      showErrorModalFunc("❌ Product name is required");
      return;
    }
    if (!editProductPrice || parseFloat(editProductPrice) <= 0) {
      showErrorModalFunc("❌ Price must be greater than 0");
      return;
    }
    const stockValue = parseInt(editProduct.stock) || 0;
    if (!editProduct.stock || stockValue <= 0) {
      showErrorModalFunc("❌ Stock must be greater than 0");
      return;
    }

    const formData = new FormData();
          formData.append('product_name', editProduct.product_name);
    formData.append('description', editProduct.description);
    formData.append('category', editProduct.category || 'general');
    formData.append('price', editProductPrice);
    formData.append('stock', editProduct.stock);
    
    const fileInput = document.getElementById('edit-product-image');
    if (fileInput?.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/products/${editProduct.id}`, {
        method: "PUT",
        body: formData
      });
      const result = await response.json();
      
      if (result.success && result.product) {
        closeEditProductModal();
        fetchProducts(sellerId);
        showSuccessModalFunc('✅ Product updated!');
      } else {
        showErrorModalFunc(`❌ ${result.message || "Failed to update product"}`);
      }
    } catch (error) {
      showErrorModalFunc('❌ Network error');
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !sellerId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/${productToDelete._id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success || result.message?.includes("deleted")) {
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productToDelete._id));
        setShowDeleteModal(false);
        setProductToDelete(null);
        showSuccessModalFunc('✅ Product deleted!');
      } else {
        showErrorModalFunc(`❌ ${result.message || "Failed to delete"}`);
      }
    } catch (error) {
      showErrorModalFunc('❌ Network error');
    }
  };

  const getStatusBadge = (stock) => {
    if (!stock) stock = 0;
    if (stock === 0) return { class: 'out-of-stock', text: 'Out of Stock' };
    if (stock <= 5) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'active', text: 'Active' };
  };

  const closeAddProductModal = () => {
    setShowAddProductModal(false);
    setNewProduct({ product_name: '', description: '', category: '', price: '', stock: '' });
    setNewProductPrice('0.00');
    setNewProductPriceDisplay('0.00');
    setNewProductPreview(null);
    setNewProductHasImage(false);
  };

  const closeEditProductModal = () => {
    setShowEditProductModal(false);
    setEditProduct({ id: '', product_name: '', description: '', category: '', price: '', stock: '', image: '' });
    setEditProductPrice('0.00');
    setEditProductPriceDisplay('0.00');
    setEditProductPreview(null);
    setEditProductHasImage(false);
  };

  // Handle avatar error
  const handleAvatarError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultAvatar;
  };

  // Display avatar
  const displayAvatar = previewImage || profile.avatar || defaultAvatar;

  // ✅ PAGINATION - SORT TO SHOW OUT OF STOCK FIRST
  const sortedProducts = [...products].sort((a, b) => {
    const stockA = parseInt(a.stock || 0);
    const stockB = parseInt(b.stock || 0);
    
    // Out of stock (0) first
    if (stockA === 0 && stockB > 0) return -1;
    if (stockB === 0 && stockA > 0) return 1;
    
    // Low stock (1-5) second
    if (stockA <= 5 && stockA > 0 && stockB > 5) return -1;
    if (stockB <= 5 && stockB > 0 && stockA > 5) return 1;
    
    // Then by newest (by _id which is timestamp-based)
    if (b._id > a._id) return 1;
    if (b._id < a._id) return -1;
    
    return 0;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // ✅ LOADING SCREEN
  if (loading || !sellerId) {
    return (
      <div className="seller-product-app" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000', color: '#fff'}}>
        <div>⏳ Loading your products...</div>
      </div>
    );
  }

  return (
    <div className="seller-product-app">
      {/* ✅ PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal" onClick={handleCancelProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCancelProfile}>×</button>
            
            <div className="modal-image-upload" onClick={openFileExplorer}>
              {previewImage || profile.avatar ? (
                <img src={previewImage || profile.avatar} alt="Preview" onError={handleAvatarError} />
              ) : (
                <div className="question-mark-avatar">?</div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>

            <h2 className="modal-title">Update Profile</h2>
            <p className="modal-subtitle">Click avatar to change profile image</p>

            <div className="profile-name-input-container">
              <label className="profile-label">Profile Name</label>
              <input 
                className="profile-name-input"
                type="text" 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)} 
                placeholder="Enter your name"
              />
            </div>

            <button className="get-image-btn" onClick={handleSaveProfile} disabled={uploading}>
              {uploading ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <button className="cancel-btn" onClick={handleCancelProfile}>Cancel</button>
          </div>
        </div>
      )}

      {/* ✅ ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="add-product-modal" onClick={closeAddProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeAddProductModal}>×</button>
            
            <div className="modal-image-upload" onClick={() => document.getElementById('product-image').click()}>
              {newProductPreview ? (
                <img src={newProductPreview} alt="Product Preview" />
              ) : (
                <div className="no-image-placeholder">
                  <span>📸</span>
                  <p>Click to upload image</p>
                </div>
              )}
              <input id="product-image" type="file" accept="image/*" onChange={handleProductFileSelect} style={{ display: 'none' }} />
            </div>

            <h2 className="modal-title">Add New Product</h2>
            <p className="modal-subtitle">Fill in details <span className="required-note">* All fields required</span></p>

            <div className="product-form-group">
              <label>Product Name <span className="required">*</span></label>
              <input type="text" value={newProduct.product_name} onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})} placeholder="Enter product name" />
            </div>

            <div className="product-form-group">
              <label>Description</label>
              <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="Enter description" rows="3" />
            </div>

            <div className="product-form-row">
              <div className="product-form-group">
                <label>Price (₱) <span className="required">*</span></label>
                <input type="text" value={newProductPriceDisplay} onChange={(e) => handlePriceInput(e.target.value, setNewProductPrice, setNewProductPriceDisplay)} placeholder="0.00" />
              </div>
              <div className="product-form-group">
                <label>Stock <span className="required">*</span></label>
                <input type="number" min="1" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: handleNumberChange(e.target.value, 1)})} placeholder="1" />
              </div>
            </div>

            <button className="get-image-btn" onClick={handleAddProduct}>➕ Add Product</button>
            <button className="cancel-btn" onClick={closeAddProductModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* ✅ EDIT PRODUCT MODAL */}
      {showEditProductModal && (
        <div className="add-product-modal" onClick={closeEditProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeEditProductModal}>×</button>
            
            <div className="modal-image-upload" onClick={() => document.getElementById('edit-product-image').click()}>
              {editProductPreview ? (
                <img src={editProductPreview} alt="Product Preview" onError={(e) => e.target.style.display = 'none'} />
              ) : (
                <div className="no-image-placeholder">
                  <span>📸</span>
                  <p>Click to add image</p>
                </div>
              )}
              <input id="edit-product-image" type="file" accept="image/*" onChange={handleEditProductFileSelect} style={{ display: 'none' }} />
            </div>

            <h2 className="modal-title">Edit Product</h2>

            <div className="product-form-group">
              <label>Product Name *</label>
              <input type="text" value={editProduct.product_name} onChange={(e) => setEditProduct({...editProduct, product_name: e.target.value})} placeholder="Product name" />
            </div>

            <div className="product-form-group">
              <label>Description</label>
              <textarea value={editProduct.description} onChange={(e) => setEditProduct({...editProduct, description: e.target.value})} rows="3" />
            </div>

            <div className="product-form-row">
              <div className="product-form-group">
                <label>Price (₱) *</label>
                <input type="text" value={editProductPriceDisplay} onChange={(e) => handlePriceInput(e.target.value, setEditProductPrice, setEditProductPriceDisplay)} placeholder="0.00" />
              </div>
              <div className="product-form-group">
                <label>Stock *</label>
                <input type="number" min="1" value={editProduct.stock} onChange={(e) => setEditProduct({...editProduct, stock: handleNumberChange(e.target.value, 1)})} />
              </div>
            </div>

            <button className="get-image-btn" onClick={handleEditProduct}>Update Product</button>
            <button className="cancel-btn" onClick={closeEditProductModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* ✅ SIDEBAR */}
      <div className="sidebar">
        <div className="admin-profile">
          <div className="profile-avatar" onClick={() => setShowProfileModal(true)}>
            {displayAvatar && displayAvatar !== defaultAvatar ? (
              <img src={displayAvatar} alt="Profile" onError={handleAvatarError} />
            ) : (
              <div className="question-mark-avatar">?</div>
            )}
          </div>
          <p className="profile-name">{profile.fullName || profile.username || "Set your name"}</p>
        </div>
        
        <ul>
          <li><a href="/seller_dashboard">📊 Dashboard</a></li>
          <li><a href="/seller_product" className="active">📦 Products</a></li>
          <li><a href="/seller_orders">📋 Orders</a></li>
          <li><a href="/seller_messages">💬 Messages</a></li>
          <br /><br /><br />
          <li><a href="#" onClick={handleLogout}>🚪 Logout</a></li>
        </ul>

        <div className="sidebar-logo">
          <img src={logo} alt="Hoopers Fits" />
        </div>
      </div>

      {/* ✅ MAIN CONTENT */}
      <div className="main">
        <div className="top-bar">
          <h1>📦 Product Management</h1>
          <button className="add-product" onClick={() => setShowAddProductModal(true)}>➕ Add New Product</button>
        </div>

        <div className="top-stats">
          <div className="stat-card">
            <h3>{products.filter(p => (p.stock || 0) > 5).length}</h3>
            <p>Active Items</p>
          </div>
          <div className="stat-card">
            <h3>{products.filter(p => (p.stock || 0) === 0).length}</h3>
            <p>Out of Stock</p>
          </div>
          <div className="stat-card">
            <h3>{products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length}</h3>
            <p>Low Stock</p>
          </div>
        </div>

        <div className="inventory-table">
          <h4>📋 Inventory</h4>
          {products.length === 0 ? (
            <div className="empty-state">
              <div>📦</div>
              <h3>No products yet</h3>
              <p>Add your first product!</p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product, index) => {
                    const badge = getStatusBadge(product.stock);
                    return (
                      <tr key={product._id || index}>
                        <td className="product-name-cell">{product.product_name}</td>
                        <td className="stock-cell">{product.stock || 0}</td>
                        <td className="price-cell">₱{parseFloat(product.price || 0).toLocaleString()}</td>
                        <td><span className={`status-badge ${badge.class}`}>{badge.text}</span></td>
                        <td className="actions">
                          <button onClick={() => handleEditClick(product)}>Edit</button>
                          <button className="delete" onClick={() => handleDeleteClick(product)}>🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>← Prev</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ DELETE MODAL */}
      {showDeleteModal && productToDelete && (
        <div className="delete-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowDeleteModal(false)}>×</button>
            <div className="delete-icon">🗑️</div>
            <h2>Delete Product?</h2>
            <p>Delete <strong>"{productToDelete.product_name}"</strong>?</p>
            <div className="delete-button-group">
              <button className="delete-confirm-btn" onClick={confirmDelete}>Yes, Delete</button>
              <button className="delete-cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NOTIFICATIONS */}
      {showSuccessModal && (
        <div className="notification-modal success">
          <div>✅</div>
          <div>{notificationMessage}</div>
        </div>
      )}

      {showErrorModal && (
        <div className="notification-modal error">
          <div>❌</div>
          <div>{notificationMessage}</div>
        </div>
      )}
    </div>
  );
};

export default SellerProduct;