import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { getOrders } from '../services/orders';
import { getProducts } from '../services/products';
import { getCustomers } from '../services/customers';
import { ShoppingBag, IndianRupee, UtensilsCrossed, Users, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

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
        <CardBody style={{ padding: '0px' }}>
          {recentOrdersList.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No recent orders recorded today.
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
