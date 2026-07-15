import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getCustomers, getCustomer, updateCustomerStatus } from '../services/customers';
import { Search, Eye, ShieldAlert, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const Customers = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Filters State
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Selected Customer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await getCustomers({
        status: filterStatus,
        search: filterSearch
      });
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to retrieve customer catalog. Please try again.');
      addToast('Error fetching customer details', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSearch, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Details Modal
  const handleOpenDetails = async (customerId) => {
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const data = await getCustomer(customerId);
      setSelectedCustomer(data);
    } catch (err) {
      addToast('Failed to load customer profile details', 'error');
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle Customer block/unblock Status
  const handleToggleStatus = async (cust) => {
    if (statusSubmitting) return;

    const newStatus = cust.status === 'active' ? 'blocked' : 'active';
    const dialogVerb = newStatus === 'blocked' ? 'Block' : 'Unblock';
    
    const confirmed = await confirm({
      title: `${dialogVerb} Customer?`,
      message: `Are you sure you want to ${dialogVerb.toLowerCase()} customer "${cust.name}"? ${
        newStatus === 'blocked'
          ? 'Blocked customers will not be able to log in or submit orders.'
          : 'Unblocked customers will regain normal access to submit orders.'
      }`,
      confirmLabel: `${dialogVerb} Account`,
      cancelLabel: 'Cancel',
      variant: newStatus === 'blocked' ? 'danger' : 'primary'
    });

    if (!confirmed) return;

    setStatusSubmitting(true);
    try {
      await updateCustomerStatus(cust.id, newStatus);
      addToast(`Customer "${cust.name}" is now ${newStatus === 'active' ? 'Active' : 'Blocked'}`, 'success');
      
      // Update locally to keep sync
      setCustomers(prev =>
        prev.map(c => c.id === cust.id ? { ...c, status: newStatus } : c)
      );

      // If active detailed profile is open, update its status too
      if (selectedCustomer && selectedCustomer.id === cust.id) {
        setSelectedCustomer(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to update customer account status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active Only' },
    { value: 'blocked', label: 'Blocked Only' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Customer Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Browse restaurant guest directories and manage block access controls
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="search-field-container">
          <label htmlFor="search-customer" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
            Search customer details
          </label>
          <div className="search-input-wrapper">
            <Search className="search-input-icon" size={18} />
            <input
              id="search-customer"
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
        </div>

        <Select
          label="Filter by Status"
          options={statusOptions}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        />
      </div>

      {/* Main content table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size="lg" />
        </div>
      ) : errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchCustomers}>
              Retry Fetching
            </Button>
          </CardBody>
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={filterSearch || filterStatus ? "No customer records matched your query filters." : "Guests who register or order will appear here."}
          icon={UserCheck}
        />
      ) : (
        <Card>
          <CardBody style={{ padding: '0px' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email / Phone</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Total Orders</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Total Spent</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((cust) => (
                  <TableRow key={cust.id}>
                    <TableCell style={{ fontWeight: '600' }}>
                      {cust.name}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{cust.email}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {cust.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: '500' }}>
                      {cust.totalOrders}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(cust.totalSpent)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Badge variant={cust.status === 'active' ? 'success' : 'error'}>
                        {cust.status === 'active' ? 'Active' : 'Blocked'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetails(cust.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={cust.status === 'active' ? ShieldAlert : ShieldCheck}
                          className={cust.status === 'active' ? 'text-danger' : 'text-success'}
                          onClick={() => handleToggleStatus(cust)}
                          disabled={statusSubmitting}
                        >
                          {cust.status === 'active' ? 'Block' : 'Unblock'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Customer Details Drawer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? `Customer Profile: ${selectedCustomer.name}` : 'Customer Profile'}
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
        ) : selectedCustomer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Profile Summary grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Email</p>
                <p style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-all' }}>{selectedCustomer.email}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Phone</p>
                <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{selectedCustomer.phone}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Account Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <Badge variant={selectedCustomer.status === 'active' ? 'success' : 'error'}>
                    {selectedCustomer.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                    onClick={() => handleToggleStatus(selectedCustomer)}
                    disabled={statusSubmitting}
                  >
                    Change
                  </Button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Registration Date</p>
                <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{formatDate(selectedCustomer.joinedDate)}</p>
              </div>
            </div>

            {/* Transactions History */}
            <div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '12px',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '4px'
              }}>Order History</h3>
              
              <Table style={{ minWidth: 'auto' }}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Items Ordered</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead style={{ textAlign: 'center' }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCustomer.orders.map((ord) => (
                    <TableRow key={ord.id}>
                      <TableCell style={{ fontWeight: '600' }}>{ord.id}</TableCell>
                      <TableCell style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{ord.items}</TableCell>
                      <TableCell style={{ fontWeight: '600' }}>{ord.total}</TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>{formatDate(ord.date)}</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Badge variant={ord.status === 'completed' ? 'success' : ord.status === 'pending' ? 'warning' : 'info'}>
                          {ord.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </div>
        ) : null}
      </Modal>

    </div>
  );
};

export default Customers;
