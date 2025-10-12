import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element: Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // if not logged in → redirect to /login
  return isAuthenticated ? <Element /> : <Navigate to="/login" />;
};

export default PrivateRoute;
