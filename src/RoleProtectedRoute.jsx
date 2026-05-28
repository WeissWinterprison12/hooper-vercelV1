// RoleProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // ✅ Better loading UI
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        background: '#f8f9fa'
      }}>
        🔄 Loading your dashboard...
      </div>
    );
  }

  // ✅ Debug logging (remove after testing)
  console.log('🔒 RoleProtectedRoute:', {
    userId: user?.user_id,
    role: user?.role,
    allowedRoles,
    hasAccess: user && allowedRoles.includes(user?.role)
  });

  // No user OR wrong role → redirect
  if (!user || !allowedRoles.includes(user.role)) {
    console.log('🚫 Access denied - redirecting');
    
    // Redirect based on role if user exists but wrong role
    if (user && user.role === 'buyer') {
      return <Navigate to="/buyer_home" replace />;
    }
    
    return <Navigate to="/login" replace />;
  }

  // ✅ Access granted
  console.log('✅ Access granted');
  return children;
};

export default RoleProtectedRoute;