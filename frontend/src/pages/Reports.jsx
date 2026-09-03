import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import {
  getSalesReport,
  getProductReport,
  getCategoryReport,
  getTableReport,
  getWaiterReport,
  getPaymentReport
} from '../services/reports';
import {
  BarChart3,
  Calendar,
  Download,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Users,
  Grid,
  CreditCard,
  ChefHat,
  RefreshCw,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import useToast from '../hooks/useToast';
import './Reports.css';

const TAB_OPTIONS = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp },
  { id: 'products', label: 'Product Report', icon: Utensils },
  { id: 'categories', label: 'Category Report', icon: BarChart3 },
  { id: 'tables', label: 'Table Report', icon: Grid },
  { id: 'waiters', label: 'Waiter Report', icon: Users },
  { id: 'payments', label: 'Payment Report', icon: CreditCard }
];

const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom' }
];

const Reports = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { range: dateRange };
      if (dateRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      let data;
      switch (activeTab) {
        case 'sales':
          data = await getSalesReport(params);
          break;
        case 'products':
          data = await getProductReport(params);
          break;
        case 'categories':
          data = await getCategoryReport(params);
          break;
        case 'tables':
          data = await getTableReport(params);
          break;
        case 'waiters':
          data = await getWaiterReport(params);
          break;
        case 'payments':
          data = await getPaymentReport(params);
          break;
        default:
          data = await getSalesReport(params);
      }
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      addToast('Failed to fetch analytics report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, startDate, endDate, addToast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Export to CSV helper
  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    let rows = [];

    if (activeTab === 'sales') {
      csvContent += 'Date,Total Orders,Completed Orders,Daily Revenue ($)\n';
      (reportData.dailyBreakdown || []).forEach(r => {
        rows.push(`${r.date},${r.totalOrders},${r.completedOrders},${r.dailyRevenue}`);
      });
    } else if (activeTab === 'products') {
      csvContent += 'Product Name,Category,Quantity Sold,Total Revenue ($)\n';
      (reportData || []).forEach(r => {
        rows.push(`"${r.productName}","${r.categoryName}",${r.quantitySold},${r.totalRevenue}`);
      });
    } else if (activeTab === 'categories') {
      csvContent += 'Category Name,Order Count,Items Sold,Total Revenue ($)\n';
      (reportData || []).forEach(r => {
        rows.push(`"${r.categoryName}",${r.orderCount},${r.itemsSold},${r.totalRevenue}`);
      });
    } else if (activeTab === 'tables') {
      csvContent += 'Table Number,Capacity,Total Orders,Completed Orders,Total Revenue ($)\n';
      (reportData || []).forEach(r => {
        rows.push(`"${r.tableNumber}",${r.capacity},${r.totalOrders},${r.completedOrders},${r.totalRevenue}`);
      });
    } else if (activeTab === 'waiters') {
      csvContent += 'Waiter Name,Email,Total Orders,Completed Orders,Total Sales ($)\n';
      (reportData || []).forEach(r => {
        rows.push(`"${r.waiterName}","${r.email}",${r.totalOrders},${r.completedOrders},${r.totalSales}`);
      });
    } else if (activeTab === 'payments') {
      csvContent += 'Metric,Value\n';
      rows.push(`Cash Paid Orders,${reportData.cashPaidOrders}`);
      rows.push(`Cash Revenue,${reportData.cashRevenue}`);
      rows.push(`Online Paid Orders,${reportData.onlinePaidOrders}`);
      rows.push(`Online Revenue,${reportData.onlineRevenue}`);
      rows.push(`Total Revenue,${reportData.totalRevenue}`);
    }

    csvContent += rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saleiz_${activeTab}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-page-container">
      
      {/* Top Header & Filter Controls */}
      <div className="report-header-bar">
        <div className="report-header-text">
          <h2 className="report-header-title">Dine-In Reports & Analytics</h2>
          <p className="report-header-subtitle">
            Comprehensive sales, product popularity, table utilization, waiter performance, and revenue reports
          </p>
        </div>

        <div className="report-header-controls">
          {/* Preset Range Selector */}
          <div className="report-range-pills">
            {DATE_RANGE_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className={`range-pill ${dateRange === preset.id ? 'active' : ''}`}
                onClick={() => setDateRange(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="report-custom-date-group">
              <input
                type="date"
                className="report-date-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="report-date-sep">to</span>
              <input
                type="date"
                className="report-date-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}

          <Button
            variant="secondary"
            icon={Download}
            onClick={exportToCSV}
            disabled={loading || !reportData}
            className="report-export-btn"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="report-nav-tabs">
        {TAB_OPTIONS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`report-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Body Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner size="lg" />
        </div>
      ) : reportData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: SALES REPORT */}
          {activeTab === 'sales' && (
            <>
              <div className="report-kpi-grid">
                <Card>
                  <CardBody>
                    <span className="kpi-label">TOTAL REVENUE</span>
                    <h3 className="kpi-val text-success">{formatCurrency(reportData.totalRevenue)}</h3>
                    <span className="kpi-sub">Completed order sales</span>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <span className="kpi-label">TOTAL ORDERS</span>
                    <h3 className="kpi-val">{reportData.totalOrders}</h3>
                    <span className="kpi-sub">{reportData.completedOrders} Completed • {reportData.cancelledOrders} Cancelled</span>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <span className="kpi-label">AVERAGE ORDER VALUE</span>
                    <h3 className="kpi-val">{formatCurrency(reportData.avgOrderValue)}</h3>
                    <span className="kpi-sub">Per completed transaction</span>
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardBody>
                  <h3 className="report-section-heading">Daily Sales Timeline Breakdown</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="report-data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Total Orders</th>
                          <th>Completed Orders</th>
                          <th style={{ textAlign: 'right' }}>Daily Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.dailyBreakdown?.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600' }}>{formatDate(row.date)}</td>
                            <td>{row.totalOrders}</td>
                            <td><Badge variant="success">{row.completedOrders} Completed</Badge></td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                              {formatCurrency(row.dailyRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* TAB 2: PRODUCT REPORT */}
          {activeTab === 'products' && (
            <Card>
              <CardBody>
                <h3 className="report-section-heading">Best-Selling Products Breakdown</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="report-data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Product Item</th>
                        <th>Category</th>
                        <th>Quantity Sold</th>
                        <th style={{ textAlign: 'right' }}>Total Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(reportData) && reportData.map((prod, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '800', color: 'var(--color-primary)' }}>#{idx + 1}</td>
                          <td style={{ fontWeight: '700' }}>{prod.productName}</td>
                          <td><Badge variant="secondary">{prod.categoryName}</Badge></td>
                          <td style={{ fontWeight: '700' }}>{prod.quantitySold} units</td>
                          <td style={{ textAlign: 'right', fontWeight: '800' }}>{formatCurrency(prod.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 3: CATEGORY REPORT */}
          {activeTab === 'categories' && (
            <Card>
              <CardBody>
                <h3 className="report-section-heading">Category Sales & Volume Summary</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="report-data-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Unique Orders</th>
                        <th>Total Items Sold</th>
                        <th style={{ textAlign: 'right' }}>Category Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(reportData) && reportData.map((cat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '700' }}>📁 {cat.categoryName}</td>
                          <td>{cat.orderCount} orders</td>
                          <td>{cat.itemsSold} items</td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--color-primary)' }}>
                            {formatCurrency(cat.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 4: TABLE REPORT */}
          {activeTab === 'tables' && (
            <Card>
              <CardBody>
                <h3 className="report-section-heading">Table Turnover & Revenue Performance</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="report-data-table">
                    <thead>
                      <tr>
                        <th>Table Number</th>
                        <th>Capacity</th>
                        <th>Total Orders Served</th>
                        <th>Completed Orders</th>
                        <th style={{ textAlign: 'right' }}>Total Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(reportData) && reportData.map((tbl, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>🍽️ {tbl.tableNumber}</td>
                          <td>👥 {tbl.capacity} Seats</td>
                          <td>{tbl.totalOrders} orders</td>
                          <td><Badge variant="success">{tbl.completedOrders} Completed</Badge></td>
                          <td style={{ textAlign: 'right', fontWeight: '800' }}>{formatCurrency(tbl.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 5: WAITER REPORT */}
          {activeTab === 'waiters' && (
            <Card>
              <CardBody>
                <h3 className="report-section-heading">Staff / Waiter Performance Report</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="report-data-table">
                    <thead>
                      <tr>
                        <th>Waiter Name</th>
                        <th>Contact Email</th>
                        <th>Total Orders Handled</th>
                        <th>Completed Orders</th>
                        <th style={{ textAlign: 'right' }}>Total Sales Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(reportData) && reportData.map((w, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '700' }}>👤 {w.waiterName}</td>
                          <td style={{ color: '#64748B', fontSize: '0.85rem' }}>{w.email}</td>
                          <td>{w.totalOrders} orders</td>
                          <td><Badge variant="success">{w.completedOrders} Completed</Badge></td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: '#2E7D32' }}>
                            {formatCurrency(w.totalSales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 6: PAYMENT REPORT */}
          {activeTab === 'payments' && (
            <>
              <div className="report-kpi-grid">
                <Card>
                  <CardBody>
                    <span className="kpi-label">CASH REVENUE</span>
                    <h3 className="kpi-val text-success">{formatCurrency(reportData.cashRevenue)}</h3>
                    <span className="kpi-sub">{reportData.cashPaidOrders} Cash Transactions</span>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <span className="kpi-label">ONLINE / UPI REVENUE</span>
                    <h3 className="kpi-val text-info">{formatCurrency(reportData.onlineRevenue)}</h3>
                    <span className="kpi-sub">{reportData.onlinePaidOrders} Online Transactions</span>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <span className="kpi-label">TOTAL PAID SETTLEMENT</span>
                    <h3 className="kpi-val">{formatCurrency(reportData.totalRevenue)}</h3>
                    <span className="kpi-sub">{reportData.paidOrdersCount} Paid Orders</span>
                  </CardBody>
                </Card>
              </div>
            </>
          )}

        </div>
      ) : null}

    </div>
  );
};

export default Reports;
