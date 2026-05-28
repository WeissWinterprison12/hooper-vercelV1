// ProtectedRoute.jsx - CLEAN: Session-based route protection
import React from "react";
import { Navigate } from "react-router-dom";

// ✅ BUYER PROTECTION
// ✅ BUYER PROTECTION - WITH DEBUG
export const BuyerRoute = ({ children }) => {
  const sessionStr = localStorage.getItem("buyer_session");
  const sellerStr = localStorage.getItem("seller_session");
  
  console.log("🔍 BuyerRoute check:", { buyer: sessionStr, seller: sellerStr });

  if (!sessionStr) {
    if (sellerStr) {
      console.log("⚠️ User is already seller, redirecting to seller_dashboard");
      return <Navigate to="/seller_dashboard" replace />;
    }
    console.log("❌ No session, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  try {
    const session = JSON.parse(sessionStr);
    console.log("✅ Buyer session found:", session);
    
    if (session.role !== "buyer") {
      console.log("❌ Wrong role:", session.role);
      return <Navigate to="/login" replace />;
    }
    
    return children;
  } catch (e) {
    console.log("❌ Parse error");
    return <Navigate to="/login" replace />;
  }
};

// ✅ SELLER PROTECTION
export const SellerRoute = ({ children }) => {
  const sessionStr = localStorage.getItem("seller_session");

  if (!sessionStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const session = JSON.parse(sessionStr);
    
    if (session.role !== "seller") {

      return <Navigate to="/buyer_home" replace />;
    }

    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

// ✅ DEFAULT - Redirect to correct dashboard based on session
export default function AuthRedirect() {
  const seller = localStorage.getItem("seller_session");
  const buyer = localStorage.getItem("buyer_session");

  if (seller) return <Navigate to="/seller_dashboard" replace />;
  if (buyer) return <Navigate to="/buyer_home" replace />;

  return <Navigate to="/login" replace />;
}