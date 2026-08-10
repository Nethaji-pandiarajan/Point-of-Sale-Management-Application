import React, { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { X, Printer, CreditCard, DollarSign, CheckCircle2, Receipt, FileText } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import './BillReceiptModal.css';

const BillReceiptModal = ({ bill, loading, onClose, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  if (!bill && !loading) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCompletePayment = async () => {
    if (submitting || !bill) return;
    setSubmitting(true);
    try {
      await onPaymentComplete(bill.id, paymentMethod);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bill-modal-overlay" onClick={onClose}>
      <div className="bill-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Printable Header */}
        <div className="bill-modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={22} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Dine-In Bill & Receipt</h3>
          </div>
          <button type="button" className="bill-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner size="md" />
          </div>
        ) : bill ? (
          <div className="bill-modal-body">
            
            {/* Printable Receipt Sheet */}
            <div className="printable-receipt-sheet" id="receipt-print-area">
              <div className="receipt-brand-header">
                <h1 className="receipt-brand-name">SALEIZ RESTAURANT</h1>
                <p className="receipt-brand-sub">Dine-In Tax Invoice & Guest Receipt</p>
                <div className="receipt-divider-dash" />
              </div>

              <div className="receipt-meta-grid">
                <div>
                  <span className="receipt-label">Bill No:</span>
                  <strong className="receipt-val">{bill.billNumber || `BILL-#${bill.id}`}</strong>
                </div>
                <div>
                  <span className="receipt-label">Order No:</span>
                  <strong className="receipt-val">#{bill.orderNo || bill.orderId}</strong>
                </div>
                <div>
                  <span className="receipt-label">Table:</span>
                  <strong className="receipt-val">🍽️ {bill.tableNo || 'Table'}</strong>
                </div>
                <div>
                  <span className="receipt-label">Server:</span>
                  <strong className="receipt-val">{bill.waiterName || 'Staff'}</strong>
                </div>
                <div>
                  <span className="receipt-label">Date & Time:</span>
                  <strong className="receipt-val">{formatDate(bill.createdAt)}, {formatTime(bill.createdAt)}</strong>
                </div>
                <div>
                  <span className="receipt-label">Status:</span>
                  <strong className={`receipt-status-badge ${bill.paymentStatus}`}>
                    {bill.paymentStatus?.toUpperCase()}
                  </strong>
                </div>
              </div>

              <table className="receipt-items-table">
                <thead>
                  <tr>
                    <th>Qty</th>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '700' }}>{item.quantity}x</td>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-totals-box">
                <div className="receipt-total-row">
                  <span>Items Subtotal:</span>
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.tax > 0 && (
                  <div className="receipt-total-row">
                    <span>GST / Taxes:</span>
                    <span>+{formatCurrency(bill.tax)}</span>
                  </div>
                )}
                {bill.discount > 0 && (
                  <div className="receipt-total-row text-success">
                    <span>Discount Applied:</span>
                    <span>-{formatCurrency(bill.discount)}</span>
                  </div>
                )}
                <div className="receipt-total-row grand-total">
                  <span>GRAND TOTAL:</span>
                  <span>{formatCurrency(bill.grandTotal)}</span>
                </div>
              </div>

              <div className="receipt-footer-text">
                <p>Thank you for dining with Saleiz!</p>
                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Please keep this receipt for your records.</p>
              </div>
            </div>

            {/* Payment Method Selector (Only if Unpaid) */}
            {bill.paymentStatus !== 'paid' && (
              <div className="payment-method-card no-print">
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px' }}>
                  Select Payment Method:
                </h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className={`pay-method-opt ${paymentMethod === 'cash' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <DollarSign size={18} />
                    <span>💵 Cash Payment</span>
                  </button>
                  <button
                    type="button"
                    className={`pay-method-opt ${paymentMethod === 'online' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <CreditCard size={18} />
                    <span>💳 Online / UPI</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : null}

        {/* Footer Action Controls */}
        <div className="bill-modal-footer no-print">
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>
            Print Receipt
          </Button>

          {bill && bill.paymentStatus !== 'paid' ? (
            <Button
              variant="primary"
              icon={CheckCircle2}
              onClick={handleCompletePayment}
              isLoading={submitting}
            >
              Complete Payment & Close Order
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BillReceiptModal;
