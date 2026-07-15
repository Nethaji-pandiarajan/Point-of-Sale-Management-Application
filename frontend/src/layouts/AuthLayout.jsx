import React from 'react';
import './AuthLayout.css';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-card-wrapper">
        <div className="auth-logo-section">
          <span className="auth-logo-icon">🍽️</span>
          <h1 className="auth-logo-text">Saleiz</h1>
          <p className="text-secondary">Restaurant Order Management</p>
        </div>
        <div className="auth-card-body">
          {children}
        </div>
        <div className="auth-card-footer">
          <p className="text-secondary">&copy; {new Date().getFullYear()} Saleiz Corp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
