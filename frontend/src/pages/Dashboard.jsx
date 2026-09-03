import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { getDashboardStats } from '../services/admin';
import { getOrder, updateOrderStatus } from '../services/orders';
import { generateBill, processPayment } from '../services/bills';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { ShoppingBag, IndianRupee, UtensilsCrossed, Users, RefreshCw, Clock, CheckCircle2, Eye, LayoutGrid, ChefHat, Utensils, AlertCircle, ArrowRight, Play, XCircle, X, User, Mail, Phone, Receipt } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, getOrderTimeMetrics } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import BillReceiptModal from '../components/BillReceiptModal/BillReceiptModal';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Live clock state
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Dashboard Data State
  const [statsData, setStatsData] = useState(null);

  // Selected Order Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Bill Modal States
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setErrorState(null);
    try {
      const data = await getDashboardStats();
      setStatsData(data);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
      setErrorState('Could not retrieve live dashboard statistics. Verify connection.');
      if (isManual) addToast('Failed to refresh dashboard stats', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadDashboardData();
    const autoRefresh = setInterval(() => loadDashboardData(), 15000);
    return () => clearInterval(autoRefresh);
  }, [loadDashboardData]);

  const handleOpenOrderDetails = async (orderId) => {
    setIsOrderModalOpen(true);
    setLoadingOrderDetails(true);
    try {
      const data = await getOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      addToast('Failed to load order details', 'error');
      setIsOrderModalOpen(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const handleUpdateOrderStatus = async (newStatus) => {
    if (statusSubmitting || !selectedOrder) return;

    if (newStatus === 'cancelled') {
      const confirmed = await confirm({
        title: 'Cancel Order?',
        message: `Are you sure you want to cancel Order #${selectedOrder.orderNo || selectedOrder.id}?`,
        confirmLabel: 'Cancel Order',
        cancelLabel: 'Keep Active',
        variant: 'danger'
      });
      if (!confirmed) return;
    }

    setStatusSubmitting(true);
    try {
      const updated = await updateOrderStatus(selectedOrder.id, newStatus);
      setSelectedOrder(updated);
      addToast(`Order #${selectedOrder.orderNo || selectedOrder.id} status updated to ${newStatus.toUpperCase()}`, 'success');
      loadDashboardData();
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleOpenBill = async (orderId) => {
    setIsBillModalOpen(true);
    setLoadingBill(true);
    try {
      const billData = await generateBill(orderId);
      setCurrentBill(billData);
    } catch (err) {
      addToast(err.message || 'Failed to generate bill for order', 'error');
      setIsBillModalOpen(false);
    } finally {
      setLoadingBill(false);
    }
  };

  const handlePaymentComplete = async (billId, paymentMethod) => {
    try {
      const result = await processPayment(billId, { paymentMethod });
      addToast(`Payment of ${formatCurrency(result.grandTotal)} completed successfully!`, 'success');
      setCurrentBill(prev => ({ ...prev, paymentStatus: 'paid', paymentMethod }));
      loadDashboardData();
      if (selectedOrder) {
        setSelectedOrder(prev => ({ ...prev, status: 'completed', paymentStatus: 'paid' }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete payment', 'error');
    }
  };

  const getStatusBadge = (tableStatus) => {
    switch (tableStatus) {
      case 'available': return <Badge variant="success">Available</Badge>;
      case 'occupied': return <Badge variant="info">Occupied</Badge>;
      case 'reserved': return <Badge variant="warning">Reserved</Badge>;
      default: return <Badge variant="secondary">{tableStatus}</Badge>;
    }
  };

  const getOrderStatusBadge = (orderStatus) => {
    switch (orderStatus) {
      case 'pending': return <Badge variant="warning">New Order</Badge>;
      case 'preparing': return <Badge variant="info">Preparing</Badge>;
      case 'ready': return <Badge variant="success">Ready</Badge>;
      case 'served': return <Badge variant="success">Served</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge variant="secondary">{orderStatus}</Badge>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (errorState && !statsData) {
    return (
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadDashboardData(true)}>
            Retry Fetching
          </Button>
        </CardBody>
      </Card>
    );
  }

  const {
    totalTables = 0,
    availableTables = 0,
    occupiedTables = 0,
    reservedTables = 0,
    activeOrders = 0,
    newKotOrders = 0,
    preparingOrders = 0,
    readyOrders = 0,
    todayCompletedOrders = 0,
    todayRevenue = 0,
    floorTables = [],
    feeds = { newKots: [], readyOrders: [], recentOrders: [] }
  } = statsData || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Restaurant Command Center</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Real-time Dine-In tables, active kitchen orders, and sales performance overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => loadDashboardData(true)}
            isLoading={refreshing}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 1. DINE-IN METRICS OVERVIEW CARDS */}
      <div className="dash-metrics-grid">
        <Card className="dash-metric-card">
          <CardBody>
            <div className="dash-metric-row">
              <div className="dash-metric-icon bg-total"><LayoutGrid size={20} /></div>
              <span className="dash-metric-label">Total Tables</span>
            </div>
            <h3 className="dash-metric-val">{totalTables}</h3>
            <span className="dash-metric-sub">{availableTables} Available • {occupiedTables} Occupied</span>
          </CardBody>
        </Card>

        <Card className="dash-metric-card">
          <CardBody>
            <div className="dash-metric-row">
              <div className="dash-metric-icon bg-avail"><CheckCircle2 size={20} /></div>
              <span className="dash-metric-label">Available Tables</span>
            </div>
            <h3 className="dash-metric-val text-success">{availableTables}</h3>
            <span className="dash-metric-sub">Ready for guests</span>
          </CardBody>
        </Card>

        <Card className="dash-metric-card">
          <CardBody>
            <div className="dash-metric-row">
              <div className="dash-metric-icon bg-occ"><Users size={20} /></div>
              <span className="dash-metric-label">Occupied Tables</span>
            </div>
            <h3 className="dash-metric-val text-info">{occupiedTables}</h3>
            <span className="dash-metric-sub">Active dining guests</span>
          </CardBody>
        </Card>

        <Card className="dash-metric-card">
          <CardBody>
            <div className="dash-metric-row">
              <div className="dash-metric-icon bg-active"><ShoppingBag size={20} /></div>
              <span className="dash-metric-label">Active Orders</span>
            </div>
            <h3 className="dash-metric-val text-primary">{activeOrders}</h3>
            <span className="dash-metric-sub">Pending to Served</span>
          </CardBody>
        </Card>

        <Card className="dash-metric-card">
          <CardBody>
            <div className="dash-metric-row">
              <div className="dash-metric-icon bg-kot"><ChefHat size={20} /></div>
              <span className="dash-metric-label">Kitchen Status</span>
            </div>
            <div className="kitchen-status-list">
              <div className="kitchen-status-item">
                <span className="status-dot dot-red"></span>
                <span className="kitchen-val">{newKotOrders}</span>
                <span className="kitchen-lbl">New Orders</span>
              </div>
              <div className="kitchen-status-item">
                <span className="status-dot dot-orange"></span>
                <span className="kitchen-val">{preparingOrders}</span>
                <span className="kitchen-lbl">Preparing</span>
              </div>
              <div className="kitchen-status-item">
                <span className="status-dot dot-green"></span>
                <span className="kitchen-val">{readyOrders}</span>
                <span className="kitchen-lbl">Ready for Pickup</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="dash-metric-card">
          <CardBody>
            <div className="dash-metric-row">
              <div className="dash-metric-icon bg-rev"><IndianRupee size={20} /></div>
              <span className="dash-metric-label">Today's Revenue</span>
            </div>
            <h3 className="dash-metric-val text-success">{formatCurrency(todayRevenue)}</h3>
            <span className="dash-metric-sub">{todayCompletedOrders} completed orders today</span>
          </CardBody>
        </Card>
      </div>

      {/* 2. VISUAL RESTAURANT FLOOR PLAN OVERVIEW */}
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Restaurant Floor Plan & Table Live Overview</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Click any occupied table card to view and manage its active live order
              </p>
            </div>
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/tables')}>
              Manage Tables Module
            </Button>
          </div>

          <div className="floor-grid-container">
            {floorTables.map((tbl) => {
              const isOccupied = tbl.status === 'occupied';
              return (
                <div
                  key={tbl.id}
                  className={`floor-table-card ${tbl.status}`}
                  onClick={() => {
                    if (isOccupied && tbl.activeOrderId) {
                      handleOpenOrderDetails(tbl.activeOrderId);
                    } else {
                      navigate('/tables');
                    }
                  }}
                >
                  <div className="floor-table-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="floor-table-name">{tbl.tableNumber}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-primary, #E53935)', fontWeight: '800' }}>
                        ID: {tbl.tableCode || `TAB${String(tbl.id).padStart(2, '0')}`}
                      </span>
                    </div>
                    {getStatusBadge(tbl.status)}
                  </div>

                  <div className="floor-table-capacity">
                    👥 {tbl.capacity} {tbl.capacity === 1 ? 'Seat' : 'Seats'}
                  </div>

                  {isOccupied && tbl.activeOrderNo ? (
                    <div className="floor-active-order-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="floor-order-no">#{tbl.activeOrderNo}</span>
                        <span className="floor-order-status">{tbl.activeOrderStatus}</span>
                      </div>
                      {tbl.assignedWaiter && (
                        <div className="floor-waiter">Server: {tbl.assignedWaiter}</div>
                      )}
                      {tbl.activeOrderTotal && (
                        <div className="floor-total">{formatCurrency(parseFloat(tbl.activeOrderTotal))}</div>
                      )}
                    </div>
                  ) : (
                    <div className="floor-available-msg">
                      {tbl.status === 'reserved' ? 'Reserved' : 'Ready for guests'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* 3. COMPACT FEEDS SECTION */}
      <div className="dash-feeds-grid">
        
        {/* NEW KITCHEN KOTs FEED */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChefHat size={18} style={{ color: 'var(--color-primary)' }} />
                New Kitchen KOTs ({feeds.newKots?.length || 0})
              </h4>
              <Button variant="ghost" size="sm" onClick={() => navigate('/kitchen')}>
                Open KDS
              </Button>
            </div>

            {feeds.newKots?.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                No new KOT tickets pending
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {feeds.newKots?.map((kot) => (
                  <div
                    key={kot.id}
                    className="dash-feed-item"
                    onClick={() => navigate('/kitchen')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.85rem' }}>{kot.kotNumber}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{formatTime(kot.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#1E293B', marginTop: '2px' }}>
                      🍽️ <strong>{kot.tableNo || 'Dine-In'}</strong> • Server: {kot.waiterName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* RECENTLY READY ORDERS FEED */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: '#2E7D32' }} />
                Ready for Service ({feeds.readyOrders?.length || 0})
              </h4>
              <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                All Orders
              </Button>
            </div>

            {feeds.readyOrders?.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                No orders waiting for pickup
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {feeds.readyOrders?.map((ord) => (
                  <div
                    key={ord.id}
                    className="dash-feed-item"
                    onClick={() => handleOpenOrderDetails(ord.id)}
                    style={{ borderLeft: '3px solid #2E7D32' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>#{ord.orderNo || ord.id}</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>{formatCurrency(ord.totalAmount)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#2E7D32', marginTop: '2px', fontWeight: '600' }}>
                      🍽️ {ord.tableNo || 'Table'} • Ready for Waiter
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* RECENT ORDERS TABLE */}
        <Card style={{ gridColumn: 'span 2' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} style={{ color: 'var(--color-primary)' }} />
                Recent Dine-In Transactions
              </h4>
              <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                View All Orders
              </Button>
            </div>

            {feeds.recentOrders?.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                No recent order records
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Table</th>
                      <th>Server</th>
                      <th>Order Status</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeds.recentOrders?.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontWeight: '700' }}>#{ord.orderNo || ord.id}</td>
                        <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>🍽️ {ord.tableNo || 'Takeaway'}</td>
                        <td>{ord.customerName}</td>
                        <td>{getOrderStatusBadge(ord.status)}</td>
                        <td>
                          <Badge variant={ord.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                            {ord.paymentStatus || 'unpaid'}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatCurrency(ord.totalAmount)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" icon={Eye} onClick={() => handleOpenOrderDetails(ord.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

      </div>

      {/* Order Command Center Details Modal */}
      {isOrderModalOpen && (
        <div className="order-command-overlay" onClick={() => setIsOrderModalOpen(false)}>
          <div className="order-command-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="order-command-header">
              <div>
                <div className="order-command-title-row">
                  <h3 className="order-command-id">
                    ORDER #{selectedOrder?.orderNo || selectedOrder?.id}
                  </h3>
                  {selectedOrder && getOrderStatusBadge(selectedOrder.status)}
                </div>
                {selectedOrder && (
                  <p className="order-command-meta">
                    Placed • {formatDate(selectedOrder.createdAt)}, {formatTime(selectedOrder.createdAt)} • {getOrderTimeMetrics(selectedOrder, currentTime).primaryText}
                  </p>
                )}
              </div>
              <button type="button" className="order-command-close-btn" onClick={() => setIsOrderModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {loadingOrderDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Spinner size="md" />
              </div>
            ) : selectedOrder ? (
              <div className="order-command-body">
                <div className="order-command-grid">
                  <div>
                    <h4 className="command-section-title">
                      <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} />
                      Order Items ({selectedOrder.items?.length || 0})
                    </h4>

                    <div className="command-items-list">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="command-item-card">
                          <div className="command-item-left">
                            <span style={{ fontWeight: '800', color: 'var(--color-primary)', marginRight: '8px' }}>
                              {item.quantity}x
                            </span>
                            <span className="command-item-name">{item.name}</span>
                          </div>
                          <span className="command-item-price">{formatCurrency(item.quantity * item.price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="command-summary-box">
                      <div className="command-summary-row total">
                        <span>ORDER TOTAL</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="command-section-title">
                      <User size={16} style={{ color: 'var(--color-primary)' }} />
                      Table & Waiter Details
                    </h4>

                    <div className="command-info-card">
                      <div className="command-info-item">
                        <User size={16} className="command-info-icon" />
                        <div className="command-info-text">
                          <span className="command-info-label">Assigned Waiter</span>
                          <span className="command-info-val">{selectedOrder.customerName}</span>
                        </div>
                      </div>
                      <div className="command-info-item">
                        <Utensils size={16} className="command-info-icon" />
                        <div className="command-info-text">
                          <span className="command-info-label">Dining Table</span>
                          <span className="service-pill-badge">🍽️ {selectedOrder.tableNo || 'Table'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="order-command-footer">
              {selectedOrder && selectedOrder.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedOrder.status === 'pending' && (
                    <Button variant="primary" icon={Play} onClick={() => handleUpdateOrderStatus('preparing')} isLoading={statusSubmitting}>
                      Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button variant="primary" icon={CheckCircle2} onClick={() => handleUpdateOrderStatus('ready')} isLoading={statusSubmitting}>
                      Mark Ready
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button variant="primary" icon={CheckCircle2} onClick={() => handleUpdateOrderStatus('served')} isLoading={statusSubmitting}>
                      Mark Served
                    </Button>
                  )}
                  {(selectedOrder.status === 'served' || selectedOrder.status === 'completed') && (
                    <Button variant="primary" icon={Receipt} onClick={() => handleOpenBill(selectedOrder.id)}>
                      {selectedOrder.paymentStatus === 'paid' ? 'View Bill Receipt' : 'Generate & Pay Bill'}
                    </Button>
                  )}
                  {selectedOrder.status !== 'completed' && (
                    <Button variant="danger" icon={XCircle} onClick={() => handleUpdateOrderStatus('cancelled')} isLoading={statusSubmitting}>
                      Cancel Order
                    </Button>
                  )}
                </div>
              )}
              <Button variant="ghost" onClick={() => setIsOrderModalOpen(false)}>Close</Button>
            </div>

          </div>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {isBillModalOpen && (
        <BillReceiptModal
          bill={currentBill}
          loading={loadingBill}
          onClose={() => setIsBillModalOpen(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

    </div>
  );
};

export default Dashboard;
