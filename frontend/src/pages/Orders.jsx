import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getOrders, getOrder, updateOrderStatus } from '../services/orders';
import { generateBill, getBillByOrderId, processPayment } from '../services/bills';
import { Search, Eye, RefreshCw, Calendar, ChevronLeft, ChevronRight, XCircle, CheckCircle2, Play, Clock, X, User, Mail, Phone, Utensils, Check, ShoppingBag, Receipt } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, getOrderTimeMetrics, getProductImageUrl } from '../utils/helpers';
import AdvancedDataTable from '../components/AdvancedDataTable/AdvancedDataTable';
import BillReceiptModal from '../components/BillReceiptModal/BillReceiptModal';
import './Orders.css';

const getIncompleteOrderTime = (order, now = new Date()) => {
  if (!order || !order.createdAt) return { primaryText: '—', secondaryText: '' };
  const createdTime = new Date(order.createdAt);
  if (isNaN(createdTime.getTime())) return { primaryText: '—', secondaryText: '' };

  const diffMs = Math.max(0, now.getTime() - createdTime.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  let primaryText = '';
  if (diffMinutes < 60) {
    primaryText = `${diffMinutes} min`;
  } else {
    const hrs = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    primaryText = `${hrs} hr ${mins < 10 ? '0' + mins : mins} min`;
  }

  const secondaryText = `Placed at ${formatTime(order.createdAt)}`;
  return { primaryText, secondaryText, diffMinutes };
};

const getCompletedOrderTime = (order) => {
  if (!order) return { primaryText: '—', secondaryText: '' };
  
  let compDate = null;
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];
  const compEvent = timeline.find(t => t.status === 'completed');
  if (compEvent && compEvent.time) {
    compDate = new Date(compEvent.time);
  } else if (order.completedAt) {
    compDate = new Date(order.completedAt);
  } else if (order.updatedAt) {
    compDate = new Date(order.updatedAt);
  } else if (order.createdAt) {
    compDate = new Date(order.createdAt);
  }

  if (!compDate || isNaN(compDate.getTime())) {
    return { primaryText: '—', secondaryText: '' };
  }

  const today = new Date();
  const isToday = compDate.toDateString() === today.toDateString();

  if (isToday) {
    return {
      primaryText: formatTime(compDate),
      secondaryText: 'Completed today'
    };
  }

  return {
    primaryText: `${formatDate(compDate)}, ${formatTime(compDate)}`,
    secondaryText: ''
  };
};

const Orders = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Tab State ('incomplete' | 'completed')
  const [activeTab, setActiveTab] = useState('incomplete');
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Bill Modal states
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);

  // Live timer tick state (updates every 60s)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 5; // limit per page

  // Filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTableNo, setFilterTableNo] = useState('');
  const [filterWaiterName, setFilterWaiterName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Selected Order details modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsClosing, setIsDetailsClosing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Close Order Details Modal with Reverse Animation
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsDetailsClosing(false);
    }, 240);
  }, []);

  // Keyboard Escape Key Handler for Details Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen && !statusSubmitting) {
        handleCloseDetailsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, statusSubmitting, handleCloseDetailsModal]);

  // Fetch orders from API
  const fetchOrders = useCallback(async (pageNum = page) => {
    setLoading(true);
    setErrorState(null);
    try {
      const targetStatus = activeTab === 'incomplete' 
        ? (filterStatus || 'incomplete') 
        : 'completed';

      const filters = {
        status: targetStatus,
        tableNo: filterTableNo,
        waiterName: filterWaiterName,
        paymentStatus: filterPaymentStatus,
        search: filterSearch,
        startDate: filterStartDate,
        endDate: filterEndDate
      };
      
      const response = await getOrders(filters, pageNum, limit);
      
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
      if (response.pagination.incompleteCount !== undefined) {
        setIncompleteCount(response.pagination.incompleteCount);
      }
      if (response.pagination.completedCount !== undefined) {
        setCompletedCount(response.pagination.completedCount);
      }
      setPage(response.pagination.page);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to retrieve order records. Please try again.');
      addToast('Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterStatus, filterTableNo, filterWaiterName, filterPaymentStatus, filterSearch, filterStartDate, filterEndDate, addToast]);

  // Fetch on mount, tab change, or filter changes
  useEffect(() => {
    setPage(1);
    fetchOrders(1);
  }, [activeTab, filterStatus, filterTableNo, filterWaiterName, filterPaymentStatus, filterSearch, filterStartDate, filterEndDate]);

  // Handle Page navigation
  const handlePageChange = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchOrders(pageNum);
  };

  // Open Details Modal
  const handleOpenDetails = async (orderId) => {
    setIsDetailsClosing(false);
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const data = await getOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      addToast('Failed to load order details', 'error');
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle Order Status Update
  const handleUpdateStatus = async (newStatus) => {
    if (statusSubmitting) return;

    if (newStatus === 'cancelled') {
      const confirmed = await confirm({
        title: 'Cancel Order?',
        message: `Are you sure you want to cancel Order #${selectedOrder.orderNo || selectedOrder.id}? This will notify the kitchen and server.`,
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
      
      // Update in local orders array to prevent screen flash
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      
      fetchOrders(page);
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
      
      fetchOrders(page);
      
      if (selectedOrder) {
        setSelectedOrder(prev => ({ ...prev, status: 'completed', paymentStatus: 'paid' }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete payment', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">New Order</Badge>;
      case 'preparing': return <Badge variant="info">Preparing</Badge>;
      case 'ready': return <Badge variant="success">Ready</Badge>;
      case 'served': return <Badge variant="success">Served</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (pStatus) => {
    switch (pStatus) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'unpaid':
      default: return <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    const summary = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    return summary.length > 45 ? `${summary.slice(0, 45)}...` : summary;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Dine-In Order Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Monitor, track, and update live restaurant table orders throughout the service lifecycle
          </p>
        </div>
      </div>

      {/* 1. INCOMPLETE vs COMPLETED ORDERS TAB BAR */}
      <div className="orders-tabs-wrapper">
        <button
          type="button"
          className={`orders-tab-item ${activeTab === 'incomplete' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('incomplete');
            setFilterStatus('');
            setPage(1);
          }}
        >
          <span>Incomplete Orders</span>
          <span className="orders-tab-badge">{incompleteCount}</span>
        </button>
        <button
          type="button"
          className={`orders-tab-item ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('completed');
            setFilterStatus('');
            setPage(1);
          }}
        >
          <span>Completed Orders</span>
          <span className="orders-tab-badge">{completedCount}</span>
        </button>
      </div>

      {/* Advanced Enterprise Data Table */}
      {errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchOrders(page)}>
              Retry Loading
            </Button>
          </CardBody>
        </Card>
      ) : (
        <AdvancedDataTable
          tableKey={`orders-${activeTab}`}
          data={orders}
          loading={loading}
          searchFields={['id', 'orderNo', 'customerName', 'tableNo', 'notes']}
          searchPlaceholder="Search order ID, waiter, table, or items... (Ctrl+F)"
          onRefresh={() => fetchOrders(page)}
          emptyStateTitle={activeTab === 'incomplete' ? "No active orders right now." : "No completed orders yet."}
          emptyStateDescription={activeTab === 'incomplete' ? "New dine-in orders will appear here." : "Orders marked as Completed will be stored here."}
          serverSide={true}
          serverTotalItems={totalCount}
          serverPage={page}
          serverLimit={limit}
          onServerPageChange={handlePageChange}
          onServerSearchChange={(val) => {
            setFilterSearch(val);
            setPage(1);
          }}
          onServerFilterChange={(newFilters) => {
            setFilterStatus(newFilters.status || '');
            setFilterTableNo(newFilters.tableNo || '');
            setFilterWaiterName(newFilters.waiterName || '');
            setFilterPaymentStatus(newFilters.paymentStatus || '');
            setFilterStartDate(newFilters.ordStartDate || '');
            setFilterEndDate(newFilters.ordEndDate || '');
            setPage(1);
          }}
          filterConfigs={[
            ...(activeTab === 'incomplete' ? [{
              key: 'status',
              label: 'Order Status',
              type: 'select',
              options: [
                { value: '', label: 'All Active Statuses' },
                { value: 'pending', label: 'New Order' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'ready', label: 'Ready' },
                { value: 'served', label: 'Served' }
              ]
            }] : []),
            {
              key: 'paymentStatus',
              label: 'Payment Status',
              type: 'select',
              options: [
                { value: '', label: 'All Payment Statuses' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'paid', label: 'Paid' }
              ]
            },
            {
              key: 'tableNo',
              label: 'Table Number',
              type: 'text',
              placeholder: 'e.g. Table 4'
            },
            {
              key: 'waiterName',
              label: 'Waiter / Server',
              type: 'text',
              placeholder: 'e.g. Marco'
            },
            {
              key: 'dateRange',
              label: 'Date Range',
              type: 'dateRange',
              startKey: 'ordStartDate',
              endKey: 'ordEndDate'
            }
          ]}
          columns={[
            {
              key: 'id',
              title: 'Order ID',
              sortable: true,
              render: (ord) => <span style={{ fontWeight: '700' }}>#{ord.orderNo || ord.id}</span>
            },
            {
              key: 'tableNo',
              title: 'Table Number',
              sortable: true,
              render: (ord) => (
                <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                  🍽️ {ord.tableNo || 'Takeaway'}
                </span>
              )
            },
            {
              key: 'customerName',
              title: 'Waiter / Server',
              sortable: true,
              render: (ord) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600' }}>{ord.customerName}</span>
                  {ord.phone && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {ord.phone}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'itemsSummary',
              title: 'Items Summary',
              sortable: false,
              render: (ord) => (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {getItemsSummary(ord.items)}
                </span>
              )
            },
            {
              key: 'totalAmount',
              title: 'Total Amount',
              sortable: true,
              render: (ord) => <span style={{ fontWeight: '700' }}>{formatCurrency(ord.totalAmount)}</span>
            },
            {
              key: 'status',
              title: 'Order Status',
              sortable: true,
              render: (ord) => getStatusBadge(ord.status)
            },
            {
              key: 'paymentStatus',
              title: 'Payment',
              sortable: true,
              render: (ord) => getPaymentStatusBadge(ord.paymentStatus)
            },
            {
              key: 'time',
              title: activeTab === 'incomplete' ? 'Live Time' : 'Completed At',
              sortable: true,
              render: (ord) => {
                if (activeTab === 'incomplete') {
                  const { primaryText, secondaryText, diffMinutes } = getIncompleteOrderTime(ord, currentTime);
                  const urgency = diffMinutes >= 20 ? 'delayed' : diffMinutes >= 10 ? 'attention' : 'normal';

                  return (
                    <div className={`order-time-cell urgency-${urgency}`}>
                      <div className="order-time-primary">
                        <Clock size={13} className="order-time-icon" />
                        <span style={{ fontWeight: '700' }}>{primaryText}</span>
                      </div>
                      <span className="order-time-secondary">{secondaryText}</span>
                    </div>
                  );
                } else {
                  const { primaryText, secondaryText } = getCompletedOrderTime(ord);

                  return (
                    <div className="order-time-cell urgency-normal">
                      <div className="order-time-primary">
                        <CheckCircle2 size={13} className="order-time-icon text-success" />
                        <span style={{ fontWeight: '700' }}>{primaryText}</span>
                      </div>
                      {secondaryText && <span className="order-time-secondary">{secondaryText}</span>}
                    </div>
                  );
                }
              }
            },
            {
              key: 'actions',
              title: 'Actions',
              width: '200px',
              render: (ord) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Receipt}
                    title={activeTab === 'incomplete' ? 'View & Pay Bill' : 'Print Receipt'}
                    onClick={() => handleOpenBill(ord.id)}
                  >
                    {activeTab === 'incomplete' ? 'Bill' : 'Receipt'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleOpenDetails(ord.id)}
                  >
                    Details
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* Order Command Center Details Modal */}
      {isModalOpen && (
        <div className={`order-command-overlay ${isDetailsClosing ? 'closing' : ''}`} onClick={handleCloseDetailsModal}>
          <div className={`order-command-container ${isDetailsClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="order-command-header">
              <div>
                <div className="order-command-title-row">
                  <h3 className="order-command-id">
                    ORDER #{selectedOrder?.orderNo || selectedOrder?.id}
                  </h3>
                  {selectedOrder && getStatusBadge(selectedOrder.status)}
                  {selectedOrder && getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                {selectedOrder && (
                  <p className="order-command-meta">
                    Placed • {formatDate(selectedOrder.createdAt)}, {formatTime(selectedOrder.createdAt)} • {getOrderTimeMetrics(selectedOrder, currentTime).primaryText}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="order-command-close-btn"
                onClick={handleCloseDetailsModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Spinner size="md" />
              </div>
            ) : selectedOrder ? (
              <div className="order-command-body">
                
                {/* 1. ORDER STATUS PROGRESS TRACKER */}
                <div className="order-progress-tracker">
                  {(() => {
                    const status = selectedOrder.status;
                    const isCancelled = status === 'cancelled';

                    if (isCancelled) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                          <XCircle size={20} />
                          <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>This order was cancelled</span>
                        </div>
                      );
                    }

                    const steps = [
                      { id: 'pending', label: 'Order Placed' },
                      { id: 'preparing', label: 'Preparing' },
                      { id: 'ready', label: 'Ready' },
                      { id: 'served', label: 'Served' },
                      { id: 'completed', label: 'Completed' }
                    ];

                    const stepIndex = status === 'pending' ? 0 
                      : status === 'preparing' ? 1 
                      : status === 'ready' ? 2 
                      : status === 'served' ? 3 
                      : status === 'completed' ? 4 : 0;

                    return steps.map((step, idx) => {
                      const isDone = idx < stepIndex || status === 'completed';
                      const isActive = idx === stepIndex && status !== 'completed';

                      return (
                        <React.Fragment key={step.id}>
                          <div className={`progress-step ${isDone ? 'completed' : isActive ? 'active' : 'muted'}`}>
                            <div className="step-node">
                              {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                            </div>
                            <div className="step-info">
                              <span className="step-title">{step.label}</span>
                            </div>
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`progress-connector ${isDone ? 'completed' : ''}`} />
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>

                {/* 2. MAIN TWO-COLUMN GRID */}
                <div className="order-command-grid">
                  
                  {/* LEFT COLUMN: ITEMS & SUMMARY */}
                  <div>
                    <h4 className="command-section-title">
                      <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} />
                      Order Items ({selectedOrder.items?.length || 0})
                    </h4>

                    <div className="command-items-list">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="command-item-card">
                          <div className="command-item-left">
                            <div className="command-item-icon-box">
                              {item.image && (item.image.startsWith('/') || item.image.startsWith('http') || item.image.startsWith('blob:')) ? (
                                <img 
                                  src={getProductImageUrl(item.image)} 
                                  alt={item.name} 
                                  style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} 
                                />
                              ) : (
                                item.image || '🍕'
                              )}
                            </div>
                            <div className="command-item-details">
                              <span className="command-item-name">{item.name}</span>
                              <span className="command-item-qty">
                                Qty {item.quantity} × {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>
                          <span className="command-item-price">
                            {formatCurrency(item.quantity * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Summary Box */}
                    <div className="command-summary-box">
                      <div className="command-summary-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.totalAmount)}</span>
                      </div>
                      <div className="command-summary-row total">
                        <span>ORDER TOTAL</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="kds-notes-box" style={{ margin: '14px 0 0 0', fontSize: '0.85rem' }}>
                        <span><strong>Special Note:</strong> {selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: WAITER & TABLE INFO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h4 className="command-section-title">
                        <User size={16} style={{ color: 'var(--color-primary)' }} />
                        Waiter & Dining Details
                      </h4>

                      <div className="command-info-card">
                        <div className="command-info-item">
                          <User size={16} className="command-info-icon" />
                          <div className="command-info-text">
                            <span className="command-info-label">Waiter / Server Name</span>
                            <span className="command-info-val">{selectedOrder.customerName}</span>
                          </div>
                        </div>

                        <div className="command-info-item">
                          <Mail size={16} className="command-info-icon" />
                          <div className="command-info-text">
                            <span className="command-info-label">Contact Email</span>
                            <span className="command-info-val">{selectedOrder.email || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="command-info-item">
                          <Phone size={16} className="command-info-icon" />
                          <div className="command-info-text">
                            <span className="command-info-label">Phone Contact</span>
                            <span className="command-info-val">{selectedOrder.phone || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="command-info-item">
                          <Utensils size={16} className="command-info-icon" />
                          <div className="command-info-text">
                            <span className="command-info-label">Service Table</span>
                            <span className="service-pill-badge">
                              🍽️ {selectedOrder.tableNo || 'Table 1'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. ORDER TIMING & TIMELINE SECTION */}
                <div className="command-timing-card">
                  <div className="timing-block">
                    <span className="timing-label">Order Placed</span>
                    <span className="timing-val">{formatTime(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="timing-block">
                    <span className="timing-label">Current Status</span>
                    <span className="timing-val" style={{ textTransform: 'capitalize' }}>{selectedOrder.status}</span>
                  </div>
                  <div className="timing-block">
                    <span className="timing-label">Payment Status</span>
                    <span className="timing-val" style={{ textTransform: 'capitalize' }}>{selectedOrder.paymentStatus || 'Unpaid'}</span>
                  </div>
                  <div className="timing-block">
                    <span className="timing-label">Time Elapsed</span>
                    <span className="timing-val">{getOrderTimeMetrics(selectedOrder, currentTime).primaryText}</span>
                  </div>
                </div>

                {/* 4. AUDIT STATUS TIMELINE & PERFORMER LOG */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 className="command-section-title">
                      <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                      Status Audit History & Performer Log
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      {selectedOrder.timeline.map((entry, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-primary)', background: '#FFF0F0', padding: '2px 6px', borderRadius: '4px' }}>
                              {entry.status}
                            </span>
                            <span style={{ color: 'var(--color-text-primary)' }}>
                              {entry.note || `Status updated to ${entry.status}`}
                            </span>
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                            {entry.by && <strong style={{ color: 'var(--color-text-primary)', marginRight: '6px' }}>{entry.by}</strong>}
                            <span>{formatTime(entry.time)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : null}

            {/* Footer */}
            <div className="order-command-footer">
              {selectedOrder && selectedOrder.status !== 'cancelled' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedOrder.status === 'pending' && (
                    <Button
                      variant="primary"
                      icon={Play}
                      onClick={() => handleUpdateStatus('preparing')}
                      isLoading={statusSubmitting}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => handleUpdateStatus('ready')}
                      isLoading={statusSubmitting}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => handleUpdateStatus('served')}
                      isLoading={statusSubmitting}
                    >
                      Mark Served
                    </Button>
                  )}
                  {(selectedOrder.status === 'served' || selectedOrder.status === 'completed') && (
                    <Button
                      variant="primary"
                      icon={Receipt}
                      onClick={() => handleOpenBill(selectedOrder.id)}
                    >
                      {selectedOrder.paymentStatus === 'paid' ? 'View Bill Receipt' : 'Generate & Pay Bill'}
                    </Button>
                  )}
                  {selectedOrder.status !== 'completed' && (
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={() => handleUpdateStatus('cancelled')}
                      isLoading={statusSubmitting}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              ) : (
                <div />
              )}

              <Button variant="ghost" onClick={handleCloseDetailsModal}>
                Close
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Bill & Receipt Modal */}
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

export default Orders;
