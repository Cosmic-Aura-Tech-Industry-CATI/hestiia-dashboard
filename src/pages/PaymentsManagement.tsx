import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  X,
  Printer,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Payment, Invoice, RestaurantSettings } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

export const PaymentsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<{ invoice: Invoice; restaurant: RestaurantSettings } | null>(null);

  const { success, error } = useToast();

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'payments') {
        const res = await adminApi.getPayments({
          search: searchQuery || undefined,
          paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        });
        if (res.success) setPayments(res.payments);
      } else {
        const res = await adminApi.getInvoices({
          search: searchQuery || undefined,
        });
        if (res.success) setInvoices(res.invoices);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load financial data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [activeTab, paymentStatus]);

  const handleRecordCollection = async (pay: Payment) => {
    try {
      const res = await adminApi.recordPaymentCollection({
        paymentId: pay.id,
        orderNumber: pay.orderNumber,
        collectedBy: 'Floor Cashier Counter',
      });
      if (res.success) {
        success(res.message);
        fetchFinancialData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to record payment collection.');
    }
  };

  const handleOpenInvoice = async (invoiceNumber: string) => {
    try {
      const res = await adminApi.getInvoiceDetails(invoiceNumber);
      if (res.success) {
        setSelectedInvoice({ invoice: res.invoice, restaurant: res.restaurant });
      }
    } catch (err: any) {
      error(err.message || 'Failed to load printable invoice snapshot.');
    }
  };

  const totalCollected = payments
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCollection = payments
    .filter((p) => p.paymentStatus === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments, Transactions & Tax Invoices"
        subtitle="Audited financial ledger, gateway reconciliations and legal GST tax receipts"
      />

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-charcoal-card border border-emerald-600/30">
          <span className="text-xs text-emerald-400 font-medium">Reconciled Verified Collections</span>
          <div className="font-serif text-3xl font-bold text-emerald-300 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-400/80">Online gateway & cash collections</span>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-card border border-amber-600/30">
          <span className="text-xs text-amber-400 font-medium">Outstanding / Pending Cash</span>
          <div className="font-serif text-3xl font-bold text-amber-300 mt-1">
            ₹{pendingCollection.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-400/80">Awaiting counter delivery collection</span>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-card border border-charcoal-border">
          <span className="text-xs text-beige font-medium">Total Invoices Issued</span>
          <div className="font-serif text-3xl font-bold text-warmwhite mt-1">
            {invoices.length || payments.length}
          </div>
          <span className="text-[10px] text-beige-muted">Unique legal GST invoice snapshots</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-charcoal-border">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-beige hover:text-warmwhite'
          }`}
        >
          Payment Transactions
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-beige hover:text-warmwhite'
          }`}
        >
          Generated Tax Invoices
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder={activeTab === 'payments' ? 'Search payment ref, order #...' : 'Search invoice number, customer...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </div>

        {activeTab === 'payments' && (
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid & Verified</option>
            <option value="pending">Pending Payment</option>
            <option value="failed">Failed Transactions</option>
          </select>
        )}
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Fetching ledger records..." />
      ) : activeTab === 'payments' ? (
        payments.length === 0 ? (
          <EmptyState title="No Payment Transactions" description="Payment transactions will appear as orders are processed." />
        ) : (
          <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-semibold">Reference</th>
                    <th className="py-3.5 px-4 font-semibold">Order Number</th>
                    <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                    <th className="py-3.5 px-4 font-semibold">Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Method</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/60">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-charcoal/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gold font-medium">{pay.paymentReference}</td>
                      <td className="py-3.5 px-4 font-bold text-warmwhite">
                        <Link to={`/admin/orders/${pay.orderId}`} className="hover:text-gold transition-colors">
                          {pay.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-beige">
                        {new Date(pay.transactionDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-warmwhite text-sm">
                        ₹{pay.amount}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-beige font-semibold text-[11px]">
                        {pay.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={pay.paymentStatus} type="payment" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {pay.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => handleRecordCollection(pay)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-sm"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Invoices Tab */
        invoices.length === 0 ? (
          <EmptyState title="No Invoices Issued" description="Invoices are created automatically when orders are submitted." />
        ) : (
          <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-semibold">Invoice #</th>
                    <th className="py-3.5 px-4 font-semibold">Order Number</th>
                    <th className="py-3.5 px-4 font-semibold">Customer</th>
                    <th className="py-3.5 px-4 font-semibold">Subtotal</th>
                    <th className="py-3.5 px-4 font-semibold">GST (5%)</th>
                    <th className="py-3.5 px-4 font-semibold">Grand Total</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Invoice View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-charcoal/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gold">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4 text-warmwhite font-medium">{inv.orderNumber}</td>
                      <td className="py-3.5 px-4 text-warmwhite">{inv.customerName}</td>
                      <td className="py-3.5 px-4 text-beige">₹{inv.subtotal}</td>
                      <td className="py-3.5 px-4 text-beige">₹{inv.taxAmount}</td>
                      <td className="py-3.5 px-4 font-serif font-bold text-warmwhite text-sm">
                        ₹{inv.grandTotal}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenInvoice(inv.invoiceNumber)}
                          className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1 transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View & Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Invoice Snapshot Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-gray-900 p-8 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div className="flex items-start space-x-3">
                <img
                  src="/brand-icon.jpg"
                  alt="Hestiia"
                  className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-black p-0.5"
                />
                <div>
                  <h2 className="text-xl font-serif font-bold text-gray-950 tracking-wider">
                    {selectedInvoice.restaurant.restaurantName}
                  </h2>
                  <p className="text-xs text-gray-600">{selectedInvoice.restaurant.address}</p>
                  <p className="text-xs text-gray-600">Phone: {selectedInvoice.restaurant.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">TAX INVOICE</span>
                <span className="text-xs font-mono font-bold text-gray-800">{selectedInvoice.invoice.invoiceNumber}</span>
                <span className="text-[10px] text-gray-500 block">
                  Date: {new Date(selectedInvoice.invoice.issuedAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            <div className="border-b pb-3 mb-3 text-xs grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <strong>Billed To:</strong>
                <div>{selectedInvoice.invoice.customerName}</div>
                <div>{selectedInvoice.invoice.customerPhone}</div>
              </div>
              <div className="text-right">
                <strong>Order:</strong>
                <div>{selectedInvoice.invoice.orderNumber}</div>
                <div>Status: {selectedInvoice.invoice.paymentStatus.toUpperCase()}</div>
              </div>
            </div>

            <table className="w-full text-left text-xs mb-4">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-800">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedInvoice.invoice.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="py-2">{i.name}</td>
                    <td className="py-2 text-center">{i.quantity}</td>
                    <td className="py-2 text-right">₹{i.price}</td>
                    <td className="py-2 text-right">₹{i.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-300 pt-3 space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{selectedInvoice.invoice.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({selectedInvoice.restaurant.taxRatePercent}%)</span>
                <span>₹{selectedInvoice.invoice.taxAmount}</span>
              </div>
              {selectedInvoice.invoice.deliveryCharge > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>₹{selectedInvoice.invoice.deliveryCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-950 pt-2 border-t">
                <span>Grand Total (INR)</span>
                <span>₹{selectedInvoice.invoice.grandTotal}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 print:hidden">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
