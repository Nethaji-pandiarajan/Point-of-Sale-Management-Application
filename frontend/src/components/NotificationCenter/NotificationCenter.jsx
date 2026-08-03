import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  ShoppingBag,
  Utensils,
  Users,
  Tags,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
} from '../../services/notifications';
import { formatDistanceToNow } from '../../utils/time';
import useToast from '../../hooks/useToast';
import './NotificationCenter.css';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'order', label: 'Orders' },
  { id: 'product', label: 'Products' },
  { id: 'customer', label: 'Customers' },
  { id: 'category', label: 'Categories' },
  { id: 'system', label: 'System' }
];

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const containerRef = useRef(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // 1. Fetch unread count for badge
  const fetchUnreadCountOnly = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to fetch unread notification count:', err.message);
    }
  }, []);

  // 2. Fetch notifications list
  const fetchNotificationsList = useCallback(async (filter = activeFilter, pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const filterParams = {
        page: pageNum,
        limit: 8
      };

      if (filter === 'unread') {
        filterParams.read = 'false';
      } else if (filter !== 'all') {
        filterParams.reference_type = filter;
      }

      const res = await getNotifications(filterParams);
      const items = res.data || [];
      const pagination = res.pagination || {};

      if (append) {
        setNotifications(prev => [...prev, ...items]);
      } else {
        setNotifications(items);
      }

      setUnreadCount(pagination.unreadCount || 0);
      setHasMore(pageNum < (pagination.totalPages || 1));
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  // Initial load & 20-second polling interval
  useEffect(() => {
    fetchUnreadCountOnly();

    const interval = setInterval(() => {
      fetchUnreadCountOnly();
      if (isOpen) {
        fetchNotificationsList(activeFilter, 1, false);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchUnreadCountOnly, fetchNotificationsList, isOpen, activeFilter]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle Popover
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotificationsList(activeFilter, 1, false);
    }
  };

  // Change Filter
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    fetchNotificationsList(filterId, 1, false);
  };

  // Load More
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchNotificationsList(activeFilter, page + 1, true);
    }
  };

  // Mark single as read & navigate
  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id);
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    // Optional page navigation
    setIsOpen(false);
    if (item.referenceType === 'order') {
      navigate('/orders');
    } else if (item.referenceType === 'product') {
      navigate('/products');
    } else if (item.referenceType === 'customer') {
      navigate('/customers');
    } else if (item.referenceType === 'category') {
      navigate('/categories');
    } else if (item.referenceType === 'system') {
      navigate('/profile');
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to mark all read', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear all read
  const handleClearRead = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.isRead));
      addToast(res.message || 'Cleared read notifications', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to clear read notifications', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single notification
  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const target = notifications.find(n => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      addToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  // Get icon component by reference_type or type
  const renderIcon = (type, refType) => {
    if (refType === 'order') return <ShoppingBag size={18} />;
    if (refType === 'product') return <Utensils size={18} />;
    if (refType === 'customer') return <Users size={18} />;
    if (refType === 'category') return <Tags size={18} />;

    switch (type) {
      case 'success': return <CheckCircle2 size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      case 'error': return <XCircle size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className="notification-center-container" ref={containerRef}>
      
      {/* Bell Trigger Button */}
      <button
        className={`topnav-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label="Toggle notifications menu"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bell-badge-pill">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          
          {/* Header */}
          <div className="notification-header">
            <div className="header-title-stack">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-counter-tag">{unreadCount} Unread</span>
              )}
            </div>

            <div className="header-actions">
              <button
                className="action-link-btn"
                title="Mark all as read"
                onClick={handleMarkAllRead}
                disabled={actionLoading || unreadCount === 0}
              >
                <CheckCheck size={16} />
                <span>Mark All Read</span>
              </button>

              <button
                className="action-link-btn danger"
                title="Clear read notifications"
                onClick={handleClearRead}
                disabled={actionLoading}
              >
                <Trash2 size={16} />
                <span>Clear Read</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="notification-filters">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`filter-pill ${activeFilter === opt.id ? 'active' : ''}`}
                onClick={() => handleFilterChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Notification List Container */}
          <div className="notification-list-body">
            {loading && notifications.length === 0 ? (
              <div className="notification-skeletons">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="notification-skeleton-card">
                    <div className="sk-avatar"></div>
                    <div className="sk-lines">
                      <div className="sk-line title"></div>
                      <div className="sk-line body"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty-state">
                <div className="empty-icon-circle">
                  <Bell size={28} />
                </div>
                <h4>No Notifications</h4>
                <p>You are all caught up! New order, product, and system updates will appear here.</p>
              </div>
            ) : (
              <div className="notification-cards-stack">
                {notifications.map(item => (
                  <div
                    key={item.id}
                    className={`notification-card type-${item.type} ${!item.isRead ? 'unread' : 'read'}`}
                    onClick={() => handleNotificationClick(item)}
                  >
                    {!item.isRead && <span className="unread-dot-indicator"></span>}

                    <div className={`card-icon-box type-${item.type}`}>
                      {renderIcon(item.type, item.referenceType)}
                    </div>

                    <div className="card-content-stack">
                      <div className="card-top-row">
                        <h4 className="card-title">{item.title}</h4>
                        <span className="card-time">{formatDistanceToNow(item.createdAt)}</span>
                      </div>
                      <p className="card-message">{item.message}</p>
                    </div>

                    <button
                      className="delete-item-btn"
                      title="Delete notification"
                      onClick={(e) => handleDeleteItem(e, item.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {hasMore && (
                  <button
                    className="load-more-notifications-btn"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load Previous Notifications'}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default NotificationCenter;
