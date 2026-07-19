import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import AdvancedFilter from '../components/ui/AdvancedFilter';
import { getOrders } from '../services/orders';
import { getProducts } from '../services/products';
import { getCustomers } from '../services/customers';
import { ShoppingBag, IndianRupee, UtensilsCrossed, Users, RefreshCw, Search, Sliders } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Original list state
  const [masterOrdersList, setMasterOrdersList] = useState([]);

  // Filter UI states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({
    orderId: '',
    customerName: '',
    status: '',
    paymentStatus: '',
    fromDate: '',
    toDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'newest'
  });

  // Dynamic metrics state
  const [todaySales, setTodaySales] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [menuProducts, setMenuProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [recentOrdersList, setRecentOrdersList] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const [ordersRes, productsData, customersData] = await Promise.all([
        getOrders({ limit: 100 }, 1, 100),
        getProducts(),
        getCustomers()
      ]);

      const ordersList = ordersRes.data;

      // Save list
      setMasterOrdersList(ordersList);

      // 1. Calculate Menu Products Count
      setMenuProducts(productsData.length);

      // 2. Calculate Total Customers Count
      setTotalCustomers(customersData.length);

      // 3. Calculate Today's Sales (Completed orders sum)
      const salesSum = ordersList
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
      setTodaySales(salesSum);

      // 4. Calculate Active Orders Count (Pending + Preparing)
      const activeCount = ordersList.filter(o => o.status === 'pending' || o.status === 'preparing').length;
      setActiveOrders(activeCount);

      // 5. Select 4 most recent orders
      setRecentOrdersList(ordersList.slice(0, 4));

      // Reset filters
      setSearchQuery('');
      setFilterValues({
        orderId: '',
        customerName: '',
        status: '',
        paymentStatus: '',
        fromDate: '',
        toDate: '',
        minAmount: '',
        maxAmount: '',
        sortBy: 'newest'
      });

    } catch (err) {
      console.error('Error fetching dashboard records:', err);
      setErrorState('Could not retrieve dashboard statistics. Verify server status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Combined Search & Advanced Filters Logic
  const applyDashboardFilters = useCallback((searchVal, filters) => {
    let result = [...masterOrdersList];

    // 1. Search Query (Customer Name or Order ID)
    if (searchVal) {
      const term = searchVal.toLowerCase().trim();
      result = result.filter(o => 
        o.id.toString().toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term)
      );
    }

    // 2. Advanced Order ID field
    if (filters.orderId) {
      const term = filters.orderId.toLowerCase().trim();
      result = result.filter(o => o.id.toString().toLowerCase().includes(term));
    }

    // 3. Customer Name
    if (filters.customerName) {
      const term = filters.customerName.toLowerCase().trim();
      result = result.filter(o => o.customerName.toLowerCase().includes(term));
    }

    // 4. Order Status
    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }

    // 5. Payment Status (Completed = Paid; all others = Unpaid)
    if (filters.paymentStatus) {
      if (filters.paymentStatus === 'paid') {
        result = result.filter(o => o.status === 'completed');
      } else if (filters.paymentStatus === 'unpaid') {
        result = result.filter(o => o.status !== 'completed');
      }
    }

    // 6. Date Range
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= to);
    }

    // 7. Minimum & Maximum Amounts
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      if (!isNaN(min)) {
        result = result.filter(o => parseFloat(o.totalAmount) >= min);
      }
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      if (!isNaN(max)) {
        result = result.filter(o => parseFloat(o.totalAmount) <= max);
      }
    }

    // 8. Sorting options
    if (filters.sortBy) {
      if (filters.sortBy === 'newest') {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (filters.sortBy === 'oldest') {
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (filters.sortBy === 'highest') {
        result.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
      } else if (filters.sortBy === 'lowest') {
        result.sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount));
      }
    }

    // Recalculate metrics based on filtered results
    const salesSum = result
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    setTodaySales(salesSum);

    const activeCount = result.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    setActiveOrders(activeCount);

    // Limit Recent Orders display to 4 records
    setRecentOrdersList(result.slice(0, 4));
  }, [masterOrdersList]);

  // Handle Input Field Changes
  const handleFieldChange = (fieldName, value) => {
    setFilterValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Action Triggers
  const handleApplyFilters = () => {
    applyDashboardFilters(searchQuery, filterValues);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      orderId: '',
      customerName: '',
      status: '',
      paymentStatus: '',
      fromDate: '',
      toDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'newest'
    };
    setFilterValues(defaultFilters);
    applyDashboardFilters(searchQuery, defaultFilters);
  };

  // Search input handler
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyDashboardFilters(query, filterValues);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'preparing': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'secondary';
    }
  };

  const getItemsTextSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    const summary = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    return summary.length > 40 ? `${summary.slice(0, 40)}...` : summary;
  };

  // Definition of Advanced Filter Config Fields
  const filterFields = [
    { name: 'orderId', label: 'Order ID', type: 'text', placeholder: 'e.g. 7' },
    { name: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'e.g. Jonathan' },
    { name: 'status', label: 'Order Status', type: 'select', options: [
      { value: '', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'preparing', label: 'Preparing' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ] },
    { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: [
      { value: '', label: 'All Payments' },
      { value: 'paid', label: 'Paid' },
      { value: 'unpaid', label: 'Unpaid' }
    ] },
    { name: 'fromDate', label: 'From Date', type: 'date' },
    { name: 'toDate', label: 'To Date', type: 'date' },
    { name: 'minAmount', label: 'Minimum Amount', type: 'number', placeholder: 'Min ₹' },
    { name: 'maxAmount', label: 'Maximum Amount', type: 'number', placeholder: 'Max ₹' },
    { name: 'sortBy', label: 'Sort By', type: 'select', options: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'highest', label: 'Highest Amount' },
      { value: 'lowest', label: 'Lowest Amount' }
    ] }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (errorState) {
    return (
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={loadDashboardData}>
            Retry Fetching
          </Button>
        </CardBody>
      </Card>
    );
  }

  const stats = [
    { title: 'Today\'s Sales', value: formatCurrency(todaySales), desc: 'Completed sales totals', icon: IndianRupee, color: 'primary' },
    { title: 'Active Orders', value: activeOrders.toString(), desc: 'Pending and preparing', icon: ShoppingBag, color: 'primary' },
    { title: 'Menu Products', value: menuProducts.toString(), desc: 'Active menu selections', icon: UtensilsCrossed, color: 'primary' },
    { title: 'Total Customers', value: totalCustomers.toString(), desc: 'Registered guest profiles', icon: Users, color: 'primary' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Redesigned Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover-lift" style={{ position: 'relative', overflow: 'hidden' }}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.title}</p>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '2px', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>{stat.value}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{stat.desc}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders table */}
      <Card>
        <CardHeader style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Live incoming customer dining transactions</CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/orders')}>
            View All Orders
          </Button>
        </CardHeader>
        
        {/* Search and Filters Toggle row */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} size={18} />
            <input
              type="text"
              placeholder="Search by Customer Name or Order ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <Button
            variant={isFilterOpen ? 'primary' : 'secondary'}
            icon={Sliders}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={{ borderRadius: '10px' }}
          >
            Filters
          </Button>
        </div>

        {/* Dynamic Expandable Filter Panel */}
        <AdvancedFilter
          isOpen={isFilterOpen}
          fields={filterFields}
          values={filterValues}
          onFieldChange={handleFieldChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        <CardBody style={{ padding: '0px' }}>
          {recentOrdersList.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>🔍</span>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>No matching orders found</p>
                <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Try widening your filter conditions or checking spelling.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items Ordered</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Total Amount</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrdersList.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {getItemsTextSummary(order.items)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Dashboard;
