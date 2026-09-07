import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import useToast from '../hooks/useToast';
import { getKots, updateKotStatus, getKot } from '../services/kots';
import { 
  RefreshCw, Clock, ChefHat, Play, CheckCircle2, ShoppingBag, X, User, 
  Utensils, MessageSquare, AlertTriangle, Search, Maximize2, ChevronLeft, 
  ChevronRight, ChevronDown, ChevronUp 
} from 'lucide-react';
import { formatTime, getOrderTimeMetrics } from '../utils/helpers';
import './Kitchen.css';

// Default KDS Overview displays maximum 3 complete cards per page per column
const OVERVIEW_ITEMS_PER_PAGE = 3;

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

  // Per-column Pagination States
  const [pageNew, setPageNew] = useState(1);
  const [pagePreparing, setPagePreparing] = useState(1);
  const [pageReady, setPageReady] = useState(1);

  // Card items expand state map: { [kotId]: boolean }
  const [expandedKotIds, setExpandedKotIds] = useState({});

  // Focus View State: null | 'new' | 'preparing' | 'ready' | 'served'
  const [focusColumn, setFocusColumn] = useState(null);

  // Updating state for active status button
  const [updatingId, setUpdatingId] = useState(null);

  // Selected KOT Modal
  const [selectedKot, setSelectedKot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Helper to sort KOTs oldest-first so longest-waiting stay at top
  const sortByOldest = (list) => {
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
      return timeA - timeB;
    });
  };

  // Filter & Sort Active Kitchen Columns
  const newKots = sortByOldest(kots.filter(k => k.status === 'new'));
  const preparingKots = sortByOldest(kots.filter(k => k.status === 'preparing'));
  const readyKots = sortByOldest(kots.filter(k => k.status === 'ready'));

  // Reset column pagination when filters change
  useEffect(() => {
    setPageNew(1);
    setPagePreparing(1);
    setPageReady(1);
  }, [filterStatus, filterTableNo, filterWaiterName, filterSearch]);

  // Recalculate pagination bounds whenever KOT counts change (e.g. after status transitions)
  useEffect(() => {
    const maxPageNew = Math.max(1, Math.ceil(newKots.length / OVERVIEW_ITEMS_PER_PAGE));
    if (pageNew > maxPageNew) setPageNew(maxPageNew);

    const maxPagePrep = Math.max(1, Math.ceil(preparingKots.length / OVERVIEW_ITEMS_PER_PAGE));
    if (pagePreparing > maxPagePrep) setPagePreparing(maxPagePrep);

    const maxPageReady = Math.max(1, Math.ceil(readyKots.length / OVERVIEW_ITEMS_PER_PAGE));
    if (pageReady > maxPageReady) setPageReady(maxPageReady);
  }, [newKots.length, preparingKots.length, readyKots.length]);

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

  const toggleExpandKot = (kotId, e) => {
    if (e) e.stopPropagation();
    setExpandedKotIds(prev => ({
      ...prev,
      [kotId]: !prev[kotId]
    }));
  };

  // Pagination helper
  const getPaginatedData = (items, page, pageSize = OVERVIEW_ITEMS_PER_PAGE) => {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const paginatedItems = items.slice(startIndex, endIndex);
    return { items: paginatedItems, currentPage, totalPages, startIndex, endIndex, total };
  };

  const paginatedNew = getPaginatedData(newKots, pageNew);
  const paginatedPreparing = getPaginatedData(preparingKots, pagePreparing);
  const paginatedReady = getPaginatedData(readyKots, pageReady);

  // Render Card Items with compact 3-item truncation & inline toggle
  const renderCardItems = (kot) => {
    const items = kot.items || [];
    const isExpanded = !!expandedKotIds[kot.id];
    const hasMore = items.length > 3;
    const displayItems = isExpanded ? items : items.slice(0, 3);

    return (
      <div className="kds-ticket-items">
        {displayItems.map((item, idx) => (
          <div key={idx} className="kds-item-row">
            <div className="kds-item-qty">{item.quantity}x</div>
            <span className="kds-item-name">{item.name}</span>
          </div>
        ))}
        {hasMore && (
          <button
            type="button"
            className="kds-items-toggle-btn"
            onClick={(e) => toggleExpandKot(kot.id, e)}
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                <span>+{items.length - 3} more items</span>
                <ChevronDown size={13} />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Render Compact KOT Card Component specifically for quick kitchen scanning
  const renderKotCard = (kot, columnType) => {
    const { primaryText, urgency } = getOrderTimeMetrics(kot, currentTime);
    const isUrgent = urgency === 'delayed';
    const isWarning = urgency === 'attention';

    // Check for additional items indicator
    const isAdditional = kot.isAdditional || kot.is_additional || 
      (kot.notes && /additional/i.test(kot.notes)) || 
      (kot.type && /additional/i.test(kot.type));

    let cardClass = `kds-ticket-card ${columnType}`;
    if (isUrgent) cardClass += ' urgency-delayed';
    else if (isWarning) cardClass += ' urgency-warning';

    return (
      <div
        key={kot.id}
        className={cardClass}
        onClick={() => handleOpenDetails(kot.id)}
      >
        {/* ROW 1: Table Badge (left) & Additional Items Label / Elapsed Time (right) */}
        <div className="kds-ticket-row-1">
          <div className="kds-row-1-left">
            <span className={`kds-table-badge ${columnType}`}>
              🍽️ {kot.tableNo || 'Dine-In'}
            </span>
            {isAdditional && (
              <span className="kds-additional-badge">
                Additional Items
              </span>
            )}
          </div>

          <div className="kds-row-1-right">
            {isUrgent && (
              <span className="kds-urgency-pill delayed" title="Delayed Order (>20m)">
                <AlertTriangle size={12} />
                URGENT
              </span>
            )}
            {isWarning && !isUrgent && (
              <span className="kds-urgency-pill warning" title="Waiting >10m">
                <Clock size={12} />
                10m+
              </span>
            )}
            <span className={`kds-ticket-time ${isUrgent ? 'time-delayed' : ''}`}>
              <Clock size={12} />
              {primaryText}
            </span>
          </div>
        </div>

        {/* ROW 2: KOT Number & Order Number */}
        <div className="kds-ticket-row-2">
          <span className="kds-kot-num">{kot.kotNumber}</span>
          <span className="kds-order-bullet">•</span>
          <span className="kds-order-num">Order #{kot.orderNo}</span>
        </div>

        {/* ROW 3: Waiter / Server Name */}
        <div className="kds-ticket-row-3">
          <span>Server: <strong>{kot.waiterName || 'Staff'}</strong></span>
        </div>

        {/* ITEM SECTION: Max first 2-3 items */}
        {renderCardItems(kot)}

        {/* SPECIAL NOTES BOX */}
        {kot.notes && (
          <div className="kds-notes-box">
            <MessageSquare size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Note: {kot.notes}</span>
          </div>
        )}

        {/* BOTTOM: Full-width Primary Action */}
        <div className="kds-ticket-footer">
          {columnType === 'pending' && (
            <button
              type="button"
              className="kds-action-btn start"
              onClick={(e) => handleUpdateStatus(kot.id, 'preparing', e)}
              disabled={updatingId === kot.id}
            >
              <Play size={16} fill="currentColor" />
              Start Preparing
            </button>
          )}

          {columnType === 'preparing' && (
            <button
              type="button"
              className="kds-action-btn ready"
              onClick={(e) => handleUpdateStatus(kot.id, 'ready', e)}
              disabled={updatingId === kot.id}
            >
              <CheckCircle2 size={16} />
              Mark Ready
            </button>
          )}

          {columnType === 'ready' && (
            <button
              type="button"
              className="kds-action-btn served"
              onClick={(e) => handleUpdateStatus(kot.id, 'served', e)}
              disabled={updatingId === kot.id}
            >
              <CheckCircle2 size={16} />
              Mark Served
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render Column Pagination Controls (Pinned at bottom)
  const renderPaginationFooter = (paginatedData, setPage) => {
    const { currentPage, totalPages, startIndex, endIndex, total } = paginatedData;
    if (total === 0) return null;

    return (
      <div className="kds-pagination-footer">
        <span className="kds-page-info">
          Showing {total > 0 ? startIndex + 1 : 0}–{endIndex} of {total}
        </span>
        <div className="kds-page-controls">
          <button
            type="button"
            className="kds-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            title="Previous Page"
          >
            <ChevronLeft size={15} />
            <span>Prev</span>
          </button>
          <span className="kds-page-indicator">{currentPage} / {totalPages}</span>
          <button
            type="button"
            className="kds-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            title="Next Page"
          >
            <span>Next</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  };

  // Focus View Configuration
  const getFocusColumnDetails = () => {
    if (!focusColumn) return null;
    if (focusColumn === 'new') {
      return { title: 'NEW KOTs', count: newKots.length, data: newKots, type: 'pending', color: '#B71C1C' };
    }
    if (focusColumn === 'preparing') {
      return { title: 'PREPARING IN KITCHEN', count: preparingKots.length, data: preparingKots, type: 'preparing', color: '#E65100' };
    }
    if (focusColumn === 'ready') {
      return { title: 'READY FOR SERVICE', count: readyKots.length, data: readyKots, type: 'ready', color: '#2E7D32' };
    }
    return null;
  };

  const focusDetails = getFocusColumnDetails();

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
          </select>
        </div>
      </Card>

      {/* Main KDS 3-Column Grid */}
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
              <button
                type="button"
                className="kds-focus-btn"
                onClick={() => setFocusColumn('new')}
                title="Focus View: NEW KOTs"
              >
                <Maximize2 size={14} />
                <span>Focus View</span>
              </button>
            </div>

            <div className="kds-card-list">
              {newKots.length === 0 ? (
                <div className="kds-empty-col">
                  <ChefHat size={32} />
                  <span>No new incoming KOTs</span>
                </div>
              ) : (
                paginatedNew.items.map((kot) => renderKotCard(kot, 'pending'))
              )}
            </div>

            {renderPaginationFooter(paginatedNew, setPageNew)}
          </div>

          {/* COLUMN 2: PREPARING IN KITCHEN */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span className="kds-column-title preparing">
                🟠 PREPARING IN KITCHEN ({preparingKots.length})
              </span>
              <button
                type="button"
                className="kds-focus-btn"
                onClick={() => setFocusColumn('preparing')}
                title="Focus View: PREPARING IN KITCHEN"
              >
                <Maximize2 size={14} />
                <span>Focus View</span>
              </button>
            </div>

            <div className="kds-card-list">
              {preparingKots.length === 0 ? (
                <div className="kds-empty-col">
                  <Utensils size={32} />
                  <span>No orders currently preparing</span>
                </div>
              ) : (
                paginatedPreparing.items.map((kot) => renderKotCard(kot, 'preparing'))
              )}
            </div>

            {renderPaginationFooter(paginatedPreparing, setPagePreparing)}
          </div>

          {/* COLUMN 3: READY FOR SERVICE */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span className="kds-column-title ready">
                🟢 READY FOR SERVICE ({readyKots.length})
              </span>
              <button
                type="button"
                className="kds-focus-btn"
                onClick={() => setFocusColumn('ready')}
                title="Focus View: READY FOR SERVICE"
              >
                <Maximize2 size={14} />
                <span>Focus View</span>
              </button>
            </div>

            <div className="kds-card-list">
              {readyKots.length === 0 ? (
                <div className="kds-empty-col">
                  <CheckCircle2 size={32} />
                  <span>No orders ready for pickup</span>
                </div>
              ) : (
                paginatedReady.items.map((kot) => renderKotCard(kot, 'ready'))
              )}
            </div>

            {renderPaginationFooter(paginatedReady, setPageReady)}
          </div>

        </div>
      )}

      {/* FOCUS VIEW OVERLAY MODAL (UNTOUCHED / PRESERVED) */}
      {focusDetails && (
        <div className="kds-focus-overlay" onClick={() => setFocusColumn(null)}>
          <div className="kds-focus-container" onClick={(e) => e.stopPropagation()}>
            <div className="kds-focus-header">
              <div className="kds-focus-title-group">
                <span className="kds-focus-pill" style={{ color: focusDetails.color }}>
                  {focusDetails.title} ({focusDetails.count})
                </span>
                <span className="kds-focus-subtext">Full-screen KDS view • Oldest orders first</span>
              </div>
              <Button
                variant="secondary"
                icon={X}
                onClick={() => setFocusColumn(null)}
              >
                Exit Focus View
              </Button>
            </div>

            <div className="kds-focus-grid">
              {focusDetails.data.length === 0 ? (
                <div className="kds-empty-col" style={{ gridColumn: '1 / -1', padding: '80px 0' }}>
                  <ChefHat size={40} />
                  <span>No orders found for this status</span>
                </div>
              ) : (
                focusDetails.data.map((kot) => renderKotCard(kot, focusDetails.type))
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


