import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import useToast from '../hooks/useToast';
import { getKots, updateKotStatus, getKot } from '../services/kots';
import { RefreshCw, Clock, ChefHat, Play, CheckCircle2, ShoppingBag, X, User, Utensils, MessageSquare, AlertCircle, Filter, Search } from 'lucide-react';
import { formatTime, getOrderTimeMetrics } from '../utils/helpers';
import './Kitchen.css';

const Kitchen = () => {
  const { addToast } = useToast();

  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTableNo, setFilterTableNo] = useState('');
  const [filterWaiterName, setFilterWaiterName] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Updating state for active status button
  const [updatingId, setUpdatingId] = useState(null);

  // Selected KOT Modal
  const [selectedKot, setSelectedKot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Auto Refresh & Live Clock Ticks
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchKitchenKots = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const filters = {
        status: filterStatus,
        tableNo: filterTableNo,
        waiterName: filterWaiterName,
        search: filterSearch
      };
      const response = await getKots(filters, 1, 100);
      setKots(response.data || []);
    } catch (err) {
      console.error(err);
      if (isManual) addToast('Failed to refresh Kitchen Order Tickets', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [filterStatus, filterTableNo, filterWaiterName, filterSearch, addToast]);

  // Initial Fetch & 10s Auto Polling
  useEffect(() => {
    fetchKitchenKots();
    const pollInterval = setInterval(() => {
      fetchKitchenKots();
    }, 10000); // 10 seconds auto-refresh

    return () => clearInterval(pollInterval);
  }, [fetchKitchenKots]);

  const handleUpdateStatus = async (kotId, newStatus, e) => {
    if (e) e.stopPropagation();
    if (updatingId) return;

    setUpdatingId(kotId);
    try {
      const updated = await updateKotStatus(kotId, newStatus);
      addToast(`KOT ${updated.kotNumber} status changed to "${newStatus.toUpperCase()}"`, 'success');
      
      // Update local state instantly to prevent UI flicker
      setKots(prev => prev.map(k => k.id === kotId ? { ...k, status: newStatus } : k));
      
      if (selectedKot && selectedKot.id === kotId) {
        setSelectedKot(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to update KOT status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDetails = async (kotId) => {
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const data = await getKot(kotId);
      setSelectedKot(data);
    } catch (err) {
      addToast('Failed to load KOT ticket details', 'error');
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter Active Kitchen Columns
  const newKots = kots.filter(k => k.status === 'new');
  const preparingKots = kots.filter(k => k.status === 'preparing');
  const readyKots = kots.filter(k => k.status === 'ready');
  const servedKots = kots.filter(k => k.status === 'served');

  return (
    <div className="kitchen-kds-container">
      
      {/* Header Bar */}
      <div className="kitchen-kds-header">
        <div className="kitchen-kds-title">
          <ChefHat size={28} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2>Kitchen Order Ticket (KOT) System</h2>
            <div className="kitchen-live-pill" style={{ marginTop: '2px' }}>
              <div className="pulse-dot" />
              <span>Live Kitchen Sync (10s)</span>
            </div>
          </div>
        </div>

        <div className="kitchen-metrics-row">
          <div className="kds-count-badge pending">
            <span>🔴 New KOTs:</span>
            <strong>{newKots.length}</strong>
          </div>
          <div className="kds-count-badge preparing">
            <span>🟠 Preparing:</span>
            <strong>{preparingKots.length}</strong>
          </div>
          <div className="kds-count-badge ready">
            <span>🟢 Ready:</span>
            <strong>{readyKots.length}</strong>
          </div>

          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => fetchKitchenKots(true)}
            isLoading={refreshing}
            style={{ marginLeft: '8px' }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '200px', flex: '1' }}>
            <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              className="kds-filter-input"
              placeholder="Filter KOT #, Order #, Table, Waiter..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
            />
          </div>

          <input
            type="text"
            className="kds-filter-input"
            placeholder="Table Filter..."
            value={filterTableNo}
            onChange={(e) => setFilterTableNo(e.target.value)}
            style={{ width: '130px', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
          />

          <input
            type="text"
            className="kds-filter-input"
            placeholder="Waiter Filter..."
            value={filterWaiterName}
            onChange={(e) => setFilterWaiterName(e.target.value)}
            style={{ width: '130px', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.85rem' }}
          >
            <option value="">All KOT Statuses</option>
            <option value="new">🔴 New KOTs</option>
            <option value="preparing">🟠 Preparing</option>
            <option value="ready">🟢 Ready</option>
            <option value="served">🔵 Served</option>
          </select>
        </div>
      </Card>

      {/* Main KDS Column Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="kds-board-grid">
          
          {/* COLUMN 1: NEW KOTs */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span className="kds-column-title pending">
                🔴 NEW KOTs ({newKots.length})
              </span>
            </div>

            <div className="kds-card-list">
              {newKots.length === 0 ? (
                <div className="kds-empty-col">
                  <ChefHat size={32} />
                  <span>No new incoming KOTs</span>
                </div>
              ) : (
                newKots.map((kot) => {
                  const { primaryText } = getOrderTimeMetrics(kot, currentTime);
                  return (
                    <div
                      key={kot.id}
                      className="kds-ticket-card pending"
                      onClick={() => handleOpenDetails(kot.id)}
                    >
                      <div className="kds-ticket-header">
                        <span className="kds-table-badge">
                          🍽️ {kot.tableNo || 'Dine-In'}
                        </span>
                        <span className="kds-ticket-time">
                          <Clock size={12} />
                          {primaryText}
                        </span>
                      </div>

                      <div className="kds-ticket-meta">
                        <span style={{ fontWeight: '800', color: 'var(--color-primary)' }}>{kot.kotNumber}</span>
                        <span>#{kot.orderNo} • Server: <strong>{kot.waiterName}</strong></span>
                      </div>

                      <div className="kds-ticket-items">
                        {kot.items?.map((item, idx) => (
                          <div key={idx} className="kds-item-row">
                            <div className="kds-item-qty">{item.quantity}x</div>
                            <span className="kds-item-name">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {kot.notes && (
                        <div className="kds-notes-box">
                          <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>Note: {kot.notes}</span>
                        </div>
                      )}

                      <div className="kds-ticket-footer">
                        <button
                          type="button"
                          className="kds-action-btn start"
                          onClick={(e) => handleUpdateStatus(kot.id, 'preparing', e)}
                          disabled={updatingId === kot.id}
                        >
                          <Play size={16} fill="currentColor" />
                          Start Preparing
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING IN KITCHEN */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span className="kds-column-title preparing">
                🟠 PREPARING IN KITCHEN ({preparingKots.length})
              </span>
            </div>

            <div className="kds-card-list">
              {preparingKots.length === 0 ? (
                <div className="kds-empty-col">
                  <Utensils size={32} />
                  <span>No orders currently preparing</span>
                </div>
              ) : (
                preparingKots.map((kot) => {
                  const { primaryText } = getOrderTimeMetrics(kot, currentTime);
                  return (
                    <div
                      key={kot.id}
                      className="kds-ticket-card preparing"
                      onClick={() => handleOpenDetails(kot.id)}
                    >
                      <div className="kds-ticket-header">
                        <span className="kds-table-badge" style={{ backgroundColor: '#FFF8E1', color: '#F57F17' }}>
                          🍽️ {kot.tableNo || 'Dine-In'}
                        </span>
                        <span className="kds-ticket-time">
                          <Clock size={12} />
                          {primaryText}
                        </span>
                      </div>

                      <div className="kds-ticket-meta">
                        <span style={{ fontWeight: '800', color: '#E65100' }}>{kot.kotNumber}</span>
                        <span>#{kot.orderNo} • Server: <strong>{kot.waiterName}</strong></span>
                      </div>

                      <div className="kds-ticket-items">
                        {kot.items?.map((item, idx) => (
                          <div key={idx} className="kds-item-row">
                            <div className="kds-item-qty">{item.quantity}x</div>
                            <span className="kds-item-name">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {kot.notes && (
                        <div className="kds-notes-box">
                          <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>Note: {kot.notes}</span>
                        </div>
                      )}

                      <div className="kds-ticket-footer">
                        <button
                          type="button"
                          className="kds-action-btn ready"
                          onClick={(e) => handleUpdateStatus(kot.id, 'ready', e)}
                          disabled={updatingId === kot.id}
                        >
                          <CheckCircle2 size={16} />
                          Mark Ready
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: READY FOR SERVICE */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span className="kds-column-title ready">
                🟢 READY FOR SERVICE ({readyKots.length})
              </span>
            </div>

            <div className="kds-card-list">
              {readyKots.length === 0 ? (
                <div className="kds-empty-col">
                  <CheckCircle2 size={32} />
                  <span>No orders ready for pickup</span>
                </div>
              ) : (
                readyKots.map((kot) => {
                  return (
                    <div
                      key={kot.id}
                      className="kds-ticket-card ready"
                      onClick={() => handleOpenDetails(kot.id)}
                    >
                      <div className="kds-ticket-header">
                        <span className="kds-table-badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                          🍽️ {kot.tableNo || 'Dine-In'}
                        </span>
                        <Badge variant="success">Ready for Waiter</Badge>
                      </div>

                      <div className="kds-ticket-meta">
                        <span style={{ fontWeight: '800', color: '#2E7D32' }}>{kot.kotNumber}</span>
                        <span>#{kot.orderNo} • Server: <strong>{kot.waiterName}</strong></span>
                      </div>

                      <div className="kds-ticket-items">
                        {kot.items?.map((item, idx) => (
                          <div key={idx} className="kds-item-row">
                            <div className="kds-item-qty">{item.quantity}x</div>
                            <span className="kds-item-name">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {kot.notes && (
                        <div className="kds-notes-box">
                          <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>Note: {kot.notes}</span>
                        </div>
                      )}

                      <div className="kds-ticket-footer">
                        <button
                          type="button"
                          className="kds-action-btn served"
                          onClick={(e) => handleUpdateStatus(kot.id, 'served', e)}
                          disabled={updatingId === kot.id}
                          style={{ backgroundColor: '#1E88E5', color: '#FFF' }}
                        >
                          <CheckCircle2 size={16} />
                          Mark Served
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 4: SERVED KOTs */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span className="kds-column-title" style={{ color: '#1E88E5' }}>
                🔵 SERVED KOTs ({servedKots.length})
              </span>
            </div>

            <div className="kds-card-list">
              {servedKots.length === 0 ? (
                <div className="kds-empty-col">
                  <Utensils size={32} />
                  <span>No served KOTs</span>
                </div>
              ) : (
                servedKots.map((kot) => (
                  <div
                    key={kot.id}
                    className="kds-ticket-card served"
                    onClick={() => handleOpenDetails(kot.id)}
                    style={{ borderLeft: '4px solid #1E88E5' }}
                  >
                    <div className="kds-ticket-header">
                      <span className="kds-table-badge" style={{ backgroundColor: '#E3F2FD', color: '#1565C0' }}>
                        🍽️ {kot.tableNo || 'Dine-In'}
                      </span>
                      <Badge variant="secondary">Served</Badge>
                    </div>

                    <div className="kds-ticket-meta">
                      <span style={{ fontWeight: '800', color: '#1565C0' }}>{kot.kotNumber}</span>
                      <span>#{kot.orderNo} • Server: <strong>{kot.waiterName}</strong></span>
                    </div>

                    <div className="kds-ticket-items">
                      {kot.items?.map((item, idx) => (
                        <div key={idx} className="kds-item-row">
                          <div className="kds-item-qty">{item.quantity}x</div>
                          <span className="kds-item-name">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* KOT Ticket Details Modal */}
      {isModalOpen && (
        <div className="order-command-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="order-command-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="order-command-header">
              <div>
                <div className="order-command-title-row">
                  <h3 className="order-command-id">
                    TICKET {selectedKot?.kotNumber || `KOT #${selectedKot?.id}`}
                  </h3>
                  {selectedKot && (
                    <Badge variant={selectedKot.status === 'ready' || selectedKot.status === 'served' ? 'success' : 'warning'}>
                      {selectedKot.status?.toUpperCase()}
                    </Badge>
                  )}
                </div>
                {selectedKot && (
                  <p className="order-command-meta">
                    Parent Order: #{selectedKot.orderNo} • Placed {formatTime(selectedKot.createdAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="order-command-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Spinner size="md" />
              </div>
            ) : selectedKot ? (
              <div className="order-command-body">
                <div className="order-command-grid">
                  <div>
                    <h4 className="command-section-title">
                      <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} />
                      KOT Item Breakdown ({selectedKot.items?.length || 0})
                    </h4>

                    <div className="command-items-list">
                      {selectedKot.items?.map((item, idx) => (
                        <div key={idx} className="command-item-card">
                          <div className="command-item-left">
                            <span style={{ fontWeight: '800', color: 'var(--color-primary)', marginRight: '10px' }}>
                              {item.quantity}x
                            </span>
                            <span className="command-item-name">{item.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedKot.notes && (
                      <div className="kds-notes-box" style={{ marginTop: '16px' }}>
                        <MessageSquare size={16} />
                        <span><strong>Special Kitchen Notes:</strong> {selectedKot.notes}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="command-section-title">
                      <Utensils size={16} style={{ color: 'var(--color-primary)' }} />
                      Table & Server Details
                    </h4>

                    <div className="command-info-card">
                      <div className="command-info-item">
                        <Utensils size={16} className="command-info-icon" />
                        <div className="command-info-text">
                          <span className="command-info-label">Assigned Table</span>
                          <span className="service-pill-badge">🍽️ {selectedKot.tableNo || 'Dine-In Table'}</span>
                        </div>
                      </div>

                      <div className="command-info-item">
                        <User size={16} className="command-info-icon" />
                        <div className="command-info-text">
                          <span className="command-info-label">Server / Waiter</span>
                          <span className="command-info-val">{selectedKot.waiterName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="order-command-footer">
              {selectedKot && selectedKot.status !== 'served' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedKot.status === 'new' && (
                    <Button
                      variant="primary"
                      icon={Play}
                      onClick={(e) => handleUpdateStatus(selectedKot.id, 'preparing', e)}
                      isLoading={updatingId === selectedKot.id}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {selectedKot.status === 'preparing' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={(e) => handleUpdateStatus(selectedKot.id, 'ready', e)}
                      isLoading={updatingId === selectedKot.id}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {selectedKot.status === 'ready' && (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={(e) => handleUpdateStatus(selectedKot.id, 'served', e)}
                      isLoading={updatingId === selectedKot.id}
                    >
                      Mark Served
                    </Button>
                  )}
                </div>
              )}

              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Kitchen;
