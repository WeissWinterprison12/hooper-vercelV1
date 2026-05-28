// AuthContext.jsx - UPDATED: With name & profile_image in session
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

const AuthContext = createContext(null);

// ✅ Custom Hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// ✅ Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // CHECK SESSION ON APP START
  // =====================================================
  useEffect(() => {
    try {
      const sellerSession = localStorage.getItem("seller_session");
      const buyerSession = localStorage.getItem("buyer_session");

      // ✅ Seller Session
      if (sellerSession) {
        const parsedSeller = JSON.parse(sellerSession);

        if (parsedSeller?.role === "seller") {
          setUser(parsedSeller);
          setLoading(false);
          return;
        }
      }

      // ✅ Buyer Session
      if (buyerSession) {
        const parsedBuyer = JSON.parse(buyerSession);

        if (parsedBuyer?.role === "buyer") {
          setUser(parsedBuyer);
          setLoading(false);
          return;
        }
      }

      // No valid session
      setUser(null);
    } catch (error) {
      console.error("❌ AuthContext Session Error:", error);

      localStorage.removeItem("seller_session");
      localStorage.removeItem("buyer_session");

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // LOGIN - NOW WITH NAME & PROFILE_IMAGE
  // =====================================================
  const login = (userData) => {
    try {
      const session = {
        id: userData.id,
        role: userData.role,
        name: userData.name || "",
        profile_image: userData.profile_image || null
      };

      // ✅ CLEAR OLD SESSIONS FIRST
      localStorage.removeItem("seller_session");
      localStorage.removeItem("buyer_session");

      // ✅ SAVE CORRECT SESSION
      if (userData.role === "seller") {
        localStorage.setItem(
          "seller_session",
          JSON.stringify(session)
        );
      } else {
        localStorage.setItem(
          "buyer_session",
          JSON.stringify(session)
        );
      }

      setUser(session);

      console.log("✅ Logged in:", session);

    } catch (error) {
      console.error("❌ Login Error:", error);
    }
  };

  // =====================================================
  // UPDATE USER - Update session data
  // =====================================================
  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      
      const updated = { ...prev, ...updates };

      const key = updated.role === "seller"
        ? "seller_session"
        : "buyer_session";

      localStorage.setItem(key, JSON.stringify(updated));

      console.log("✅ User updated:", updated);

      return updated;
    });
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const logout = () => {
    localStorage.removeItem("seller_session");
    localStorage.removeItem("buyer_session");

    setUser(null);

    console.log("🚪 Logged out");
  };

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;