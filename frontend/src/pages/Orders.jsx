import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getOrders, getOrder, updateOrderStatus } from '../services/orders';
import { Search, Eye, RefreshCw, Calendar, ChevronLeft, ChevronRight, XCircle, CheckCircle2, Play } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import AdvancedDataTable from '../components/AdvancedDataTable/AdvancedDataTable';
import './Orders.css';

const Orders = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 5; // limit per page

  // Filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Selected Order details modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Fetch orders from API
  const fetchOrders = useCallback(async (pageNum = page) => {
    setLoading(true);
    setErrorState(null);
    try {
      const filters = {
        status: filterStatus,
        search: filterSearch,
        startDate: filterStartDate,
        endDate: filterEndDate
      };
      
      const response = await getOrders(filters, pageNum, limit);
      
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
      setPage(response.pagination.page);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to retrieve order records. Please try again.');
      addToast('Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSearch, filterStartDate, filterEndDate, addToast]);

  // Fetch on mount or filter changes
  useEffect(() => {
    setPage(1);
    fetchOrders(1);
  }, [filterStatus, filterSearch, filterStartDate, filterEndDate]);

  // Handle Page navigation
  const handlePageChange = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchOrders(pageNum);
  };

  // Open Details Modal
  const handleOpenDetails = async (orderId) => {
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
        message: `Are you sure you want to cancel Order ${selectedOrder.id}? This will notify the kitchen and customer.`,
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
      addToast(`Order ${selectedOrder.id} status updated to ${newStatus}`, 'success');
      
      // Update in local orders array to prevent screen flash
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      
      // Optionally reload from DB to ensure sync
      fetchOrders(page);
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'preparing': return <Badge variant="info">Preparing</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    const summary = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    return summary.length > 50 ? `${summary.slice(0, 50)}...` : summary;
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Order Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Monitor, track, and update restaurant guest dining transactions
          </p>
        </div>
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
          tableKey="orders"
          data={orders}
          loading={loading}
          searchFields={['id', 'orderNo', 'customerName', 'email', 'phone']}
          searchPlaceholder="Search order ID or customer name... (Ctrl+F)"
          onRefresh={() => fetchOrders(page)}
          emptyStateTitle="No Orders Found"
          emptyStateDescription="We couldn't find any transaction matching your query filters."
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
            setFilterStartDate(newFilters.ordStartDate || '');
            setFilterEndDate(newFilters.ordEndDate || '');
            setPage(1);
          }}
          filterConfigs={[
            {
              key: 'status',
              label: 'Order Status',
              type: 'select',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]
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
              render: (ord) => <span style={{ fontWeight: '600' }}>#{ord.orderNo || ord.id}</span>
            },
            {
              key: 'customerName',
              title: 'Customer',
              sortable: true,
              render: (ord) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500' }}>{ord.customerName}</span>
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
              render: (ord) => <span style={{ fontWeight: '600' }}>{formatCurrency(ord.totalAmount)}</span>
            },
            {
              key: 'status',
              title: 'Status',
              sortable: true,
              render: (ord) => getStatusBadge(ord.status)
            },
            {
              key: 'createdAt',
              title: 'Order Time',
              sortable: true,
              render: (ord) => (
                <span style={{ fontSize: '0.8125rem' }}>
                  {new Date(ord.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              width: '130px',
              render: (ord) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleOpenDetails(ord.id)}
                  >
                    View Details
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* Order Details Modal Shell */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? `Order Details: ${selectedOrder.id}` : 'Order Details'}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        }
      >
        {loadingDetails ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner size="md" />
          </div>
        ) : selectedOrder ? (
          <div className="order-details-grid">
            {/* Left Column: Items details */}
            <div>
              <h3 className="details-section-title">Order Items</h3>
              <Table style={{ minWidth: 'auto', marginBottom: '20px' }}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead style={{ textAlign: 'center' }}>Qty</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Price</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell style={{ fontWeight: '500' }}>{item.name}</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>{item.quantity}</TableCell>
                      <TableCell style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</TableCell>
                      <TableCell style={{ textAlign: 'right', fontWeight: '600' }}>
                        {formatCurrency(item.quantity * item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow style={{ backgroundColor: 'rgba(251,247,242,0.4)', fontWeight: '700' }}>
                    <TableCell colSpan={3}>Order Total</TableCell>
                    <TableCell style={{ textAlign: 'right', fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Status stepper control panel */}
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <div className="order-status-controller">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Update Fulfilment State</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                        onClick={() => handleUpdateStatus('completed')}
                        isLoading={statusSubmitting}
                      >
                        Mark Completed
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={() => handleUpdateStatus('cancelled')}
                      isLoading={statusSubmitting}
                    >
                      Cancel Order
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Customer details & Timelines */}
            <div>
              <h3 className="details-section-title">Delivery & Guest Info</h3>
              <div className="customer-info-box" style={{ marginBottom: '24px' }}>
                <div className="customer-info-row">
                  <span className="customer-info-label">Customer Name</span>
                  <span className="customer-info-value">{selectedOrder.customerName}</span>
                </div>
                <div className="customer-info-row">
                  <span className="customer-info-label">Email Address</span>
                  <span className="customer-info-value">{selectedOrder.email}</span>
                </div>
                <div className="customer-info-row">
                  <span className="customer-info-label">Phone Contact</span>
                  <span className="customer-info-value">{selectedOrder.phone}</span>
                </div>
                <div className="customer-info-row">
                  <span className="customer-info-label">Service Type / Table</span>
                  <span className="customer-info-value" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                    {selectedOrder.tableNo}
                  </span>
                </div>
              </div>

              <h3 className="details-section-title">Fulfilment Timeline</h3>
              <div className="timeline-container">
                {selectedOrder.timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    className={`timeline-event ${idx === selectedOrder.timeline.length - 1 ? 'active' : ''} ${selectedOrder.status === 'completed' ? 'completed' : ''} ${selectedOrder.status === 'cancelled' ? 'cancelled' : ''}`}
                  >
                    <div className="timeline-dot"></div>
                    <div className="timeline-event-title">
                      {evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                    </div>
                    <div className="timeline-event-time">
                      {new Date(evt.time).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    <div className="timeline-event-note">{evt.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

    </div>
  );
};

export default Orders;
