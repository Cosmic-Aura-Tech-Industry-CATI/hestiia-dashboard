import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  ShoppingBag,
  FileText,
  Calendar,
  Send,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Order, Payment, Invoice } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastContext';

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchOrderData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await adminApi.getOrderDetails(id);
      if (res.success) {
        setOrder(res.order);
        setPayment(res.payment || null);
        setInvoice(res.invoice || null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch order details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      setIsUpdating(true);
      const res = await adminApi.updateOrderStatus(order.id, newStatus, statusNote);
      if (res.success) {
        setOrder(res.order);
        setStatusNote('');
        success(`Order status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkPaymentPaid = async () => {
    if (!order) return;
    try {
      setIsUpdating(true);
      const res = await adminApi.updateOrderPayment(order.id, 'paid', 'Staff Counter');
      if (res.success) {
        setOrder(res.order);
        if (payment) setPayment({ ...payment, paymentStatus: 'paid' });
        success('Payment recorded as Paid in full.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to record payment.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <LoadingState message="Fetching comprehensive order profile..." />;
  }

  if (!order) {
    return (
      <div className="p-8 text-center bg-charcoal-card border border-charcoal-border rounded-3xl">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="font-serif text-xl font-bold text-warmwhite">Order Not Found</h2>
        <p className="text-xs text-beige my-2">The requested order number could not be retrieved.</p>
        <Link
          to="/admin/orders"
          className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold text-charcoal-950 font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders List</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-border">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-warmwhite transition-colors"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-2xl font-bold text-warmwhite">{order.orderNumber}</h1>
              <StatusBadge status={order.orderStatus} type="order" />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
            <p className="text-xs text-beige mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold/40 text-gold text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ordered Items & Financial Totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Dishes Card */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <h2 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <span>Itemized Culinary Order Snapshot</span>
            </h2>

            <div className="divide-y divide-charcoal-border/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-charcoal overflow-hidden border border-charcoal-border flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-warmwhite text-sm">{item.name}</h4>
                      <p className="text-xs text-beige-muted">
                        ₹{item.price} x {item.quantity} unit(s)
                      </p>
                    </div>
                  </div>
                  <div className="font-serif font-bold text-warmwhite text-base">
                    ₹{item.total}
                  </div>
                </div>
              ))}
            </div>

            {/* Billing Calculation Breakdown */}
            <div className="pt-4 mt-4 border-t border-charcoal-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-beige">
                <span>Subtotal (Items)</span>
                <span className="font-medium text-warmwhite">₹{order.subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-beige">
                <span>GST (5.0% Restaurant Services)</span>
                <span className="font-medium text-warmwhite">₹{order.taxAmount}</span>
              </div>
              {order.deliveryCharge > 0 && (
                <div className="flex items-center justify-between text-beige">
                  <span>Home Delivery Surcharge</span>
                  <span className="font-medium text-warmwhite">₹{order.deliveryCharge}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Promotional Discount</span>
                  <span className="font-medium">-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold text-warmwhite pt-2 border-t border-charcoal-border/70 font-serif">
                <span>Total Chargeable (INR)</span>
                <span className="text-xl text-gold">₹{order.grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Information Card */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <h2 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-gold" />
              <span>Customer & Fulfillment Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-beige-muted block mb-1">Customer Name</span>
                <span className="font-semibold text-warmwhite text-sm">{order.customerName}</span>
              </div>

              <div>
                <span className="text-beige-muted block mb-1">Contact Phone</span>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="font-semibold text-gold hover:underline flex items-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.customerPhone}</span>
                </a>
              </div>

              <div>
                <span className="text-beige-muted block mb-1">Fulfillment Channel</span>
                <span className="capitalize px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border text-warmwhite font-medium inline-block">
                  {order.fulfillmentType}
                </span>
              </div>

              <div>
                <span className="text-beige-muted block mb-1">Delivery / Table Address</span>
                <span className="text-warmwhite flex items-start space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
                  <span>{order.deliveryAddress || 'Pickup Counter'}</span>
                </span>
              </div>

              {order.notes && (
                <div className="sm:col-span-2 p-3 rounded-2xl bg-charcoal border border-charcoal-border">
                  <span className="text-gold font-semibold block mb-0.5">Kitchen / Chef Notes from Patron:</span>
                  <p className="text-warmwhite italic">"{order.notes}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <h2 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gold" />
              <span>Order Transition Audit Trail</span>
            </h2>

            <div className="space-y-4">
              {order.statusHistory.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0 ring-4 ring-gold/20" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warmwhite capitalize">{item.status.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-beige-muted">
                        {new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>
                    <p className="text-beige mt-0.5">{item.note}</p>
                    <span className="text-[10px] text-gold font-medium">Logged by: {item.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Action Console */}
        <div className="space-y-6">
          {/* Status Transition Control */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-gold/40 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Kitchen Stage Progression</span>
            </h3>

            <p className="text-xs text-beige leading-relaxed">
              Advance this order through official fulfillment milestones.
            </p>

            <div className="space-y-2">
              {order.orderStatus === 'pending' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('confirmed')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Accept & Confirm Order
                </button>
              )}

              {['pending', 'confirmed'].includes(order.orderStatus) && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('preparing')}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Send to Kitchen (Preparing)
                </button>
              )}

              {['preparing', 'confirmed'].includes(order.orderStatus) && (
                <button
                  disabled={isUpdating}
                  onClick={() =>
                    handleUpdateStatus(order.fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup')
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  {order.fulfillmentType === 'delivery' ? 'Dispatch with Delivery Partner' : 'Mark Ready for Pickup'}
                </button>
              )}

              {['out_for_delivery', 'ready_for_pickup', 'preparing'].includes(order.orderStatus) && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('completed')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Mark Completed & Delivered
                </button>
              )}

              {order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('cancelled')}
                  className="w-full py-2 px-3 rounded-xl bg-charcoal border border-rose-600/40 text-rose-400 hover:bg-rose-950/40 font-semibold text-xs transition-all"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {/* Note input */}
            <div className="pt-2">
              <label className="block text-[11px] text-beige-muted mb-1 font-medium">Add Optional Milestone Note</label>
              <input
                type="text"
                placeholder="e.g. Assigned to delivery captain Ramesh"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Reconciliation Card */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4 text-xs">
            <h3 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-gold" />
              <span>Payment Details</span>
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-beige-muted">Payment Method</span>
                <span className="uppercase font-semibold text-warmwhite">{order.paymentMethod}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-beige-muted">Payment Status</span>
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>

              {payment?.gatewayTransactionReference && (
                <div className="flex items-center justify-between">
                  <span className="text-beige-muted">Gateway Ref</span>
                  <span className="font-mono text-gold text-[11px]">{payment.gatewayTransactionReference}</span>
                </div>
              )}

              {order.paymentStatus !== 'paid' && (
                <div className="pt-2">
                  <button
                    disabled={isUpdating}
                    onClick={handleMarkPaymentPaid}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Confirm Cash Received (Mark Paid)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick WhatsApp Notification Action */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-3 text-xs">
            <h3 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Patron Update</span>
            </h3>

            <p className="text-beige text-[11px] leading-relaxed">
              Send immediate order update receipt directly to customer's WhatsApp ({order.customerPhone}).
            </p>

            <a
              href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Namaste ${order.customerName}! 🍽️ Your Hestiia Restaurant order *${order.orderNumber}* is currently *${order.orderStatus.toUpperCase()}*.\nTotal Amount: ₹${order.grandTotal}.\nThank you for choosing Hestiia!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-green-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Message Patron on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-gray-900 p-8 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-950 tracking-wider">HESTIIA RESTAURANT</h2>
                <p className="text-xs text-gray-600">PAC Road, Shyam Nagar, Kanpur, UP 208013</p>
                <p className="text-xs text-gray-600">Phone: +91 78808 40622 | GSTIN: 09AAAFH1234F1Z5</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">TAX INVOICE</span>
                <span className="text-xs font-mono font-bold text-gray-800">{order.invoiceNumber}</span>
                <span className="text-[10px] text-gray-500 block">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="border-b pb-3 mb-3 text-xs grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <strong>Billed To:</strong>
                <div>{order.customerName}</div>
                <div>{order.customerPhone}</div>
              </div>
              <div className="text-right">
                <strong>Delivery Mode:</strong>
                <div className="capitalize">{order.fulfillmentType}</div>
                <div>Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus.toUpperCase()})</div>
              </div>
            </div>

            {/* Table */}
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
                {order.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="py-2">{i.name}</td>
                    <td className="py-2 text-center">{i.quantity}</td>
                    <td className="py-2 text-right">₹{i.price}</td>
                    <td className="py-2 text-right">₹{i.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-gray-300 pt-3 space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5.0%)</span>
                <span>₹{order.taxAmount}</span>
              </div>
              {order.deliveryCharge > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>₹{order.deliveryCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-950 pt-2 border-t">
                <span>Total Due</span>
                <span>₹{order.grandTotal}</span>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-gray-500 italic">
              Thank you for dining with Hestiia Restaurant! Powered by DIMISI Technologies.
            </div>

            <div className="mt-6 flex justify-end space-x-3 print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
