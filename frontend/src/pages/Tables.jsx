import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getTables, createTable, updateTable, deleteTable } from '../services/tables';
import { getOrder, updateOrderStatus } from '../services/orders';
import { Plus, Edit, Trash2, RefreshCw, X, Users, LayoutGrid, CheckCircle2, Clock, Eye, ShoppingBag, User, Mail, Phone, Utensils, Check, XCircle, Play } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, getOrderTimeMetrics } from '../utils/helpers';
import AdvancedDataTable from '../components/AdvancedDataTable/AdvancedDataTable';
import './Tables.css';

const Tables = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Live clock state
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Table Add/Edit Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null); // null = Add, object = Edit
  const [tableCode, setTableCode] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState('available');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Active Order View Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Fetch Tables
  const fetchTablesList = useCallback(async (pageNum = page) => {
    setLoading(true);
    setErrorState(null);
    try {
      const filters = {
        status: filterStatus,
        search: filterSearch
      };

      const response = await getTables(filters, pageNum, limit);
      setTables(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
      setPage(response.pagination.page);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to load table records. Please check connection and try again.');
      addToast('Error fetching tables', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSearch, page, limit, addToast]);

  useEffect(() => {
    setPage(1);
    fetchTablesList(1);
  }, [filterStatus, filterSearch]);

  const handlePageChange = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchTablesList(pageNum);
  };

  const handleCloseModal = useCallback(() => {
    if (submitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 240);
  }, [submitting]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen && !submitting) handleCloseModal();
        if (isOrderModalOpen && !statusSubmitting) setIsOrderModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, submitting, isOrderModalOpen, statusSubmitting, handleCloseModal]);

  const handleOpenAddModal = () => {
    setSelectedTable(null);
    setTableCode('');
    setTableNumber('');
    setCapacity('4');
    setStatus('available');
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (table) => {
    setSelectedTable(table);
    setTableCode(table.tableCode || '');
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity.toString());
    setStatus(table.status);
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleOpenActiveOrder = async (orderId) => {
    setIsOrderModalOpen(true);
    setLoadingOrderDetails(true);
    try {
      const data = await getOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      addToast('Failed to load active order details', 'error');
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
      
      fetchTablesList(page);
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    const capNum = parseInt(capacity, 10);
    if (!capacity || isNaN(capNum) || capNum <= 0) {
      errors.capacity = 'Capacity must be at least 1 seat';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      addToast('Please fix validation errors', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tableCode: tableCode.trim() || undefined,
        tableNumber: tableNumber.trim() || undefined,
        capacity: parseInt(capacity, 10),
        status
      };

      if (selectedTable) {
        await updateTable(selectedTable.id, payload);
        addToast(`Table "${payload.tableCode || selectedTable.tableCode}" updated successfully\nTable details have been updated.`, 'success');
      } else {
        const res = await createTable(payload);
        addToast(`Table "${res.tableCode || 'created'}" added successfully\nTable is now available for orders.`, 'success');
      }

      handleCloseModal();
      fetchTablesList(page);
    } catch (err) {
      addToast(err.message || 'Failed to save table details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (table) => {
    const confirmed = await confirm({
      title: 'Delete Table?',
      message: `Are you sure you want to delete "${table.tableNumber}" (${table.tableCode || 'ID: ' + table.id})? This action cannot be undone.`,
      confirmLabel: 'Delete Table',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteTable(table.id);
      addToast(`Table "${table.tableCode || table.tableNumber}" deleted successfully\nRemoved table from active floor plan.`, 'success');
      fetchTablesList(page);
    } catch (err) {
      addToast(err.message || 'Failed to delete table', 'error');
    }
  };

  const getStatusBadge = (tableStatus) => {
    switch (tableStatus) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'occupied':
        return <Badge variant="info">Occupied</Badge>;
      case 'reserved':
        return <Badge variant="warning">Reserved</Badge>;
      default:
        return <Badge variant="secondary">{tableStatus}</Badge>;
    }
  };

  // KPI Metrics Calculation
  const totalTables = totalCount;
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Table Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Manage dining tables, seating capacities, and real-time active order links for Dine-In guests
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          Add Table
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="table-kpi-grid">
        <div className="table-kpi-card">
          <div className="table-kpi-icon total">
            <LayoutGrid size={22} />
          </div>
          <div className="table-kpi-info">
            <span className="table-kpi-value">{totalTables}</span>
            <span className="table-kpi-label">Total Tables</span>
          </div>
        </div>

        <div className="table-kpi-card">
          <div className="table-kpi-icon available">
            <CheckCircle2 size={22} />
          </div>
          <div className="table-kpi-info">
            <span className="table-kpi-value">{availableCount}</span>
            <span className="table-kpi-label">Available Now</span>
          </div>
        </div>

        <div className="table-kpi-card">
          <div className="table-kpi-icon occupied">
            <Users size={22} />
          </div>
          <div className="table-kpi-info">
            <span className="table-kpi-value">{occupiedCount}</span>
            <span className="table-kpi-label">Occupied</span>
          </div>
        </div>

        <div className="table-kpi-card">
          <div className="table-kpi-icon reserved">
            <Clock size={22} />
          </div>
          <div className="table-kpi-info">
            <span className="table-kpi-value">{reservedCount}</span>
            <span className="table-kpi-label">Reserved</span>
          </div>
        </div>
      </div>

      {/* Table Data Table */}
      {errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchTablesList(page)}>
              Retry Fetching
            </Button>
          </CardBody>
        </Card>
      ) : (
        <AdvancedDataTable
          tableKey="tables"
          data={tables}
          loading={loading}
          searchFields={['tableNumber', 'status', 'activeOrderNo', 'assignedWaiter']}
          searchPlaceholder="Search table, order #, or waiter... (Ctrl+F)"
          onRefresh={() => fetchTablesList(page)}
          emptyStateTitle="No Tables Found"
          emptyStateDescription="No dining tables match your active search terms or status filter."
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
            setPage(1);
          }}
          filterConfigs={[
            {
              key: 'status',
              label: 'Table Status',
              type: 'select',
              options: [
                { value: 'available', label: 'Available' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'reserved', label: 'Reserved' }
              ]
            }
          ]}
          columns={[
            {
              key: 'tableCode',
              title: 'Table ID',
              sortable: true,
              render: (t) => (
                <span style={{ fontWeight: '700', color: 'var(--color-primary, #E53935)', fontFamily: 'var(--font-body), monospace' }}>
                  {t.tableCode || `TAB${String(t.id).padStart(2, '0')}`}
                </span>
              )
            },
            {
              key: 'tableNumber',
              title: 'Table Number / Name',
              sortable: true,
              render: (t) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t.tableNumber}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    ID: {t.tableCode || `TAB${String(t.id).padStart(2, '0')}`}
                  </span>
                </div>
              )
            },
            {
              key: 'capacity',
              title: 'Seating Capacity',
              sortable: true,
              render: (t) => (
                <span style={{ fontWeight: '500' }}>
                  👥 {t.capacity} {t.capacity === 1 ? 'Seat' : 'Seats'}
                </span>
              )
            },
            {
              key: 'status',
              title: 'Current Status',
              sortable: true,
              render: (t) => getStatusBadge(t.status)
            },
            {
              key: 'activeOrder',
              title: 'Active Order Link',
              sortable: false,
              render: (t) => t.activeOrderNo ? (
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => handleOpenActiveOrder(t.activeOrderId)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant="info">#{t.activeOrderNo}</Badge>
                      <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--color-primary)', fontWeight: '700' }}>
                        ({t.activeOrderStatus})
                      </span>
                    </div>
                    {t.assignedWaiter && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        Server: {t.assignedWaiter}
                      </span>
                    )}
                  </div>
                </button>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>—</span>
              )
            },
            {
              key: 'activeOrderTotal',
              title: 'Order Total',
              sortable: false,
              render: (t) => t.activeOrderTotal ? (
                <span style={{ fontWeight: '800', color: 'var(--color-text-primary)' }}>
                  {formatCurrency(parseFloat(t.activeOrderTotal))}
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>—</span>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              width: '140px',
              render: (t) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  {t.activeOrderId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      title="View Active Order"
                      onClick={() => handleOpenActiveOrder(t.activeOrderId)}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleOpenEditModal(t)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-danger"
                    onClick={() => handleDeleteTable(t)}
                  />
                </div>
              )
            }
          ]}
        />
      )}

      {/* Add / Edit Table Modal Container */}
      {isModalOpen && (
        <div className={`table-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
          <div className={`table-modal-container ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="table-modal-header">
              <div>
                <h3 className="table-modal-title">
                  {selectedTable ? 'Edit Restaurant Table' : 'Add New Table'}
                </h3>
                <p className="table-modal-subtitle">
                  Configure seating capacity and availability status for Dine-In guests
                </p>
              </div>
              <button
                type="button"
                className="table-modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="table-modal-body">
                <Input
                  label="Table ID (VARCHAR / String)"
                  placeholder="Auto-generated (e.g. TAB01, TAB02)"
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value.toUpperCase())}
                  disabled={submitting}
                  helperText="Format: TAB01, TAB02 (Leave empty to auto-assign)"
                />

                <Input
                  label="Table Number / Name"
                  placeholder="e.g. Table 1 or Patio Table 4"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    if (formErrors.tableNumber) setFormErrors(prev => ({ ...prev, tableNumber: '' }));
                  }}
                  error={formErrors.tableNumber}
                  disabled={submitting}
                />

                <Input
                  label="Seating Capacity (Guests)"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={capacity}
                  onChange={(e) => {
                    setCapacity(e.target.value);
                    if (formErrors.capacity) setFormErrors(prev => ({ ...prev, capacity: '' }));
                  }}
                  error={formErrors.capacity}
                  disabled={submitting}
                  required
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    Table Status
                  </label>
                  <div className="table-status-selector">
                    <button
                      type="button"
                      className={`status-opt-btn ${status === 'available' ? 'selected' : ''}`}
                      onClick={() => setStatus('available')}
                      disabled={submitting}
                    >
                      🟢 Available
                    </button>
                    <button
                      type="button"
                      className={`status-opt-btn ${status === 'occupied' ? 'selected' : ''}`}
                      onClick={() => setStatus('occupied')}
                      disabled={submitting}
                    >
                      🔵 Occupied
                    </button>
                    <button
                      type="button"
                      className={`status-opt-btn ${status === 'reserved' ? 'selected' : ''}`}
                      onClick={() => setStatus('reserved')}
                      disabled={submitting}
                    >
                      🟡 Reserved
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="table-modal-footer">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                >
                  {selectedTable ? 'Save Changes' : 'Create Table'}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Active Order Details Command Center Modal */}
      {isOrderModalOpen && (
        <div className="order-command-overlay" onClick={() => setIsOrderModalOpen(false)}>
          <div className="order-command-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="order-command-header">
              <div>
                <div className="order-command-title-row">
                  <h3 className="order-command-id">
                    ORDER #{selectedOrder?.orderNo || selectedOrder?.id}
                  </h3>
                  {selectedOrder && (
                    <Badge variant={selectedOrder.status === 'completed' ? 'success' : selectedOrder.status === 'cancelled' ? 'error' : 'warning'}>
                      {selectedOrder.status}
                    </Badge>
                  )}
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
                onClick={() => setIsOrderModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {loadingOrderDetails ? (
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
                  <div>
                    <h4 className="command-section-title">
                      <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} />
                      Order Items ({selectedOrder.items?.length || 0})
                    </h4>

                    <div className="command-items-list">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="command-item-card">
                          <div className="command-item-left">
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
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h4 className="command-section-title">
                        <User size={16} style={{ color: 'var(--color-primary)' }} />
                        Dining & Server Info
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
                            <span className="command-info-label">Table Number</span>
                            <span className="service-pill-badge">
                              🍽️ {selectedOrder.tableNo || 'Table'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

            <div className="order-command-footer">
              {selectedOrder && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedOrder.status === 'pending' && (
                    <Button
                      variant="primary"
                      icon={Play}
                      onClick={() => handleUpdateOrderStatus('preparing')}
                      isLoading={statusSubmitting}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => handleUpdateOrderStatus('ready')}
                      isLoading={statusSubmitting}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => handleUpdateOrderStatus('served')}
                      isLoading={statusSubmitting}
                    >
                      Mark Served
                    </Button>
                  )}
                  {selectedOrder.status === 'served' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => handleUpdateOrderStatus('completed')}
                      isLoading={statusSubmitting}
                    >
                      Mark Completed
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    icon={XCircle}
                    onClick={() => handleUpdateOrderStatus('cancelled')}
                    isLoading={statusSubmitting}
                  >
                    Cancel Order
                  </Button>
                </div>
              ) : (
                <div />
              )}

              <Button variant="ghost" onClick={() => setIsOrderModalOpen(false)}>
                Close
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Tables;
