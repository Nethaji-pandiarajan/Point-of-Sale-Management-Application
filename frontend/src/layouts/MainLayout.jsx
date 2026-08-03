import React, { useState } from 'react';
import './MainLayout.css';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  X,
  Palette,
  LogOut
} from 'lucide-react';

import { getProductImageUrl } from '../utils/helpers';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Products', path: '/products', icon: UtensilsCrossed },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Profile & Settings', path: '/profile', icon: Settings },
    { name: 'UI Style Guide', path: '/style-guide', icon: Palette }
  ];

  return (
    <div className="main-layout-container">
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle navigation menu">
          <Menu size={24} />
        </button>
        <span className="logo-text">Saleiz</span>
        <div style={{ width: 24 }}></div> {/* spacer */}
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="sidebar-overlay-bg" onClick={closeSidebar}></div>}

      {/* Sidebar Drawer */}
      <aside className={`sidebar-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={closeSidebar}>
            🍽️ <span className="logo-text">Saleiz</span>
          </Link>
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `nav-link-item ${isActive ? 'nav-link-active' : ''}`}
                onClick={closeSidebar}
                end={item.path === '/'}
              >
                <Icon size={18} className="nav-link-icon" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.profileImage ? (
                <img
                  src={getProductImageUrl(user.profileImage)}
                  alt={user.name || 'Admin'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                user?.name?.charAt(0) || 'A'
              )}
            </div>
            <div className="admin-details">
              <span className="admin-name">{user?.name || 'Saleiz Admin'}</span>
              <span className="admin-role">{user?.role || 'Owner'}</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content-wrapper">
        <div className="main-content-header">
          <div className="welcome-banner">
            <h2>Restaurant Admin Portal</h2>
            <p className="text-secondary">Overview and control center for Saleiz</p>
          </div>
        </div>
        <div className="main-content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
