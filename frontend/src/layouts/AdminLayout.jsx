import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  ShoppingBag,
  Users,
  Settings,
  Grid,
  UserCheck,
  ChefHat,
  BarChart3,
  Menu,
  X,
  Palette,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  User,
  ChevronDown
} from 'lucide-react';
import { getProductImageUrl } from '../utils/helpers';
import NotificationCenter from '../components/NotificationCenter/NotificationCenter';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileOpen = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Map paths to Page Titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/kitchen') return 'Kitchen Display System (KDS)';
    if (path === '/tables') return 'Table Management';
    if (path === '/categories') return 'Categories';
    if (path === '/products') return 'Food Products';
    if (path === '/orders') return 'Orders';
    if (path === '/staff') return 'Staff & Waiter Management';
    if (path === '/customers') return 'Customers';
    if (path === '/reports') return 'Reports & Analytics';
    if (path === '/profile') return 'Profile & Settings';
    return 'Admin Console';
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Kitchen KDS', path: '/kitchen', icon: ChefHat },
    { name: 'Tables', path: '/tables', icon: Grid },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Food Products', path: '/products', icon: UtensilsCrossed },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Staff & Waiters', path: '/staff', icon: UserCheck },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Profile & Settings', path: '/profile', icon: Settings }
  ];

  return (
    <div className="admin-layout">
      {/* Off-canvas mobile sidebar overlay */}
      {isMobileOpen && <div className="admin-mobile-overlay" onClick={closeMobile}></div>}

      {/* Collapsible Left Sidebar */}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={closeMobile}>
            <svg className="logo-svg" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M6 18V6a6 6 0 0 1 12 0v12" />
              <path d="M18 18H6M9 22h6" />
            </svg>
            {!isCollapsed && (
              <div className="logo-text-group">
                <span className="logo-text">Saleiz</span>
                <span className="logo-subtext">Restaurant Management</span>
              </div>
            )}
          </Link>
          <button className="mobile-close-btn" onClick={closeMobile} aria-label="Close menu">
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
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                end={item.path === '/'}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon size={20} className="link-icon" />
                <span className="link-label">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {!isCollapsed && (
          <div className="sidebar-promo-card">
            <div className="promo-icon-container">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18h18M4 21h16M12 5c-3.87 0-7 3.13-7 7h14c0-3.87-3.13-7-7-7z" />
              </svg>
            </div>
            <h4 className="promo-title">Delicious food, Happy customers</h4>
            <p className="promo-desc">Great food brings people together.</p>
          </div>
        )}

        <div className="sidebar-footer">
          <button
            onClick={logout}
            className="sidebar-link logout-btn"
            title={isCollapsed ? 'Logout' : undefined}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut size={20} className="link-icon" />
            <span className="link-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Navigation Bar */}
        <header className="admin-topnav">
          <div className="topnav-left">
            {/* Hamburger button visible on Mobile & Tablet */}
            <button className="hamburger-btn" onClick={toggleMobileOpen} aria-label="Open navigation menu">
              <Menu size={24} />
            </button>

            {/* Sidebar toggle button visible on Desktop */}
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            <h1 className="topnav-title">{getPageTitle()}</h1>
          </div>

          <div className="topnav-right">
            {/* UI Mock Search Bar */}
            <div className="topnav-search">
              <input type="text" placeholder="Search orders, dishes..." readOnly />
              <Search className="search-icon" size={18} />
            </div>

            {/* Global Enterprise Notification Center */}
            <NotificationCenter />

            {/* User Profile avatar dropdown */}
            <div className="topnav-profile" ref={dropdownRef}>
              <button
                className={`profile-trigger ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Toggle profile menu"
                aria-expanded={isDropdownOpen}
              >
                <div className="profile-avatar">
                  {user?.profileImage ? (
                    <img
                      src={getProductImageUrl(user.profileImage)}
                      alt={user.name || 'Admin'}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    user?.name?.charAt(0) || 'S'
                  )}
                </div>
                 <div className="profile-text-stack">
                   <span className="profile-name">{user?.name || 'Saleiz Admin'}</span>
                   <span className="profile-role">Administrator</span>
                 </div>
                 <ChevronDown size={16} className={`arrow-icon ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-info">
                    <p className="dropdown-username">{user?.name || 'Saleiz Admin'}</p>
                    <p className="dropdown-email text-secondary">{user?.email || 'admin@saleiz.com'}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={logout} className="dropdown-item text-danger w-full text-left" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Container Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
